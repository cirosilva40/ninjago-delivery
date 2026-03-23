import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { pizzariaId } = payload;

    if (!pizzariaId) {
      return Response.json({ error: 'pizzariaId obrigatório' }, { status: 400 });
    }

    const pizzaria = await base44.asServiceRole.entities.Pizzaria.get(pizzariaId);
    if (!pizzaria) {
      return Response.json({ error: 'Pizzaria não encontrada' }, { status: 404 });
    }

    // Retorna APENAS os campos públicos necessários pelo cardápio do cliente.
    // Campos sensíveis (mp_access_token, senha, dados_bancarios, etc.) são OMITIDOS.
    const dadosPublicos = {
      id: pizzaria.id,
      nome: pizzaria.nome,
      nome_exibicao_cliente: pizzaria.nome_exibicao_cliente,
      tema_cliente: pizzaria.tema_cliente,
      cor_primaria_cliente: pizzaria.cor_primaria_cliente,
      logo_url: pizzaria.logo_url,
      horario_abertura: pizzaria.horario_abertura,
      horario_fechamento: pizzaria.horario_fechamento,
      taxa_entrega_base: pizzaria.taxa_entrega_base,
      raio_entrega_km: pizzaria.raio_entrega_km,
      raio_maximo_atendimento_km: pizzaria.raio_maximo_atendimento_km,
      taxa_adicional_por_km: pizzaria.taxa_adicional_por_km,
      valor_minimo_entrega_gratis: pizzaria.valor_minimo_entrega_gratis,
      entrega_gratis_dentro_raio_base: pizzaria.entrega_gratis_dentro_raio_base,
      latitude: pizzaria.latitude,
      longitude: pizzaria.longitude,
      telefone: pizzaria.telefone,
      endereco: pizzaria.endereco,
      cidade: pizzaria.cidade,
      estado: pizzaria.estado,
      // Configurações: somente o que o frontend público precisa
      configuracoes: {
        loja_aberta: pizzaria.configuracoes?.loja_aberta,
        tempo_medio_preparo: pizzaria.configuracoes?.tempo_medio_preparo,
        aceitar_pix: pizzaria.configuracoes?.aceitar_pix,
        aceitar_cartao: pizzaria.configuracoes?.aceitar_cartao,
        aceitar_dinheiro: pizzaria.configuracoes?.aceitar_dinheiro,
        // mp_public_key é segura para expor (chave pública por design do MP)
        mp_public_key: pizzaria.configuracoes?.mp_public_key,
        // mp_access_token é OMITIDO intencionalmente
      },
    };

    return Response.json({ success: true, pizzaria: dadosPublicos });
  } catch (error) {
    console.error('Erro ao obter config pública:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});