import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { 
      pedidoId,
      valorTotal,
      pizzariaId,
      clienteNome,
      clienteTelefone,
      clienteEmail,
      itens = []
    } = payload;

    if (!pedidoId || !valorTotal || !pizzariaId) {
      return Response.json({ 
        error: 'Dados incompletos. Necessário: pedidoId, valorTotal, pizzariaId' 
      }, { status: 400 });
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Token do Mercado Pago não configurado' }, { status: 500 });
    }

    const pizzaria = await base44.asServiceRole.entities.Pizzaria.get(pizzariaId);
    if (!pizzaria) {
      return Response.json({ error: 'Pizzaria não encontrada' }, { status: 404 });
    }

    // Montar itens da preferência
    const preferenceItems = itens.length > 0
      ? itens.map(item => ({
          title: item.nome,
          quantity: item.quantidade,
          unit_price: parseFloat((item.preco_unitario || item.preco || 0).toFixed(2)),
          currency_id: 'BRL'
        }))
      : [{
          title: `Pedido - ${pizzaria.nome_exibicao_cliente || pizzaria.nome}`,
          quantity: 1,
          unit_price: parseFloat(valorTotal.toFixed(2)),
          currency_id: 'BRL'
        }];

    // URL base do app
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    // Preferência de pagamento - Checkout Pro
    const preference = {
      items: preferenceItems,
      payer: {
        name: clienteNome || 'Cliente',
        email: clienteEmail || `${clienteTelefone}@cliente.com`,
        phone: clienteTelefone ? { number: clienteTelefone } : undefined
      },
      back_urls: {
        success: `${origin}${import.meta.url.includes('localhost') ? '' : ''}/PagamentoSucesso?pedidoId=${pedidoId}&pizzariaId=${pizzariaId}`,
        failure: `${origin}/PagamentoFalha?pedidoId=${pedidoId}&pizzariaId=${pizzariaId}`,
        pending: `${origin}/PagamentoSucesso?pedidoId=${pedidoId}&pizzariaId=${pizzariaId}&status=pending`
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `${origin}/webhookMercadoPago?pizzaria_id=${pizzariaId}`,
      statement_descriptor: (pizzaria.nome_exibicao_cliente || pizzaria.nome || 'Delivery').substring(0, 22),
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // expira em 30min
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': pedidoId
      },
      body: JSON.stringify(preference)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro do Mercado Pago:', errorData);
      return Response.json({ 
        error: 'Erro ao criar pagamento no Mercado Pago',
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();

    // Salvar preference_id no pedido
    await base44.asServiceRole.entities.Pedido.update(pedidoId, {
      observacoes_financeiras: `MP Preference ID: ${data.id}`
    });

    return Response.json({
      success: true,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      preference_id: data.id
    });

  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    return Response.json({ 
      error: 'Erro interno ao processar pagamento',
      details: error.message 
    }, { status: 500 });
  }
});