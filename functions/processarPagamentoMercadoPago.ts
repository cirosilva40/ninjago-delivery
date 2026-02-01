import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { MercadoPagoConfig, Preference, Payment } from 'npm:mercadopago@2.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { 
      pedidoId,
      valorTotal,
      pizzariaId,
      metodoPagamento, // 'pix', 'credit_card', 'debit_card'
      dadosCartao, // { number, cvv, expiration_month, expiration_year, cardholder_name, cardholder_cpf }
      clienteEmail
    } = payload;

    if (!pedidoId || !valorTotal || !pizzariaId || !metodoPagamento) {
      return Response.json({ 
        error: 'Dados incompletos' 
      }, { status: 400 });
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'Token do Mercado Pago não configurado' 
      }, { status: 500 });
    }

    // Configurar cliente do Mercado Pago
    const client = new MercadoPagoConfig({ accessToken });

    // Buscar dados do pedido
    const pedido = await base44.asServiceRole.entities.Pedido.get(pedidoId);
    if (!pedido) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Buscar dados da pizzaria
    const pizzaria = await base44.asServiceRole.entities.Pizzaria.get(pizzariaId);
    if (!pizzaria) {
      return Response.json({ error: 'Pizzaria não encontrada' }, { status: 404 });
    }

    // Preparar itens do pedido
    const items = pedido.itens.map(item => ({
      title: item.nome,
      quantity: item.quantidade,
      unit_price: item.preco_unitario,
      currency_id: 'BRL'
    }));

    // Adicionar taxa de entrega se houver
    if (pedido.taxa_entrega > 0) {
      items.push({
        title: 'Taxa de Entrega',
        quantity: 1,
        unit_price: pedido.taxa_entrega,
        currency_id: 'BRL'
      });
    }

    // Processar pagamento via PIX
    if (metodoPagamento === 'pix') {
      paymentData.payment_method_id = 'pix';
      
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${pedidoId}-${Date.now()}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro do Mercado Pago:', errorData);
        return Response.json({ 
          error: 'Erro ao criar pagamento PIX',
          details: errorData
        }, { status: response.status });
      }

      const data = await response.json();

      // Atualizar pedido com informações do PIX
      await base44.asServiceRole.entities.Pedido.update(pedidoId, {
        status_pagamento: 'pendente',
        observacoes_financeiras: `Pagamento PIX - ID: ${data.id}`
      });

      return Response.json({
        success: true,
        tipo: 'pix',
        qr_code: data.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_id: data.id,
        status: data.status
      });
    }

    // Processar pagamento com cartão (crédito, débito ou vale refeição)
    if (metodoPagamento === 'credit_card' || metodoPagamento === 'debit_card' || metodoPagamento === 'vale_refeicao') {
      if (!dadosCartao || !dadosCartao.token) {
        return Response.json({ 
          error: 'Dados do cartão não fornecidos' 
        }, { status: 400 });
      }

      paymentData.token = dadosCartao.token;
      paymentData.payment_method_id = dadosCartao.payment_method_id;
      
      // Vale refeição sempre tem 1 parcela
      paymentData.installments = metodoPagamento === 'credit_card' ? (dadosCartao.installments || 1) : 1;
      
      paymentData.payer = {
        email: clienteEmail,
        identification: {
          type: 'CPF',
          number: dadosCartao.cardholder_cpf
        }
      };

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${pedidoId}-${Date.now()}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro do Mercado Pago:', errorData);
        return Response.json({ 
          error: 'Erro ao processar pagamento com cartão',
          details: errorData
        }, { status: response.status });
      }

      const data = await response.json();

      // Atualizar status do pedido
      const novoStatus = data.status === 'approved' ? 'pago' : 
                         data.status === 'pending' ? 'pendente' : 'cancelado';

      const tipoPagamento = metodoPagamento === 'credit_card' ? 'Crédito' : 
                            metodoPagamento === 'debit_card' ? 'Débito' : 'Vale Refeição';
      
      await base44.asServiceRole.entities.Pedido.update(pedidoId, {
        status_pagamento: novoStatus,
        observacoes_financeiras: `Pagamento ${tipoPagamento} - ID: ${data.id}`
      });

      return Response.json({
        success: true,
        tipo: 'cartao',
        payment_id: data.id,
        status: data.status,
        status_detail: data.status_detail
      });
    }

    return Response.json({ error: 'Método de pagamento inválido' }, { status: 400 });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return Response.json({ 
      error: 'Erro interno ao processar pagamento',
      details: error.message 
    }, { status: 500 });
  }
});