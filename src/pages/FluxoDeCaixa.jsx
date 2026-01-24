import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Trash2,
  Edit,
  BarChart3
} from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function FluxoDeCaixa() {
  const [theme] = useState(() => localStorage.getItem('theme') || 'dark');
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  
  const [showCustoModal, setShowCustoModal] = useState(false);
  const [editingCusto, setEditingCusto] = useState(null);
  const [mesAtual, setMesAtual] = useState(moment().format('YYYY-MM'));
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: moment().format('YYYY-MM-DD'),
    categoria: 'outros',
    tipo: 'variavel',
    recorrente: false,
    observacoes: '',
  });

  // Categorias
  const categorias = [
    { value: 'operacional', label: 'Operacional', color: 'bg-blue-500' },
    { value: 'marketing', label: 'Marketing', color: 'bg-purple-500' },
    { value: 'salarios', label: 'Salários', color: 'bg-green-500' },
    { value: 'insumos', label: 'Insumos', color: 'bg-orange-500' },
    { value: 'aluguel', label: 'Aluguel', color: 'bg-red-500' },
    { value: 'energia', label: 'Energia', color: 'bg-yellow-500' },
    { value: 'agua', label: 'Água', color: 'bg-cyan-500' },
    { value: 'internet', label: 'Internet', color: 'bg-indigo-500' },
    { value: 'manutencao', label: 'Manutenção', color: 'bg-pink-500' },
    { value: 'impostos', label: 'Impostos', color: 'bg-gray-500' },
    { value: 'outros', label: 'Outros', color: 'bg-slate-500' },
  ];

  // Buscar custos do mês
  const { data: custos = [] } = useQuery({
    queryKey: ['custos', mesAtual],
    queryFn: async () => {
      const inicioMes = moment(mesAtual).startOf('month').format('YYYY-MM-DD');
      const fimMes = moment(mesAtual).endOf('month').format('YYYY-MM-DD');
      const allCustos = await base44.entities.Custo.list('-data', 1000);
      return allCustos.filter(c => 
        moment(c.data).isBetween(inicioMes, fimMes, null, '[]')
      );
    },
  });

  // Buscar pedidos finalizados do mês
  const { data: pedidosFinalizados = [] } = useQuery({
    queryKey: ['pedidos-finalizados', mesAtual],
    queryFn: async () => {
      const inicioMes = moment(mesAtual).startOf('month').toISOString();
      const fimMes = moment(mesAtual).endOf('month').toISOString();
      const pedidos = await base44.entities.Pedido.list('-created_date', 1000);
      return pedidos.filter(p => 
        p.status === 'finalizada' && 
        moment(p.created_date).isBetween(inicioMes, fimMes, null, '[]')
      );
    },
  });

  // Mutations
  const createCustoMutation = useMutation({
    mutationFn: (data) => base44.entities.Custo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos'] });
      setShowCustoModal(false);
      resetForm();
      toast.success('Custo adicionado com sucesso!');
    },
  });

  const updateCustoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Custo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos'] });
      setShowCustoModal(false);
      setEditingCusto(null);
      resetForm();
      toast.success('Custo atualizado com sucesso!');
    },
  });

  const deleteCustoMutation = useMutation({
    mutationFn: (id) => base44.entities.Custo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custos'] });
      toast.success('Custo excluído com sucesso!');
    },
  });

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      data: moment().format('YYYY-MM-DD'),
      categoria: 'outros',
      tipo: 'variavel',
      recorrente: false,
      observacoes: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.descricao || !formData.valor) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const data = {
      ...formData,
      valor: parseFloat(formData.valor),
      pizzaria_id: 'default',
    };

    if (editingCusto) {
      updateCustoMutation.mutate({ id: editingCusto.id, data });
    } else {
      createCustoMutation.mutate(data);
    }
  };

  const handleEdit = (custo) => {
    setEditingCusto(custo);
    setFormData({
      descricao: custo.descricao,
      valor: custo.valor.toString(),
      data: custo.data,
      categoria: custo.categoria,
      tipo: custo.tipo,
      recorrente: custo.recorrente || false,
      observacoes: custo.observacoes || '',
    });
    setShowCustoModal(true);
  };

  // Cálculos
  const totalReceitas = pedidosFinalizados.reduce((acc, p) => acc + (p.valor_total || 0), 0);
  const totalCustos = custos.reduce((acc, c) => acc + (c.valor || 0), 0);
  const saldo = totalReceitas - totalCustos;

  const custosPorCategoria = categorias.map(cat => ({
    ...cat,
    total: custos
      .filter(c => c.categoria === cat.value)
      .reduce((acc, c) => acc + c.valor, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Fluxo de Caixa
          </h1>
          <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
            Acompanhe receitas e despesas do seu negócio
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingCusto(null);
            resetForm();
            setShowCustoModal(true);
          }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Custo
        </Button>
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center gap-4">
        <Label className={isLight ? 'text-gray-900' : 'text-white'}>Período:</Label>
        <Input
          type="month"
          value={mesAtual}
          onChange={(e) => setMesAtual(e.target.value)}
          className={`w-48 ${isLight ? 'bg-white' : 'glass-card'}`}
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Receitas
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {totalReceitas.toFixed(2)}
            </div>
            <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-400'} mt-1`}>
              {pedidosFinalizados.length} pedidos
            </p>
          </CardContent>
        </Card>

        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Despesas
              </CardTitle>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              R$ {totalCustos.toFixed(2)}
            </div>
            <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-400'} mt-1`}>
              {custos.length} lançamentos
            </p>
          </CardContent>
        </Card>

        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                Saldo
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              R$ {saldo.toFixed(2)}
            </div>
            <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-400'} mt-1`}>
              {saldo >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="custos" className="space-y-6">
        <TabsList className={isLight ? 'bg-gray-100' : 'bg-white/5'}>
          <TabsTrigger value="custos">Despesas</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
        </TabsList>

        {/* Lista de Custos */}
        <TabsContent value="custos" className="space-y-4">
          {custos.length === 0 ? (
            <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
              <CardContent className="text-center py-12">
                <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                  Nenhuma despesa registrada neste período
                </p>
              </CardContent>
            </Card>
          ) : (
            custos.map((custo) => {
              const cat = categorias.find(c => c.value === custo.categoria);
              return (
                <Card key={custo.id} className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${cat?.color} text-white`}>
                            {cat?.label}
                          </Badge>
                          <Badge variant="outline">
                            {custo.tipo === 'fixo' ? 'Fixo' : 'Variável'}
                          </Badge>
                          {custo.recorrente && (
                            <Badge variant="outline">Recorrente</Badge>
                          )}
                        </div>
                        <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {custo.descricao}
                        </h3>
                        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          {moment(custo.data).format('DD/MM/YYYY')}
                        </p>
                        {custo.observacoes && (
                          <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                            {custo.observacoes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-red-500">
                          R$ {custo.valor.toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(custo)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Deseja excluir este custo?')) {
                                deleteCustoMutation.mutate(custo.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Custos por Categoria */}
        <TabsContent value="categorias" className="space-y-4">
          {custosPorCategoria.map((cat) => (
            <Card key={cat.value} className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={`${cat.color} text-white`}>
                      {cat.label}
                    </Badge>
                    <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                      {custos.filter(c => c.categoria === cat.value).length} lançamento(s)
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-red-500">
                    R$ {cat.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Receitas */}
        <TabsContent value="receitas" className="space-y-4">
          {pedidosFinalizados.length === 0 ? (
            <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
              <CardContent className="text-center py-12">
                <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                  Nenhuma receita neste período
                </p>
              </CardContent>
            </Card>
          ) : (
            pedidosFinalizados.map((pedido) => (
              <Card key={pedido.id} className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="bg-orange-500/20 text-orange-500 mb-2">
                        #{pedido.numero_pedido}
                      </Badge>
                      <h3 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {pedido.cliente_nome}
                      </h3>
                      <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        {moment(pedido.created_date).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-green-500">
                      R$ {pedido.valor_total?.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Custo */}
      <Dialog open={showCustoModal} onOpenChange={setShowCustoModal}>
        <DialogContent className={`max-w-md ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={isLight ? 'text-gray-900' : 'text-white'}>
              {editingCusto ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                Descrição *
              </Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Aluguel do imóvel"
                className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                  Valor *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                  className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                />
              </div>

              <div>
                <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                  Data *
                </Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                />
              </div>
            </div>

            <div>
              <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                Categoria *
              </Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                <SelectTrigger className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                Tipo
              </Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="variavel">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                Observações
              </Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Detalhes adicionais (opcional)"
                className={`mt-1 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustoModal(false);
                  setEditingCusto(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleSubmit}
                disabled={createCustoMutation.isPending || updateCustoMutation.isPending}
              >
                {(createCustoMutation.isPending || updateCustoMutation.isPending) ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}