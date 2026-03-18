import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { latitude, longitude, endereco } = payload;

    // Geocodificação reversa: lat/lng → endereço
    if (latitude && longitude) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR&addressdetails=1`,
        { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } }
      );

      const data = await response.json();

      if (!data || data.error) {
        return Response.json({ success: false, error: 'Não foi possível obter o endereço para esta localização' });
      }

      const address = data.address || {};
      return Response.json({
        success: true,
        endereco: {
          cep: (address.postcode || '').replace(/\D/g, ''),
          logradouro: address.road || address.street || address.pedestrian || '',
          numero: address.house_number || '',
          bairro: address.suburb || address.neighbourhood || address.district || address.city_district || '',
          cidade: address.city || address.town || address.village || address.municipality || '',
          estado: address.state_code || address.state || '',
          latitude,
          longitude
        }
      });
    }

    // Geocodificação direta: endereço → lat/lng
    if (!endereco) {
      return Response.json({ success: false, error: 'Endereço não informado' }, { status: 400 });
    }

    // Tentativa 1: endereço completo
    const url1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&countrycodes=br&accept-language=pt-BR`;
    const resp1 = await fetch(url1, { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } });
    const data1 = await resp1.json();

    if (data1 && data1.length > 0) {
      return Response.json({
        success: true,
        latitude: parseFloat(data1[0].lat),
        longitude: parseFloat(data1[0].lon)
      });
    }

    // Tentativa 2: remover partes depois de vírgula (simplificar endereço)
    const enderecoSimples = endereco.split(',').slice(0, 3).join(',').trim();
    const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoSimples)}&limit=1&countrycodes=br&accept-language=pt-BR`;
    const resp2 = await fetch(url2, { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } });
    const data2 = await resp2.json();

    if (data2 && data2.length > 0) {
      return Response.json({
        success: true,
        latitude: parseFloat(data2[0].lat),
        longitude: parseFloat(data2[0].lon)
      });
    }

    // Tentativa 3: buscar apenas pelo CEP
    const cepMatch = endereco.match(/\b(\d{5}-?\d{3})\b/);
    if (cepMatch) {
      const cep = cepMatch[1].replace('-', '');
      const url3 = `https://nominatim.openstreetmap.org/search?format=json&q=${cep}+Brasil&limit=1&countrycodes=br`;
      const resp3 = await fetch(url3, { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } });
      const data3 = await resp3.json();

      if (data3 && data3.length > 0) {
        return Response.json({
          success: true,
          latitude: parseFloat(data3[0].lat),
          longitude: parseFloat(data3[0].lon)
        });
      }
    }

    return Response.json({ success: false, error: 'CEP ou endereço não encontrado. Verifique os dados e tente novamente.' });

  } catch (error) {
    return Response.json({ success: false, error: 'Erro interno ao processar geocodificação' }, { status: 500 });
  }
});