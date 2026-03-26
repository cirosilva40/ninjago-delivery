import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ShoppingCart, PackagePlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function RegistrarCompra({ pizzariaId }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cabecalho, setCabecalho] = useState({
    nota_compra: '',
    data: moment().format('YYYY-MM-DD'),
    observacoes: '',
  });

  const [itensCompra, setItensCompra] = useState([
    { estoque_item_id: '', quantidade: '', custo_unitario: '', _key: Date.now() }
  ]);

  const { data: estoqueItens = [] } = useQuery({
    queryKey: ['estoque-itens', pizzariaId],
    queryFn: () => base44.entities.EstoqueItem.filter({ pizzaria_id: pizzariaId, ativo: true }, 'nome', 500),
    enabled: !!pizzariaId,
  });

  const addLinha = () => {
    setItensCompra(prev => [...prev, { estoque_item_id: '', quantidade: '', custo_unitario: '', _key: Date.now() }]);
  };

  const removeLinha = (key) => {
    setItensCompra(prev => prev.filter(i => i._key !== key));
  };

  const updateLinha = (key, field, value) => {
    setItensCompra(prev => prev.map(i => i._key === key ? { ...i, [field]: value } : i));
  };

  const totalCompra = itensCompra.reduce((acc, i) => {
    return acc + ((parseFloat(i.quantidade) || 0) * (parseFloat(i.custo_unitario) || 0));
  }, 0);

  const handleSalvar = async () => {
    const linhasValidas = itensCompra.filter(i => i.estoque_item_id && parseFloat(i.quantidade) > 0 && parseFloat(i.custo_unitario) >= 0);
    if (linhasValidas.length === 0) {
      toast.error('Adicione ao menos um item válido à compra');
      return;
    }

    setSaving(true);
    try {
      for (const linha of linhasValidas) {
        const item = estoqueItens.find(e => e.id === linha.estoque_item_id);
        if (!item) continue;

        const qtd = parseFloat(linha.quantidade);
        const custoUni = parseFloat(linha.custo_unitario);
        const custoTotal = qtd * custoUni;

        const qtdAtual = item.quantidade_atual || 0;
        const custoMedioAtual = item.custo_unitario_medio || 0;
        // Cálculo de custo médio ponderado
        const novoTotal = qtdAtual + qtd;
        const novoCustoMedio = novoTotal > 0
          ? ((qtdAtual * custoMedioAtual) + (qtd * custoUni)) / novoTotal
          : custoUni;

        // Registrar movimentação
        await base44.entities.MovimentacaoEstoque.create({
          pizzaria_id: pizzariaId,
          estoque_item_id: item.id,
          estoque_item_nome: item.nome,
          tipo: 'entrada',
          motivo: 'compra',
          quantidade: qtd,
          custo_unitario: custoUni,
          custo_total: custoTotal,
          quantidade_anterior: qtdAtual,
          quantidade_posterior: novoTotal,
          nota_compra: cabecalho.nota_compra,
          observacoes: cabecalho.observacoes,
          data: cabecalho.data,
        });

        // Atualizar estoque
        await base44.entities.EstoqueItem.update(item.id, {
          quantidade_atual: novoTotal,
          custo_unitario_medio: novoCustoMedio,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['estoque-itens'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });

      setSuccess(true);
      setCabecalho({ nota_compra: '', data: moment().format('YYYY-MM-DD'), observacoes: '' });
      setItensCompra([{ estoque_item_id: '', quantidade: '', custo_unitario: '', _key: Date.now() }]);
      setTimeout(() => setSuccess(false), 4000);
      toast.success(`${linhasValidas.length} item(ns) lançado(s) no estoque!`);
    } catch (err) {
      toast.error('Erro ao registrar compra: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (estoqueItens.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl bg-white/5 border border-white/10">
        <PackagePlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Cadastre itens de estoque primeiro</p>
        <p className="text-sm text-slate-500 mt-1">Acesse a aba "Estoque Atual" para criar os itens</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-400">Compra registrada com sucesso!</p>
            <p className="text-sm text-slate-400">Estoque atualizado e custo médio recalculado.</p>
          </div>
        </div>
      )}

      {/* Cabeçalho da Compra */}
      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            Dados da Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-400">Data da Compra *</Label>
              <Input type="date" value={cabecalho.data}
                onChange={(e) => setCabecalho({ ...cabecalho, data: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Nº Nota / Referência</Label>
              <Input value={cabecalho.nota_compra} placeholder="Ex: NF-001"
                onChange={(e) => setCabecalho({ ...cabecalho, nota_compra: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Observações</Label>
              <Input value={cabecalho.observacoes} placeholder="Fornecedor, etc."
                onChange={(e) => setCabecalho({ ...cabecalho, observacoes: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens da Compra */}
      <Card className="glass-card border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-blue-400" />
              Itens Comprados
            </CardTitle>
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={addLinha}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header da tabela */}
          <div className="hidden sm:grid grid-cols-12 gap-3 pb-2 border-b border-white/10">
            <p className="col-span-5 text-xs text-slate-400 uppercase">Item</p>
            <p className="col-span-2 text-xs text-slate-400 uppercase">Qtd</p>
            <p className="col-span-3 text-xs text-slate-400 uppercase">Custo Unit. (R$)</p>
            <p className="col-span-1 text-xs text-slate-400 uppercase text-right">Total</p>
            <p className="col-span-1"></p>
          </div>

          {itensCompra.map((linha) => {
            const item = estoqueItens.find(e => e.id === linha.estoque_item_id);
            const subtotal = (parseFloat(linha.quantidade) || 0) * (parseFloat(linha.custo_unitario) || 0);
            return (
              <div key={linha._key} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="col-span-12 sm:col-span-5">
                  <Select value={linha.estoque_item_id} onValueChange={(v) => updateLinha(linha._key, 'estoque_item_id', v)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selecionar item..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {estoqueItens.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nome} ({e.unidade_medida})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input type="number" placeholder="Qtd" value={linha.quantidade}
                    onChange={(e) => updateLinha(linha._key, 'quantidade', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <Input type="number" step="0.01" placeholder="0,00" value={linha.custo_unitario}
                    onChange={(e) => updateLinha(linha._key, 'custo_unitario', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="col-span-3 sm:col-span-1 text-right">
                  <p className="text-emerald-400 font-semibold text-sm">R$ {subtotal.toFixed(2)}</p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400"
                    onClick={() => removeLinha(linha._key)} disabled={itensCompra.length === 1}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mt-2">
            <span className="font-semibold text-white">Total da Compra</span>
            <span className="text-2xl font-bold text-emerald-400">R$ {totalCompra.toFixed(2)}</span>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSalvar} disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-red-600 px-8">
              {saving ? 'Registrando...' : 'Registrar Compra'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}