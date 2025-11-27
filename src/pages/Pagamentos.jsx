import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Check,
  X,
  Banknote,
  QrCode,
  Smartphone,
  Globe,
  Ticket,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tipoConfig = {
  dinheiro: { label: 'Dinheiro', icon: Banknote, color: 'bg-green-500' },
  cartao_credito: { label: 'Cartão Crédito', icon: CreditCard, color: 'bg-purple-500' },
  cartao_debito: { label: 'Cartão Débito', icon: CreditCard, color: 'bg-blue-500' },
  pix: { label: 'PIX', icon: QrCode, color: 'bg-cyan-500' },
  online: { label: 'Online', icon: Globe, color: 'bg-indigo-500' },
  vale_refeicao: { label: 'Vale Refeição', icon: Ticket, color: 'bg-orange-500' },
  outro: { label: 'Outro', icon: Settings, color: 'bg-slate-500' },
};

export default function Pagamentos() {
  const [showModal, setShowModal] = useState(false);
  const [editingMetodo, setEditingMetodo] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    tipo: 'dinheiro',
    ativo: true,
    instrucoes: '',
  });

  const { data: metodos = [], refetch } = useQuery({
    queryKey: ['metodos-pagamento'],
    queryFn: () => base44.entities.MetodoPagamento.list('tipo', 50),
  });

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        restaurante_id: 'default',
      };

      if (editingMetodo) {
        await base44.entities.MetodoPagamento.update(editingMetodo.id, data);
      } else {
        await base44.entities.MetodoPagamento.create(data);
      }
      refetch();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleEdit = (metodo) => {
    setEditingMetodo(metodo);
    setForm({
      nome: metodo.nome || '',
      tipo: metodo.tipo || 'dinheiro',
      ativo: metodo.ativo !== false,
      instrucoes: metodo.instrucoes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este método de pagamento?')) {
      await base44.entities.MetodoPagamento.delete(id);
      refetch();
    }
  };

  const toggleAtivo = async (metodo) => {
    await base44.entities.MetodoPagamento.update(metodo.id, { ativo: !metodo.ativo });
    refetch();
  };

  const resetForm = () => {
    setEditingMetodo(null);
    setForm({
      nome: '',
      tipo: 'dinheiro',
      ativo: true,
      instrucoes: '',
    });
  };

  // Criar métodos padrão se não existir nenhum
  const criarMetodosPadrao = async () => {
    const padrao = [
      { nome: 'Dinheiro', tipo: 'dinheiro', ativo: true },
      { nome: 'PIX', tipo: 'pix', ativo: true },
      { nome: 'Cartão de Crédito', tipo: 'cartao_credito', ativo: true },
      { nome: 'Cartão de Débito', tipo: 'cartao_debito', ativo: true },
    ];

    for (const m of padrao) {
      await base44.entities.MetodoPagamento.create({ ...m, restaurante_id: 'default' });
    }
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Formas de Pagamento</h1>
          <p className="text-slate-400 mt-1">Configure os métodos aceitos no seu estabelecimento</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Método
        </Button>
      </div>

      {/* Lista de Métodos */}
      {metodos.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-12 text-center">
          <CreditCard className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">Nenhum método de pagamento configurado</p>
          <p className="text-sm text-slate-500 mb-6">Configure os métodos aceitos pelo seu estabelecimento</p>
          <Button 
            onClick={criarMetodosPadrao}
            className="bg-gradient-to-r from-blue-500 to-indigo-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Métodos Padrão
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metodos.map((metodo, index) => {
            const config = tipoConfig[metodo.tipo] || tipoConfig.outro;
            const Icon = config.icon;
            return (
              <motion.div
                key={metodo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-white/5 border-white/10 p-6 ${!metodo.ativo ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${config.color}/20 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{metodo.nome}</h3>
                        <Badge className={`${config.color}/20 ${config.color.replace('bg-', 'text-')} text-xs`}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                        <DropdownMenuItem onClick={() => handleEdit(metodo)} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleAtivo(metodo)} className="cursor-pointer">
                          {metodo.ativo ? (
                            <><X className="w-4 h-4 mr-2" /> Desativar</>
                          ) : (
                            <><Check className="w-4 h-4 mr-2" /> Ativar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(metodo.id)}
                          className="cursor-pointer text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {metodo.instrucoes && (
                    <p className="text-sm text-slate-400 mb-4">{metodo.instrucoes}</p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-sm text-slate-400">Status</span>
                    <Badge className={metodo.ativo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}>
                      {metodo.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-orange-500" />
              {editingMetodo ? 'Editar Método' : 'Novo Método de Pagamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Nome do Método</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ex: PIX Banco XYZ"
              />
            </div>

            <div>
              <Label className="text-slate-400">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(tipoConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-400">Instruções (opcional)</Label>
              <Textarea
                value={form.instrucoes}
                onChange={(e) => setForm({ ...form, instrucoes: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Instruções para o cliente ou entregador..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="text-white">Método ativo</span>
              </div>
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowModal(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!form.nome}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {editingMetodo ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}