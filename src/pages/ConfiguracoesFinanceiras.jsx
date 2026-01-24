import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function ConfiguracoesFinanceiras() {
  const [theme] = useState(() => localStorage.getItem('theme') || 'dark');
  const isLight = theme === 'light';
  const queryClient = useQueryClient();

  // Buscar pizzaria
  const { data: pizzarias = [] } = useQuery({
    queryKey: ['pizzarias'],
    queryFn: () => base44.entities.Pizzaria.list(),
  });

  const pizzaria = pizzarias[0];

  const [dadosBancarios, setDadosBancarios] = useState({
    banco_nome: pizzaria?.dados_bancarios?.banco_nome || '',
    banco_numero: pizzaria?.dados_bancarios?.banco_numero || '',
    agencia: pizzaria?.dados_bancarios?.agencia || '',
    conta: pizzaria?.dados_bancarios?.conta || '',
    tipo_conta: pizzaria?.dados_bancarios?.tipo_conta || 'corrente',
    pix_tipo: pizzaria?.dados_bancarios?.pix_tipo || 'cnpj',
    pix_chave: pizzaria?.dados_bancarios?.pix_chave || '',
  });

  // Buscar pedidos finalizados
  const { data: pedidosFinalizados = [] } = useQuery({
    queryKey: ['pedidos-finalizados-all'],
    queryFn: async () => {
      const pedidos = await base44.entities.Pedido.list('-created_date', 1000);
      return pedidos.filter(p => p.status === 'finalizada');
    },
  });

  // Mutation para atualizar pizzaria
  const updatePizzariaMutation = useMutation({
    mutationFn: (data) => base44.entities.Pizzaria.update(pizzaria.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pizzarias'] });
      toast.success('Configurações atualizadas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    },
  });

  const handleSaveDadosBancarios = () => {
    if (!pizzaria) {
      toast.error('Pizzaria não encontrada');
      return;
    }

    updatePizzariaMutation.mutate({
      dados_bancarios: dadosBancarios,
    });
  };

  // Calcular KPIs
  const calcularKPIs = (periodo) => {
    let pedidosFiltrados = pedidosFinalizados;
    
    if (periodo === 'hoje') {
      pedidosFiltrados = pedidosFinalizados.filter(p =>
        moment(p.created_date).isSame(moment(), 'day')
      );
    } else if (periodo === 'semana') {
      pedidosFiltrados = pedidosFinalizados.filter(p =>
        moment(p.created_date).isSame(moment(), 'week')
      );
    } else if (periodo === 'mes') {
      pedidosFiltrados = pedidosFinalizados.filter(p =>
        moment(p.created_date).isSame(moment(), 'month')
      );
    }

    const totalVendas = pedidosFiltrados.reduce((acc, p) => acc + (p.valor_total || 0), 0);
    const ticketMedio = pedidosFiltrados.length > 0 ? totalVendas / pedidosFiltrados.length : 0;
    const totalPedidos = pedidosFiltrados.length;

    return { totalVendas, ticketMedio, totalPedidos };
  };

  const kpisHoje = calcularKPIs('hoje');
  const kpisSemana = calcularKPIs('semana');
  const kpisMes = calcularKPIs('mes');
  const kpisTotal = calcularKPIs('total');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Configurações Financeiras
        </h1>
        <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
          Configure dados bancários e acompanhe indicadores
        </p>
      </div>

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList className={isLight ? 'bg-gray-100' : 'bg-white/5'}>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="banco">Dados Bancários</TabsTrigger>
        </TabsList>

        {/* KPIs */}
        <TabsContent value="kpis" className="space-y-6">
          {/* KPIs de Hoje */}
          <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
            <CardHeader>
              <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                Hoje
              </CardTitle>
              <CardDescription className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                {moment().format('DD/MM/YYYY')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Vendas
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisHoje.totalVendas.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Ticket Médio
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisHoje.ticketMedio.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Pedidos
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {kpisHoje.totalPedidos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs da Semana */}
          <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
            <CardHeader>
              <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                Esta Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Vendas
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisSemana.totalVendas.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Ticket Médio
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisSemana.ticketMedio.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Pedidos
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {kpisSemana.totalPedidos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs do Mês */}
          <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
            <CardHeader>
              <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                Este Mês
              </CardTitle>
              <CardDescription className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                {moment().format('MMMM YYYY')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Vendas
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisMes.totalVendas.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Ticket Médio
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisMes.ticketMedio.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Pedidos
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {kpisMes.totalPedidos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Totais */}
          <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
            <CardHeader>
              <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                Histórico Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Vendas
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisTotal.totalVendas.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Ticket Médio
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    R$ {kpisTotal.ticketMedio.toFixed(2)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Total de Pedidos
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {kpisTotal.totalPedidos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados Bancários */}
        <TabsContent value="banco" className="space-y-6">
          <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className={isLight ? 'text-gray-900' : 'text-white'}>
                    Dados Bancários
                  </CardTitle>
                  <CardDescription className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                    Configure as informações da conta bancária
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                    Nome do Banco
                  </Label>
                  <Input
                    value={dadosBancarios.banco_nome}
                    onChange={(e) => setDadosBancarios({ ...dadosBancarios, banco_nome: e.target.value })}
                    placeholder="Ex: Banco do Brasil"
                    className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                  />
                </div>

                <div>
                  <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                    Número do Banco
                  </Label>
                  <Input
                    value={dadosBancarios.banco_numero}
                    onChange={(e) => setDadosBancarios({ ...dadosBancarios, banco_numero: e.target.value })}
                    placeholder="Ex: 001"
                    className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                  />
                </div>

                <div>
                  <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                    Agência
                  </Label>
                  <Input
                    value={dadosBancarios.agencia}
                    onChange={(e) => setDadosBancarios({ ...dadosBancarios, agencia: e.target.value })}
                    placeholder="Ex: 1234-5"
                    className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                  />
                </div>

                <div>
                  <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                    Conta
                  </Label>
                  <Input
                    value={dadosBancarios.conta}
                    onChange={(e) => setDadosBancarios({ ...dadosBancarios, conta: e.target.value })}
                    placeholder="Ex: 12345-6"
                    className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                  />
                </div>

                <div>
                  <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                    Tipo de Conta
                  </Label>
                  <Select 
                    value={dadosBancarios.tipo_conta} 
                    onValueChange={(value) => setDadosBancarios({ ...dadosBancarios, tipo_conta: value })}
                  >
                    <SelectTrigger className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                    Tipo de Chave PIX
                  </Label>
                  <Select 
                    value={dadosBancarios.pix_tipo} 
                    onValueChange={(value) => setDadosBancarios({ ...dadosBancarios, pix_tipo: value })}
                  >
                    <SelectTrigger className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="chave_aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                    Chave PIX
                  </Label>
                  <Input
                    value={dadosBancarios.pix_chave}
                    onChange={(e) => setDadosBancarios({ ...dadosBancarios, pix_chave: e.target.value })}
                    placeholder="Digite a chave PIX"
                    className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveDadosBancarios}
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={updatePizzariaMutation.isPending}
                >
                  {updatePizzariaMutation.isPending ? 'Salvando...' : 'Salvar Dados Bancários'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}