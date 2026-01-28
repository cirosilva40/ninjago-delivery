import { base44 } from '@/api/base44Client';

// Mensagens de notificação por status
const mensagensPorStatus = {
  novo: {
    titulo: '🎉 Pedido Recebido!',
    mensagem: 'Seu pedido foi recebido com sucesso e está sendo processado.',
  },
  em_preparo: {
    titulo: '👨‍🍳 Preparando seu Pedido',
    mensagem: 'Nosso chef já começou a preparar seu pedido com todo carinho!',
  },
  pronto: {
    titulo: '✅ Pedido Pronto',
    mensagem: 'Seu pedido está prontinho e aguardando o entregador!',
  },
  em_entrega: {
    titulo: '🏍️ Saiu para Entrega',
    mensagem: 'Seu pedido saiu para entrega! Chegará em breve.',
  },
  entregue: {
    titulo: '🎊 Pedido Entregue',
    mensagem: 'Seu pedido foi entregue! Esperamos que aproveite. Bom apetite! 🍕',
  },
  cancelado: {
    titulo: '❌ Pedido Cancelado',
    mensagem: 'Seu pedido foi cancelado. Entre em contato conosco se tiver dúvidas.',
  },
};

// Função para enviar notificação ao cliente sobre mudança de status
export const enviarNotificacaoStatusPedido = async (pedido, novoStatus) => {
  try {
    const mensagem = mensagensPorStatus[novoStatus];
    
    if (!mensagem) return; // Status não tem notificação configurada

    // Criar notificação no sistema
    await base44.entities.Notificacao.create({
      pizzaria_id: pedido.pizzaria_id || 'default',
      destinatario_id: pedido.cliente_telefone, // Usar telefone como ID do cliente
      tipo: 'alerta',
      titulo: mensagem.titulo,
      mensagem: `${mensagem.mensagem}\n\nPedido #${pedido.numero_pedido}`,
      dados: {
        pedido_id: pedido.id,
        status: novoStatus,
        numero_pedido: pedido.numero_pedido,
      },
      lida: false,
      url_acao: `/acompanhar-pedido?id=${pedido.id}`,
    });

    console.log(`✅ Notificação enviada: ${mensagem.titulo}`);
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};

// Função para enviar notificação manual do admin
export const enviarNotificacaoManual = async (pedido, titulo, mensagem) => {
  try {
    await base44.entities.Notificacao.create({
      pizzaria_id: pedido.pizzaria_id || 'default',
      destinatario_id: pedido.cliente_telefone,
      tipo: 'mensagem',
      titulo: titulo,
      mensagem: `${mensagem}\n\nPedido #${pedido.numero_pedido}`,
      dados: {
        pedido_id: pedido.id,
        numero_pedido: pedido.numero_pedido,
      },
      lida: false,
      url_acao: `/acompanhar-pedido?id=${pedido.id}`,
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação manual:', error);
    return false;
  }
};

// Verificar se deve enviar notificação (evitar duplicatas e notificações excessivas)
export const deveEnviarNotificacao = (statusAntigo, statusNovo) => {
  // Não enviar se status não mudou
  if (statusAntigo === statusNovo) return false;
  
  // Não enviar para transições irrelevantes
  const transicoesIgnoradas = [
    'finalizada', // Status interno, não relevante para cliente
  ];
  
  if (transicoesIgnoradas.includes(statusNovo)) return false;
  
  return true;
};