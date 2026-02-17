import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { access_token } = await req.json();
    if (!access_token) return Response.json({ ok: false, erro: 'Access Token não informado' });

    // Testa buscando os dados da conta MP
    const res = await fetch('https://api.mercadopago.com/v1/account/bank_report/search', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Usa endpoint mais simples: buscar info do usuário MP
    const userRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const data = await userRes.json();

    if (userRes.ok && data.id) {
      return Response.json({
        ok: true,
        nome: data.first_name + ' ' + (data.last_name || ''),
        email: data.email,
        conta_tipo: data.site_id,
        id: data.id,
      });
    } else {
      return Response.json({
        ok: false,
        erro: data.message || 'Token inválido ou sem permissão',
      });
    }
  } catch (error) {
    return Response.json({ ok: false, erro: error.message }, { status: 500 });
  }
});