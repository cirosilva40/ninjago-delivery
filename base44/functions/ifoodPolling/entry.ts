import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const IFOOD_BASE = 'https://merchant-api.ifood.com.br';

async function getValidToken(base44, pizzaria) {
  const now = new Date();
  const expiresAt = pizzaria.ifood_token_expires_at ? new Date(pizzaria.ifood_token_expires_at) : null;

  // Se token ainda válido (com margem de 2 min), usar direto
  if (pizzaria.ifood_access_token && expiresAt && (expiresAt - now) > 120000) {
    return pizzaria.ifood_access_token;
  }

  // Renovar token via Client Credentials
  const params = new URLSearchParams({
    grantType: 'client_credentials',
    clientId: pizzaria.ifood_client_id,
    clientSecret: pizzaria.ifood_client_secret,
  });

  const resp = await fetch(`${IFOOD_BASE}/authentication/v1.0/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`iFood auth failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  const expiresIn = data.expiresIn || data.expires_in || 21600;
  const newExpires = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Salvar token atualizado na pizzaria
  await base44.asServiceRole.entities.Pizzaria.update(pizzaria.id, {
    ifood_access_token: data.accessToken || data.access_token,
    ifood_token_expires_at: newExpires,
  });

  return data.accessToken || data.access_token;
}

async function mapearPedidoIfood(pedido, pizzariaId) {
  const cliente = pedido.customer || pedido.buyer || {};
  const entrega = pedido.delivery || pedido.deliveryAddress || {};
  const itens = (pedido.items || []).map(item => ({
    nome: item.name,
    quantidade: item.quantity,
    preco_unitario: (item.unitPrice || item.totalPrice / item.quantity || 0) / 100,
    observacao: item.observations || '',
  }));

  const valorTotal = (pedido.total?.orderAmount || pedido.subTotal || 0) / 100;
  const taxaEntrega = (pedido.total?.deliveryFee || pedido.deliveryFee || 0) / 100;
  const valorProdutos = valorTotal - taxaEntrega;

  const enderecoEntrega = [
    entrega.streetName || '',
    entrega.streetNumber ? `, ${entrega.streetNumber}` : '',
    entrega.complement ? ` - ${entrega.complement}` : '',
  ].join('').trim();

  return {
    pizzaria_id: pizzariaId,
    cliente_nome: cliente.name || 'Cliente iFood',
    cliente_telefone: cliente.phone?.number || cliente.phoneNumber || '',
    cliente_endereco: enderecoEntrega,
    cliente_bairro: entrega.neighborhood || '',
    cliente_cidade: entrega.city || '',
    cliente_estado: entrega.state || '',
    cliente_complemento: entrega.complement || '',
    itens,
    valor_produtos: valorProdutos,
    taxa_entrega: taxaEntrega,
    valor_total: valorTotal,
    forma_pagamento: 'online',
    status_pagamento: 'pago',
    status: 'novo',
    origem: 'ifood',
    observacoes: `Pedido iFood #${pedido.displayId || pedido.id}`,
    horario_pedido: pedido.createdAt || new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Buscar todas as pizzarias com polling ativo e credenciais iFood
    const todasPizzarias = await base44.asServiceRole.entities.Pizzaria.filter(
      { ifood_polling_ativo: true }, '-created_date', 50
    );

    const pizzariasComCredenciais = todasPizzarias.filter(p =>
      p.ifood_client_id && p.ifood_client_secret && p.ifood_merchant_id
    );

    const resultados = [];

    for (const pizzaria of pizzariasComCredenciais) {
      try {
        const token = await getValidToken(base44, pizzaria);
        const merchantId = pizzaria.ifood_merchant_id;

        // 1. Buscar novos eventos via polling
        const eventsResp = await fetch(
          `${IFOOD_BASE}/events/v1.0/events:polling`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!eventsResp.ok) {
          resultados.push({ pizzariaId: pizzaria.id, erro: `Events polling: ${eventsResp.status}` });
          continue;
        }

        const eventos = await eventsResp.json();
        if (!eventos || eventos.length === 0) {
          resultados.push({ pizzariaId: pizzaria.id, novos: 0 });
          continue;
        }

        // 2. Filtrar apenas eventos de novo pedido (PLACED)
        const eventosNovoPedido = eventos.filter(e => e.code === 'PLACED' || e.fullCode === 'ORDER_PLACED');
        const idsParaAck = eventos.map(e => ({ id: e.id }));

        let pedidosCriados = 0;

        for (const evento of eventosNovoPedido) {
          const orderId = evento.orderId || evento.id;

          // 3. Buscar detalhes do pedido
          const orderResp = await fetch(
            `${IFOOD_BASE}/order/v1.0/orders/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!orderResp.ok) continue;

          const pedidoIfood = await orderResp.json();

          // Verificar se pedido já existe (evitar duplicatas)
          const existentes = await base44.asServiceRole.entities.Pedido.filter(
            { pizzaria_id: pizzaria.id, observacoes: `Pedido iFood #${pedidoIfood.displayId || orderId}` },
            '-created_date', 1
          );
          if (existentes.length > 0) continue;

          // 4. Mapear e criar pedido
          const pedidoData = await mapearPedidoIfood(pedidoIfood, pizzaria.id);

          // Gerar número sequencial
          const pedidosHoje = await base44.asServiceRole.entities.Pedido.filter(
            { pizzaria_id: pizzaria.id }, '-created_date', 200
          );
          const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
          const pedidosDoDia = pedidosHoje.filter(p => {
            const d = new Date(p.created_date); d.setHours(0, 0, 0, 0);
            return d.getTime() === hoje.getTime();
          });
          const numeros = pedidosDoDia.map(p => parseInt(p.numero_pedido) || 0);
          const proximoNumero = (numeros.length > 0 ? Math.max(...numeros) : 0) + 1;
          pedidoData.numero_pedido = proximoNumero.toString().padStart(2, '0');

          const pedidoCriado = await base44.asServiceRole.entities.Pedido.create(pedidoData);

          // 5. Confirmar pedido no iFood
          await fetch(`${IFOOD_BASE}/order/v1.0/orders/${orderId}/confirm`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          });

          // 6. Notificação
          await base44.asServiceRole.entities.Notificacao.create({
            pizzaria_id: pizzaria.id,
            tipo: 'mensagem',
            titulo: '🛵 Novo pedido via iFood!',
            mensagem: `Pedido #${pedidoCriado.numero_pedido} de ${pedidoData.cliente_nome} — R$ ${pedidoData.valor_total?.toFixed(2)}`,
            lida: false,
          });

          pedidosCriados++;
        }

        // 7. Acknowledgment — confirmar recebimento de TODOS os eventos
        if (idsParaAck.length > 0) {
          await fetch(`${IFOOD_BASE}/events/v1.0/events/acknowledgment`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(idsParaAck),
          });
        }

        resultados.push({ pizzariaId: pizzaria.id, eventos: eventos.length, novos: pedidosCriados });
      } catch (err) {
        resultados.push({ pizzariaId: pizzaria.id, erro: err.message });
      }
    }

    return Response.json({ success: true, processadas: pizzariasComCredenciais.length, resultados });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});