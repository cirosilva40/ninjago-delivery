import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package, AlertTriangle, Edit, Trash2, Plus, Search,
  TrendingDown, Box, Layers
} from 'lucide-react';
import { toast } from 'sonner';

const categorias = [
  { value: 'insumos', label: 'Insumos', color: 'bg-orange-500' },
  { value: 'descartaveis', label: 'Descartáveis', color: 'bg-blue-500' },
  { value: 'limpeza', label: 'Limpeza', color: 'bg-cyan-500' },
  { value: 'embalagens', label: 'Embalagens', color: 'bg-purple-500' },
  { value: 'bebidas', label: 'Bebidas', color: 'bg-green-500' },
  { value: 'outros', label: 'Outros', color: 'bg-slate-500' },
];

const unidades = ['unidade', 'kg', 'g', 'litro', 'ml', 'cx', 'pacote', 'saco', 'fardo'];

export default function EstoqueAtual({ pizzariaId }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    nome: '', descricao: '', categoria: 'insumos',
    unidade_medida: 'unidade', alerta_minimo: 0,
  });

  const { data: itens = [] } = useQuery({
    queryKey: ['estoque-itens', pizzariaId],
    queryFn: () => base44.entities.EstoqueItem.filter({ pizzaria_id: pizzariaId, ativo: true }, 'nome', 500),
    enabled: !!pizzariaId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingItem
      ? base44.entities.EstoqueItem.update(editingItem.id, data)
      : base44.entities.EstoqueItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque-itens'] });
      setShowModal(false);
      resetForm();
      toast.success(editingItem ? 'Item atualizado!' : 'Item criado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EstoqueItem.update(id, { ativo: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque-itens'] });
      toast.success('Item removido!');
    },
  });

  const resetForm = () => {
    setEditingItem(null);
    setForm({ nome: '', descricao: '', categoria: 'insumos', unidade_medida: 'unidade', alerta_minimo: 0 });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      nome: item.nome, descricao: item.descricao || '',
      categoria: item.categoria, unidade_medida: item.unidade_medida,
      alerta_minimo: item.alerta_minimo || 0,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nome) return toast.error('Informe o nome do item');
    saveMutation.mutate({ ...form, pizzaria_id: pizzariaId });
  };

  const filtered = itens.filter(i =>
    !search || i.nome.toLowerCase().includes(search.toLowerCase())
  );

  const emAlerta = itens.filter(i => i.alerta_minimo > 0 && i.quantidade_atual <= i.alerta_minimo);

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {emAlerta.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-red-400">{emAlerta.length} item(ns) com estoque baixo</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {emAlerta.map(i => (
              <Badge key={i.id} className="bg-red-500/20 text-red-300 border border-red-500/30">
                {i.nome}: {i.quantidade_atual} {i.unidade_medida}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-gradient-to-r from-orange-500 to-red-600"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <Box className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{itens.length}</p>
          <p className="text-xs text-slate-400">Itens cadastrados</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{emAlerta.length}</p>
          <p className="text-xs text-slate-400">Em alerta</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <TrendingDown className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">
            R$ {itens.reduce((acc, i) => acc + ((i.quantidade_atual || 0) * (i.custo_unitario_medio || 0)), 0).toFixed(2)}
          </p>
          <p className="text-xs text-slate-400">Valor em estoque</p>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-white/5 border border-white/10">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum item cadastrado</p>
          <p className="text-sm text-slate-500 mt-1">Clique em "Novo Item" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => {
            const cat = categorias.find(c => c.value === item.categoria);
            const emBaixo = item.alerta_minimo > 0 && item.quantidade_atual <= item.alerta_minimo;
            return (
              <Card key={item.id} className={`glass-card border-none ${emBaixo ? 'ring-1 ring-red-500/40' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${cat?.color} text-white text-xs`}>{cat?.label}</Badge>
                        {emBaixo && (
                          <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />Baixo
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-white truncate">{item.nome}</h3>
                      {item.descricao && <p className="text-xs text-slate-400 truncate">{item.descricao}</p>}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={() => handleEdit(item)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400"
                        onClick={() => confirm('Remover item?') && deleteMutation.mutate(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-slate-400">Estoque</p>
                      <p className={`text-lg font-bold ${emBaixo ? 'text-red-400' : 'text-white'}`}>
                        {item.quantidade_atual || 0} <span className="text-sm font-normal text-slate-400">{item.unidade_medida}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Custo médio</p>
                      <p className="text-lg font-bold text-emerald-400">
                        R$ {(item.custo_unitario_medio || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {item.alerta_minimo > 0 && (
                    <p className="text-xs text-slate-500 mt-2">Alerta com {item.alerta_minimo} {item.unidade_medida} ou menos</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item de Estoque'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="Ex: Copo 500ml" />
            </div>
            <div>
              <Label className="text-slate-400">Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="Detalhes opcionais" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Unidade</Label>
                <Select value={form.unidade_medida} onValueChange={(v) => setForm({ ...form, unidade_medida: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Alerta de estoque mínimo</Label>
              <Input type="number" value={form.alerta_minimo} onChange={(e) => setForm({ ...form, alerta_minimo: parseFloat(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white mt-1" placeholder="0 = sem alerta" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}