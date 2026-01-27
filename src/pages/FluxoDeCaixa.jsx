import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/masked-input';
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
  BarChart3,
  Printer
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
  const [currentPage, setCurrentPage] = useState(1);
  const [receitasPage, setReceitasPage] = useState(1);
  const itemsPerPage = 10;
  
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

  // Paginação de custos
  const totalPages = Math.ceil(custos.length / itemsPerPage);
  const paginatedCustos = custos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Paginação de receitas
  const totalReceitasPages = Math.ceil(pedidosFinalizados.length / itemsPerPage);
  const paginatedReceitas = pedidosFinalizados.slice((receitasPage - 1) * itemsPerPage, receitasPage * itemsPerPage);

  // Função de impressão
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const mesFormatado = moment(mesAtual).format('MMMM [de] YYYY');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Fluxo de Caixa - ${mesFormatado}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          h1 {
            text-align: center;
            color: #f97316;
            margin-bottom: 10px;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          .summary-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666;
          }
          .summary-card .value {
            font-size: 28px;
            font-weight: bold;
          }
          .summary-card.receitas .value { color: #10b981; }
          .summary-card.despesas .value { color: #ef4444; }
          .summary-card.saldo .value { color: #3b82f6; }
          .summary-card.saldo.negative .value { color: #ef4444; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin: 30px 0 15px 0;
            color: #1f2937;
          }
          .categoria {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            color: white;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>Relatório de Fluxo de Caixa</h1>
        <div class="subtitle">${mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1)}</div>
        
        <div class="summary">
          <div class="summary-card receitas">
            <h3>Total de Receitas</h3>
            <div class="value">R$ ${totalReceitas.toFixed(2)}</div>
            <div style="font-size: 12px; color: #666; margin-top: 8px;">${pedidosFinalizados.length} pedidos</div>
          </div>
          <div class="summary-card despesas">
            <h3>Total de Despesas</h3>
            <div class="value">R$ ${totalCustos.toFixed(2)}</div>
            <div style="font-size: 12px; color: #666; margin-top: 8px;">${custos.length} lançamentos</div>
          </div>
          <div class="summary-card saldo ${saldo < 0 ? 'negative' : ''}">
            <h3>Saldo do Período</h3>
            <div class="value">R$ ${saldo.toFixed(2)}</div>
            <div style="font-size: 12px; color: #666; margin-top: 8px;">${saldo >= 0 ? 'Positivo' : 'Negativo'}</div>
          </div>
        </div>

        <div class="section-title">Despesas por Categoria</div>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th style="text-align: right;">Quantidade</th>
              <th style="text-align: right;">Total</th>
              <th style="text-align: right;">% do Total</th>
            </tr>
          </thead>
          <tbody>
            ${custosPorCategoria.map(cat => `
              <tr>
                <td>${cat.label}</td>
                <td style="text-align: right;">${custos.filter(c => c.categoria === cat.value).length}</td>
                <td style="text-align: right;">R$ ${cat.total.toFixed(2)}</td>
                <td style="text-align: right;">${((cat.total / totalCustos) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f9fafb;">
              <td>TOTAL</td>
              <td style="text-align: right;">${custos.length}</td>
              <td style="text-align: right;">R$ ${totalCustos.toFixed(2)}</td>
              <td style="text-align: right;">100%</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Detalhamento de Despesas</div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${custos.map(custo => {
              const cat = categorias.find(c => c.value === custo.categoria);
              return `
                <tr>
                  <td>${moment(custo.data).format('DD/MM/YYYY')}</td>
                  <td>${custo.descricao}</td>
                  <td>${cat?.label || custo.categoria}</td>
                  <td>${custo.tipo === 'fixo' ? 'Fixo' : 'Variável'}</td>
                  <td style="text-align: right; color: #ef4444; font-weight: bold;">R$ ${custo.valor.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="section-title">Receitas (Pedidos Finalizados)</div>
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${pedidosFinalizados.map(pedido => `
              <tr>
                <td>${moment(pedido.created_date).format('DD/MM/YYYY HH:mm')}</td>
                <td>#${pedido.numero_pedido}</td>
                <td>${pedido.cliente_nome}</td>
                <td style="text-align: right; color: #10b981; font-weight: bold;">R$ ${pedido.valor_total?.toFixed(2) || '0.00'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Relatório gerado em ${moment().format('DD/MM/YYYY [às] HH:mm')}</p>
          <p>Sistema NinjaGO Delivery</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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
        <div className="flex gap-3">
          <Button 
            onClick={handlePrint}
            variant="outline"
            className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Relatório
          </Button>
          <Button 
            onClick={() => {
              toast.info('Funcionalidade em desenvolvimento');
            }}
            variant="outline"
            className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Categoria
          </Button>
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
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center gap-4">
        <Label className={isLight ? 'text-gray-900' : 'text-white'}>Período:</Label>
        <Input
          type="month"
          value={mesAtual}
          onChange={(e) => setMesAtual(e.target.value)}
          className={`w-48 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-600 text-white'}`}
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
            <>
              {paginatedCustos.map((custo) => {
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
            })}
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={isLight ? '' : 'border-white/10 text-white'}
                >
                  Anterior
                </Button>
                <span className={`px-4 ${isLight ? 'text-gray-700' : 'text-white'}`}>
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={isLight ? '' : 'border-white/10 text-white'}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
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
            <>
              {paginatedReceitas.map((pedido) => (
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
            ))}
            
            {/* Paginação de Receitas */}
            {totalReceitasPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReceitasPage(p => Math.max(1, p - 1))}
                  disabled={receitasPage === 1}
                  className={isLight ? '' : 'border-white/10 text-white'}
                >
                  Anterior
                </Button>
                <span className={`px-4 ${isLight ? 'text-gray-700' : 'text-white'}`}>
                  Página {receitasPage} de {totalReceitasPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReceitasPage(p => Math.min(totalReceitasPages, p + 1))}
                  disabled={receitasPage === totalReceitasPages}
                  className={isLight ? '' : 'border-white/10 text-white'}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
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
                className={`mt-1 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                  Valor *
                </Label>
                <CurrencyInput
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className={`mt-1 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500'}`}
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
                  className={`mt-1 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500'}`}
                />
              </div>
            </div>

            <div>
              <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                Categoria *
              </Label>
              <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                <SelectTrigger className={`mt-1 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-600 text-white'}`}>
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
                <SelectTrigger className={`mt-1 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-600 text-white'}`}>
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
                className={`mt-1 ${isLight ? 'bg-white border-gray-300' : 'bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500'}`}
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