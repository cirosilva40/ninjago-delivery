import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, FlaskConical, TrendingUp, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function ComposicaoProdutos({ pizzariaId }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [selectedProduto, setSelectedProduto] = useState('');
  const [itensComp, setItensComp] = useState([
    { estoque_item_id: '', quantidade: '', _key: Date.now() }
  ]);

  const { data: composicoes = [] } = useQuery({
    queryKey: ['composicoes', pizzariaId],
    queryFn: () => base44.entities.ComposicaoProduto.filter({ pizzaria_id: pizzariaId, ativo: true }, 'produto_nome', 200),
    enabled: !!pizzariaId,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos', pizzariaId],
    queryFn: () => base44.entities.Produto.filter({ restaurante_id: pizzariaId, disponivel: true }, 'nome', 200),
    enabled: !!pizzariaId,
  });

  const { data: estoqueItens = [] } = useQuery({
    queryKey: ['estoque-itens', pizzariaId],
    queryFn: () => base44.entities.EstoqueItem.filter({ pizzaria_id: pizzariaId, ativo: true }, 'nome', 500),
    enabled: !!pizzariaId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingComp
      ? base44.entities.ComposicaoProduto.update(editingComp.id, data)
      : base44.entities.ComposicaoProduto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicoes'] });
      setShowModal(false);
      resetForm();
      toast.success('Composição salva!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ComposicaoProduto.update(id, { ativo: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicoes'] });
      toast.success('Composição removida!');
    },
  });

  const resetForm = () => {
    setEditingComp(null);
    setSelectedProduto('');
    setItensComp([{ estoque_item_id: '', quantidade: '', _key: Date.now() }]);
  };

  const addLinha = () => setItensComp(prev => [...prev, { estoque_item_id: '', quantidade: '', _key: Date.now() }]);
  const removeLinha = (key) => setItensComp(prev => prev.filter(i => i._key !== key));
  const updateLinha = (key, field, value) => setItensComp(prev => prev.map(i => i._key === key ? { ...i, [field]: value } : i));

  const calcularCusto = (itens) => {
    return itens.reduce((acc, i) => {
      const estoqueItem = estoqueItens.find(e => e.id === i.estoque_item_id);
      return acc + ((parseFloat(i.quantidade) || 0) * (estoqueItem?.custo_unitario_medio || 0));
    }, 0);
  };

  const handleEdit = (comp) => {
    setEditingComp(comp);
    setSelectedProduto(comp.produto_id);
    setItensComp((comp.itens || []).map(i => ({ ...i, _key: Math.random() })));
    setShowModal(true);
  };

  const handleSalvar = () => {
    if (!selectedProduto) return toast.error('Selecione um produto');
    const linhasValidas = itensComp.filter(i => i.estoque_item_id && parseFloat(i.quantidade) > 0);
    if (linhasValidas.length === 0) return toast.error('Adicione ao menos um item');

    const produto = produtos.find(p => p.id === selectedProduto);
    const custoProducao = calcularCusto(linhasValidas);
    const precoVenda = produto?.preco || 0;
    const margemPercentual = precoVenda > 0 ? ((precoVenda - custoProducao) / precoVenda) * 100 : 0;

    const itensFormatados = linhasValidas.map(i => {
      const estoqueItem = estoqueItens.find(e => e.id === i.estoque_item_id);
      return {
        estoque_item_id: i.estoque_item_id,
        estoque_item_nome: estoqueItem?.nome || '',
        quantidade: parseFloat(i.quantidade),
        unidade_medida: estoqueItem?.unidade_medida || '',
      };
    });

    saveMutation.mutate({
      pizzaria_id: pizzariaId,
      produto_id: selectedProduto,
      produto_nome: produto?.nome || '',
      itens: itensFormatados,
      custo_producao: custoProducao,
      preco_venda: precoVenda,
      margem_percentual: margemPercentual,
    });
  };

  const produtosSemComposicao = produtos.filter(p => !composicoes.find(c => c.produto_id === p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Defina quais itens de estoque compõem cada produto vendido para calcular o CMV automaticamente.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-gradient-to-r from-orange-500 to-red-600 shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Nova Composição
        </Button>
      </div>

      {produtosSemComposicao.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm text-amber-300">
            ⚠️ {produtosSemComposicao.length} produto(s) ainda sem composição definida:
            {produtosSemComposicao.slice(0, 3).map(p => ` ${p.nome}`).join(',')}
            {produtosSemComposicao.length > 3 ? ` e mais ${produtosSemComposicao.length - 3}...` : ''}
          </p>
        </div>
      )}

      {composicoes.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-white/5 border border-white/10">
          <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma composição cadastrada</p>
          <p className="text-sm text-slate-500 mt-1">Defina a "receita" de cada produto para calcular o CMV</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {composicoes.map(comp => {
            const margem = comp.margem_percentual || 0;
            const margemCor = margem >= 50 ? 'text-emerald-400' : margem >= 30 ? 'text-yellow-400' : 'text-red-400';
            return (
              <Card key={comp.id} className="glass-card border-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{comp.produto_nome}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={() => handleEdit(comp)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400"
                        onClick={() => confirm('Remover composição?') && deleteMutation.mutate(comp.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="space-y-1 mb-3">
                    {(comp.itens || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300">{item.estoque_item_nome}</span>
                        </div>
                        <span className="text-slate-400">{item.quantidade} {item.unidade_medida}</span>
                      </div>
                    ))}
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">CMV</p>
                      <p className="text-sm font-bold text-red-400">R$ {(comp.custo_producao || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Venda</p>
                      <p className="text-sm font-bold text-white">R$ {(comp.preco_venda || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Margem</p>
                      <p className={`text-sm font-bold ${margemCor}`}>{(comp.margem_percentual || 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-orange-500" />
              {editingComp ? 'Editar Composição' : 'Nova Composição'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Produto *</Label>
              <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Selecionar produto..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} - R$ {p.preco?.toFixed(2)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-400">Itens consumidos por unidade vendida</Label>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 h-7" onClick={addLinha}>
                  <Plus className="w-3 h-3 mr-1" />Item
                </Button>
              </div>
              <div className="space-y-2">
                {itensComp.map(linha => {
                  const estoqueItem = estoqueItens.find(e => e.id === linha.estoque_item_id);
                  return (
                    <div key={linha._key} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Select value={linha.estoque_item_id} onValueChange={(v) => updateLinha(linha._key, 'estoque_item_id', v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Item..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {estoqueItens.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input type="number" step="0.01" placeholder="Qtd" value={linha.quantidade}
                        onChange={(e) => updateLinha(linha._key, 'quantidade', e.target.value)}
                        className="w-20 bg-slate-800 border-slate-700 text-white" />
                      {estoqueItem && <span className="text-xs text-slate-400 w-12">{estoqueItem.unidade_medida}</span>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => removeLinha(linha._key)}
                        disabled={itensComp.length === 1}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProduto && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400 mb-1">Prévia do CMV</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Custo de produção:</span>
                  <span className="font-bold text-red-400">R$ {calcularCusto(itensComp.filter(i => i.estoque_item_id && i.quantidade)).toFixed(2)}</span>
                </div>
                {(() => {
                  const produto = produtos.find(p => p.id === selectedProduto);
                  const custo = calcularCusto(itensComp.filter(i => i.estoque_item_id && i.quantidade));
                  const preco = produto?.preco || 0;
                  const margem = preco > 0 ? ((preco - custo) / preco) * 100 : 0;
                  return (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-300 text-sm">Margem estimada:</span>
                      <span className={`font-bold text-sm ${margem >= 50 ? 'text-emerald-400' : margem >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {margem.toFixed(1)}%
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600" onClick={handleSalvar} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}