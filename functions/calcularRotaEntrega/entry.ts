import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const { origemLat, origemLng, destinoLat, destinoLng, pizzariaId } = await req.json();

    if (!origemLat || !origemLng || !destinoLat || !destinoLng) {
      return Response.json({ success: false, error: 'Coordenadas incompletas.' }, { status: 400 });
    }

    // Buscar configurações da pizzaria via service role (sem necessidade de auth do usuário)
    const base44 = createClientFromRequest(req);
    const pizzarias = await base44.asServiceRole.entities.Pizzaria.filter({ id: pizzariaId });

    if (!pizzarias || pizzarias.length === 0) {
      return Response.json({ success: false, error: 'Pizzaria não encontrada.' }, { status: 404 });
    }

    const config = pizzarias[0];
    const taxaBase = Number(config.taxa_entrega_base) || 0;
    const raioBase = Number(config.raio_entrega_km) || 0;
    const raioMaximo = Number(config.raio_maximo_entrega_km) || raioBase || 0;
    const taxaAdicionalPorKm = Number(config.taxa_adicional_por_km) || 0;

    // Calcular rota real via OSRM (gratuito, sem chave)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origemLng},${origemLat};${destinoLng},${destinoLat}?overview=false`;

    const osrmResp = await fetch(osrmUrl);
    const osrmData = await osrmResp.json();

    let distanciaKm;

    if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
      // Distância em metros → km
      distanciaKm = osrmData.routes[0].distance / 1000;
    } else {
      // Fallback: Haversine (linha reta)
      const R = 6371;
      const dLat = (destinoLat - origemLat) * Math.PI / 180;
      const dLon = (destinoLng - origemLng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(origemLat * Math.PI / 180) * Math.cos(destinoLat * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
      distanciaKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const distanciaArredondada = parseFloat(distanciaKm.toFixed(2));

    // Verificar raio máximo de entrega
    if (raioMaximo > 0 && distanciaKm > raioMaximo) {
      return Response.json({
        success: true,
        foraAreaEntrega: true,
        distanciaKm: distanciaArredondada,
        erro: `Seu endereço está fora da área de entrega (${distanciaArredondada} km de distância). Entregamos até ${raioMaximo} km.`
      });
    }

    // Calcular taxa com blocos de 0,5 km
    const kmExtra = Math.max(0, distanciaKm - raioBase);
    let taxaEntrega;
    let detalhes;

    if (kmExtra <= 0) {
      // Dentro do raio base
      taxaEntrega = config.entrega_gratis_dentro_raio_base ? 0 : taxaBase;
      detalhes = {
        dentro_raio_base: true,
        km_percorridos: distanciaArredondada,
        raio_base: raioBase,
        taxa_base: taxaBase,
        km_excedente: 0,
        km_cobrado: 0,
        blocos: 0,
        valor_adicional: 0,
        taxa_adicional_por_km: taxaAdicionalPorKm
      };
    } else {
      // Fora do raio base: blocos de 0,5 km arredondados para cima
      const blocos = Math.ceil(kmExtra / 0.5);
      const kmCobrado = blocos * 0.5;
      const valorAdicional = parseFloat((kmCobrado * taxaAdicionalPorKm).toFixed(2));
      taxaEntrega = parseFloat((taxaBase + valorAdicional).toFixed(2));
      detalhes = {
        dentro_raio_base: false,
        km_percorridos: distanciaArredondada,
        raio_base: raioBase,
        taxa_base: taxaBase,
        km_excedente: parseFloat(kmExtra.toFixed(2)),
        km_cobrado: parseFloat(kmCobrado.toFixed(1)),
        blocos,
        taxa_adicional_por_km: taxaAdicionalPorKm,
        valor_adicional: valorAdicional
      };
    }

    return Response.json({
      success: true,
      foraAreaEntrega: false,
      distanciaKm: distanciaArredondada,
      taxaEntrega,
      detalhes
    });

  } catch (error) {
    return Response.json({ success: false, error: `Erro ao calcular rota: ${error.message}` }, { status: 500 });
  }
});