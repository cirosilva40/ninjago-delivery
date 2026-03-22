import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Validar se é admin
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar todos os clientes que ainda não têm senha
    const clientesSemSenha = await base44.asServiceRole.entities.Cliente.filter({ senha: null }, '-created_date', 1000);

    // Gerar senhas temporárias para cada cliente
    const clientesAtualizados = [];
    
    for (const cliente of clientesSemSenha) {
      // Gerar senha temporária: 8 caracteres aleatórios
      const senhaTemporaria = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      await base44.asServiceRole.entities.Cliente.update(cliente.id, {
        senha: senhaTemporaria
      });

      clientesAtualizados.push({
        id: cliente.id,
        email: cliente.email,
        nome: cliente.nome,
        senhaTemporaria: senhaTemporaria
      });
    }

    return Response.json({
      success: true,
      message: `${clientesAtualizados.length} cliente(s) atualizado(s) com sucesso`,
      clientes: clientesAtualizados
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});