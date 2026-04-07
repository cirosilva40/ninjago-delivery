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
import { Badge } from '@/components/ui/badge';
import { Bike, Car, Star, Package, Check, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const statusConfig = {
  disponivel: { label: 'Disponível', color: 'bg-emerald-500' },
  em_entrega: { label: 'Em Entrega', color: 'bg-blue-500' },
  offline: { label: 'Offline', color: 'bg-slate-500' },
  pausado: { label: 'Pausado', color: 'bg-yellow-500' },
};

export default function AtribuirEntregaModal({ open, onClose, pedido, pizzariaId, onAtribuir }) {
  const [entregadores, setEntregadores] = useState([]);
  const [selectedEntregador, setSelectedEntregador] = useState(null);
  const [taxaEntregador, setTaxaEntregador] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && pizzariaId) {
      loadEntregadores();
      // Pré-preencher com a taxa de entrega do pedido
      if (pedido?.taxa_entrega != null) {
        setTaxaEntregador(pedido.taxa_entrega);
      }
      setSelectedEntregador(null);
    }
  }, [open, pizzariaId, pedido?.id]);

  const loadEntregadores = async () => {
    try {
      const data = await base44.entities.Entregador.filter({ 
        pizzaria_id: pizzariaId,
        ativo: true 
      });
      setEntregadores(data);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
    }
  };

  const handleAtribuir = async () => {
    if (!selectedEntregador || !pedido) {
      toast.error('Selecione um entregador');
      return;
    }
    
    setLoading(true);
    try {
      // Criar a entrega
      const entrega = await base44.entities.Entrega.create({
        pizzaria_id: pizzariaId,
        pedido_id: pedido.id,
        entregador_id: selectedEntregador.id,
        numero_pedido: pedido.numero_pedido,
        cliente_nome: pedido.cliente_nome,
        cliente_telefone: pedido.cliente_telefone,
        endereco_completo: [
          pedido.cliente_endereco,
          pedido.cliente_numero,
          pedido.cliente_complemento,
          pedido.cliente_bairro,
          pedido.cliente_cidade,
          pedido.cliente_estado,
        ].filter(Boolean).join(', '),
        bairro: pedido.cliente_bairro,
        latitude_destino: pedido.latitude,
        longitude_destino: pedido.longitude,
        valor_pedido: pedido.valor_total,
        taxa_entregador: taxaEntregador,
        forma_pagamento: pedido.forma_pagamento,
        troco_para: pedido.troco_para,
        status: 'pendente',
        horario_atribuicao: new Date().toISOString(),
        itens_resumo: pedido.itens?.map(i => `${i.quantidade}x ${i.nome}`).join(', '),
      });

      // Atualizar status do pedido
      await base44.entities.Pedido.update(pedido.id, { status: 'em_entrega' });

      // Criar notificação para o entregador
      await base44.entities.Notificacao.create({
        pizzaria_id: pizzariaId,
        destinatario_id: selectedEntregador.id,
        tipo: 'nova_entrega',
        titulo: 'Nova Entrega!',
        mensagem: `Pedido #${pedido.numero_pedido} - ${pedido.cliente_endereco}`,
        dados: { entrega_id: entrega.id, pedido_id: pedido.id },
      });

      toast.success('Entrega atribuída!', {
        description: `${selectedEntregador.nome} foi notificado.`,
      });

      onAtribuir && onAtribuir();
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir entrega:', error);
      toast.error('Erro ao atribuir entrega', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const disponíveis = entregadores.filter(e => e.status === 'disponivel');
  const emEntrega = entregadores.filter(e => e.status === 'em_entrega');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" />
            Atribuir Entrega - #{pedido?.numero_pedido}
          </DialogTitle>
        </DialogHeader>

        {pedido && (
          <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-400 mt-1" />
              <div>
                <p className="font-medium text-white">{pedido.cliente_nome}</p>
                <p className="text-sm text-slate-400">{pedido.cliente_endereco}</p>
                {pedido.cliente_bairro && (
                  <p className="text-sm text-slate-500">{pedido.cliente_bairro}</p>
                )}
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-emerald-400">R$ {pedido.valor_total?.toFixed(2)}</p>
                <p className="text-sm text-slate-400">{pedido.forma_pagamento}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-slate-400 mb-2 block">Taxa do Entregador (R$)</Label>
            <Input
              type="number"
              step="0.50"
              value={taxaEntregador}
              onChange={(e) => setTaxaEntregador(parseFloat(e.target.value) || 0)}
              className="bg-slate-800 border-slate-700 text-white w-32"
            />
          </div>

          <div>
            <Label className="text-slate-400 mb-3 block">
              Selecione o Entregador ({disponíveis.length} disponíveis)
            </Label>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              <AnimatePresence>
                {disponíveis.length === 0 && emEntrega.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Bike className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum entregador cadastrado</p>
                  </div>
                ) : (
                  <>
                    {disponíveis.map((entregador) => (
                      <motion.div
                        key={entregador.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedEntregador(entregador)}
                        className={`
                          p-4 rounded-xl border cursor-pointer transition-all
                          ${selectedEntregador?.id === entregador.id 
                            ? 'bg-orange-500/20 border-orange-500' 
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                              <span className="text-white font-bold">{entregador.nome?.charAt(0)}</span>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${statusConfig[entregador.status]?.color} border-2 border-slate-900`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{entregador.nome}</span>
                              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Disponível</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                {entregador.veiculo === 'moto' ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                                {entregador.veiculo}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {entregador.avaliacao_media?.toFixed(1)}
                              </span>
                              <span>{entregador.total_entregas} entregas</span>
                            </div>
                          </div>
                          
                          {selectedEntregador?.id === entregador.id && (
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {emEntrega.length > 0 && (
                      <>
                        <p className="text-sm text-slate-500 mt-4 mb-2">Em entrega (ocupados):</p>
                        {emEntrega.map((entregador) => (
                          <div
                            key={entregador.id}
                            className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 opacity-60"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white font-bold">{entregador.nome?.charAt(0)}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-white">{entregador.nome}</span>
                                <Badge className="ml-2 bg-blue-500/20 text-blue-400 text-xs">Em Entrega</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 mt-6">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">
            Cancelar
          </Button>
          <Button 
            onClick={handleAtribuir}
            disabled={!selectedEntregador || loading}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            {loading ? 'Atribuindo...' : 'Atribuir Entrega'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}