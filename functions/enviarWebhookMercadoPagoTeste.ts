import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { pizzaria_id, webhook_url } = await req.json();

    if (!pizzaria_id || !webhook_url) {
      return Response.json({ success: false, message: 'ID da pizzaria ou URL do webhook faltando' }, { status: 400 });
    }

    if (user.role !== 'admin' && user.pizzaria_id !== pizzaria_id) {
      return Response.json({ success: false, message: 'Acesso negado para esta pizzaria' }, { status: 403 });
    }

    const testPayload = {
      id: '54321',
      live_mode: false,
      type: 'payment',
      date_created: new Date().toISOString(),
      action: 'payment.created',
      data: { id: '123456789' },
    };

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      return Response.json({ success: true, message: 'Evento de teste enviado com sucesso.' });
    } else {
      const errorText = await response.text();
      return Response.json({ success: false, message: `Webhook respondeu com erro ${response.status}: ${errorText}` });
    }
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
});