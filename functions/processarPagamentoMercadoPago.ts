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
      const preference = new Preference(client);
      
      const preferenceData = await preference.create({
        body: {
          items: items,
          payer: {
            email: clienteEmail
          },
          external_reference: pedidoId,
          payment_methods: {
            excluded_payment_types: [
              { id: 'credit_card' },
              { id: 'debit_card' },
              { id: 'ticket' }
            ],
            installments: 1
          },
          back_urls: {
            success: `${req.headers.get('origin')}/acompanhar-pedido?id=${pedidoId}`,
            failure: `${req.headers.get('origin')}/cardapio`,
            pending: `${req.headers.get('origin')}/acompanhar-pedido?id=${pedidoId}`
          },
          auto_return: 'approved',
          statement_descriptor: pizzaria.nome
        }
      });

      // Criar pagamento PIX
      const payment = new Payment(client);
      const paymentData = await payment.create({
        body: {
          transaction_amount: valorTotal,
          description: `Pedido #${pedido.numero_pedido} - ${pizzaria.nome}`,
          payment_method_id: 'pix',
          payer: {
            email: clienteEmail
          }
        }
      });

      // Atualizar pedido com informações do PIX
      await base44.asServiceRole.entities.Pedido.update(pedidoId, {
        status_pagamento: 'pendente',
        observacoes_financeiras: `Pagamento PIX - ID: ${paymentData.id}`
      });

      return Response.json({
        success: true,
        tipo: 'pix',
        qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_id: paymentData.id,
        preference_id: preferenceData.id,
        status: paymentData.status
      });
    }

    // Processar pagamento com cartão (crédito, débito ou vale refeição)
    if (metodoPagamento === 'credit_card' || metodoPagamento === 'debit_card' || metodoPagamento === 'vale_refeicao') {
      if (!dadosCartao || !dadosCartao.token) {
        return Response.json({ 
          error: 'Dados do cartão não fornecidos' 
        }, { status: 400 });
      }

      // Criar preferência para cartão
      const preference = new Preference(client);
      const preferenceData = await preference.create({
        body: {
          items: items,
          payer: {
            email: clienteEmail
          },
          external_reference: pedidoId,
          back_urls: {
            success: `${req.headers.get('origin')}/acompanhar-pedido?id=${pedidoId}`,
            failure: `${req.headers.get('origin')}/cardapio`,
            pending: `${req.headers.get('origin')}/acompanhar-pedido?id=${pedidoId}`
          },
          auto_return: 'approved',
          statement_descriptor: pizzaria.nome
        }
      });

      // Processar pagamento com cartão
      const payment = new Payment(client);
      const paymentData = await payment.create({
        body: {
          transaction_amount: valorTotal,
          token: dadosCartao.token,
          description: `Pedido #${pedido.numero_pedido} - ${pizzaria.nome}`,
          payment_method_id: dadosCartao.payment_method_id,
          installments: metodoPagamento === 'credit_card' ? (dadosCartao.installments || 1) : 1,
          payer: {
            email: clienteEmail,
            identification: {
              type: 'CPF',
              number: dadosCartao.cardholder_cpf
            }
          }
        }
      });

      // Atualizar status do pedido
      const novoStatus = paymentData.status === 'approved' ? 'pago' : 
                         paymentData.status === 'pending' ? 'pendente' : 'cancelado';

      const tipoPagamento = metodoPagamento === 'credit_card' ? 'Crédito' : 
                            metodoPagamento === 'debit_card' ? 'Débito' : 'Vale Refeição';
      
      await base44.asServiceRole.entities.Pedido.update(pedidoId, {
        status_pagamento: novoStatus,
        observacoes_financeiras: `Pagamento ${tipoPagamento} - ID: ${paymentData.id}`
      });

      return Response.json({
        success: true,
        tipo: 'cartao',
        payment_id: paymentData.id,
        preference_id: preferenceData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail
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