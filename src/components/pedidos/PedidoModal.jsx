import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Package, Send } from 'lucide-react';
import { enviarNotificacaoManual } from './NotificacaoHelper';
import { toast } from 'sonner';

export default function PedidoModal({ open, onClose, pedido, pizzariaId, onSave }) {
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_endereco: '',
    cliente_bairro: '',
    cliente_complemento: '',
    cliente_referencia: '',
    itens: [{ nome: '', quantidade: 1, preco_unitario: 0, observacao: '' }],
    taxa_entrega: 5,
    desconto: 0,
    forma_pagamento: 'dinheiro',
    troco_para: 0,
    observacoes: '',
    origem: 'balcao',
  });
  const [loading, setLoading] = useState(false);
  const [showNotificacao, setShowNotificacao] = useState(false);
  const [notifForm, setNotifForm] = useState({ titulo: '', mensagem: '' });

  useEffect(() => {
    if (pedido) {
      setForm({
        ...pedido,
        itens: pedido.itens || [{ nome: '', quantidade: 1, preco_unitario: 0, observacao: '' }],
      });
    } else {
      setForm({
        cliente_nome: '',
        cliente_telefone: '',
        cliente_endereco: '',
        cliente_bairro: '',
        cliente_complemento: '',
        cliente_referencia: '',
        itens: [{ nome: '', quantidade: 1, preco_unitario: 0, observacao: '' }],
        taxa_entrega: 5,
        desconto: 0,
        forma_pagamento: 'dinheiro',
        troco_para: 0,
        observacoes: '',
        origem: 'balcao',
      });
    }
  }, [pedido, open]);

  const addItem = () => {
    setForm({
      ...form,
      itens: [...form.itens, { nome: '', quantidade: 1, preco_unitario: 0, observacao: '' }]
    });
  };

  const removeItem = (index) => {
    if (form.itens.length > 1) {
      setForm({
        ...form,
        itens: form.itens.filter((_, i) => i !== index)
      });
    }
  };

  const updateItem = (index, field, value) => {
    const newItens = [...form.itens];
    newItens[index][field] = value;
    setForm({ ...form, itens: newItens });
  };

  const calcularTotal = () => {
    const subtotal = form.itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
    return subtotal + (form.taxa_entrega || 0) - (form.desconto || 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const valor_produtos = form.itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
      const valor_total = calcularTotal();
      const numero_pedido = `${Date.now().toString().slice(-6)}`;
      
      const data = {
        ...form,
        pizzaria_id: pizzariaId,
        numero_pedido,
        valor_produtos,
        valor_total,
        status: 'novo',
        horario_pedido: new Date().toISOString(),
      };

      if (pedido?.id) {
        await base44.entities.Pedido.update(pedido.id, data);
      } else {
        await base44.entities.Pedido.create(data);
      }
      
      onSave && onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarNotificacao = async () => {
    if (!notifForm.titulo || !notifForm.mensagem) {
      toast.error('Preencha título e mensagem');
      return;
    }

    const sucesso = await enviarNotificacaoManual(
      pedido || form,
      notifForm.titulo,
      notifForm.mensagem
    );

    if (sucesso) {
      toast.success('Notificação enviada com sucesso! 📲');
      setNotifForm({ titulo: '', mensagem: '' });
      setShowNotificacao(false);
    } else {
      toast.error('Erro ao enviar notificação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" />
            {pedido ? 'Editar Pedido' : 'Novo Pedido'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white border-b border-slate-700 pb-2">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Nome</Label>
                <Input
                  value={form.cliente_nome}
                  onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label className="text-slate-400">Telefone</Label>
                <Input
                  value={form.cliente_telefone}
                  onChange={(e) => setForm({ ...form, cliente_telefone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Endereço</Label>
              <Input
                value={form.cliente_endereco}
                onChange={(e) => setForm({ ...form, cliente_endereco: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Rua, número"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Bairro</Label>
                <Input
                  value={form.cliente_bairro}
                  onChange={(e) => setForm({ ...form, cliente_bairro: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Complemento</Label>
                <Input
                  value={form.cliente_complemento}
                  onChange={(e) => setForm({ ...form, cliente_complemento: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Apto, bloco..."
                />
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="font-semibold text-white">Itens do Pedido</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                className="border-orange-500 text-orange-500 hover:bg-orange-500/20"
              >
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            
            {form.itens.map((item, index) => (
              <div key={index} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <Label className="text-slate-400">Descrição</Label>
                    <Input
                      value={item.nome}
                      onChange={(e) => updateItem(index, 'nome', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: Pizza Margherita Grande"
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-slate-400">Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-slate-400">Preço</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.preco_unitario}
                      onChange={(e) => updateItem(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="mt-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={item.observacao}
                  onChange={(e) => updateItem(index, 'observacao', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Observações do item..."
                />
              </div>
            ))}
          </div>

          {/* Pagamento */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white border-b border-slate-700 pb-2">Pagamento</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-400">Taxa Entrega</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.taxa_entrega}
                  onChange={(e) => setForm({ ...form, taxa_entrega: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Desconto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.desconto}
                  onChange={(e) => setForm({ ...form, desconto: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400">Forma Pagamento</Label>
                <Select
                  value={form.forma_pagamento}
                  onValueChange={(value) => setForm({ ...form, forma_pagamento: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {form.forma_pagamento === 'dinheiro' && (
              <div className="w-1/3">
                <Label className="text-slate-400">Troco para</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.troco_para}
                  onChange={(e) => setForm({ ...form, troco_para: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <Label className="text-slate-400">Observações Gerais</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>

          {/* Total */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total do Pedido</span>
              <span className="text-3xl font-bold text-orange-400">R$ {calcularTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Notificação Manual */}
          {pedido && (
            <div className="space-y-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-400" />
                  Enviar Notificação ao Cliente
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotificacao(!showNotificacao)}
                  className="text-blue-400"
                >
                  {showNotificacao ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
              
              {showNotificacao && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-400">Título da Notificação</Label>
                    <Input
                      value={notifForm.titulo}
                      onChange={(e) => setNotifForm({ ...notifForm, titulo: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: Pedido em andamento"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Mensagem</Label>
                    <Textarea
                      value={notifForm.mensagem}
                      onChange={(e) => setNotifForm({ ...notifForm, mensagem: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: Seu pedido chegará em aproximadamente 30 minutos"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleEnviarNotificacao}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Notificação
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              {loading ? 'Salvando...' : (pedido ? 'Atualizar Pedido' : 'Criar Pedido')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}