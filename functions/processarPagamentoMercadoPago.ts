import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const {
      pedidoId,
      valorTotal,
      pizzariaId,
      metodoPagamento, // 'pix', 'credit_card', 'debit_card', 'vale_refeicao'
      dadosCartao,     // { token, payment_method_id, cardholder_name, cardholder_cpf, installments }
      clienteEmail
    } = payload;

    if (!pedidoId || !valorTotal || !pizzariaId || !metodoPagamento) {
      return Response.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Buscar pizzaria para pegar o access token dela
    const pizzaria = await base44.asServiceRole.entities.Pizzaria.get(pizzariaId);
    if (!pizzaria) {
      return Response.json({ error: 'Pizzaria não encontrada' }, { status: 404 });
    }

    const accessToken = pizzaria.configuracoes?.mp_access_token || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({
        error: 'Token do Mercado Pago não configurado. Configure nas Configurações > Pagamento.'
      }, { status: 500 });
    }

    const pedido = await base44.asServiceRole.entities.Pedido.get(pedidoId);
    if (!pedido) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const email = clienteEmail || `cliente_${pedidoId}@ninjago.delivery`;
    const idempotencyKey = `${pedidoId}-${metodoPagamento}-${Date.now()}`;

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey
    };

    // ── PIX ──────────────────────────────────────────────────────────────────
    if (metodoPagamento === 'pix') {
      const body = {
        transaction_amount: parseFloat(valorTotal.toFixed(2)),
        description: `Pedido #${pedido.numero_pedido || pedidoId} - ${pizzaria.nome}`,
        external_reference: pedidoId,
        payment_method_id: 'pix',
        payer: { email }
      };

      const res = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json();
      console.log('PIX response:', JSON.stringify(data));

      if (!res.ok) {
        return Response.json({
          error: 'Erro ao gerar PIX',
          details: data?.message || JSON.stringify(data)
        }, { status: res.status });
      }

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

    // ── CARTÃO (crédito, débito, vale refeição) ───────────────────────────────
    if (['credit_card', 'debit_card', 'vale_refeicao'].includes(metodoPagamento)) {
      if (!dadosCartao?.token) {
        return Response.json({ error: 'Token do cartão não fornecido' }, { status: 400 });
      }

      const installments = metodoPagamento === 'credit_card' ? (dadosCartao.installments || 1) : 1;

      const body = {
        transaction_amount: parseFloat(valorTotal.toFixed(2)),
        token: dadosCartao.token,
        description: `Pedido #${pedido.numero_pedido || pedidoId} - ${pizzaria.nome}`,
        external_reference: pedidoId,
        payment_method_id: dadosCartao.payment_method_id,
        installments,
        payer: {
          email,
          identification: {
            type: 'CPF',
            number: dadosCartao.cardholder_cpf?.replace(/\D/g, '')
          }
        }
      };

      console.log('Card payment body:', JSON.stringify({ ...body, token: '***' }));

      const res = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json();
      console.log('Card payment response:', JSON.stringify(data));

      if (!res.ok) {
        const errMsg = data?.message || data?.cause?.[0]?.description || JSON.stringify(data);
        return Response.json({
          error: 'Erro ao processar pagamento com cartão',
          details: errMsg
        }, { status: res.status });
      }

      const statusMap = { approved: 'pago', pending: 'pendente', in_process: 'pendente' };
      const novoStatus = statusMap[data.status] || 'cancelado';

      const tipoPagamento = metodoPagamento === 'credit_card' ? 'Crédito' :
                            metodoPagamento === 'debit_card' ? 'Débito' : 'Vale Refeição';

      await base44.asServiceRole.entities.Pedido.update(pedidoId, {
        status_pagamento: novoStatus,
        observacoes_financeiras: `Pagamento ${tipoPagamento} - ID: ${data.id} - Status: ${data.status} (${data.status_detail})`
      });

      // Se aprovado, mover para em_preparo
      if (data.status === 'approved') {
        await base44.asServiceRole.entities.Pedido.update(pedidoId, { status: 'em_preparo' });
      }

      return Response.json({
        success: data.status === 'approved' || data.status === 'pending' || data.status === 'in_process',
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