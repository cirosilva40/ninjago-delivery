import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const { endereco } = await req.json();

    if (!endereco) {
      return Response.json({ success: false, error: 'Endereço não informado' }, { status: 400 });
    }

    // Usando Nominatim (OpenStreetMap) — sem chave de API
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco)}&format=json&limit=1&countrycodes=br`;

    const resp = await fetch(url, {
      headers: { 'User-Agent': 'NinjaGO-Delivery/1.0' }
    });

    const results = await resp.json();

    if (!results || results.length === 0) {
      return Response.json({ success: false, error: 'CEP ou endereço não encontrado. Verifique os dados e tente novamente.' });
    }

    const { lat, lon, display_name } = results[0];

    return Response.json({
      success: true,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      enderecoEncontrado: display_name
    });

  } catch (error) {
    return Response.json({ success: false, error: 'Erro interno ao geocodificar endereço.' }, { status: 500 });
  }
});