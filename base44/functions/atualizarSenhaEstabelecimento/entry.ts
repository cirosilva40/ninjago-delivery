import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { estabelecimento_id, nova_senha } = await req.json();

    if (!estabelecimento_id || !nova_senha) {
      return Response.json(
        { error: 'ID do estabelecimento e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (nova_senha.length < 6) {
      return Response.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);

    // Atualiza a senha usando service role
    await base44.asServiceRole.entities.Pizzaria.update(estabelecimento_id, {
      senha: nova_senha,
      eh_senha_temporaria: false
    });

    return Response.json({ 
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return Response.json(
      { error: 'Erro ao atualizar senha. Tente novamente.' },
      { status: 500 }
    );
  }
});