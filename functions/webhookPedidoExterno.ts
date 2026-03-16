import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Mapeamento de campos iFood → nosso schema
function mapearPedidoIfood(body, pizzariaId) {
  const itens = (body.items || body.orderItems || []).map(item => ({
    produto_id: item.id || item.externalCode || '',
    nome: item.name || item.description || '',
    quantidade: item.quantity || 1,
    preco_unitario: (item.totalPrice || item.price || 0) / (item.quantity || 1),
    observacao: item.observations || '',
  }));

  const cliente = body.customer || body.client || {};
  const entrega = body.delivery || body.deliveryAddress || {};
  const pagamento = (body.payments || body.payment || [])[0] || body.payment || {};

  return {
    pizzaria_id: pizzariaId,
    numero_pedido: String(body.displayId || body.id || body.orderId || Date.now()),
    tipo_pedido: 'delivery',
    cliente_nome: cliente.name || cliente.fullName || 'Cliente iFood',
    cliente_telefone: cliente.phone?.number || cliente.phoneNumber || '',
    cliente_endereco: entrega.streetName || entrega.address || '',
    cliente_numero: entrega.streetNumber || entrega.number || '',
    cliente_bairro: entrega.neighborhood || entrega.district || '',
    cliente_cidade: entrega.city?.name || entrega.city || '',
    cliente_estado: entrega.state || '',
    cliente_complemento: entrega.complement || '',
    cliente_referencia: entrega.reference || '',
    itens,
    valor_produtos: body.subTotal || body.subtotal || 0,
    taxa_entrega: body.deliveryFee || body.delivery?.fee || 0,
    desconto: body.discount || body.benefits?.reduce((a, b) => a + (b.value || 0), 0) || 0,
    valor_total: body.total?.orderAmount || body.totalPrice || body.totalAmount || 0,
    forma_pagamento: pagamento.name?.toLowerCase().includes('pix') ? 'pix' : 
                     pagamento.name?.toLowerCase().includes('cart') ? 'cartao_credito' : 'outro',
    status_pagamento: 'pendente',
    status: 'novo',
    observacoes: body.notes || body.observations || '',
    horario_pedido: new Date().toISOString(),
    origem: 'ifood',
  };
}

// Mapeamento de campos 99Food → nosso schema
function mapearPedido99food(body, pizzariaId) {
  const itens = (body.items || body.products || []).map(item => ({
    produto_id: item.id || item.code || '',
    nome: item.name || item.title || '',
    quantidade: item.qty || item.quantity || 1,
    preco_unitario: item.unit_price || item.price || 0,
    observacao: item.note || item.observation || '',
  }));

  const cliente = body.customer || body.buyer || {};
  const entrega = body.address || body.delivery_address || {};
  const pagamento = body.payment || body.payment_method || {};

  return {
    pizzaria_id: pizzariaId,
    numero_pedido: String(body.order_number || body.id || Date.now()),
    tipo_pedido: 'delivery',
    cliente_nome: cliente.name || 'Cliente 99Food',
    cliente_telefone: cliente.phone || cliente.mobile || '',
    cliente_endereco: entrega.street || entrega.address || '',
    cliente_numero: entrega.number || '',
    cliente_bairro: entrega.neighborhood || entrega.district || '',
    cliente_cidade: entrega.city || '',
    cliente_estado: entrega.state || '',
    cliente_complemento: entrega.complement || '',
    cliente_referencia: entrega.reference || '',
    itens,
    valor_produtos: body.subtotal || 0,
    taxa_entrega: body.delivery_fee || 0,
    desconto: body.discount || 0,
    valor_total: body.total || body.amount || 0,
    forma_pagamento: pagamento.type === 'pix' ? 'pix' : 
                     pagamento.type === 'card' ? 'cartao_credito' : 'outro',
    status_pagamento: 'pendente',
    status: 'novo',
    observacoes: body.note || body.observations || '',
    horario_pedido: new Date().toISOString(),
    origem: '99food',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Source, X-Pizzaria-Id, X-Webhook-Secret',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Validar secret do webhook (opcional mas recomendado)
    const webhookSecret = req.headers.get('X-Webhook-Secret');
    const pizzariaIdHeader = req.headers.get('X-Pizzaria-Id');
    const source = req.headers.get('X-Source') || 'ifood'; // 'ifood' ou '99food'

    if (!pizzariaIdHeader) {
      return Response.json({ error: 'X-Pizzaria-Id header é obrigatório' }, { status: 400 });
    }

    // Verificar secret se configurado
    const secretEsperado = Deno.env.get('WEBHOOK_PEDIDO_SECRET');
    if (secretEsperado && webhookSecret !== secretEsperado) {
      return Response.json({ error: 'Webhook secret inválido' }, { status: 401 });
    }

    const body = await req.json();

    // Mapear pedido conforme a origem
    let pedidoData;
    if (source === 'ifood') {
      pedidoData = mapearPedidoIfood(body, pizzariaIdHeader);
    } else if (source === '99food') {
      pedidoData = mapearPedido99food(body, pizzariaIdHeader);
    } else {
      return Response.json({ error: 'Fonte desconhecida. Use X-Source: ifood ou 99food' }, { status: 400 });
    }

    // Buscar pedidos de hoje para gerar número sequencial
    const pedidosRecentes = await base44.asServiceRole.entities.Pedido.filter(
      { pizzaria_id: pizzariaIdHeader }, '-created_date', 200
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const pedidosHoje = pedidosRecentes.filter(p => {
      const data = new Date(p.created_date);
      data.setHours(0, 0, 0, 0);
      return data.getTime() === hoje.getTime();
    });

    let proximoNumero = 1;
    if (pedidosHoje.length > 0) {
      const numeros = pedidosHoje.map(p => parseInt(p.numero_pedido) || 0);
      proximoNumero = Math.max(...numeros) + 1;
    }

    pedidoData.numero_pedido = proximoNumero.toString().padStart(2, '0');

    // Criar pedido no banco de dados
    const pedido = await base44.asServiceRole.entities.Pedido.create(pedidoData);

    // Criar notificação para a pizzaria
    await base44.asServiceRole.entities.Notificacao.create({
      pizzaria_id: pizzariaIdHeader,
      tipo: 'mensagem',
      titulo: `Novo pedido via ${source === 'ifood' ? 'iFood' : '99Food'}!`,
      mensagem: `Pedido #${pedido.numero_pedido} de ${pedidoData.cliente_nome} - R$ ${pedidoData.valor_total?.toFixed(2)}`,
      lida: false,
    });

    return Response.json({
      success: true,
      pedido_id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      origem: source,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});