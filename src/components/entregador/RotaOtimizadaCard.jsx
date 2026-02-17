import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Route, Navigation, ExternalLink, Clock, MapPin, 
  ChevronDown, ChevronUp, X, RefreshCw, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function RotaOtimizadaCard({ rotaNotificacao, entregasAtivas, onDismiss }) {
  const [expandida, setExpandida] = useState(true);
  const [recalculando, setRecalculando] = useState(false);

  const dados = rotaNotificacao?.dados || {};
  const sequenciaIds = dados.sequencia_ids || [];
  const sequenciaNumeros = dados.sequencia_numeros || [];
  const distanciaKm = dados.distancia_km;
  const tempoMinutos = dados.tempo_minutos;
  const resumo = dados.resumo;

  // Ordenar entregas ativas conforme a sequência otimizada
  const entregasOrdenadas = sequenciaIds.length > 0
    ? sequenciaIds.map(id => entregasAtivas.find(e => e.id === id)).filter(Boolean)
    : entregasAtivas;

  const abrirRotaGoogleMaps = () => {
    if (entregasOrdenadas.length === 0) return;
    const waypoints = entregasOrdenadas
      .slice(0, -1)
      .map(e => encodeURIComponent(e.endereco_completo))
      .join('|');
    const destino = encodeURIComponent(entregasOrdenadas[entregasOrdenadas.length - 1].endereco_completo);
    const base = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`;
    const url = waypoints ? `${base}&waypoints=${waypoints}` : base;
    window.open(url, '_blank');
  };

  const abrirRotaWaze = () => {
    if (entregasOrdenadas.length === 0) return;
    const primeira = entregasOrdenadas[0];
    if (primeira.latitude_destino && primeira.longitude_destino) {
      window.open(`https://waze.com/ul?ll=${primeira.latitude_destino},${primeira.longitude_destino}&navigate=yes`, '_blank');
    } else {
      window.open(`https://waze.com/ul?q=${encodeURIComponent(primeira.endereco_completo)}&navigate=yes`, '_blank');
    }
  };

  const handleRecalcular = async (entregadorId) => {
    setRecalculando(true);
    try {
      await base44.functions.invoke('otimizarRotaEntregador', { entregador_id: entregadorId });
    } catch(e) {
      console.error(e);
    } finally {
      setRecalculando(false);
    }
  };

  if (entregasOrdenadas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="mb-5"
    >
      <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Route className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Rota Otimizada</p>
              <p className="text-xs text-blue-300">{entregasOrdenadas.length} parada{entregasOrdenadas.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats rápidos */}
            {distanciaKm && (
              <div className="hidden sm:flex items-center gap-3 mr-2">
                <div className="text-center">
                  <p className="text-white font-bold text-sm">{Number(distanciaKm).toFixed(1)} km</p>
                  <p className="text-blue-300 text-xs">distância</p>
                </div>
                {tempoMinutos && (
                  <div className="text-center border-l border-blue-500/30 pl-3">
                    <p className="text-white font-bold text-sm">{tempoMinutos} min</p>
                    <p className="text-blue-300 text-xs">estimado</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setExpandida(v => !v)} className="text-slate-400 hover:text-white p-1">
              {expandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onDismiss && (
              <button onClick={onDismiss} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {expandida && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Stats mobile */}
                {(distanciaKm || tempoMinutos) && (
                  <div className="sm:hidden flex gap-3 mb-1">
                    {distanciaKm && (
                      <div className="flex-1 text-center bg-blue-500/10 rounded-xl py-2">
                        <p className="text-white font-bold">{Number(distanciaKm).toFixed(1)} km</p>
                        <p className="text-blue-300 text-xs">distância</p>
                      </div>
                    )}
                    {tempoMinutos && (
                      <div className="flex-1 text-center bg-blue-500/10 rounded-xl py-2">
                        <p className="text-white font-bold">{tempoMinutos} min</p>
                        <p className="text-blue-300 text-xs">estimado</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Resumo da IA */}
                {resumo && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-200 leading-relaxed">💡 {resumo}</p>
                  </div>
                )}

                {/* Sequência de paradas */}
                <div className="space-y-2">
                  {entregasOrdenadas.map((entrega, index) => (
                    <div key={entrega.id} className="flex items-start gap-3">
                      {/* Linha vertical */}
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow">
                          {index + 1}
                        </div>
                        {index < entregasOrdenadas.length - 1 && (
                          <div className="w-0.5 h-4 bg-orange-500/30 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">#{entrega.numero_pedido}</span>
                          <Badge className={`text-xs ${
                            entrega.status === 'em_rota' ? 'bg-purple-500/20 text-purple-300' :
                            entrega.status === 'aceita' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {entrega.status === 'em_rota' ? 'Em rota' : entrega.status === 'aceita' ? 'Aceita' : 'Pendente'}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {entrega.bairro || entrega.endereco_completo}
                        </p>
                        <p className="text-slate-500 text-xs">{entrega.cliente_nome}</p>
                      </div>
                      <p className="text-emerald-400 font-bold text-sm flex-shrink-0">
                        R$ {entrega.valor_pedido?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Botões de navegação */}
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 h-11 bg-white hover:bg-gray-100 text-gray-900 font-semibold"
                    onClick={abrirRotaGoogleMaps}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Google Maps
                  </Button>
                  <Button
                    className="flex-1 h-11 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold"
                    onClick={abrirRotaWaze}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Waze
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}