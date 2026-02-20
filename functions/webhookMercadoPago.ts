import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const pizzariaId = url.searchParams.get('pizzaria_id');

    const payload = await req.json();

    console.log('Webhook MP recebido:', JSON.stringify(payload), 'pizzaria_id:', pizzariaId);

    // Mercado Pago envia notificações com type=payment
    if (payload.type !== 'payment') {
      return Response.json({ received: true });
    }

    const paymentId = payload.data?.id;
    if (!paymentId) {
      return Response.json({ received: true });
    }

    // Buscar o access token da pizzaria específica, ou fallback para a variável de ambiente global
    let accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (pizzariaId) {
      const pizzaria = await base44.asServiceRole.entities.Pizzaria.get(pizzariaId);
      const tokenDaPizzaria = pizzaria?.configuracoes?.mp_access_token;
      if (tokenDaPizzaria) {
        accessToken = tokenDaPizzaria;
      }
    }

    if (!accessToken) {
      return Response.json({ error: 'Token não configurado' }, { status: 500 });
    }

    // Buscar dados do pagamento na API do Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!mpResponse.ok) {
      console.error('Erro ao buscar pagamento no MP:', await mpResponse.text());
      return Response.json({ error: 'Erro ao consultar MP' }, { status: 500 });
    }

    const payment = await mpResponse.json();
    const pedidoId = payment.external_reference;

    if (!pedidoId) {
      return Response.json({ received: true });
    }

    // Buscar pedido
    const pedido = await base44.asServiceRole.entities.Pedido.get(pedidoId);
    if (!pedido) {
      console.error('Pedido não encontrado:', pedidoId);
      return Response.json({ received: true });
    }

    // Mapear status do MP para status do sistema
    const statusMap = {
      approved: 'pago',
      rejected: 'cancelado',
      cancelled: 'cancelado',
      refunded: 'cancelado',
      pending: 'pendente',
      in_process: 'pendente',
      authorized: 'pendente'
    };

    const novoStatusPagamento = statusMap[payment.status] || 'pendente';

    // Atualizar pedido
    const updateData = {
      status_pagamento: novoStatusPagamento,
      comprovante_url: `https://www.mercadopago.com.br/activities/payment/${paymentId}`
    };

    // Se aprovado, marcar como em preparo
    if (payment.status === 'approved' && pedido.status === 'novo') {
      updateData.status = 'em_preparo';
    }

    await base44.asServiceRole.entities.Pedido.update(pedidoId, updateData);

    // Notificar o estabelecimento se pagamento aprovado
    if (payment.status === 'approved') {
      const metodoPagamento = payment.payment_type_id === 'bank_transfer' ? 'PIX' :
                               payment.payment_type_id === 'credit_card' ? 'Cartão de Crédito' :
                               payment.payment_type_id === 'debit_card' ? 'Cartão de Débito' : 'Online';

      await base44.asServiceRole.entities.Notificacao.create({
        pizzaria_id: pedido.pizzaria_id,
        tipo: 'sistema',
        titulo: `💰 Pagamento Recebido - Pedido ${pedido.numero_pedido}`,
        mensagem: `Pagamento de R$ ${payment.transaction_amount?.toFixed(2)} via ${metodoPagamento} confirmado para o pedido de ${pedido.cliente_nome}.`,
        dados: {
          pedido_id: pedidoId,
          payment_id: paymentId,
          valor: payment.transaction_amount,
          metodo: metodoPagamento
        },
        lida: false
      });
    }

    return Response.json({ received: true, status: payment.status });

  } catch (error) {
    console.error('Erro no webhook MP:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});