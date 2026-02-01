import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Criar cliente sem exigir autenticação (permite clientes não logados)
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { latitude, longitude } = payload;

    if (!latitude || !longitude) {
      return Response.json({ 
        error: 'Latitude e longitude são obrigatórios' 
      }, { status: 400 });
    }

    const apiKey = Deno.env.get('VITE_GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      return Response.json({ 
        error: 'Chave da API do Google Maps não configurada' 
      }, { status: 500 });
    }

    // Chamar a API de Geocoding do Google Maps
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR`
    );

    if (!response.ok) {
      return Response.json({ 
        error: 'Erro ao consultar API do Google Maps' 
      }, { status: response.status });
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return Response.json({ 
        error: 'Não foi possível obter o endereço para esta localização' 
      }, { status: 404 });
    }

    // Processar o resultado para extrair os componentes do endereço
    const result = data.results[0];
    const addressComponents = result.address_components;

    let endereco = {
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      latitude,
      longitude
    };

    // Extrair informações dos componentes
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('postal_code')) {
        endereco.cep = component.long_name;
      } else if (types.includes('route')) {
        endereco.logradouro = component.long_name;
      } else if (types.includes('street_number')) {
        endereco.numero = component.long_name;
      } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        endereco.bairro = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        endereco.cidade = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        endereco.estado = component.short_name;
      }
    }

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