import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { lote = 10, offset = 0 } = await req.json().catch(() => ({}));

    // Buscar produtos sem imagem
    const todosProdutos = await base44.asServiceRole.entities.Produto.filter({});
    const produtosSemImagem = todosProdutos.filter(p => !p.imagem_url);
    
    // Pegar apenas o lote solicitado
    const produtosLote = produtosSemImagem.slice(offset, offset + lote);

    console.log(`Processando ${produtosLote.length} produtos (${offset} a ${offset + lote} de ${produtosSemImagem.length})`);

    const categoriaDescricao = {
      pizza: 'delicious Italian pizza',
      esfiha: 'Arabic esfiha pastry',
      lanche: 'gourmet burger sandwich',
      bebida: 'refreshing cold beverage',
      acai: 'Brazilian açaí bowl',
      combo: 'meal combo',
      sobremesa: 'delicious dessert',
      porcao: 'food portion appetizer',
      salgado: 'Brazilian savory snack',
      doce: 'gourmet sweet treat',
      outro: 'food dish'
    };

    const resultados = [];

    for (const produto of produtosLote) {
      try {
        const tipo = categoriaDescricao[produto.categoria] || 'food';
        const prompt = `Professional food photography, ${produto.nome}, ${tipo}, appetizing, clean white background, studio lighting, high quality`;

        const resultado = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });

        if (resultado?.url) {
          await base44.asServiceRole.entities.Produto.update(produto.id, {
            imagem_url: resultado.url
          });

          resultados.push({ nome: produto.nome, status: 'sucesso' });
        }
      } catch (error) {
        console.error(`Erro em ${produto.nome}:`, error.message);
        resultados.push({ nome: produto.nome, status: 'erro', erro: error.message });
      }
    }

    const proximoOffset = offset + lote;
    const temMais = proximoOffset < produtosSemImagem.length;

    return Response.json({
      success: true,
      processados: resultados.length,
      total_sem_imagem: produtosSemImagem.length,
      proximo_offset: temMais ? proximoOffset : null,
      tem_mais: temMais,
      resultados
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});