import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike,
  Package,
  MapPin,
  Phone,
  Navigation,
  Clock,
  DollarSign,
  Check,
  X,
  Play,
  AlertCircle,
  User,
  Home,
  History,
  Wallet,
  Settings,
  LogOut,
  ChevronRight,
  Star,
  RefreshCw,
  ExternalLink,
  Bell,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import moment from 'moment';

const statusConfig = {
  pendente: { label: 'Nova Entrega', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  aceita: { label: 'Aceita', color: 'bg-blue-500', textColor: 'text-blue-400' },
  em_rota: { label: 'Em Rota', color: 'bg-purple-500', textColor: 'text-purple-400' },
  entregue: { label: 'Entregue', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  recusada: { label: 'Recusada', color: 'bg-red-500', textColor: 'text-red-400' },
};

export default function AppEntregador() {
  const [activeTab, setActiveTab] = useState('entregas');
  const [user, setUser] = useState(null);
  const [entregador, setEntregador] = useState(null);
  const [selectedEntrega, setSelectedEntrega] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      // Buscar dados do entregador pelo email
      const entregadores = await base44.entities.Entregador.filter({ email: userData.email });
      if (entregadores.length > 0) {
        setEntregador(entregadores[0]);
      }
    } catch (e) {
      console.log('User not logged');
    }
  };

  const { data: entregas = [], refetch } = useQuery({
    queryKey: ['minhas-entregas', entregador?.id],
    queryFn: () => entregador?.id 
      ? base44.entities.Entrega.filter({ entregador_id: entregador.id }, '-created_date', 50)
      : Promise.resolve([]),
    enabled: !!entregador?.id,
    refetchInterval: 5000,
  });

  const { data: historico = [] } = useQuery({
    queryKey: ['historico-entregas', entregador?.id],
    queryFn: () => entregador?.id 
      ? base44.entities.Entrega.filter({ entregador_id: entregador.id, status: 'entregue' }, '-created_date', 100)
      : Promise.resolve([]),
    enabled: !!entregador?.id,
  });

  const entregasPendentes = entregas.filter(e => e.status === 'pendente');
  const entregaAtiva = entregas.find(e => e.status === 'aceita' || e.status === 'em_rota');

  const updateStatus = async (entregaId, newStatus) => {
    try {
      const updates = { status: newStatus };
      
      if (newStatus === 'aceita') {
        updates.horario_aceite = new Date().toISOString();
        // Atualizar status do entregador
        if (entregador?.id) {
          await base44.entities.Entregador.update(entregador.id, { status: 'em_entrega' });
        }
      } else if (newStatus === 'em_rota') {
        updates.horario_saida = new Date().toISOString();
      } else if (newStatus === 'entregue') {
        updates.horario_entrega = new Date().toISOString();
        const entrega = entregas.find(e => e.id === entregaId);
        if (entrega?.horario_saida) {
          const minutos = moment().diff(moment(entrega.horario_saida), 'minutes');
          updates.tempo_entrega_minutos = minutos;
        }
        // Atualizar saldo do entregador
        if (entregador?.id && entrega?.taxa_entregador) {
          const novoSaldo = (entregador.saldo_taxas || 0) + entrega.taxa_entregador;
          await base44.entities.Entregador.update(entregador.id, { 
            saldo_taxas: novoSaldo,
            total_entregas: (entregador.total_entregas || 0) + 1,
            status: 'disponivel'
          });
        }
      } else if (newStatus === 'recusada') {
        if (entregador?.id) {
          await base44.entities.Entregador.update(entregador.id, { status: 'disponivel' });
        }
      }

      await base44.entities.Entrega.update(entregaId, updates);
      refetch();
      loadUser();
      setSelectedEntrega(null);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  const openMaps = (entrega) => {
    const address = encodeURIComponent(entrega.endereco_completo);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openWaze = (entrega) => {
    if (entrega.latitude_destino && entrega.longitude_destino) {
      const url = `https://waze.com/ul?ll=${entrega.latitude_destino},${entrega.longitude_destino}&navigate=yes`;
      window.open(url, '_blank');
    } else {
      const address = encodeURIComponent(entrega.endereco_completo);
      const url = `https://waze.com/ul?q=${address}&navigate=yes`;
      window.open(url, '_blank');
    }
  };

  const toggleStatus = async () => {
    if (!entregador) return;
    const newStatus = entregador.status === 'disponivel' ? 'offline' : 'disponivel';
    await base44.entities.Entregador.update(entregador.id, { status: newStatus });
    loadUser();
  };

  // Se não está logado ou não é entregador
  if (!entregador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10 p-8 text-center">
          <Bike className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">App do Entregador</h1>
          <p className="text-slate-400 mb-6">
            {user ? 'Seu perfil não está vinculado a um entregador cadastrado.' : 'Faça login para acessar suas entregas.'}
          </p>
          {!user ? (
            <Button 
              onClick={() => base44.auth.redirectToLogin()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600"
            >
              Fazer Login
            </Button>
          ) : (
            <p className="text-sm text-slate-500">
              Entre em contato com a pizzaria para vincular seu cadastro.
            </p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                entregador.status === 'disponivel' ? 'bg-emerald-500' : 
                entregador.status === 'em_entrega' ? 'bg-blue-500' : 'bg-slate-500'
              }`} />
            </div>
            <div>
              <h1 className="font-bold text-white">{entregador.nome}</h1>
              <p className="text-xs text-slate-400 capitalize">{entregador.status?.replace('_', ' ')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={refetch}
              className="text-slate-400"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <button
              onClick={toggleStatus}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                entregador.status === 'disponivel' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}
            >
              {entregador.status === 'disponivel' ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        {/* Nova Entrega Alert */}
        <AnimatePresence>
          {entregasPendentes.length > 0 && !selectedEntrega && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Nova Entrega!</p>
                    <p className="text-sm text-orange-200">{entregasPendentes.length} entrega(s) aguardando</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedEntrega(entregasPendentes[0])}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600"
                >
                  Ver Entrega
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entrega Ativa */}
        {entregaAtiva && !selectedEntrega && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Entrega em Andamento
            </h2>
            <Card 
              className="bg-white/5 border-white/10 p-5 cursor-pointer hover:bg-white/8"
              onClick={() => setSelectedEntrega(entregaAtiva)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-white">#{entregaAtiva.numero_pedido}</span>
                    <Badge className={`${statusConfig[entregaAtiva.status]?.color}/20 ${statusConfig[entregaAtiva.status]?.textColor}`}>
                      {statusConfig[entregaAtiva.status]?.label}
                    </Badge>
                  </div>
                  <p className="text-slate-400">{entregaAtiva.cliente_nome}</p>
                </div>
                <p className="text-2xl font-bold text-emerald-400">R$ {entregaAtiva.valor_pedido?.toFixed(2)}</p>
              </div>
              
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{entregaAtiva.endereco_completo}</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={(e) => { e.stopPropagation(); openMaps(entregaAtiva); }}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Google Maps
                </Button>
                <Button 
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                  onClick={(e) => { e.stopPropagation(); openWaze(entregaAtiva); }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Waze
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white/5 border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-white">{historico.length}</p>
            <p className="text-xs text-slate-400">Entregas</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">R$ {entregador.saldo_taxas?.toFixed(0) || '0'}</p>
            <p className="text-xs text-slate-400">Saldo</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-2xl font-bold text-white">{entregador.avaliacao_media?.toFixed(1) || '5.0'}</span>
            </div>
            <p className="text-xs text-slate-400">Avaliação</p>
          </Card>
        </div>

        {/* Tabs Content */}
        {activeTab === 'entregas' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Entregas Recentes</h2>
            {entregas.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Nenhuma entrega no momento</p>
                <p className="text-sm text-slate-500">Aguarde novas entregas</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {entregas.filter(e => e.status !== 'entregue').map((entrega) => (
                  <Card 
                    key={entrega.id}
                    className="bg-white/5 border-white/10 p-4 cursor-pointer hover:bg-white/8"
                    onClick={() => setSelectedEntrega(entrega)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig[entrega.status]?.color}/20`}>
                          <Package className={`w-5 h-5 ${statusConfig[entrega.status]?.textColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">#{entrega.numero_pedido}</span>
                            <Badge className={`${statusConfig[entrega.status]?.color}/20 ${statusConfig[entrega.status]?.textColor} text-xs`}>
                              {statusConfig[entrega.status]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">{entrega.bairro || entrega.endereco_completo?.slice(0, 30)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">R$ {entrega.valor_pedido?.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">{moment(entrega.created_date).fromNow()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'historico' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Histórico de Entregas</h2>
            {historico.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-8 text-center">
                <History className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Nenhuma entrega concluída</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {historico.slice(0, 20).map((entrega) => (
                  <Card key={entrega.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">#{entrega.numero_pedido}</p>
                        <p className="text-sm text-slate-400">{entrega.bairro}</p>
                        <p className="text-xs text-slate-500">{moment(entrega.horario_entrega).format('DD/MM HH:mm')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">+R$ {entrega.taxa_entregador?.toFixed(2)}</p>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Entregue</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'carteira' && (
          <div>
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-none p-6 mb-6">
              <p className="text-white/80 text-sm">Saldo Acumulado</p>
              <p className="text-4xl font-bold text-white mt-1">R$ {entregador.saldo_taxas?.toFixed(2) || '0.00'}</p>
              <p className="text-white/60 text-sm mt-2">{historico.length} entregas realizadas</p>
            </Card>

            <h3 className="text-lg font-semibold text-white mb-3">Últimos Ganhos</h3>
            <div className="space-y-2">
              {historico.slice(0, 10).map((entrega) => (
                <Card key={entrega.id} className="bg-white/5 border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Entrega #{entrega.numero_pedido}</p>
                        <p className="text-xs text-slate-400">{moment(entrega.horario_entrega).format('DD/MM HH:mm')}</p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-400">+R$ {entrega.taxa_entregador?.toFixed(2)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">{entregador.nome?.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{entregador.nome}</h2>
                  <p className="text-slate-400">{entregador.telefone}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-white">{entregador.avaliacao_media?.toFixed(1)}</span>
                    <span className="text-slate-400">• {entregador.total_entregas || 0} entregas</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400">Veículo</span>
                  <span className="text-white capitalize">{entregador.veiculo}</span>
                </div>
                {entregador.placa_veiculo && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-slate-400">Placa</span>
                    <span className="text-white">{entregador.placa_veiculo}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400">Email</span>
                  <span className="text-white">{entregador.email || user?.email}</span>
                </div>
              </div>
            </Card>

            <Button 
              variant="outline" 
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/5 px-4 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {[
            { id: 'entregas', icon: Package, label: 'Entregas' },
            { id: 'historico', icon: History, label: 'Histórico' },
            { id: 'carteira', icon: Wallet, label: 'Carteira' },
            { id: 'perfil', icon: User, label: 'Perfil' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'text-orange-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modal de Detalhes da Entrega */}
      <AnimatePresence>
        {selectedEntrega && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end"
            onClick={() => setSelectedEntrega(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-h-[90vh] bg-slate-900 rounded-t-3xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Handle */}
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-white">#{selectedEntrega.numero_pedido}</span>
                      <Badge className={`${statusConfig[selectedEntrega.status]?.color}/20 ${statusConfig[selectedEntrega.status]?.textColor}`}>
                        {statusConfig[selectedEntrega.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-slate-400">{selectedEntrega.itens_resumo || 'Pedido da pizzaria'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-400">R$ {selectedEntrega.valor_pedido?.toFixed(2)}</p>
                    <p className="text-sm text-slate-400">Taxa: R$ {selectedEntrega.taxa_entregador?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Cliente */}
                <Card className="bg-white/5 border-white/10 p-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{selectedEntrega.cliente_nome}</p>
                      <a 
                        href={`tel:${selectedEntrega.cliente_telefone}`}
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-4 h-4" />
                        {selectedEntrega.cliente_telefone}
                      </a>
                    </div>
                    <a 
                      href={`tel:${selectedEntrega.cliente_telefone}`}
                      className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600"
                    >
                      <Phone className="w-5 h-5 text-white" />
                    </a>
                  </div>
                </Card>

                {/* Endereço */}
                <Card className="bg-white/5 border-white/10 p-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{selectedEntrega.endereco_completo}</p>
                      {selectedEntrega.bairro && (
                        <p className="text-slate-400">{selectedEntrega.bairro}</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Pagamento */}
                <Card className="bg-white/5 border-white/10 p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400">Forma de Pagamento</p>
                      <p className="font-semibold text-white capitalize">{selectedEntrega.forma_pagamento?.replace('_', ' ')}</p>
                    </div>
                    {selectedEntrega.troco_para > 0 && (
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Troco para</p>
                        <p className="font-bold text-white">R$ {selectedEntrega.troco_para?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Botões de Navegação */}
                <div className="flex gap-3 mb-6">
                  <Button 
                    className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-lg"
                    onClick={() => openMaps(selectedEntrega)}
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Google Maps
                  </Button>
                  <Button 
                    className="flex-1 h-14 bg-cyan-500 hover:bg-cyan-600 text-lg"
                    onClick={() => openWaze(selectedEntrega)}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Waze
                  </Button>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3">
                  {selectedEntrega.status === 'pendente' && (
                    <>
                      <Button 
                        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 text-lg"
                        onClick={() => updateStatus(selectedEntrega.id, 'aceita')}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Aceitar Entrega
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full h-14 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => updateStatus(selectedEntrega.id, 'recusada')}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Recusar
                      </Button>
                    </>
                  )}

                  {selectedEntrega.status === 'aceita' && (
                    <Button 
                      className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-600 text-lg"
                      onClick={() => updateStatus(selectedEntrega.id, 'em_rota')}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Iniciar Entrega
                    </Button>
                  )}

                  {selectedEntrega.status === 'em_rota' && (
                    <Button 
                      className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 text-lg"
                      onClick={() => updateStatus(selectedEntrega.id, 'entregue')}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Finalizar Entrega
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}