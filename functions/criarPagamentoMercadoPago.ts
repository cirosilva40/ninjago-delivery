import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Valida se há um usuário autenticado ou cliente
    const payload = await req.json();
    const { 
      pedidoId,
      valorTotal,
      pizzariaId,
      clienteNome,
      clienteTelefone,
      clienteEmail
    } = payload;

    if (!pedidoId || !valorTotal || !pizzariaId) {
      return Response.json({ 
        error: 'Dados incompletos. Necessário: pedidoId, valorTotal, pizzariaId' 
      }, { status: 400 });
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Token do Mercado Pago não configurado' 
      }, { status: 500 });
    }

    // Busca dados da pizzaria
    const pizzaria = await base44.asServiceRole.entities.Pizzaria.get(pizzariaId);
    
    if (!pizzaria) {
      return Response.json({ error: 'Pizzaria não encontrada' }, { status: 404 });
    }

    // Cria a preferência de pagamento no Mercado Pago
    const preference = {
      items: [
        {
          title: `Pedido #${pedidoId} - ${pizzaria.nome}`,
          quantity: 1,
          unit_price: valorTotal,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: clienteNome,
        phone: {
          number: clienteTelefone
        },
        email: clienteEmail || `${clienteTelefone}@cliente.com`
      },
      back_urls: {
        success: `${req.headers.get('origin')}/acompanhar-pedido?pedidoId=${pedidoId}&pizzariaId=${pizzariaId}&status=success`,
        failure: `${req.headers.get('origin')}/cardapio-cliente?pizzariaId=${pizzariaId}&status=failure`,
        pending: `${req.headers.get('origin')}/acompanhar-pedido?pedidoId=${pedidoId}&pizzariaId=${pizzariaId}&status=pending`
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `${req.headers.get('origin')}/webhook-mercadopago`,
      statement_descriptor: pizzaria.nome_exibicao_cliente || pizzaria.nome
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
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

    // Retorna o link de pagamento
    return Response.json({
      success: true,
      init_point: data.init_point, // Link para desktop
      sandbox_init_point: data.sandbox_init_point, // Link para sandbox (testes)
      preference_id: data.id
    });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return Response.json({ 
      error: 'Erro interno ao processar pagamento',
      details: error.message 
    }, { status: 500 });
  }
});