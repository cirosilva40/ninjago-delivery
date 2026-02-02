import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { latitude, longitude } = payload;

    if (!latitude || !longitude) {
      return Response.json({ 
        error: 'Latitude e longitude são obrigatórios' 
      }, { status: 400 });
    }

    // Usar API pública OpenStreetMap Nominatim para geocodificação reversa
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'NinjaGO-Delivery-App'
        }
      }
    );

    if (!response.ok) {
      return Response.json({ 
        error: 'Erro ao consultar serviço de geocodificação' 
      }, { status: response.status });
    }

    const data = await response.json();

    if (!data || data.error) {
      return Response.json({ 
        error: 'Não foi possível obter o endereço para esta localização'
      }, { status: 404 });
    }

    const address = data.address || {};

    let endereco = {
      cep: address.postcode || '',
      logradouro: address.road || address.street || '',
      numero: address.house_number || '',
      bairro: address.suburb || address.neighbourhood || address.district || '',
      cidade: address.city || address.town || address.municipality || '',
      estado: address.state || '',
      latitude,
      longitude
    };

    return Response.json({
      success: true,
      endereco
    });

  } catch (error) {
    console.error('Erro ao geocodificar:', error);
    return Response.json({ 
      error: 'Erro interno ao processar geocodificação',
      details: error.message 
    }, { status: 500 });
  }
});