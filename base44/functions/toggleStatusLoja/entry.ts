import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pizzariaId, lojaAberta } = await req.json();

    if (!pizzariaId) {
      return Response.json({ error: 'pizzariaId obrigatório' }, { status: 400 });
    }
    if (typeof lojaAberta !== 'boolean' && lojaAberta !== null) {
      return Response.json({ error: 'lojaAberta deve ser boolean ou null' }, { status: 400 });
    }

    const pizzaria = await base44.asServiceRole.entities.Pizzaria.get(pizzariaId);
    if (!pizzaria) {
      return Response.json({ error: 'Pizzaria não encontrada' }, { status: 404 });
    }

    await base44.asServiceRole.entities.Pizzaria.update(pizzaria.id, {
      configuracoes: {
        ...pizzaria.configuracoes,
        loja_aberta: lojaAberta,
      }
    });

    return Response.json({ success: true, loja_aberta: lojaAberta });
  } catch (error) {
    console.error('Erro ao toggle status loja:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});