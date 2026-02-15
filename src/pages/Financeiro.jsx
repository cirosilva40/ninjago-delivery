import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Wallet,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

export default function Financeiro() {
  const [theme] = useState(() => localStorage.getItem('theme') || 'dark');
  const isLight = theme === 'light';
  const [pizzariaId, setPizzariaId] = useState(null);

  useEffect(() => {
    const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
    if (estabelecimentoLogado) {
      const estab = JSON.parse(estabelecimentoLogado);
      setPizzariaId(estab.id);
    }
  }, []);

  // Buscar pedidos entregues aguardando conferência
  const { data: pedidosAguardando = [] } = useQuery({
    queryKey: ['pedidos-aguardando-conferencia', pizzariaId],
    queryFn: () => {
      if (!pizzariaId) return [];
      return base44.entities.Pedido.filter({ 
        pizzaria_id: pizzariaId,
        status: 'entregue' 
      });
    },
    enabled: !!pizzariaId,
    refetchInterval: 30000,
  });

  // Buscar pedidos finalizados do mês
  const { data: pedidosFinalizados = [] } = useQuery({
    queryKey: ['pedidos-finalizados-mes', pizzariaId],
    queryFn: async () => {
      if (!pizzariaId) return [];
      const inicioMes = moment().startOf('month').toISOString();
      const pedidos = await base44.entities.Pedido.filter({ pizzaria_id: pizzariaId }, '-created_date', 1000);
      return pedidos.filter(p => 
        p.status === 'finalizada' && 
        moment(p.created_date).isAfter(inicioMes)
      );
    },
    enabled: !!pizzariaId,
    refetchInterval: 60000,
  });

  // Buscar custos do mês
  const { data: custosDoMes = [] } = useQuery({
    queryKey: ['custos-mes', pizzariaId],
    queryFn: async () => {
      if (!pizzariaId) return [];
      const inicioMes = moment().startOf('month').format('YYYY-MM-DD');
      const custos = await base44.entities.Custo.filter({ pizzaria_id: pizzariaId }, '-data', 1000);
      return custos.filter(c => moment(c.data).isSameOrAfter(inicioMes));
    },
    enabled: !!pizzariaId,
    refetchInterval: 60000,
  });

  // Calcular métricas
  const receitaMes = pedidosFinalizados.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  const custosMes = custosDoMes.reduce((acc, c) => acc + (c.valor || 0), 0);
  const lucroMes = receitaMes - custosMes;
  const ticketMedio = pedidosFinalizados.length > 0 
    ? receitaMes / pedidosFinalizados.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Financeiro
        </h1>
        <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
          Controle completo das finanças do seu negócio
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Receita do Mês
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              R$ {receitaMes.toFixed(2)}
            </div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {pedidosFinalizados.length} pedidos
            </p>
          </CardContent>
        </Card>

        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Custos do Mês
              </CardTitle>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              R$ {custosMes.toFixed(2)}
            </div>
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              {custosDoMes.length} lançamentos
            </p>
          </CardContent>
        </Card>

        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Lucro do Mês
              </CardTitle>
              <Wallet className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroMes >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {lucroMes.toFixed(2)}
            </div>
            <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-400'} mt-1`}>
              Margem: {receitaMes > 0 ? ((lucroMes / receitaMes) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Ticket Médio
              </CardTitle>
              <FileText className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              R$ {ticketMedio.toFixed(2)}
            </div>
            <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-400'} mt-1`}>
              Por pedido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Ações Rápidas */}
      {pedidosAguardando.length > 0 && (
        <Card className={`${isLight ? 'bg-orange-50 border-orange-200' : 'glass-card border-orange-500/30'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    Comandas Aguardando Conferência
                  </h3>
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                    {pedidosAguardando.length} pedido(s) entregue(s) precisam de conferência financeira
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('ControleComandas')}>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Conferir Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Módulos Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controle de Comandas */}
        <Link to={createPageUrl('ControleComandas')}>
          <Card className={`${isLight ? 'bg-white hover:bg-gray-50' : 'glass-card hover:bg-white/5'} border-none cursor-pointer transition-all h-full`}>
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                {pedidosAguardando.length > 0 && (
                  <Badge variant="destructive">{pedidosAguardando.length}</Badge>
                )}
              </div>
              <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                Controle de Comandas
              </CardTitle>
              <CardDescription className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                Confira e finalize pedidos entregues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Valide comprovantes e valores antes de finalizar as comandas
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Fluxo de Caixa */}
        <Link to={createPageUrl('FluxoDeCaixa')}>
          <Card className={`${isLight ? 'bg-white hover:bg-gray-50' : 'glass-card hover:bg-white/5'} border-none cursor-pointer transition-all h-full`}>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                Fluxo de Caixa
              </CardTitle>
              <CardDescription className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                Gerencie receitas e despesas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Registre custos e acompanhe o fluxo financeiro do negócio
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Configurações Financeiras */}
        <Link to={createPageUrl('ConfiguracoesFinanceiras')}>
          <Card className={`${isLight ? 'bg-white hover:bg-gray-50' : 'glass-card hover:bg-white/5'} border-none cursor-pointer transition-all h-full`}>
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                Configurações
              </CardTitle>
              <CardDescription className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                Dados bancários e KPIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Configure contas bancárias e acompanhe indicadores
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}