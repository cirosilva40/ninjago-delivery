Deno.serve(async (req) => {
  try {
    const { access_token } = await req.json();
    if (!access_token) return Response.json({ ok: false, erro: 'Access Token não informado' });

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