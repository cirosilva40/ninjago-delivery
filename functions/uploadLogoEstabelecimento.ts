import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se usuário está autenticado e é admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Acesso negado. Apenas administradores podem fazer upload de logos.' },
        { status: 403 }
      );
    }

    // Parse do form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return Response.json(
        { error: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { error: 'O arquivo deve ter no máximo 5MB' },
        { status: 400 }
      );
    }

    // Fazer upload usando a integração Core.UploadFile
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
      file: file
    });

    if (!uploadResult.file_url) {
      return Response.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      file_url: uploadResult.file_url
    });

  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    return Response.json(
      { error: error.message || 'Erro ao processar upload' },
      { status: 500 }
    );
  }
});