import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { endereco, latitude, longitude } = body;

    // Geocodificação reversa (coordenadas → endereço)
    if (latitude && longitude) {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'NinjaGO-Delivery/1.0' } });
      const data = await resp.json();

      if (!data || data.error) {
        return Response.json({ success: false, error: 'Não foi possível obter o endereço para esta localização.' });
      }

      const addr = data.address || {};
      return Response.json({
        success: true,
        endereco: {
          logradouro: addr.road || addr.pedestrian || addr.footway || '',
          numero: addr.house_number || '',
          bairro: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
          cidade: addr.city || addr.town || addr.village || addr.municipality || '',
          estado: addr.state_code || addr.state || '',
          cep: (addr.postcode || '').replace(/\D/g, ''),
        }
      });
    }

    // Geocodificação direta (endereço → coordenadas)
    if (!endereco) {
      return Response.json({ success: false, error: 'Endereço não informado' }, { status: 400 });
    }

    // Tentativa 1: endereço completo
    const tentativas = [
      endereco,
      // Tentativa 2: sem complemento (remover partes após vírgula que possam ser complemento)
      endereco.split(',').slice(0, 4).join(','),
    ];

    for (const tentativa of tentativas) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tentativa)}&format=json&limit=1&countrycodes=br`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'NinjaGO-Delivery/1.0' } });
      const results = await resp.json();

      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        return Response.json({
          success: true,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          enderecoEncontrado: display_name
        });
      }
    }

    // Tentativa 3: buscar apenas pelo CEP se estiver no endereço
    const cepMatch = endereco.match(/\b(\d{5}-?\d{3})\b/);
    if (cepMatch) {
      const cep = cepMatch[1].replace('-', '');
      const urlCep = `https://nominatim.openstreetmap.org/search?q=${cep},+Brasil&format=json&limit=1&countrycodes=br`;
      const respCep = await fetch(urlCep, { headers: { 'User-Agent': 'NinjaGO-Delivery/1.0' } });
      const resultsCep = await respCep.json();

      if (resultsCep && resultsCep.length > 0) {
        const { lat, lon, display_name } = resultsCep[0];
        return Response.json({
          success: true,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          enderecoEncontrado: display_name
        });
      }
    }

    return Response.json({ success: false, error: 'CEP ou endereço não encontrado. Verifique os dados e tente novamente.' });

  } catch (error) {
    return Response.json({ success: false, error: 'Erro interno ao geocodificar endereço.' }, { status: 500 });
  }
});