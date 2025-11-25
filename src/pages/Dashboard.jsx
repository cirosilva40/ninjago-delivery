import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Bike,
  DollarSign,
  Clock,
  TrendingUp,
  MapPin,
  ArrowRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/StatsCard';
import EntregaCard from '@/components/dashboard/EntregaCard';
import EntregadorCard from '@/components/dashboard/EntregadorCard';
import PedidoModal from '@/components/pedidos/PedidoModal';
import AtribuirEntregaModal from '@/components/pedidos/AtribuirEntregaModal';
import moment from 'moment';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [pizzariaId, setPizzariaId] = useState(null);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showAtribuirModal, setShowAtribuirModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      // Por simplicidade, usar o primeiro pizzaria_id ou criar um default
      setPizzariaId(userData.pizzaria_id || 'default');
    } catch (e) {
      console.log('Usuário não logado');
    }
  };

  const { data: entregas = [], refetch: refetchEntregas } = useQuery({
    queryKey: ['entregas'],
    queryFn: () => base44.entities.Entrega.list('-created_date', 50),
    refetchInterval: 10000,
  });

  const { data: pedidos = [], refetch: refetchPedidos } = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => base44.entities.Pedido.list('-created_date', 50),
    refetchInterval: 10000,
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ['entregadores'],
    queryFn: () => base44.entities.Entregador.list('-created_date', 50),
    refetchInterval: 15000,
  });

  const refetchAll = () => {
    refetchEntregas();
    refetchPedidos();
  };

  // Estatísticas
  const hoje = moment().startOf('day');
  const entregasHoje = entregas.filter(e => moment(e.created_date).isSameOrAfter(hoje));
  const entregasConcluidas = entregasHoje.filter(e => e.status === 'entregue');
  const entregadoresAtivos = entregadores.filter(e => e.status === 'disponivel' || e.status === 'em_entrega');
  const faturamentoHoje = entregasConcluidas.reduce((acc, e) => acc + (e.valor_pedido || 0), 0);
  const taxasHoje = entregasConcluidas.reduce((acc, e) => acc + (e.taxa_entregador || 0), 0);

  // Pedidos prontos para entrega
  const pedidosProntos = pedidos.filter(p => p.status === 'pronto' || p.status === 'novo');
  
  // Entregas em andamento
  const entregasEmAndamento = entregas.filter(e => e.status === 'pendente' || e.status === 'aceita' || e.status === 'em_rota');

  const handleAtribuir = (pedido) => {
    setSelectedPedido(pedido);
    setShowAtribuirModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Visão geral da operação • {moment().format('dddd, D [de] MMMM')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={refetchAll}
            className="border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => setShowPedidoModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Entregas Hoje"
          value={entregasConcluidas.length}
          subtitle={`${entregasEmAndamento.length} em andamento`}
          icon={Package}
          color="orange"
          trend={12}
        />
        <StatsCard
          title="Entregadores Ativos"
          value={entregadoresAtivos.length}
          subtitle={`${entregadores.length} cadastrados`}
          icon={Bike}
          color="green"
        />
        <StatsCard
          title="Faturamento"
          value={`R$ ${faturamentoHoje.toFixed(2)}`}
          subtitle="Hoje"
          icon={DollarSign}
          color="blue"
          trend={8}
        />
        <StatsCard
          title="Taxas Pagas"
          value={`R$ ${taxasHoje.toFixed(2)}`}
          subtitle="Hoje"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pedidos Prontos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Pedidos Aguardando Entrega
              {pedidosProntos.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-sm">
                  {pedidosProntos.length}
                </span>
              )}
            </h2>
            <Link 
              to={createPageUrl('Pedidos')}
              className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <AnimatePresence>
            {pedidosProntos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center"
              >
                <Package className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Nenhum pedido aguardando entrega</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {pedidosProntos.slice(0, 5).map((pedido) => (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/8 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">#{pedido.numero_pedido}</span>
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                              {pedido.status === 'novo' ? 'Novo' : 'Pronto'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{pedido.cliente_nome}</p>
                          <p className="text-xs text-slate-500">{pedido.cliente_endereco}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-emerald-400">R$ {pedido.valor_total?.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{moment(pedido.created_date).fromNow()}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAtribuir(pedido)}
                          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                        >
                          <Bike className="w-4 h-4 mr-1" />
                          Atribuir
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Entregas em Andamento */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-500" />
              Entregas em Andamento
              {entregasEmAndamento.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                  {entregasEmAndamento.length}
                </span>
              )}
            </h2>

            {entregasEmAndamento.length === 0 ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                <Bike className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Nenhuma entrega em andamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entregasEmAndamento.map((entrega) => (
                  <EntregaCard 
                    key={entrega.id} 
                    entrega={entrega} 
                    compact 
                    onClick={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Entregadores */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bike className="w-5 h-5 text-emerald-500" />
              Entregadores
            </h2>
            <Link 
              to={createPageUrl('Entregadores')}
              className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {entregadores.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
              <Bike className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 mb-4">Nenhum entregador cadastrado</p>
              <Link to={createPageUrl('Entregadores')}>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Entregador
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {entregadores.slice(0, 4).map((entregador) => (
                <EntregadorCard key={entregador.id} entregador={entregador} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <PedidoModal
        open={showPedidoModal}
        onClose={() => setShowPedidoModal(false)}
        pizzariaId={pizzariaId}
        onSave={refetchPedidos}
      />

      <AtribuirEntregaModal
        open={showAtribuirModal}
        onClose={() => {
          setShowAtribuirModal(false);
          setSelectedPedido(null);
        }}
        pedido={selectedPedido}
        pizzariaId={pizzariaId}
        onAtribuir={refetchAll}
      />
    </div>
  );
}