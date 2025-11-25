import React, { useState } from 'react';
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

  const { data: entregas = [] } = useQuery({
    queryKey: ['entregas-relatorio'],
    queryFn: () => base44.entities.Entrega.list('-created_date', 500),
  });

  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-relatorio'],
    queryFn: () => base44.entities.Pedido.list('-created_date', 500),
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ['entregadores-relatorio'],
    queryFn: () => base44.entities.Entregador.list(),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Relatórios</h1>
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

      {/* Stats */}
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
  );
}