import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar todos os produtos sem imagem
    const produtos = await base44.asServiceRole.entities.Produto.filter({});
    const produtosSemImagem = produtos.filter(p => !p.imagem_url);

    console.log(`Encontrados ${produtosSemImagem.length} produtos sem imagem`);

    const resultados = [];
    let sucesso = 0;
    let erros = 0;

    // Gerar imagem para cada produto
    for (const produto of produtosSemImagem) {
      try {
        // Criar prompt baseado na categoria e nome do produto
        const categoriaDescricao = {
          pizza: 'pizza italiana',
          esfiha: 'esfiha árabe',
          lanche: 'hambúrguer gourmet',
          bebida: 'bebida gelada',
          acai: 'açaí bowl',
          combo: 'combo de comida',
          sobremesa: 'sobremesa deliciosa',
          porcao: 'porção de comida',
          salgado: 'salgado brasileiro',
          doce: 'doce gourmet',
          outro: 'comida'
        };

        const tipo = categoriaDescricao[produto.categoria] || 'comida';
        const prompt = `Professional food photography of ${produto.nome}, ${tipo}, ${produto.descricao || ''}, appetizing presentation, clean white background, studio lighting, commercial quality, 4k`;

        console.log(`Gerando imagem para: ${produto.nome}`);

        // Gerar imagem usando integração Core
        const resultado = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt
        });

        if (resultado && resultado.url) {
          // Atualizar produto com a URL da imagem
          await base44.asServiceRole.entities.Produto.update(produto.id, {
            imagem_url: resultado.url
          });

          resultados.push({
            id: produto.id,
            nome: produto.nome,
            status: 'sucesso',
            url: resultado.url
          });
          sucesso++;
        } else {
          throw new Error('Falha ao gerar imagem');
        }

      } catch (error) {
        console.error(`Erro ao processar ${produto.nome}:`, error.message);
        resultados.push({
          id: produto.id,
          nome: produto.nome,
          status: 'erro',
          erro: error.message
        });
        erros++;
      }
    }

    return Response.json({
      success: true,
      total: produtosSemImagem.length,
      sucesso,
      erros,
      resultados
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});