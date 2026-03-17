import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  User,
  History,
  Wallet,
  LogOut,
  Star,
  RefreshCw,
  ExternalLink,
  Bell,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  TrendingUp,
  Calendar,
  ChevronDown,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Store,
  ArrowRight,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import moment from 'moment';
import 'moment/locale/pt-br';
import RotaOtimizadaCard from '@/components/entregador/RotaOtimizadaCard';
import PagamentoCard from '@/components/entregador/PagamentoCard';
import { useGeoTracking } from '@/components/entregador/useGeoTracking';
moment.locale('pt-br');

const statusConfig = {
  pendente: { label: 'Nova Entrega', color: 'bg-yellow-500', textColor: 'text-yellow-400', bgLight: 'bg-yellow-500/20' },
  aceita: { label: 'Aceita', color: 'bg-blue-500', textColor: 'text-blue-400', bgLight: 'bg-blue-500/20' },
  em_rota: { label: 'Em Rota', color: 'bg-purple-500', textColor: 'text-purple-400', bgLight: 'bg-purple-500/20' },
  entregue: { label: 'Entregue', color: 'bg-emerald-500', textColor: 'text-emerald-400', bgLight: 'bg-emerald-500/20' },
  recusada: { label: 'Recusada', color: 'bg-red-500', textColor: 'text-red-400', bgLight: 'bg-red-500/20' },
};

const pagamentoConfig = {
  dinheiro: { label: 'Dinheiro', icon: Banknote, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  pix: { label: 'PIX', icon: QrCode, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  cartao_credito: { label: 'Cartão Crédito', icon: CreditCard, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  cartao_debito: { label: 'Cartão Débito', icon: CreditCard, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
};

export default function AppEntregador() {
  const [activeTab, setActiveTab] = useState('entregas');
  const [user, setUser] = useState(null);
  const [entregador, setEntregador] = useState(null);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [codigoVinculo, setCodigoVinculo] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('hoje');
  const [valorRecebido, setValorRecebido] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [telefoneLogin, setTelefoneLogin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rotaDismissed, setRotaDismissed] = useState(false);
  const queryClient = useQueryClient();
  const entregasPendentesAnterioresRef = React.useRef([]);

  useEffect(() => {
    loadUser();
    // Solicitar permissão de notificação ao carregar
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadUser = async () => {
    setCheckingAuth(true);
    try {
      const entregadorSalvo = localStorage.getItem('entregador_logado');
      if (entregadorSalvo) {
        const entregadorLocal = JSON.parse(entregadorSalvo);
        // Buscar dados atualizados do banco para garantir status correto
        const entregadores = await base44.entities.Entregador.filter({ id: entregadorLocal.id });
        const entregadorAtualizado = entregadores[0] || entregadorLocal;
        localStorage.setItem('entregador_logado', JSON.stringify(entregadorAtualizado));
        setEntregador(entregadorAtualizado);
        setUser({ email: entregadorAtualizado.email || entregadorAtualizado.telefone });
      }
    } catch (e) {
      console.log('Erro ao carregar usuário');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginEntregador = async () => {
    if (!telefoneLogin) {
      setLoginError('Por favor, digite seu telefone');
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      const entregadores = await base44.entities.Entregador.filter({ telefone: telefoneLogin });
      
      if (entregadores.length === 0) {
        setLoginError('Telefone não encontrado. Verifique com a pizzaria.');
        setLoading(false);
        return;
      }

      const entregadorData = entregadores[0];
      
      // Salvar no localStorage
      localStorage.setItem('entregador_logado', JSON.stringify(entregadorData));
      
      setEntregador(entregadorData);
      setUser({ email: entregadorData.email || entregadorData.telefone });
      setTelefoneLogin('');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setLoginError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const { data: entregas = [], refetch } = useQuery({
    queryKey: ['minhas-entregas', entregador?.id, entregador?.pizzaria_id],
    queryFn: () => entregador?.id 
      ? base44.entities.Entrega.filter({ 
          entregador_id: entregador.id,
          pizzaria_id: entregador.pizzaria_id 
        }, '-created_date', 100)
      : Promise.resolve([]),
    enabled: !!entregador?.id,
    refetchInterval: 5000,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['meus-pagamentos', entregador?.id, entregador?.pizzaria_id],
    queryFn: () => entregador?.id 
      ? base44.entities.Pagamento.filter({ 
          entregador_id: entregador.id,
          pizzaria_id: entregador.pizzaria_id 
        }, '-created_date', 50)
      : Promise.resolve([]),
    enabled: !!entregador?.id,
  });

  const { data: registrosAjuste = [] } = useQuery({
    queryKey: ['registros-ajuste', entregador?.id],
    queryFn: async () => {
      if (!entregador?.id) return [];
      const todos = await base44.entities.RegistroEntrega.filter({ entregador_id: entregador.id }, '-created_date', 100);
      return todos.filter(r => r.taxa_ajuste && r.taxa_ajuste !== 0);
    },
    enabled: !!entregador?.id,
    refetchInterval: 10000,
  });

  const { data: pizzaria } = useQuery({
    queryKey: ['pizzaria', entregador?.pizzaria_id],
    queryFn: () => entregador?.pizzaria_id 
      ? base44.entities.Pizzaria.filter({ id: entregador.pizzaria_id })
      : Promise.resolve([]),
    enabled: !!entregador?.pizzaria_id,
  });

  // Filtrar entregas por período
  const getEntregasFiltradas = () => {
    const agora = moment();
    return entregas.filter(e => {
      if (e.status !== 'entregue') return false;
      const dataEntrega = moment(e.horario_entrega || e.created_date);
      switch (periodoFiltro) {
        case 'hoje':
          return dataEntrega.isSame(agora, 'day');
        case 'semana':
          return dataEntrega.isSame(agora, 'week');
        case 'mes':
          return dataEntrega.isSame(agora, 'month');
        default:
          return true;
      }
    });
  };

  const entregasPendentes = entregas.filter(e => e.status === 'pendente');

  // Notificação push quando chegar nova entrega pendente
  useEffect(() => {
    if (!entregasPendentes.length) {
      entregasPendentesAnterioresRef.current = entregasPendentes;
      return;
    }
    const idsAnteriores = entregasPendentesAnterioresRef.current.map(e => e.id);
    const novasEntregas = entregasPendentes.filter(e => !idsAnteriores.includes(e.id));

    if (novasEntregas.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      novasEntregas.forEach(entrega => {
        new Notification('🚴 Nova Entrega!', {
          body: `Pedido #${entrega.numero_pedido} - ${entrega.cliente_nome}\n${entrega.bairro || entrega.endereco_completo}\nR$ ${entrega.valor_pedido?.toFixed(2)}`,
          icon: '/icon.png',
          badge: '/icon.png',
          tag: `entrega-${entrega.id}`,
          requireInteraction: true,
        });
      });
    }
    entregasPendentesAnterioresRef.current = entregasPendentes;
  }, [entregasPendentes]);
  const entregaAtiva = entregas.find(e => e.status === 'aceita' || e.status === 'em_rota');
  const entregasConcluidas = getEntregasFiltradas();
  const historicoCompleto = entregas.filter(e => e.status === 'entregue');

  // Buscar última notificação de rota otimizada
  const { data: notificacoesRota = [] } = useQuery({
    queryKey: ['notificacoes-rota', entregador?.id],
    queryFn: () => entregador?.id
      ? base44.entities.Notificacao.filter({
          destinatario_id: entregador.id,
          tipo: 'mensagem',
        }, '-created_date', 5)
      : Promise.resolve([]),
    enabled: !!entregador?.id,
    refetchInterval: 8000,
  });
  const rotaNotificacao = notificacoesRota.find(n => n.titulo?.includes('Rota'));

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const hoje = moment().startOf('day');
    const entregasHoje = entregas.filter(e => 
      e.status === 'entregue' && moment(e.horario_entrega || e.created_date).isSameOrAfter(hoje)
    );
    
    const ganhoHoje = entregasHoje.reduce((acc, e) => acc + (e.taxa_entregador || 0), 0);
    const valorColetadoHoje = entregasHoje
      .filter(e => e.forma_pagamento === 'dinheiro')
      .reduce((acc, e) => acc + (e.valor_pedido || 0), 0);
    
    const tempoMedio = entregasHoje.length > 0
      ? entregasHoje.reduce((acc, e) => acc + (e.tempo_entrega_minutos || 0), 0) / entregasHoje.length
      : 0;

    return {
      entregasHoje: entregasHoje.length,
      ganhoHoje,
      valorColetadoHoje,
      tempoMedio: Math.round(tempoMedio),
    };
  };

  const stats = calcularEstatisticas();

  // Rastreamento GPS em tempo real
  useGeoTracking(entregador);

  const updateStatus = async (entregaId, newStatus, dadosExtras = {}) => {
    setLoading(true);
    try {
      const updates = { status: newStatus, ...dadosExtras };
      const entrega = entregas.find(e => e.id === entregaId);
      
      if (newStatus === 'aceita') {
        updates.horario_aceite = new Date().toISOString();
        if (entregador?.id) {
          await base44.entities.Entregador.update(entregador.id, { status: 'em_entrega' });
          setEntregador(prev => ({ ...prev, status: 'em_entrega' }));
        }
      } else if (newStatus === 'em_rota') {
        updates.horario_saida = new Date().toISOString();
      } else if (newStatus === 'entregue') {
        updates.horario_entrega = new Date().toISOString();
        
        if (entrega?.horario_saida) {
          const minutos = moment().diff(moment(entrega.horario_saida), 'minutes');
          updates.tempo_entrega_minutos = minutos;
        }
        
        // Atualizar saldo do entregador
        if (entregador?.id && entrega?.taxa_entregador) {
          const novoSaldo = (entregador.saldo_taxas || 0) + entrega.taxa_entregador;
          const novoTotal = (entregador.total_entregas || 0) + 1;
          
          await base44.entities.Entregador.update(entregador.id, { 
            saldo_taxas: novoSaldo,
            total_entregas: novoTotal,
            status: 'disponivel'
          });
          
          setEntregador(prev => ({
            ...prev,
            saldo_taxas: novoSaldo,
            total_entregas: novoTotal,
            status: 'disponivel'
          }));
        }

        // Atualizar status do pedido
        if (entrega?.pedido_id) {
          await base44.entities.Pedido.update(entrega.pedido_id, { status: 'entregue' });
        }
      } else if (newStatus === 'recusada') {
        if (entregador?.id) {
          await base44.entities.Entregador.update(entregador.id, { status: 'disponivel' });
        }
      }

      await base44.entities.Entrega.update(entregaId, updates);
      
      // Criar notificação para a pizzaria
      await base44.entities.Notificacao.create({
        pizzaria_id: entregador?.pizzaria_id,
        tipo: newStatus === 'entregue' ? 'entrega_concluida' : 'entrega_aceita',
        titulo: newStatus === 'entregue' ? 'Entrega Concluída' : 'Entrega Aceita',
        mensagem: `Pedido #${entrega?.numero_pedido} - ${newStatus === 'entregue' ? 'Entregue' : 'Aceita'} por ${entregador?.nome}`,
        dados: { entrega_id: entregaId, pedido_id: entrega?.pedido_id },
      });

      await refetch();
      setSelectedEntrega(null);
      setShowFinalizarModal(false);
      setValorRecebido('');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setLoading(false);
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
    if (!entregador || entregador.status === 'em_entrega') return;
    const newStatus = entregador.status === 'disponivel' ? 'offline' : 'disponivel';
    await base44.entities.Entregador.update(entregador.id, { status: newStatus });
    setEntregador(prev => ({ ...prev, status: newStatus }));
  };

  const copiarChavePix = () => {
    const chavePix = entregador?.dados_bancarios?.pix || pizzaria?.[0]?.email;
    if (chavePix) {
      navigator.clipboard.writeText(chavePix);
    }
  };

  // Tela de Login
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!entregador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4">
              <Bike className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">App do Entregador</h1>
            <p className="text-slate-400">
              Digite seu telefone para acessar
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <p className="text-sm text-red-300">{loginError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-slate-400">Telefone Cadastrado</Label>
              <Input
                value={telefoneLogin}
                onChange={(e) => setTelefoneLogin(e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-slate-800 border-slate-700 text-white h-12 text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleLoginEntregador()}
              />
              <p className="text-xs text-slate-500 mt-1">
                Use o telefone cadastrado na pizzaria
              </p>
            </div>

            <Button 
              onClick={handleLoginEntregador}
              disabled={!telefoneLogin || loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 text-lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }



  // App Principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .safe-area-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 8px);
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                {entregador.foto_url ? (
                  <img src={entregador.foto_url} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <span className="text-white text-xl font-bold">{entregador.nome?.charAt(0)}</span>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                entregador.status === 'disponivel' ? 'bg-emerald-500' : 
                entregador.status === 'em_entrega' ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'
              }`} />
            </div>
            <div>
              <h1 className="font-bold text-white">{entregador.nome?.split(' ')[0]}</h1>
              <p className="text-xs text-slate-400 capitalize">{entregador.status?.replace('_', ' ')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => refetch()}
              className="text-slate-400"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <button
              onClick={toggleStatus}
              disabled={entregador.status === 'em_entrega'}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                entregador.status === 'disponivel' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : entregador.status === 'em_entrega'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
              }`}
            >
              {entregador.status === 'disponivel' ? '● Online' : 
               entregador.status === 'em_entrega' ? '● Entregando' : '○ Offline'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-28">
        {/* Rota Otimizada */}
        <AnimatePresence>
          {rotaNotificacao && !rotaDismissed && entregas.filter(e => ['pendente','aceita','em_rota'].includes(e.status)).length > 0 && (
            <RotaOtimizadaCard
              rotaNotificacao={rotaNotificacao}
              entregasAtivas={entregas.filter(e => ['pendente','aceita','em_rota'].includes(e.status))}
              onDismiss={() => {
                setRotaDismissed(true);
                base44.entities.Notificacao.update(rotaNotificacao.id, { lida: true });
              }}
            />
          )}
        </AnimatePresence>

        {/* Alerta Nova Entrega */}
        <AnimatePresence>
          {entregasPendentes.length > 0 && !selectedEntrega && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6"
            >
              <div className="rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center animate-bounce">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">Nova Entrega!</p>
                      <p className="text-sm text-orange-200">{entregasPendentes.length} entrega(s) aguardando você</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setSelectedEntrega(entregasPendentes[0])}
                      className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-600 text-base font-semibold"
                    >
                      Ver Entrega <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    {entregasPendentes.length > 1 && (
                      <Button 
                        onClick={async () => {
                          setLoading(true);
                          for (const entrega of entregasPendentes) {
                            await updateStatus(entrega.id, 'aceita');
                          }
                          setLoading(false);
                        }}
                        disabled={loading}
                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
                      >
                        <Check className="w-5 h-5 mr-1" />
                        Aceitar Todas
                      </Button>
                    )}
                  </div>
                </div>
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
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Entrega em Andamento
            </h2>
            <Card 
              className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 p-5 cursor-pointer"
              onClick={() => setSelectedEntrega(entregaAtiva)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-white">#{entregaAtiva.numero_pedido}</span>
                    <Badge className={`${statusConfig[entregaAtiva.status]?.bgLight} ${statusConfig[entregaAtiva.status]?.textColor}`}>
                      {statusConfig[entregaAtiva.status]?.label}
                    </Badge>
                  </div>
                  <p className="text-slate-400">{entregaAtiva.cliente_nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">R$ {entregaAtiva.valor_pedido?.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">Sua taxa: R$ {entregaAtiva.taxa_entregador?.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-slate-300 mb-4 p-3 rounded-lg bg-white/5">
                <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{entregaAtiva.endereco_completo}</p>
                  {entregaAtiva.bairro && <p className="text-sm text-slate-400">{entregaAtiva.bairro}</p>}
                </div>
              </div>

              {/* Info de Pagamento */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-3">
                {pagamentoConfig[entregaAtiva.forma_pagamento] && (
                  <>
                    <div className={`w-10 h-10 rounded-lg ${pagamentoConfig[entregaAtiva.forma_pagamento].bgColor} flex items-center justify-center`}>
                      {React.createElement(pagamentoConfig[entregaAtiva.forma_pagamento].icon, {
                        className: `w-5 h-5 ${pagamentoConfig[entregaAtiva.forma_pagamento].color}`
                      })}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{pagamentoConfig[entregaAtiva.forma_pagamento].label}</p>
                      {entregaAtiva.troco_para > 0 && (
                        <p className="text-sm text-yellow-400">Troco para R$ {entregaAtiva.troco_para?.toFixed(2)}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      entregaAtiva.forma_pagamento !== 'dinheiro'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {entregaAtiva.forma_pagamento !== 'dinheiro' ? '✓ PAGO' : '⚠ COBRAR'}
                    </span>
                  </>
                )}
              </div>

              {/* Alerta de Troco */}
              {entregaAtiva.troco_para > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 mb-4 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-300 font-bold text-sm">⚠️ Lembre-se do Troco!</p>
                    <p className="text-yellow-200 text-xs">Pague com R$ {entregaAtiva.troco_para?.toFixed(2)} — Troco: R$ {(entregaAtiva.troco_para - entregaAtiva.valor_pedido)?.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  className="flex-1 h-12 bg-white hover:bg-gray-100 text-gray-900"
                  onClick={(e) => { e.stopPropagation(); openMaps(entregaAtiva); }}
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Google Maps
                </Button>
                <Button 
                  className="flex-1 h-12 bg-white hover:bg-gray-100 text-gray-900"
                  onClick={(e) => { e.stopPropagation(); openWaze(entregaAtiva); }}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Waze
                </Button>
                <a 
                  href={`tel:${entregaAtiva.cliente_telefone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="h-12 w-12 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center"
                >
                  <Phone className="w-5 h-5 text-white" />
                </a>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab: Entregas */}
        {activeTab === 'entregas' && (
          <div>
            {/* Stats do Dia */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.entregasHoje}</p>
                    <p className="text-xs text-slate-400">Entregas Hoje</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">R$ {stats.ganhoHoje.toFixed(0)}</p>
                    <p className="text-xs text-slate-400">Ganho Hoje</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Lista de Entregas Ativas */}
            <h2 className="text-lg font-semibold text-white mb-3">Entregas Ativas</h2>
            {entregas.filter(e => !['entregue', 'recusada'].includes(e.status)).length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-8 text-center">
                <Package className="w-14 h-14 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 font-medium">Nenhuma entrega no momento</p>
                <p className="text-sm text-slate-500 mt-1">
                  {entregador.status === 'disponivel' 
                    ? 'Aguarde, novas entregas chegarão em breve!'
                    : 'Fique online para receber entregas'}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {entregas.filter(e => !['entregue', 'recusada'].includes(e.status)).map((entrega) => (
                  <Card 
                    key={entrega.id}
                    className="bg-white/5 border-white/10 p-4 cursor-pointer hover:bg-white/8 transition-all"
                    onClick={() => setSelectedEntrega(entrega)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig[entrega.status]?.bgLight}`}>
                          <Package className={`w-6 h-6 ${statusConfig[entrega.status]?.textColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">#{entrega.numero_pedido}</span>
                            <Badge className={`${statusConfig[entrega.status]?.bgLight} ${statusConfig[entrega.status]?.textColor} text-xs`}>
                              {statusConfig[entrega.status]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">{entrega.bairro || entrega.cliente_nome}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">R$ {entrega.valor_pedido?.toFixed(2)}</p>
                        <p className="text-xs text-orange-400">+R$ {entrega.taxa_entregador?.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Histórico */}
        {activeTab === 'historico' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Histórico de Entregas</h2>
              <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumo do Período */}
            <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{entregasConcluidas.length}</p>
                  <p className="text-xs text-slate-400">Entregas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    R$ {entregasConcluidas.reduce((acc, e) => acc + (e.taxa_entregador || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-400">Ganhos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {entregasConcluidas.length > 0 
                      ? Math.round(entregasConcluidas.reduce((acc, e) => acc + (e.tempo_entrega_minutos || 0), 0) / entregasConcluidas.length)
                      : 0} min
                  </p>
                  <p className="text-xs text-slate-400">Tempo Médio</p>
                </div>
              </div>
            </Card>

            {entregasConcluidas.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-8 text-center">
                <History className="w-14 h-14 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Nenhuma entrega no período</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {entregasConcluidas.map((entrega) => (
                  <Card key={entrega.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">#{entrega.numero_pedido}</p>
                          <p className="text-sm text-slate-400">{entrega.bairro}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {moment(entrega.horario_entrega).format('DD/MM HH:mm')}
                            </span>
                            {entrega.tempo_entrega_minutos && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {entrega.tempo_entrega_minutos} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">+R$ {entrega.taxa_entregador?.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">
                          {pagamentoConfig[entrega.forma_pagamento]?.label}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Carteira */}
        {activeTab === 'carteira' && (
          <div>
            {/* Card Principal de Saldo */}
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-none p-6 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative">
                <p className="text-white/80 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Saldo Acumulado
                </p>
                <p className="text-5xl font-bold text-white mt-2">
                  R$ {entregador.saldo_taxas?.toFixed(2) || '0.00'}
                </p>
                <div className="flex items-center gap-4 mt-4 text-white/70 text-sm">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {historicoCompleto.length} entregas
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {entregador.avaliacao_media?.toFixed(1) || '5.0'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Stats Detalhados */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Hoje</span>
                </div>
                <p className="text-xl font-bold text-emerald-400">R$ {stats.ganhoHoje.toFixed(2)}</p>
                <p className="text-xs text-slate-500">{stats.entregasHoje} entregas</p>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Coletado em Dinheiro</span>
                </div>
                <p className="text-xl font-bold text-yellow-400">R$ {stats.valorColetadoHoje.toFixed(2)}</p>
                <p className="text-xs text-slate-500">A prestar contas</p>
              </Card>
            </div>

            {/* Movimentações */}
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Movimentações
            </h3>
            <div className="space-y-2">
              {(() => {
                // Montar lista unificada de movimentações
                const movimentacoes = [];

                // Entregas concluídas
                historicoCompleto.forEach(entrega => {
                  movimentacoes.push({
                    id: `entrega-${entrega.id}`,
                    tipo: 'entrega',
                    data: entrega.horario_entrega || entrega.created_date,
                    titulo: `Entrega #${entrega.numero_pedido}`,
                    subtitulo: entrega.bairro || pagamentoConfig[entrega.forma_pagamento]?.label,
                    valor: entrega.taxa_entregador || 0,
                    sinal: '+',
                    forma_pagamento: entrega.forma_pagamento,
                    valor_pedido: entrega.valor_pedido,
                  });
                });

                // Ajustes do admin (RegistroEntrega com taxa_ajuste)
                registrosAjuste.forEach(reg => {
                  movimentacoes.push({
                    id: `ajuste-${reg.id}`,
                    tipo: 'ajuste',
                    data: reg.data_entrega || reg.created_date,
                    titulo: reg.taxa_ajuste > 0 ? 'Bônus / Ajuste' : 'Desconto / Ajuste',
                    subtitulo: reg.motivo_ajuste || 'Ajuste realizado pela pizzaria',
                    valor: Math.abs(reg.taxa_ajuste),
                    sinal: reg.taxa_ajuste > 0 ? '+' : '-',
                  });
                });

                // Pagamentos recebidos
                pagamentos.forEach(pag => {
                  if (pag.status === 'pago') {
                    movimentacoes.push({
                      id: `pagamento-${pag.id}`,
                      tipo: 'pagamento',
                      data: pag.data_pagamento || pag.created_date,
                      titulo: 'Pagamento Recebido',
                      subtitulo: pag.observacoes || `${pag.quantidade_entregas || 0} entrega(s) • Período ${pag.periodo_inicio ? moment(pag.periodo_inicio).format('DD/MM') : ''} - ${pag.periodo_fim ? moment(pag.periodo_fim).format('DD/MM') : ''}`,
                      valor: pag.valor,
                      sinal: '+',
                    });
                  }
                });

                // Ordenar por data decrescente
                movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

                if (movimentacoes.length === 0) {
                  return (
                    <Card className="bg-white/5 border-white/10 p-8 text-center">
                      <Wallet className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-400">Nenhuma movimentação ainda</p>
                    </Card>
                  );
                }

                return movimentacoes.slice(0, 30).map(mov => (
                  <Card key={mov.id} className={`border p-4 ${
                    mov.tipo === 'ajuste' 
                      ? mov.sinal === '+' 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                      : mov.tipo === 'pagamento'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          mov.tipo === 'ajuste' 
                            ? mov.sinal === '+' ? 'bg-blue-500/20' : 'bg-red-500/20'
                            : mov.tipo === 'pagamento' 
                              ? 'bg-emerald-500/20'
                              : pagamentoConfig[mov.forma_pagamento]?.bgColor || 'bg-orange-500/20'
                        }`}>
                          {mov.tipo === 'ajuste' ? (
                            mov.sinal === '+' 
                              ? <TrendingUp className="w-5 h-5 text-blue-400" />
                              : <AlertTriangle className="w-5 h-5 text-red-400" />
                          ) : mov.tipo === 'pagamento' ? (
                            <Wallet className="w-5 h-5 text-emerald-400" />
                          ) : (
                            pagamentoConfig[mov.forma_pagamento] 
                              ? React.createElement(pagamentoConfig[mov.forma_pagamento].icon, {
                                  className: `w-5 h-5 ${pagamentoConfig[mov.forma_pagamento].color}`
                                })
                              : <DollarSign className="w-5 h-5 text-orange-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white text-sm">{mov.titulo}</p>
                            {mov.tipo === 'ajuste' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                mov.sinal === '+' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {mov.sinal === '+' ? 'Bônus' : 'Desconto'}
                              </span>
                            )}
                            {mov.tipo === 'pagamento' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300">
                                Pago
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{mov.subtitulo}</p>
                          <p className="text-xs text-slate-500">{moment(mov.data).format('DD/MM [às] HH:mm')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-base ${
                          mov.sinal === '+' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {mov.sinal}R$ {mov.valor?.toFixed(2)}
                        </p>
                        {mov.tipo === 'entrega' && mov.forma_pagamento === 'dinheiro' && (
                          <p className="text-xs text-yellow-400">R$ {mov.valor_pedido?.toFixed(2)} coletado</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Tab: Perfil */}
        {activeTab === 'perfil' && (
          <div className="space-y-4">
            {/* Card do Perfil */}
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  {entregador.foto_url ? (
                    <img src={entregador.foto_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <span className="text-white text-4xl font-bold">{entregador.nome?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{entregador.nome}</h2>
                  <p className="text-slate-400">{entregador.telefone}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-white font-medium">{entregador.avaliacao_media?.toFixed(1) || '5.0'}</span>
                    </div>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{entregador.total_entregas || 0} entregas</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Bike className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400">Veículo</span>
                  </div>
                  <span className="text-white capitalize">{entregador.veiculo}</span>
                </div>
                {entregador.placa_veiculo && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-400">Placa</span>
                    </div>
                    <span className="text-white font-mono">{entregador.placa_veiculo}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400">Pizzaria</span>
                  </div>
                  <span className="text-white">{pizzaria?.[0]?.nome || 'Vinculada'}</span>
                </div>
              </div>
            </Card>

            {/* Dados Bancários */}
            {entregador.dados_bancarios?.pix && (
              <Card className="bg-white/5 border-white/10 p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                  Chave PIX
                </h3>
                <div className="flex items-center gap-2">
                  <Input 
                    value={entregador.dados_bancarios.pix} 
                    readOnly 
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button size="icon" variant="outline" onClick={copiarChavePix} className="border-slate-700">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Suporte */}
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                Suporte
              </h3>
              <div className="space-y-2">
                <a 
                  href={`tel:${pizzaria?.[0]?.telefone || ''}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-emerald-400" />
                    <span className="text-white">Ligar para Suporte</span>
                  </div>
                  <span className="text-slate-400">{pizzaria?.[0]?.telefone}</span>
                </a>
                <a 
                  href={`https://wa.me/55${(pizzaria?.[0]?.telefone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-white">WhatsApp Suporte</span>
                  </div>
                  <span className="text-slate-400">{pizzaria?.[0]?.telefone}</span>
                </a>
              </div>
            </Card>

            {/* Logout */}
            <Button 
              variant="outline" 
              className="w-full h-12 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                localStorage.removeItem('entregador_logado');
                setEntregador(null);
                setUser(null);
              }}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair da Conta
            </Button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/5 px-2 py-2 safe-area-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { id: 'entregas', icon: Package, label: 'Entregas', badge: entregasPendentes.length },
            { id: 'historico', icon: History, label: 'Histórico' },
            { id: 'carteira', icon: Wallet, label: 'Carteira' },
            { id: 'perfil', icon: User, label: 'Perfil' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative ${
                activeTab === tab.id 
                  ? 'text-orange-400 bg-orange-500/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
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
              className="w-full max-h-[95vh] bg-slate-900 rounded-t-3xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Handle */}
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6" />

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-bold text-white">#{selectedEntrega.numero_pedido}</span>
                    </div>
                    <Badge className={`${statusConfig[selectedEntrega.status]?.bgLight} ${statusConfig[selectedEntrega.status]?.textColor}`}>
                      {statusConfig[selectedEntrega.status]?.label}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-400">R$ {selectedEntrega.valor_pedido?.toFixed(2)}</p>
                    <p className="text-sm text-orange-400">Sua taxa: R$ {selectedEntrega.taxa_entregador?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Itens do Pedido */}
                {selectedEntrega.itens_resumo && (
                  <Card className="bg-white/5 border-white/10 p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Itens do Pedido</p>
                        <p className="text-white">{selectedEntrega.itens_resumo}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Cliente */}
                <Card className="bg-white/5 border-white/10 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{selectedEntrega.cliente_nome}</p>
                        <p className="text-sm text-slate-400">{selectedEntrega.cliente_telefone}</p>
                      </div>
                    </div>
                    <a 
                      href={`tel:${selectedEntrega.cliente_telefone}`}
                      className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors"
                    >
                      <Phone className="w-6 h-6 text-white" />
                    </a>
                  </div>
                </Card>

                {/* Endereço */}
                <Card className="bg-white/5 border-white/10 p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Endereço de Entrega</p>
                      <p className="font-semibold text-white">{selectedEntrega.endereco_completo}</p>
                      {selectedEntrega.bairro && (
                        <p className="text-slate-400">{selectedEntrega.bairro}</p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Pagamento - Card Destacado */}
                <PagamentoCard entrega={selectedEntrega} />

                {/* Botões de Navegação */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button 
                    className="h-14 bg-white hover:bg-gray-100 text-gray-900 text-lg"
                    onClick={() => openMaps(selectedEntrega)}
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Google Maps
                  </Button>
                  <Button 
                    className="h-14 bg-white hover:bg-gray-100 text-gray-900 text-lg"
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
                        className="w-full h-16 bg-gradient-to-r from-emerald-500 to-green-600 text-xl font-semibold"
                        onClick={() => updateStatus(selectedEntrega.id, 'aceita')}
                        disabled={loading}
                      >
                        <Check className="w-6 h-6 mr-2" />
                        {loading ? 'Aceitando...' : 'Aceitar Entrega'}
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full h-14 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => updateStatus(selectedEntrega.id, 'recusada')}
                        disabled={loading}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Recusar
                      </Button>
                    </>
                  )}

                  {selectedEntrega.status === 'aceita' && (
                    <Button 
                      className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-600 text-xl font-semibold"
                      onClick={() => updateStatus(selectedEntrega.id, 'em_rota')}
                      disabled={loading}
                    >
                      <Play className="w-6 h-6 mr-2" />
                      {loading ? 'Iniciando...' : 'Saí para Entrega'}
                    </Button>
                  )}

                  {selectedEntrega.status === 'em_rota' && (
                    <Button 
                      className="w-full h-16 bg-gradient-to-r from-emerald-500 to-green-600 text-xl font-semibold"
                      onClick={() => updateStatus(selectedEntrega.id, 'entregue')}
                      disabled={loading}
                    >
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      {loading ? 'Finalizando...' : 'Entreguei! ✓'}
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