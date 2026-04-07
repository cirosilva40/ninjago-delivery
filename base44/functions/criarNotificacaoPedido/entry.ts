import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;
    const pedido = data;

    if (!pedido || !pedido.pizzaria_id) {
      return Response.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const tipo = event?.type;
    let titulo = '';
    let mensagem = '';
    let tipoNotif = 'sistema';

    const numero = pedido.numero_pedido ? `#${pedido.numero_pedido}` : '';
    const cliente = pedido.cliente_nome || 'Cliente';
    const total = pedido.valor_total ? `R$ ${Number(pedido.valor_total).toFixed(2)}` : '';
    const tipoPedido = pedido.tipo_pedido === 'balcao' ? 'Balcão' : 'Delivery';

    if (tipo === 'create') {
      titulo = `🛎️ Novo Pedido ${numero}`;
      mensagem = `${tipoPedido} de ${cliente} — ${total}`;
      tipoNotif = 'nova_entrega';
    } else if (tipo === 'update') {
      const status = pedido.status;
      const statusLabels = {
        em_preparo: `⚙️ Pedido ${numero} em preparo`,
        pronto: `✅ Pedido ${numero} pronto`,
        em_entrega: `🛵 Pedido ${numero} saiu para entrega`,
        entregue: `📦 Pedido ${numero} entregue`,
        finalizada: `🏁 Pedido ${numero} finalizado`,
        cancelado: `❌ Pedido ${numero} cancelado`,
      };
      const mensagensStatus = {
        em_preparo: `${cliente} está aguardando o preparo`,
        pronto: `Pedido de ${cliente} está pronto para retirada/entrega`,
        em_entrega: `Pedido de ${cliente} está a caminho`,
        entregue: `Pedido de ${cliente} foi entregue — ${total}`,
        finalizada: `Pedido de ${cliente} foi finalizado`,
        cancelado: `Pedido de ${cliente} foi cancelado`,
      };
      if (!statusLabels[status]) {
        return Response.json({ success: false, skipped: true });
      }
      titulo = statusLabels[status];
      mensagem = mensagensStatus[status] || '';
      tipoNotif = status === 'cancelado' ? 'alerta' : 'mensagem';
    }

    if (!titulo) {
      return Response.json({ success: false, skipped: true });
    }

    await base44.asServiceRole.entities.Notificacao.create({
      pizzaria_id: pedido.pizzaria_id,
      tipo: tipoNotif,
      titulo,
      mensagem,
      lida: false,
      dados: { pedido_id: pedido.id, numero_pedido: pedido.numero_pedido, status: pedido.status },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});