import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, User, Package, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import moment from 'moment';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  aceita: { label: 'Aceita', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  em_rota: { label: 'Em Rota', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  entregue: { label: 'Entregue', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  recusada: { label: 'Recusada', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelada: { label: 'Cancelada', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export default function EntregaCard({ entrega, entregador, onClick, compact = false }) {
  const status = statusConfig[entrega.status] || statusConfig.pendente;
  
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onClick}
        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">#{entrega.numero_pedido}</span>
            <Badge className={`${status.color} border text-xs`}>{status.label}</Badge>
          </div>
          <p className="text-sm text-slate-400 truncate">{entrega.cliente_nome}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-emerald-400">R$ {entrega.valor_pedido?.toFixed(2)}</p>
          <p className="text-xs text-slate-500">{moment(entrega.created_date).fromNow()}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">#{entrega.numero_pedido}</span>
              <Badge className={`${status.color} border`}>{status.label}</Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1">{entrega.itens_resumo || 'Pedido'}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">R$ {entrega.valor_pedido?.toFixed(2)}</p>
            <p className="text-xs text-slate-500">Taxa: R$ {entrega.taxa_entregador?.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-slate-500 mt-1" />
            <div>
              <p className="text-white font-medium">{entrega.cliente_nome}</p>
              <p className="text-sm text-slate-400">{entrega.cliente_telefone}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-slate-500 mt-1" />
            <div>
              <p className="text-white">{entrega.endereco_completo}</p>
              {entrega.bairro && <p className="text-sm text-slate-400">{entrega.bairro}</p>}
            </div>
          </div>

          {entrega.horario_atribuicao && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-400">
                Atribuído {moment(entrega.horario_atribuicao).fromNow()}
              </p>
            </div>
          )}
        </div>

        {entregador && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{entregador.nome?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{entregador.nome}</p>
              <p className="text-xs text-slate-400">{entregador.veiculo}</p>
            </div>
          </div>
        )}
      </div>

      {onClick && (
        <div className="px-5 py-3 bg-white/5 border-t border-white/10">
          <Button 
            onClick={onClick}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 font-bold shadow-lg"
            style={{ color: '#1a1a1a' }}
          >
            Ver Detalhes
          </Button>
        </div>
      )}
    </motion.div>
  );
}