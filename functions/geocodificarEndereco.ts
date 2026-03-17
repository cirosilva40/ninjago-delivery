import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { latitude, longitude, endereco } = payload;

    // Geocodificação direta: endereço → lat/lng
    if (endereco) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&accept-language=pt-BR`;
      const response = await fetch(url, { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } });
      
      if (!response.ok) {
        return Response.json({ error: 'Erro ao consultar serviço de geocodificação' }, { status: response.status });
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        return Response.json({ success: false, error: 'Endereço não encontrado' });
      }

      return Response.json({
        success: true,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      });
    }

    // Geocodificação reversa: lat/lng → endereço
    if (!latitude || !longitude) {
      return Response.json({ error: 'Latitude e longitude são obrigatórios' }, { status: 400 });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR&addressdetails=1`,
      { headers: { 'User-Agent': 'NinjaGO-Delivery-App' } }
    );

    if (!response.ok) {
      return Response.json({ error: 'Erro ao consultar serviço de geocodificação' }, { status: response.status });
    }

    const data = await response.json();

    if (!data || data.error) {
      return Response.json({ error: 'Não foi possível obter o endereço para esta localização' }, { status: 404 });
    }

    const address = data.address || {};

    return Response.json({
      success: true,
      endereco: {
        cep: address.postcode || '',
        logradouro: address.road || address.street || '',
        numero: address.house_number || '',
        bairro: address.suburb || address.neighbourhood || address.district || '',
        cidade: address.city || address.town || address.municipality || '',
        estado: address.state || '',
        latitude,
        longitude
      }
    });

  } catch (error) {
    console.error('Erro ao geocodificar:', error);
    return Response.json({ error: 'Erro interno ao processar geocodificação', details: error.message }, { status: 500 });
  }
});