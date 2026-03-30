import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Cálculo de distância em linha reta (haversine) como fallback
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { origemLat, origemLng, destinoLat, destinoLng, pizzariaId } = payload;

    if (!origemLat || !origemLng || !destinoLat || !destinoLng) {
      return Response.json({ error: 'Coordenadas de origem e destino são obrigatórias' }, { status: 400 });
    }

    // Tentar OSRM com timeout de 5s
    let distanciaKm;
    let usouFallback = false;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origemLng},${origemLat};${destinoLng},${destinoLat}?overview=false&steps=false`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'NinjaGO-Delivery-App' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes?.length > 0) {
          distanciaKm = data.routes[0].distance / 1000;
        }
      }
    } catch (e) {
      console.warn('OSRM indisponível, usando haversine como fallback:', e.message);
    }

    // Fallback: haversine com fator de rota de 1.3 (ruas não são linha reta)
    if (!distanciaKm) {
      distanciaKm = haversineKm(origemLat, origemLng, destinoLat, destinoLng) * 1.3;
      usouFallback = true;
    }

    // Calcular taxa se pizzariaId informado
    let taxaEntrega = null;
    let detalhes = null;

    if (pizzariaId) {
      const pizzarias = await base44.asServiceRole.entities.Pizzaria.filter({ id: pizzariaId });
      const config = pizzarias[0];

      if (config) {
        const taxaBase = Number(config.taxa_entrega_base) || 0;
        const raioBase = Number(config.raio_entrega_km) || 0;
        const raioMaximo = Number(config.raio_maximo_atendimento_km) || 0;
        const taxaAdicionalPorKm = Number(config.taxa_adicional_por_km) || 0;

        const dentroAreaEntrega = raioMaximo === 0 || distanciaKm <= raioMaximo;

        if (!dentroAreaEntrega) {
          return Response.json({
            success: true,
            distanciaKm: parseFloat(distanciaKm.toFixed(2)),
            foraAreaEntrega: true,
            usouFallback,
            erro: `Seu endereço está fora da área de entrega (${distanciaKm.toFixed(1)} km). Entregamos até ${raioMaximo} km.`
          });
        }

        const kmExtra = Math.max(0, distanciaKm - raioBase);

        if (kmExtra <= 0) {
          taxaEntrega = config.entrega_gratis_dentro_raio_base ? 0 : taxaBase;
          detalhes = {
            dentro_raio_base: true,
            km_percorridos: parseFloat(distanciaKm.toFixed(2)),
            raio_base: raioBase,
            taxa_base: taxaBase,
            km_excedente: 0,
            km_cobrado: 0,
            valor_adicional: 0
          };
        } else {
          const blocos = Math.ceil(kmExtra / 0.5);
          const kmCobrado = blocos * 0.5;
          const valorAdicional = kmCobrado * taxaAdicionalPorKm;
          taxaEntrega = parseFloat((taxaBase + valorAdicional).toFixed(2));
          detalhes = {
            dentro_raio_base: false,
            km_percorridos: parseFloat(distanciaKm.toFixed(2)),
            raio_base: raioBase,
            taxa_base: taxaBase,
            km_excedente: parseFloat(kmExtra.toFixed(2)),
            km_cobrado: parseFloat(kmCobrado.toFixed(1)),
            blocos,
            taxa_adicional_por_km: taxaAdicionalPorKm,
            valor_adicional: parseFloat(valorAdicional.toFixed(2))
          };
        }
      }
    }

    return Response.json({
      success: true,
      distanciaKm: parseFloat(distanciaKm.toFixed(2)),
      taxaEntrega,
      detalhes,
      foraAreaEntrega: false,
      usouFallback
    });

  } catch (error) {
    console.error('Erro ao calcular rota:', error);
    return Response.json({
      success: false,
      error: 'Não foi possível calcular a rota. Tente novamente.'
    }, { status: 500 });
  }
});