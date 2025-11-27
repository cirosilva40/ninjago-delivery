import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft,
  Package,
  Bike,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import moment from 'moment';

export default function EntregasHoje() {
  const { data: entregas = [] } = useQuery({
    queryKey: ['entregas-hoje'],
    queryFn: async () => {
      const all = await base44.entities.Entrega.list('-created_date', 200);
      return all.filter(e => 
        e.status === 'entregue' && 
        moment(e.horario_entrega || e.created_date).isSameOrAfter(moment().startOf('day'))
      );
    },
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ['entregadores-lista'],
    queryFn: () => base44.entities.Entregador.list(),
  });

  const getEntregador = (id) => entregadores.find(e => e.id === id);

  // Agrupar por entregador
  const entregasPorEntregador = entregas.reduce((acc, e) => {
    const entregadorId = e.entregador_id || 'sem_entregador';
    if (!acc[entregadorId]) acc[entregadorId] = [];
    acc[entregadorId].push(e);
    return acc;
  }, {});

  const totalFaturamento = entregas.reduce((acc, e) => acc + (e.valor_pedido || 0), 0);
  const totalTaxas = entregas.reduce((acc, e) => acc + (e.taxa_entregador || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Entregas de Hoje</h1>
          <p className="text-slate-400">{moment().format('dddd, D [de] MMMM')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 p-4 text-center">
          <Package className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{entregas.length}</p>
          <p className="text-xs text-slate-400">Entregas</p>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4 text-center">
          <Bike className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{Object.keys(entregasPorEntregador).length}</p>
          <p className="text-xs text-slate-400">Entregadores</p>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4 text-center">
          <DollarSign className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">R$ {totalFaturamento.toFixed(2)}</p>
          <p className="text-xs text-slate-400">Faturamento</p>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4 text-center">
          <DollarSign className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-400">R$ {totalTaxas.toFixed(2)}</p>
          <p className="text-xs text-slate-400">Taxas Pagas</p>
        </Card>
      </div>

      {/* Lista por Entregador */}
      <div className="space-y-6">
        {Object.entries(entregasPorEntregador).map(([entregadorId, entregasDoEntregador]) => {
          const entregador = getEntregador(entregadorId);
          const totalEntregador = entregasDoEntregador.reduce((acc, e) => acc + (e.taxa_entregador || 0), 0);

          return (
            <div key={entregadorId}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold">{entregador?.nome?.charAt(0) || '?'}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{entregador?.nome || 'Entregador Desconhecido'}</h3>
                  <p className="text-sm text-slate-400">{entregasDoEntregador.length} entregas • R$ {totalEntregador.toFixed(2)} em taxas</p>
                </div>
              </div>

              <div className="space-y-2 ml-13">
                {entregasDoEntregador.map((entrega) => (
                  <Card key={entrega.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">#{entrega.numero_pedido}</p>
                          <p className="text-sm text-slate-400">{entrega.cliente_nome}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {moment(entrega.horario_entrega).format('HH:mm')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {entrega.bairro}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">R$ {entrega.valor_pedido?.toFixed(2)}</p>
                        <p className="text-sm text-emerald-400">+R$ {entrega.taxa_entregador?.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {entregas.length === 0 && (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nenhuma entrega realizada hoje</p>
          </Card>
        )}
      </div>
    </div>
  );
}