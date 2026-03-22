import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Pode ser chamado pelo automation (entity event) ou diretamente
    const entregaId = payload?.event?.entity_id || payload?.entrega_id;
    const entregadorIdDireto = payload?.entregador_id;

    // Determinar o entregador_id a partir da entrega
    let entregadorId = entregadorIdDireto;
    if (!entregadorId && entregaId) {
      const entregaData = payload?.data;
      entregadorId = entregaData?.entregador_id;
      if (!entregadorId) {
        // Buscar entrega para pegar entregador_id
        const entregas = await base44.asServiceRole.entities.Entrega.filter({ id: entregaId });
        entregadorId = entregas[0]?.entregador_id;
      }
    }

    if (!entregadorId) {
      return Response.json({ skipped: true, reason: 'no entregador_id' });
    }

    // Buscar todas as entregas ativas do entregador
    const entregasAtivas = await base44.asServiceRole.entities.Entrega.filter({
      entregador_id: entregadorId,
      status: { $in: ['pendente', 'aceita', 'em_rota'] }
    });

    if (entregasAtivas.length === 0) {
      return Response.json({ skipped: true, reason: 'no active deliveries' });
    }

    // Buscar dados do entregador e pizzaria
    const entregadores = await base44.asServiceRole.entities.Entregador.filter({ id: entregadorId });
    const entregador = entregadores[0];
    if (!entregador) {
      return Response.json({ error: 'entregador not found' }, { status: 404 });
    }

    const pizzarias = await base44.asServiceRole.entities.Pizzaria.filter({ id: entregador.pizzaria_id });
    const pizzaria = pizzarias[0];

    // Montar prompt para otimização
    const enderecos = entregasAtivas.map(e => ({
      id: e.id,
      numero_pedido: e.numero_pedido,
      endereco: e.endereco_completo,
      bairro: e.bairro,
      status: e.status,
      valor: e.valor_pedido,
    }));

    const prompt = `
Você é um especialista em otimização de rotas de entrega para motoboy.

O entregador ${entregador.nome} está com ${enderecos.length} entrega(s) ativa(s).
Origem: ${pizzaria?.endereco || 'estabelecimento'}, ${pizzaria?.cidade || ''}.

Entregas:
${enderecos.map((e, i) => `${i + 1}. Pedido #${e.numero_pedido} | ${e.endereco} | ${e.bairro} | Status: ${e.status} | R$ ${e.valor}`).join('\n')}

Calcule a sequência ideal de entregas considerando:
- Entregas "em_rota" têm prioridade (já estão a caminho)
- Minimize a distância total
- Agrupe por proximidade geográfica

Retorne apenas o JSON solicitado.
`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          sequencia_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array com IDs das entregas na ordem otimizada'
          },
          distancia_total_km: { type: 'number' },
          tempo_estimado_minutos: { type: 'number' },
          resumo: { type: 'string', description: 'Resumo curto da rota para o entregador' }
        }
      }
    });

    // Montar objeto da rota otimizada
    const sequenciaOrdenada = (resultado.sequencia_ids || [])
      .map(id => entregasAtivas.find(e => e.id === id))
      .filter(Boolean);

    // Incluir entregas não encontradas na sequência no final
    const naoIncluidas = entregasAtivas.filter(e => !resultado.sequencia_ids?.includes(e.id));
    const rotaFinal = [...sequenciaOrdenada, ...naoIncluidas];

    const rotaTexto = rotaFinal
      .map((e, i) => `${i + 1}. #${e.numero_pedido} - ${e.bairro || e.endereco_completo}`)
      .join(' → ');

    const mensagem = `Rota atualizada! ${rotaFinal.length} entrega(s). Sequência: ${rotaTexto}. Dist. est: ${resultado.distancia_total_km?.toFixed(1) || '?'} km | ${resultado.tempo_estimado_minutos || '?'} min.`;

    // Criar notificação para o entregador
    await base44.asServiceRole.entities.Notificacao.create({
      pizzaria_id: entregador.pizzaria_id,
      destinatario_id: entregadorId,
      tipo: 'mensagem',
      titulo: '🗺️ Rota Recalculada',
      mensagem,
      dados: {
        sequencia_ids: rotaFinal.map(e => e.id),
        sequencia_numeros: rotaFinal.map(e => e.numero_pedido),
        distancia_km: resultado.distancia_total_km,
        tempo_minutos: resultado.tempo_estimado_minutos,
        resumo: resultado.resumo,
        atualizado_em: new Date().toISOString(),
      },
      lida: false,
    });

    return Response.json({
      success: true,
      entregador_id: entregadorId,
      entregas_count: rotaFinal.length,
      rota: rotaFinal.map((e, i) => ({ ordem: i + 1, id: e.id, numero_pedido: e.numero_pedido, endereco: e.endereco_completo })),
      distancia_km: resultado.distancia_total_km,
      tempo_minutos: resultado.tempo_estimado_minutos,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});