import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { clienteId } = await req.json();

    if (!clienteId) {
      return Response.json({ error: 'clienteId é obrigatório' }, { status: 400 });
    }

    // Buscar o cliente pelo ID da pizzaria (email do estabelecimento)
    const pizzaria = await base44.asServiceRole.entities.Pizzaria.list();
    const estab = pizzaria.find(p => p.id === clienteId);
    
    if (!estab || !estab.email) {
      return Response.json({ error: 'Estabelecimento não encontrado' }, { status: 404 });
    }

    // Buscar cliente pelo email do estabelecimento
    const clientes = await base44.asServiceRole.entities.Cliente.filter({ email: estab.email });
    
    if (clientes.length === 0) {
      return Response.json({ error: 'Cliente não encontrado para este estabelecimento' }, { status: 404 });
    }

    const cliente = clientes[0];

    // Gerar senha temporária: 8 caracteres aleatórios
    const senhaTemporaria = Math.random().toString(36).substring(2, 10).toUpperCase();

    await base44.asServiceRole.entities.Cliente.update(cliente.id, {
      senha: senhaTemporaria
    });

    return Response.json({
      success: true,
      senhaTemporaria: senhaTemporaria
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});