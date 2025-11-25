import React from 'react';
import { motion } from 'framer-motion';
import { Bike, Car, Phone, MapPin, Package, Star, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusConfig = {
  disponivel: { label: 'Disponível', color: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' },
  em_entrega: { label: 'Em Entrega', color: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-500' },
  offline: { label: 'Offline', color: 'bg-slate-500/20 text-slate-400', dot: 'bg-slate-500' },
  pausado: { label: 'Pausado', color: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' },
};

const veiculoIcons = {
  moto: Bike,
  carro: Car,
  bicicleta: Bike,
  a_pe: Circle,
};

export default function EntregadorCard({ entregador, onAtribuir, entregas = 0 }) {
  const status = statusConfig[entregador.status] || statusConfig.offline;
  const VeiculoIcon = veiculoIcons[entregador.veiculo] || Bike;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 hover:bg-white/8 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            {entregador.foto_url ? (
              <img 
                src={entregador.foto_url} 
                alt={entregador.nome}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-white text-xl font-bold">{entregador.nome?.charAt(0)}</span>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${status.dot} border-2 border-slate-900`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{entregador.nome}</h3>
            <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <VeiculoIcon className="w-4 h-4" />
              <span className="capitalize">{entregador.veiculo}</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{entregador.total_entregas} entregas</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{entregador.avaliacao_media?.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Saldo</p>
          <p className="text-lg font-bold text-emerald-400">R$ {entregador.saldo_taxas?.toFixed(2) || '0.00'}</p>
        </div>
        
        {onAtribuir && entregador.status === 'disponivel' && (
          <Button 
            onClick={() => onAtribuir(entregador)}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            Atribuir Entrega
          </Button>
        )}
        
        <a 
          href={`tel:${entregador.telefone}`}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Phone className="w-5 h-5 text-white" />
        </a>
      </div>
    </motion.div>
  );
}