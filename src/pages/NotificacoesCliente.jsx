import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function NotificacoesCliente() {
  const navigate = useNavigate();
  const [clienteTelefone, setClienteTelefone] = useState(null);

  useEffect(() => {
    const clienteData = localStorage.getItem('cliente_logado');
    if (clienteData) {
      const cliente = JSON.parse(clienteData);
      setClienteTelefone(cliente.telefone);
    } else {
      navigate(createPageUrl('AcessoCliente'));
    }
  }, []);

  const { data: notificacoes = [], refetch } = useQuery({
    queryKey: ['notificacoes-cliente', clienteTelefone],
    queryFn: () => {
      if (!clienteTelefone) return [];
      return base44.entities.Notificacao.filter({ 
        destinatario_id: clienteTelefone 
      }, '-created_date', 50);
    },
    enabled: !!clienteTelefone,
    refetchInterval: 10000,
  });

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);
  const notificacoesLidas = notificacoes.filter(n => n.lida);

  const marcarComoLida = async (id) => {
    await base44.entities.Notificacao.update(id, { lida: true });
    refetch();
  };

  const marcarTodasComoLidas = async () => {
    await Promise.all(
      notificacoesNaoLidas.map(n => base44.entities.Notificacao.update(n.id, { lida: true }))
    );
    refetch();
  };

  const deletarNotificacao = async (id) => {
    await base44.entities.Notificacao.delete(id);
    refetch();
  };

  const handleNotificacaoClick = (notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }
    
    if (notificacao.url_acao) {
      window.location.href = notificacao.url_acao;
    }
  };

  const NotificacaoCard = ({ notificacao }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card 
        className={`p-4 cursor-pointer transition-all ${
          notificacao.lida 
            ? 'bg-white/5 border-white/10' 
            : 'bg-gradient-to-r from-orange-500/20 to-red-500/10 border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/20'
        }`}
        onClick={() => handleNotificacaoClick(notificacao)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            notificacao.lida ? 'bg-white/10' : 'bg-orange-500/30'
          }`}>
            <Bell className={`w-5 h-5 ${notificacao.lida ? 'text-slate-400' : 'text-orange-400'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{notificacao.titulo}</h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notificacao.lida && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      marcarComoLida(notificacao.id);
                    }}
                    className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                    title="Marcar como lida"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletarNotificacao(notificacao.id);
                  }}
                  className="h-7 w-7 text-red-400 hover:text-red-300"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">{notificacao.mensagem}</p>
            
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-500">
                {moment(notificacao.created_date).format('DD/MM/YYYY HH:mm')}
              </span>
              {!notificacao.lida && (
                <Badge className="bg-orange-500/30 text-orange-300 text-xs">Nova</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (!clienteTelefone) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Bell className="w-7 h-7 text-orange-500" />
              Notificações
            </h1>
            {notificacoesNaoLidas.length > 0 && (
              <p className="text-slate-400 mt-1">
                {notificacoesNaoLidas.length} não lida{notificacoesNaoLidas.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl('CardapioCliente'))}
              className="text-slate-400"
            >
              <X className="w-4 h-4 mr-1" />
              Fechar
            </Button>
            {notificacoesNaoLidas.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={marcarTodasComoLidas}
                className="border-emerald-500/50 text-emerald-400"
              >
                <Check className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Notificações */}
        {notificacoes.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Nenhuma notificação ainda</p>
            <p className="text-slate-500 text-sm mt-2">
              Você receberá atualizações sobre seus pedidos aqui
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Não Lidas */}
            {notificacoesNaoLidas.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  Novas
                  <Badge className="bg-orange-500/30 text-orange-300">
                    {notificacoesNaoLidas.length}
                  </Badge>
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {notificacoesNaoLidas.map(notif => (
                      <NotificacaoCard key={notif.id} notificacao={notif} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Lidas */}
            {notificacoesLidas.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-400 mb-3">Anteriores</h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {notificacoesLidas.map(notif => (
                      <NotificacaoCard key={notif.id} notificacao={notif} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}