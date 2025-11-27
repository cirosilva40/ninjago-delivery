import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bike,
  ArrowLeft,
  Phone,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  Edit,
  Save,
  Plus,
  Minus,
  History,
  Route,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function EntregadorDetalhe() {
  const urlParams = new URLSearchParams(window.location.search);
  const entregadorId = urlParams.get('id');

  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({
    tipo: 'bonus',
    valor: '',
    motivo: '',
  });
  const [periodoFiltro, setPeriodoFiltro] = useState('mes');
  const [salvando, setSalvando] = useState(false);

  const { data: entregador, refetch: refetchEntregador } = useQuery({
    queryKey: ['entregador', entregadorId],
    queryFn: async () => {
      const list = await base44.entities.Entregador.filter({ id: entregadorId });
      return list[0];
    },
    enabled: !!entregadorId,
  });

  const { data: entregas = [] } = useQuery({
    queryKey: ['entregas-entregador', entregadorId],
    queryFn: () => base44.entities.Entrega.filter({ entregador_id: entregadorId }, '-created_date', 500),
    enabled: !!entregadorId,
  });

  const { data: registros = [], refetch: refetchRegistros } = useQuery({
    queryKey: ['registros-entrega', entregadorId],
    queryFn: () => base44.entities.RegistroEntrega.filter({ entregador_id: entregadorId }, '-created_date', 100),
    enabled: !!entregadorId,
  });

  if (!entregador) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  // Filtrar por período
  const getEntregasFiltradas = () => {
    const agora = moment();
    return entregas.filter(e => {
      if (e.status !== 'entregue') return false;
      const data = moment(e.horario_entrega || e.created_date);
      switch (periodoFiltro) {
        case 'hoje': return data.isSame(agora, 'day');
        case 'semana': return data.isSame(agora, 'week');
        case 'mes': return data.isSame(agora, 'month');
        default: return true;
      }
    });
  };

  const entregasFiltradas = getEntregasFiltradas();
  const entregasConcluidas = entregas.filter(e => e.status === 'entregue');

  // Estatísticas
  const totalGanhos = entregasFiltradas.reduce((acc, e) => acc + (e.taxa_entregador || 0), 0);
  const totalKm = entregasFiltradas.reduce((acc, e) => acc + (e.distancia_km || 0), 0);
  const tempoMedio = entregasFiltradas.length > 0
    ? entregasFiltradas.reduce((acc, e) => acc + (e.tempo_entrega_minutos || 0), 0) / entregasFiltradas.length
    : 0;
  const totalAjustes = registros.reduce((acc, r) => acc + (r.taxa_ajuste || 0), 0);

  // Salvar ajuste
  const salvarAjuste = async () => {
    setSalvando(true);
    try {
      const valorAjuste = ajusteForm.tipo === 'desconto' 
        ? -Math.abs(parseFloat(ajusteForm.valor) || 0)
        : Math.abs(parseFloat(ajusteForm.valor) || 0);

      await base44.entities.RegistroEntrega.create({
        entregador_id: entregadorId,
        entrega_id: 'manual',
        taxa_base: 0,
        taxa_ajuste: valorAjuste,
        taxa_total: valorAjuste,
        motivo_ajuste: ajusteForm.motivo,
        data_entrega: new Date().toISOString(),
      });

      // Atualizar saldo do entregador
      const novoSaldo = (entregador.saldo_taxas || 0) + valorAjuste;
      await base44.entities.Entregador.update(entregadorId, { saldo_taxas: novoSaldo });

      refetchEntregador();
      refetchRegistros();
      setShowAjusteModal(false);
      setAjusteForm({ tipo: 'bonus', valor: '', motivo: '' });
    } catch (error) {
      console.error('Erro ao salvar ajuste:', error);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Entregadores')}>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{entregador.nome}</h1>
          <p className="text-slate-400">{entregador.telefone}</p>
        </div>
        <Button 
          onClick={() => setShowAjusteModal(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600"
        >
          <Edit className="w-4 h-4 mr-2" />
          Ajuste Manual
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">R$ {(entregador.saldo_taxas || 0).toFixed(2)}</p>
              <p className="text-xs text-slate-400">Saldo Total</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{entregasConcluidas.length}</p>
              <p className="text-xs text-slate-400">Total Entregas</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Route className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalKm.toFixed(1)} km</p>
              <p className="text-xs text-slate-400">Distância (período)</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{(entregador.avaliacao_media || 5).toFixed(1)}</p>
              <p className="text-xs text-slate-400">Avaliação</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtro de Período */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Histórico</h2>
        <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
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
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{entregasFiltradas.length}</p>
            <p className="text-xs text-slate-400">Entregas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">R$ {totalGanhos.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Ganhos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalKm.toFixed(1)} km</p>
            <p className="text-xs text-slate-400">Distância</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{Math.round(tempoMedio)} min</p>
            <p className="text-xs text-slate-400">Tempo Médio</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="entregas" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="entregas" className="data-[state=active]:bg-orange-500">
            <Package className="w-4 h-4 mr-2" />
            Entregas
          </TabsTrigger>
          <TabsTrigger value="rotas" className="data-[state=active]:bg-orange-500">
            <Route className="w-4 h-4 mr-2" />
            Rotas
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-orange-500">
            <DollarSign className="w-4 h-4 mr-2" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        {/* Entregas */}
        <TabsContent value="entregas" className="space-y-3">
          {entregasFiltradas.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">Nenhuma entrega no período</p>
            </Card>
          ) : (
            entregasFiltradas.map((entrega) => (
              <Card key={entrega.id} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Pedido #{entrega.numero_pedido}</p>
                      <p className="text-sm text-slate-400">{entrega.bairro}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{moment(entrega.horario_entrega || entrega.created_date).format('DD/MM HH:mm')}</span>
                        {entrega.tempo_entrega_minutos && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {entrega.tempo_entrega_minutos} min
                          </span>
                        )}
                        {entrega.distancia_km && (
                          <span className="flex items-center gap-1">
                            <Route className="w-3 h-3" />
                            {entrega.distancia_km.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">+R$ {(entrega.taxa_entregador || 0).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Pedido: R$ {(entrega.valor_pedido || 0).toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Rotas */}
        <TabsContent value="rotas" className="space-y-3">
          <Card className="bg-white/5 border-white/10 p-6 text-center">
            <Route className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">Histórico de rotas em desenvolvimento</p>
            <p className="text-sm text-slate-500">Em breve você poderá ver todas as rotas realizadas</p>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financeiro" className="space-y-3">
          <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Saldo Atual</p>
                <p className="text-3xl font-bold text-emerald-400">R$ {(entregador.saldo_taxas || 0).toFixed(2)}</p>
              </div>
              <Button 
                onClick={() => setShowAjusteModal(true)}
                variant="outline"
                className="border-emerald-500/50 text-emerald-400"
              >
                <Edit className="w-4 h-4 mr-2" />
                Ajustar
              </Button>
            </div>
          </Card>

          <h3 className="text-white font-semibold">Movimentações</h3>
          
          {/* Entregas + Ajustes */}
          {registros.filter(r => r.taxa_ajuste !== 0).map((reg) => (
            <Card key={reg.id} className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    reg.taxa_ajuste > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    {reg.taxa_ajuste > 0 ? (
                      <Plus className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Minus className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {reg.entrega_id === 'manual' ? 'Ajuste Manual' : `Entrega #${reg.entrega_id}`}
                    </p>
                    {reg.motivo_ajuste && (
                      <p className="text-sm text-slate-400">{reg.motivo_ajuste}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {moment(reg.data_entrega || reg.created_date).format('DD/MM/YYYY HH:mm')}
                    </p>
                  </div>
                </div>
                <p className={`font-bold ${reg.taxa_ajuste > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {reg.taxa_ajuste > 0 ? '+' : ''}R$ {reg.taxa_ajuste.toFixed(2)}
                </p>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modal de Ajuste */}
      <Dialog open={showAjusteModal} onOpenChange={setShowAjusteModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="w-6 h-6 text-blue-500" />
              Ajuste Manual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Tipo de Ajuste</Label>
              <Select value={ajusteForm.tipo} onValueChange={(v) => setAjusteForm({ ...ajusteForm, tipo: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="bonus">Bônus / Acréscimo</SelectItem>
                  <SelectItem value="desconto">Desconto / Estorno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-400">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={ajusteForm.valor}
                onChange={(e) => setAjusteForm({ ...ajusteForm, valor: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label className="text-slate-400">Motivo</Label>
              <Textarea
                value={ajusteForm.motivo}
                onChange={(e) => setAjusteForm({ ...ajusteForm, motivo: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ex: Bônus por performance, correção de valor, etc."
                rows={3}
              />
            </div>

            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Saldo Atual</span>
                <span className="text-white font-medium">R$ {(entregador.saldo_taxas || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-slate-400">Ajuste</span>
                <span className={ajusteForm.tipo === 'bonus' ? 'text-emerald-400' : 'text-red-400'}>
                  {ajusteForm.tipo === 'bonus' ? '+' : '-'}R$ {Math.abs(parseFloat(ajusteForm.valor) || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-white font-medium">Novo Saldo</span>
                <span className="text-emerald-400 font-bold">
                  R$ {(
                    (entregador.saldo_taxas || 0) + 
                    (ajusteForm.tipo === 'bonus' ? 1 : -1) * Math.abs(parseFloat(ajusteForm.valor) || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowAjusteModal(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={salvarAjuste}
                disabled={!ajusteForm.valor || salvando}
                className="bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {salvando ? 'Salvando...' : 'Salvar Ajuste'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}