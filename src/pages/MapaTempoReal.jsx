import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Bike,
  Package,
  Phone,
  Navigation,
  Clock,
  RefreshCw,
  Maximize2,
  List,
  Map as MapIcon,
  Circle,
  ExternalLink,
  Route,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import moment from 'moment';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const bikeIcon = L.divIcon({
  className: 'bike-marker',
  html: `<div style="background: linear-gradient(135deg, #10b981, #059669); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  html: `<div style="background: linear-gradient(135deg, #f97316, #ef4444); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 15px rgba(249,115,22,0.4);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const pizzariaIcon = L.divIcon({
  className: 'pizzaria-marker',
  html: `<div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 15px rgba(139,92,246,0.4);">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <circle cx="8" cy="12" r="1.5"/><circle cx="12" cy="8" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="12" cy="16" r="1.5"/>
    </svg>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Auto-center map component
function AutoCenter({ positions }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  
  return null;
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500' },
  aceita: { label: 'Aceita', color: 'bg-blue-500' },
  em_rota: { label: 'Em Rota', color: 'bg-purple-500' },
  entregue: { label: 'Entregue', color: 'bg-emerald-500' },
};

export default function MapaTempoReal() {
  const [viewMode, setViewMode] = useState('map');
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [gerandoRota, setGerandoRota] = useState(false);
  const [rotaOtimizada, setRotaOtimizada] = useState(null);

  // Coordenadas padrão (São Paulo)
  const defaultCenter = [-23.5505, -46.6333];

  const { data: entregas = [], refetch } = useQuery({
    queryKey: ['entregas-mapa'],
    queryFn: () => base44.entities.Entrega.filter({
      status: { $in: ['pendente', 'aceita', 'em_rota'] }
    }, '-created_date', 50),
    refetchInterval: 5000,
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ['entregadores-mapa'],
    queryFn: () => base44.entities.Entregador.filter({
      status: { $in: ['disponivel', 'em_entrega'] }
    }),
    refetchInterval: 5000,
  });

  // Collect all positions for auto-centering
  const allPositions = [
    ...entregadores.filter(e => e.latitude && e.longitude).map(e => [e.latitude, e.longitude]),
    ...entregas.filter(e => e.latitude_destino && e.longitude_destino).map(e => [e.latitude_destino, e.longitude_destino]),
    defaultCenter,
  ];

  const openGoogleMaps = (lat, lng, address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openWaze = (lat, lng) => {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  // Buscar pedidos prontos para gerar rota
  const { data: pedidosProntos = [] } = useQuery({
    queryKey: ['pedidos-prontos-rota'],
    queryFn: () => base44.entities.Pedido.filter({ status: 'pronto' }, '-created_date', 50),
    refetchInterval: 10000,
  });

  // Gerar melhor rota
  const gerarMelhorRota = async () => {
    if (pedidosProntos.length === 0) return;
    
    setGerandoRota(true);
    try {
      // Ordenar por bairro/região para agrupar entregas próximas
      const pedidosOrdenados = [...pedidosProntos].sort((a, b) => {
        const bairroA = a.cliente_bairro || '';
        const bairroB = b.cliente_bairro || '';
        return bairroA.localeCompare(bairroB);
      });

      // Calcular distância estimada e tempo
      const distanciaEstimada = pedidosOrdenados.length * 2.5; // Média 2.5km por entrega
      const tempoEstimado = pedidosOrdenados.length * 8; // Média 8 min por entrega

      setRotaOtimizada({
        pedidos: pedidosOrdenados,
        distanciaTotal: distanciaEstimada,
        tempoEstimado: tempoEstimado,
      });
    } catch (error) {
      console.error('Erro ao gerar rota:', error);
    } finally {
      setGerandoRota(false);
    }
  };

  // Abrir rota completa no Google Maps
  const abrirRotaGoogleMaps = () => {
    if (!rotaOtimizada || rotaOtimizada.pedidos.length === 0) return;

    const waypoints = rotaOtimizada.pedidos
      .map(p => encodeURIComponent(p.cliente_endereco + ', ' + p.cliente_cidade))
      .join('|');
    
    const destino = encodeURIComponent(
      rotaOtimizada.pedidos[rotaOtimizada.pedidos.length - 1].cliente_endereco
    );

    const url = `https://www.google.com/maps/dir/?api=1&origin=Sua+Localização&destination=${destino}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mapa ao Vivo</h1>
          <p className="text-slate-400 mt-1">
            {entregadores.filter(e => e.status === 'em_entrega').length} entregadores em rota • {entregas.length} entregas ativas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={gerarMelhorRota}
            disabled={pedidosProntos.length === 0 || gerandoRota}
            className="bg-gradient-to-r from-emerald-500 to-green-600"
          >
            <Route className="w-4 h-4 mr-2" />
            {gerandoRota ? 'Gerando...' : `Gerar Rota (${pedidosProntos.length} prontos)`}
          </Button>
          <div className="flex rounded-lg bg-white/5 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-white/10 text-white' : 'text-slate-400'}
            >
              <MapIcon className="w-4 h-4 mr-1" />
              Mapa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400'}
            >
              <List className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            className="border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Card de Rota Otimizada */}
      {rotaOtimizada && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Route className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Rota Otimizada</h3>
                <p className="text-sm text-slate-400">{rotaOtimizada.pedidos.length} paradas</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-white">{rotaOtimizada.distanciaTotal.toFixed(1)} km</p>
                <p className="text-xs text-slate-400">Distância</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{rotaOtimizada.tempoEstimado} min</p>
                <p className="text-xs text-slate-400">Tempo Est.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {rotaOtimizada.pedidos.map((pedido, index) => (
              <div key={pedido.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">#{pedido.numero_pedido} - {pedido.cliente_nome}</p>
                  <p className="text-xs text-slate-400">{pedido.cliente_bairro}</p>
                </div>
                <p className="text-sm font-bold text-emerald-400">R$ {pedido.valor_total?.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={abrirRotaGoogleMaps}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Rota no Maps
            </Button>
            <Button
              variant="outline"
              onClick={() => setRotaOtimizada(null)}
              className="border-slate-600 text-slate-300"
            >
              Fechar
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className={`${viewMode === 'map' ? 'lg:col-span-2' : 'hidden lg:block lg:col-span-2'}`}>
          <Card className="overflow-hidden rounded-2xl bg-white/5 border-white/10 h-[600px]">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="rounded-2xl"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              
              {allPositions.length > 1 && <AutoCenter positions={allPositions} />}

              {/* Pizzaria Marker */}
              <Marker position={defaultCenter} icon={pizzariaIcon}>
                <Popup>
                  <div className="p-2">
                    <p className="font-bold">🍕 Pizzaria</p>
                    <p className="text-sm text-gray-600">Ponto de origem</p>
                  </div>
                </Popup>
              </Marker>

              {/* Entregadores Markers */}
              {entregadores.filter(e => e.latitude && e.longitude).map((entregador) => (
                <Marker
                  key={entregador.id}
                  position={[entregador.latitude, entregador.longitude]}
                  icon={bikeIcon}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <p className="font-bold text-lg">{entregador.nome}</p>
                      <p className="text-sm text-gray-600">{entregador.veiculo}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusConfig[entregador.status]?.color || 'bg-gray-400'}`} />
                        <span className="text-sm capitalize">{entregador.status?.replace('_', ' ')}</span>
                      </div>
                      <a 
                        href={`tel:${entregador.telefone}`}
                        className="mt-2 block text-blue-600 text-sm"
                      >
                        📞 {entregador.telefone}
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Entregas Markers */}
              {entregas.filter(e => e.latitude_destino && e.longitude_destino).map((entrega) => (
                <Marker
                  key={entrega.id}
                  position={[entrega.latitude_destino, entrega.longitude_destino]}
                  icon={destinationIcon}
                >
                  <Popup>
                    <div className="p-2 min-w-[220px]">
                      <p className="font-bold">Pedido #{entrega.numero_pedido}</p>
                      <p className="text-sm">{entrega.cliente_nome}</p>
                      <p className="text-sm text-gray-600">{entrega.endereco_completo}</p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        R$ {entrega.valor_pedido?.toFixed(2)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => openGoogleMaps(entrega.latitude_destino, entrega.longitude_destino, entrega.endereco_completo)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                        >
                          Google Maps
                        </button>
                        <button 
                          onClick={() => openWaze(entrega.latitude_destino, entrega.longitude_destino)}
                          className="text-xs bg-cyan-500 text-white px-2 py-1 rounded"
                        >
                          Waze
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Card>
        </div>

        {/* Entregas List */}
        <div className={viewMode === 'list' ? 'lg:col-span-3' : ''}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Entregas Ativas
            </h3>

            {entregas.length === 0 ? (
              <Card className="rounded-xl bg-white/5 border-white/10 p-8 text-center">
                <MapPin className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Nenhuma entrega em andamento</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {entregas.map((entrega) => {
                    const status = statusConfig[entrega.status] || statusConfig.pendente;
                    const entregador = entregadores.find(e => e.id === entrega.entregador_id);
                    
                    return (
                      <motion.div
                        key={entrega.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/8 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">#{entrega.numero_pedido}</span>
                              <Badge className={`${status.color}/20 text-white text-xs`}>
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{entrega.cliente_nome}</p>
                          </div>
                          <p className="text-xl font-bold text-emerald-400">
                            R$ {entrega.valor_pedido?.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-slate-400 mb-3">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{entrega.endereco_completo}</span>
                        </div>

                        {entregador && (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                              <Bike className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{entregador.nome}</p>
                              <p className="text-xs text-slate-400">{entregador.telefone}</p>
                            </div>
                            <a 
                              href={`tel:${entregador.telefone}`}
                              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Phone className="w-4 h-4 text-white" />
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-slate-700 text-slate-300"
                            onClick={() => openGoogleMaps(
                              entrega.latitude_destino || -23.5505,
                              entrega.longitude_destino || -46.6333,
                              entrega.endereco_completo
                            )}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Google Maps
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-slate-700 text-slate-300"
                            onClick={() => openWaze(
                              entrega.latitude_destino || -23.5505,
                              entrega.longitude_destino || -46.6333
                            )}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Waze
                          </Button>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {moment(entrega.horario_atribuicao).fromNow()}
                          </span>
                          <span>{entrega.forma_pagamento}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Entregadores Section */}
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mt-8">
              <Bike className="w-5 h-5 text-emerald-500" />
              Entregadores Online
            </h3>

            {entregadores.length === 0 ? (
              <Card className="rounded-xl bg-white/5 border-white/10 p-6 text-center">
                <Bike className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">Nenhum entregador online</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {entregadores.map((entregador) => {
                  const status = statusConfig[entregador.status] || { label: 'Offline', color: 'bg-slate-500' };
                  return (
                    <div
                      key={entregador.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold">{entregador.nome?.charAt(0)}</span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.color} border-2 border-slate-900`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{entregador.nome}</p>
                        <p className="text-xs text-slate-400 capitalize">{entregador.status?.replace('_', ' ')}</p>
                      </div>
                      <a 
                        href={`tel:${entregador.telefone}`}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                      >
                        <Phone className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}