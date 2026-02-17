import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Calendar,
  DollarSign,
  Package,
  Bike,
  TrendingUp,
  Download,
  Clock,
  MapPin,
  Star,
  ShoppingBag,
  Check,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatsCard from '@/components/dashboard/StatsCard';
import moment from 'moment';

const COLORS = ['#f97316', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4'];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('semana');
  const [pizzariaId, setPizzariaId] = useState(null);

  React.useEffect(() => {
    const loadPizzariaId = async () => {
      const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
      if (estabelecimentoLogado) {
        const estab = JSON.parse(estabelecimentoLogado);
        setPizzariaId(estab.id);
      } else {
        const userData = await base44.auth.me();
        setPizzariaId(userData.pizzaria_id || null);
      }
    };
    loadPizzariaId();
  }, []);

  const { data: entregas = [] } = useQuery({
    queryKey: ['entregas-relatorio', pizzariaId],
    queryFn: () => base44.entities.Entrega.filter({ pizzaria_id: pizzariaId }, '-created_date', 500),
    enabled: !!pizzariaId,
  });

  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-relatorio', pizzariaId],
    queryFn: () => base44.entities.Pedido.filter({ pizzaria_id: pizzariaId }, '-created_date', 500),
    enabled: !!pizzariaId,
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ['entregadores-relatorio', pizzariaId],
    queryFn: () => base44.entities.Entregador.filter({ pizzaria_id: pizzariaId }),
    enabled: !!pizzariaId,
  });

  // Filter by period
  const getDateRange = () => {
    const now = moment();
    switch (periodo) {
      case 'hoje':
        return now.startOf('day');
      case 'semana':
        return now.subtract(7, 'days');
      case 'mes':
        return now.subtract(30, 'days');
      case 'ano':
        return now.subtract(365, 'days');
      default:
        return now.subtract(7, 'days');
    }
  };

  const startDate = getDateRange();
  const entregasFiltradas = entregas.filter(e => moment(e.created_date).isAfter(startDate));
  const pedidosFiltrados = pedidos.filter(p => moment(p.created_date).isAfter(startDate));

  // Stats
  const totalEntregas = entregasFiltradas.filter(e => e.status === 'entregue').length;
  const faturamentoTotal = entregasFiltradas.filter(e => e.status === 'entregue')
    .reduce((acc, e) => acc + (e.valor_pedido || 0), 0);
  const taxasTotais = entregasFiltradas.filter(e => e.status === 'entregue')
    .reduce((acc, e) => acc + (e.taxa_entregador || 0), 0);
  const tempoMedioMinutos = entregasFiltradas.filter(e => e.tempo_entrega_minutos)
    .reduce((acc, e, _, arr) => acc + (e.tempo_entrega_minutos || 0) / arr.length, 0);

  // Charts Data
  const entregasPorDia = () => {
    const dias = {};
    entregasFiltradas.forEach(e => {
      const dia = moment(e.created_date).format('DD/MM');
      dias[dia] = (dias[dia] || 0) + 1;
    });
    return Object.entries(dias).map(([name, entregas]) => ({ name, entregas })).slice(-7);
  };

  const faturamentoPorDia = () => {
    const dias = {};
    entregasFiltradas.filter(e => e.status === 'entregue').forEach(e => {
      const dia = moment(e.created_date).format('DD/MM');
      dias[dia] = (dias[dia] || 0) + (e.valor_pedido || 0);
    });
    return Object.entries(dias).map(([name, valor]) => ({ name, valor })).slice(-7);
  };

  const entregasPorBairro = () => {
    const bairros = {};
    entregasFiltradas.forEach(e => {
      const bairro = e.bairro || 'Outros';
      bairros[bairro] = (bairros[bairro] || 0) + 1;
    });
    return Object.entries(bairros)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const entregasPorEntregador = () => {
    const dados = {};
    entregasFiltradas.filter(e => e.status === 'entregue').forEach(e => {
      const entregador = entregadores.find(ent => ent.id === e.entregador_id);
      const nome = entregador?.nome || 'Desconhecido';
      dados[nome] = (dados[nome] || 0) + 1;
    });
    return Object.entries(dados)
      .map(([name, entregas]) => ({ name, entregas }))
      .sort((a, b) => b.entregas - a.entregas)
      .slice(0, 5);
  };

  const formaPagamentoData = () => {
    const formas = {};
    pedidosFiltrados.forEach(p => {
      const forma = p.forma_pagamento || 'outros';
      formas[forma] = (formas[forma] || 0) + 1;
    });
    return Object.entries(formas).map(([name, value]) => ({ 
      name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1), 
      value 
    }));
  };

  const exportarCSV = () => {
    const headers = ['Data', 'Pedido', 'Cliente', 'Endereço', 'Valor', 'Taxa', 'Entregador', 'Status'];
    const rows = entregasFiltradas.map(e => {
      const entregador = entregadores.find(ent => ent.id === e.entregador_id);
      return [
        moment(e.created_date).format('DD/MM/YYYY HH:mm'),
        e.numero_pedido,
        e.cliente_nome,
        e.endereco_completo,
        e.valor_pedido?.toFixed(2),
        e.taxa_entregador?.toFixed(2),
        entregador?.nome || '-',
        e.status,
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_entregas_${moment().format('YYYY-MM-DD')}.csv`;
    link.click();
  };

  // Calcular métricas de pedidos
  const metricasPedidos = useMemo(() => {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    let dataInicio;
    if (periodo === 'hoje') dataInicio = hoje;
    else if (periodo === 'semana') dataInicio = inicioSemana;
    else dataInicio = inicioMes;

    const pedidosPeriodo = pedidos.filter(p => new Date(p.created_date) >= dataInicio);
    
    const totalVendas = pedidosPeriodo.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    const pedidosAbertos = pedidosPeriodo.filter(p => ['novo', 'em_preparo', 'pronto', 'em_entrega'].includes(p.status)).length;
    const pedidosEntregues = pedidosPeriodo.filter(p => p.status === 'entregue').length;
    const ticketMedio = pedidosPeriodo.length > 0 ? totalVendas / pedidosPeriodo.length : 0;

    // Produtos mais vendidos
    const produtosMap = {};
    pedidosPeriodo.forEach(pedido => {
      pedido.itens?.forEach(item => {
        if (!produtosMap[item.nome]) {
          produtosMap[item.nome] = { nome: item.nome, quantidade: 0, valor: 0 };
        }
        produtosMap[item.nome].quantidade += item.quantidade;
        produtosMap[item.nome].valor += item.preco_unitario * item.quantidade;
      });
    });
    const produtosMaisVendidos = Object.values(produtosMap)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    // Vendas por dia (últimos 7 dias)
    const vendasPorDia = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() - i);
      const pedidosDia = pedidos.filter(p => {
        const dataPedido = new Date(p.created_date);
        return dataPedido.getDate() === dia.getDate() &&
               dataPedido.getMonth() === dia.getMonth() &&
               dataPedido.getFullYear() === dia.getFullYear();
      });
      vendasPorDia.push({
        dia: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: pedidosDia.reduce((sum, p) => sum + (p.valor_total || 0), 0),
        pedidos: pedidosDia.length,
      });
    }

    // Status dos pedidos para gráfico de pizza
    const statusData = [
      { name: 'Entregues', value: pedidosPeriodo.filter(p => p.status === 'entregue').length, color: '#10b981' },
      { name: 'Em andamento', value: pedidosPeriodo.filter(p => ['novo', 'em_preparo', 'pronto', 'em_entrega'].includes(p.status)).length, color: '#f59e0b' },
      { name: 'Cancelados', value: pedidosPeriodo.filter(p => p.status === 'cancelado').length, color: '#ef4444' },
    ].filter(item => item.value > 0);

    return {
      totalVendas,
      pedidosAbertos,
      pedidosEntregues,
      ticketMedio,
      totalPedidos: pedidosPeriodo.length,
      produtosMaisVendidos,
      vendasPorDia,
      statusData,
    };
  }, [pedidos, periodo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Relatórios & Dashboard</h1>
          <p className="text-slate-400 mt-1">Análise de performance e métricas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Últimos 7 dias</SelectItem>
              <SelectItem value="mes">Últimos 30 dias</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={exportarCSV}
            className="bg-gradient-to-r from-orange-500 to-red-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Dashboard de Vendas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-orange-500" />
          Dashboard de Vendas
        </h2>

        {/* Métricas de Pedidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-emerald-400" />
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">R$ {metricasPedidos.totalVendas.toFixed(2)}</p>
            <p className="text-sm text-emerald-300">Total em Vendas</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-blue-400" />
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{metricasPedidos.totalPedidos}</p>
            <p className="text-sm text-blue-300">Total de Pedidos</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-400" />
              <Truck className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{metricasPedidos.pedidosAbertos}</p>
            <p className="text-sm text-orange-300">Pedidos em Aberto</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <Check className="w-8 h-8 text-purple-400" />
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">R$ {metricasPedidos.ticketMedio.toFixed(2)}</p>
            <p className="text-sm text-purple-300">Ticket Médio</p>
          </div>
        </div>

        {/* Gráficos de Vendas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendas por Dia */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Vendas - Últimos 7 Dias
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metricasPedidos.vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="dia" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status dos Pedidos */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Status dos Pedidos
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metricasPedidos.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metricasPedidos.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-500" />
            Produtos Mais Vendidos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricasPedidos.produtosMaisVendidos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="nome" type="category" stroke="#94a3b8" width={150} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="quantidade" fill="#f97316" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-8"></div>

      {/* Dashboard de Entregas */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
          <Bike className="w-6 h-6 text-emerald-500" />
          Dashboard de Entregas
        </h2>

        {/* Stats de Entregas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Entregas"
          value={totalEntregas}
          icon={Package}
          color="orange"
        />
        <StatsCard
          title="Faturamento"
          value={`R$ ${faturamentoTotal.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Taxas Pagas"
          value={`R$ ${taxasTotais.toFixed(2)}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Tempo Médio"
          value={`${Math.round(tempoMedioMinutos || 0)} min`}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entregas por Dia */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Entregas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entregasPorDia()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="entregas" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Faturamento por Dia */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Faturamento por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={faturamentoPorDia()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorArea)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entregas por Bairro */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              Entregas por Bairro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entregasPorBairro()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {entregasPorBairro().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {entregasPorBairro().map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formaPagamentoData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {formaPagamentoData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {formaPagamentoData().map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Entregadores */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bike className="w-5 h-5 text-emerald-500" />
              Top Entregadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entregasPorEntregador().map((item, index) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.name}</p>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(item.entregas / (entregasPorEntregador()[0]?.entregas || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold text-white">{item.entregas}</span>
                </div>
              ))}
              {entregasPorEntregador().length === 0 && (
                <p className="text-center text-slate-400 py-8">Nenhuma entrega no período</p>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Pagamentos Pendentes */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            Saldo de Entregadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Entregador</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Entregas</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Avaliação</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {entregadores.map((entregador) => {
                  const entregasEntregador = entregasFiltradas.filter(
                    e => e.entregador_id === entregador.id && e.status === 'entregue'
                  );
                  return (
                    <tr key={entregador.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold">{entregador.nome?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{entregador.nome}</p>
                            <p className="text-sm text-slate-400">{entregador.telefone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-white font-medium">{entregasEntregador.length}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-white">{entregador.avaliacao_media?.toFixed(1) || '5.0'}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-xl font-bold text-emerald-400">
                          R$ {entregador.saldo_taxas?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}