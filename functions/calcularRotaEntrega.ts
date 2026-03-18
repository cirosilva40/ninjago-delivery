import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { origemLat, origemLng, destinoLat, destinoLng, pizzariaId } = payload;

    if (!origemLat || !origemLng || !destinoLat || !destinoLng) {
      return Response.json({ error: 'Coordenadas de origem e destino são obrigatórias' }, { status: 400 });
    }

    // Usar OSRM (Open Source Routing Machine) - gratuito, sem chave de API
    // Formato: /route/v1/driving/{lng1},{lat1};{lng2},{lat2}
    const url = `https://router.project-osrm.org/route/v1/driving/${origemLng},${origemLat};${destinoLng},${destinoLat}?overview=false&steps=false`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'NinjaGO-Delivery-App' }
    });

    if (!response.ok) {
      throw new Error(`OSRM retornou status ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return Response.json({
        success: false,
        error: 'Não foi possível calcular a rota para este endereço'
      });
    }

    const rota = data.routes[0];
    const distanciaMetros = rota.distance;
    const distanciaKm = distanciaMetros / 1000;

    // Se pizzariaId informado, calcular a taxa automaticamente
    let taxaEntrega = null;
    let detalhes = null;

    if (pizzariaId) {
      const pizzarias = await base44.asServiceRole.entities.Pizzaria.filter({ id: pizzariaId });
      const config = pizzarias[0];

      if (config) {
        const taxaBase = Number(config.taxa_entrega_base) || 0;
        const raioBase = Number(config.raio_entrega_km) || 0;
        const raioMaximo = Number(config.raio_maximo_entrega_km) || raioBase || 0;
        const taxaAdicionalPorKm = Number(config.taxa_adicional_por_km) || 0;

        // Verificar se está dentro da área máxima de entrega
        const dentroAreaEntrega = raioMaximo === 0 || distanciaKm <= raioMaximo;

        if (!dentroAreaEntrega) {
          return Response.json({
            success: true,
            distanciaKm: parseFloat(distanciaKm.toFixed(2)),
            foraAreaEntrega: true,
            erro: `Seu endereço está fora da área de entrega (${distanciaKm.toFixed(1)} km). Entregamos até ${raioMaximo} km.`
          });
        }

        // Calcular km excedente ao raio base
        const kmExtra = Math.max(0, distanciaKm - raioBase);

        if (kmExtra <= 0) {
          // Dentro do raio base
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
          // Fora do raio base: cobrar em blocos de 0,5 km (arredondando para cima)
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
      foraAreaEntrega: false
    });

  } catch (error) {
    console.error('Erro ao calcular rota:', error);
    return Response.json({
      success: false,
      error: 'Não foi possível calcular a rota. Tente novamente.'
    }, { status: 500 });
  }
});