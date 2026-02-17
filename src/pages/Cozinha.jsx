import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
  User,
  MapPin,
  Timer,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { enviarNotificacaoStatusPedido, deveEnviarNotificacao } from '@/components/pedidos/NotificacaoHelper';
import { toast } from 'sonner';
import moment from 'moment';

const statusConfig = {
  em_preparo: { label: 'Em Preparo', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  pronto: { label: 'Pronto', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
};

export default function Cozinha() {
  const [pizzariaId, setPizzariaId] = useState(null);
  const [pizzariaIdCarregado, setPizzariaIdCarregado] = useState(false);

  React.useEffect(() => {
    const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
    if (estabelecimentoLogado) {
      try {
        const estab = JSON.parse(estabelecimentoLogado);
        setPizzariaId(estab.id);
      } catch (e) {}
    }
    setPizzariaIdCarregado(true);
  }, []);

  const { data: pedidos = [], refetch } = useQuery({
    queryKey: ['pedidos-cozinha', pizzariaId],
    queryFn: () => {
      const filtro = pizzariaId
        ? { pizzaria_id: pizzariaId, status: { $in: ['em_preparo', 'pronto'] } }
        : { status: { $in: ['em_preparo', 'pronto'] } };
      return base44.entities.Pedido.filter(filtro, '-created_date', 100);
    },
    enabled: pizzariaIdCarregado,
    refetchInterval: 5000,
  });

  const pedidosEmPreparo = pedidos.filter(p => p.status === 'em_preparo');
  const pedidosProntos = pedidos.filter(p => p.status === 'pronto');

  const marcarPronto = async (pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    const statusAntigo = pedido?.status;
    
    await base44.entities.Pedido.update(pedidoId, { 
      status: 'pronto',
      horario_pronto: new Date().toISOString()
    });
    
    // Enviar notificação ao cliente
    if (pedido && deveEnviarNotificacao(statusAntigo, 'pronto')) {
      await enviarNotificacaoStatusPedido({ ...pedido, status: 'pronto' }, 'pronto');
      toast.success('Pedido pronto e cliente notificado! 📲');
    }
    
    refetch();
  };

  const calcularTempoDecorrido = (dataInicio) => {
    const inicio = moment(dataInicio);
    const agora = moment();
    const minutos = agora.diff(inicio, 'minutes');
    return minutos;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-orange-500" />
            Cozinha
          </h1>
          <p className="text-slate-400 mt-1">
            {pedidosEmPreparo.length} em preparo • {pedidosProntos.length} prontos para entrega
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          className="border-slate-700 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Em Preparo */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Em Preparo
            <Badge className="bg-yellow-500/20 text-yellow-400 ml-2">{pedidosEmPreparo.length}</Badge>
          </h2>

          <div className="space-y-4">
            <AnimatePresence>
              {pedidosEmPreparo.length === 0 ? (
                <Card className="bg-white/5 border-white/10 p-8 text-center">
                  <ChefHat className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">Nenhum pedido em preparo</p>
                </Card>
              ) : (
                pedidosEmPreparo.map((pedido) => {
                  const tempoDecorrido = calcularTempoDecorrido(pedido.horario_pedido || pedido.created_date);
                  const atrasado = tempoDecorrido > 30;
                  
                  return (
                    <motion.div
                      key={pedido.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className={`bg-white/5 border-2 ${atrasado ? 'border-red-500/50' : 'border-yellow-500/30'} p-4`}>
                        {/* Header do Pedido */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-white">#{pedido.numero_pedido}</span>
                              {atrasado && (
                                <Badge className="bg-red-500/20 text-red-400 animate-pulse">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Atrasado
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {pedido.cliente_nome}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="w-4 h-4" />
                                {tempoDecorrido} min
                              </span>
                            </div>
                          </div>
                          <Badge className={`${pedido.tipo_pedido === 'balcao' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {pedido.tipo_pedido === 'balcao' ? 'Balcão' : 'Delivery'}
                          </Badge>
                        </div>

                        {/* Itens do Pedido */}
                        <div className="space-y-2 mb-4">
                          {pedido.itens?.map((item, index) => (
                            <div key={index} className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-white">
                                    <span className="text-orange-400 font-bold">{item.quantidade}x</span> {item.nome}
                                  </p>
                                  {item.observacao && (
                                    <p className="text-sm text-yellow-400 mt-1 flex items-start gap-1">
                                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      {item.observacao}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Observações Gerais */}
                        {pedido.observacoes && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                            <p className="text-sm text-yellow-300 font-medium">📝 Observação:</p>
                            <p className="text-sm text-yellow-200">{pedido.observacoes}</p>
                          </div>
                        )}

                        {/* Botão Pronto */}
                        <Button
                          onClick={() => marcarPronto(pedido.id)}
                          className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-lg font-semibold"
                        >
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Marcar como Pronto
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Prontos */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Prontos para Entrega
            <Badge className="bg-emerald-500/20 text-emerald-400 ml-2">{pedidosProntos.length}</Badge>
          </h2>

          <div className="space-y-4">
            <AnimatePresence>
              {pedidosProntos.length === 0 ? (
                <Card className="bg-white/5 border-white/10 p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">Nenhum pedido pronto</p>
                </Card>
              ) : (
                pedidosProntos.map((pedido) => (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-2xl font-bold text-white">#{pedido.numero_pedido}</span>
                          <p className="text-sm text-slate-400 mt-1">{pedido.cliente_nome}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-500 text-white">Pronto</Badge>
                          <p className="text-xs text-slate-400 mt-1">
                            {pedido.horario_pronto && moment(pedido.horario_pronto).format('HH:mm')}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {pedido.itens?.map((item, index) => (
                          <p key={index} className="text-sm text-slate-300">
                            {item.quantidade}x {item.nome}
                          </p>
                        ))}
                      </div>

                      {pedido.tipo_pedido === 'delivery' && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{pedido.cliente_bairro}</span>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}