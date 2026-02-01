import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Bike,
  Package,
  Phone,
  Navigation,
  Clock,
  RefreshCw,
  List,
  Map as MapIcon,
  ExternalLink,
  Route,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import moment from 'moment';
import { toast } from 'sonner';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  styles: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#746855" }]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#d59563" }]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#d59563" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "color": "#263c3f" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#6b9a76" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#38414e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#212a37" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9ca5b3" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{ "color": "#746855" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#1f2835" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#f3d19c" }]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [{ "color": "#2f3948" }]
    },
    {
      "featureType": "transit.station",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#d59563" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#17263c" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#515c6d" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#17263c" }]
    }
  ]
};

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500' },
  aceita: { label: 'Aceita', color: 'bg-blue-500' },
  em_rota: { label: 'Em Rota', color: 'bg-purple-500' },
  entregue: { label: 'Entregue', color: 'bg-emerald-500' },
};

export default function MapaTempoReal() {
  const [viewMode, setViewMode] = useState('map');
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [selectedEntregador, setSelectedEntregador] = useState(null);
  const [selectedPizzaria, setSelectedPizzaria] = useState(false);
  const [gerandoRota, setGerandoRota] = useState(false);
  const [rotaOtimizada, setRotaOtimizada] = useState(null);
  const [showAtribuirRotaModal, setShowAtribuirRotaModal] = useState(false);
  const [atribuindoRota, setAtribuindoRota] = useState(false);
  const [selectedEntregadorId, setSelectedEntregadorId] = useState(null);
  const [map, setMap] = useState(null);
  const [horarioInicio, setHorarioInicio] = useState(() => {
    const now = moment();
    return now.format('HH:mm');
  });

  // Buscar configurações da pizzaria para pegar coordenadas
  const { data: pizzarias = [], refetch: refetchPizzaria } = useQuery({
    queryKey: ['pizzaria-config-mapa'],
    queryFn: () => base44.entities.Pizzaria.list('-created_date', 1),
    refetchInterval: 10000,
  });

  const pizzaria = pizzarias[0];
  const defaultCenter = {
    lat: pizzaria?.latitude || -23.5505,
    lng: pizzaria?.longitude || -46.6333
  };

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

  const { data: pedidosProntos = [] } = useQuery({
    queryKey: ['pedidos-prontos-rota'],
    queryFn: () => base44.entities.Pedido.filter({ status: 'pronto' }, '-created_date', 50),
    refetchInterval: 10000,
  });

  // Auto-fit bounds quando houver mudanças
  useEffect(() => {
    if (map && entregadores.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add pizzaria
      if (pizzaria?.latitude && pizzaria?.longitude) {
        bounds.extend({ lat: pizzaria.latitude, lng: pizzaria.longitude });
      }
      
      // Add entregadores
      entregadores.forEach(e => {
        if (e.latitude && e.longitude) {
          bounds.extend({ lat: e.latitude, lng: e.longitude });
        }
      });
      
      // Add entregas
      entregas.forEach(e => {
        if (e.latitude_destino && e.longitude_destino) {
          bounds.extend({ lat: e.latitude_destino, lng: e.longitude_destino });
        }
      });
      
      if (!bounds.isEmpty() && !selectedEntregadorId) {
        map.fitBounds(bounds, 50);
      }
    }
  }, [map, entregadores, entregas, pizzaria, selectedEntregadorId]);

  // Centralizar em entregador selecionado
  useEffect(() => {
    if (map && selectedEntregadorId) {
      const entregador = entregadores.find(e => e.id === selectedEntregadorId);
      if (entregador?.latitude && entregador?.longitude) {
        map.panTo({ lat: entregador.latitude, lng: entregador.longitude });
        map.setZoom(16);
      }
    }
  }, [selectedEntregadorId, map, entregadores]);

  const openGoogleMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openWaze = (lat, lng) => {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  const gerarMelhorRota = async () => {
    if (pedidosProntos.length === 0) return;
    
    setGerandoRota(true);
    try {
      const enderecos = pedidosProntos.map(p => ({
        id: p.id,
        numero_pedido: p.numero_pedido,
        endereco: `${p.cliente_endereco}, ${p.cliente_numero} - ${p.cliente_bairro}, ${p.cliente_cidade}`,
        cliente_nome: p.cliente_nome,
        valor_total: p.valor_total,
      }));

      const prompt = `
Você é um especialista em otimização de rotas de entrega.

Tenho ${enderecos.length} entregas para fazer, começando de ${pizzaria?.endereco || 'estabelecimento'} em ${pizzaria?.cidade || ''}.

Lista de entregas:
${enderecos.map((e, i) => `${i + 1}. Pedido #${e.numero_pedido} - ${e.cliente_nome} em ${e.endereco}`).join('\n')}

Horário de início preferencial: ${horarioInicio}

Por favor:
1. Calcule a rota mais eficiente considerando o trânsito atual
2. Ordene as entregas na sequência ótima
3. Estime distância total e tempo total considerando trânsito
4. Considere que cada parada leva aproximadamente 3-5 minutos

Retorne a rota otimizada com as seguintes informações.
`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sequencia_pedidos: {
              type: "array",
              items: { type: "string" },
              description: "Array com números dos pedidos na ordem otimizada"
            },
            distancia_total_km: {
              type: "number",
              description: "Distância total em km"
            },
            tempo_estimado_minutos: {
              type: "number",
              description: "Tempo total estimado em minutos incluindo trânsito"
            },
            observacoes: {
              type: "string",
              description: "Observações sobre a rota (trânsito, melhores horários, etc)"
            }
          }
        }
      });

      const pedidosOrdenados = resultado.sequencia_pedidos.map(numeroPedido => 
        pedidosProntos.find(p => p.numero_pedido === numeroPedido)
      ).filter(Boolean);

      const pedidosNaoIncluidos = pedidosProntos.filter(p => 
        !resultado.sequencia_pedidos.includes(p.numero_pedido)
      );
      const pedidosFinais = [...pedidosOrdenados, ...pedidosNaoIncluidos];

      setRotaOtimizada({
        pedidos: pedidosFinais,
        distanciaTotal: resultado.distancia_total_km || pedidosFinais.length * 2.5,
        tempoEstimado: resultado.tempo_estimado_minutos || pedidosFinais.length * 8,
        observacoes: resultado.observacoes,
        horarioInicio: horarioInicio,
      });

      toast.success('Rota otimizada gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar rota:', error);
      toast.error('Erro ao gerar rota otimizada');
      
      const pedidosOrdenados = [...pedidosProntos].sort((a, b) => {
        const bairroA = a.cliente_bairro || '';
        const bairroB = b.cliente_bairro || '';
        return bairroA.localeCompare(bairroB);
      });

      setRotaOtimizada({
        pedidos: pedidosOrdenados,
        distanciaTotal: pedidosOrdenados.length * 2.5,
        tempoEstimado: pedidosOrdenados.length * 8,
        observacoes: 'Rota básica por bairro (sem otimização de trânsito)',
        horarioInicio: horarioInicio,
      });
    } finally {
      setGerandoRota(false);
    }
  };

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

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6 bg-red-500/10 border-red-500/30">
          <p className="text-red-400">Configure a chave da API do Google Maps nas variáveis de ambiente</p>
        </Card>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
            <Clock className="w-4 h-4 text-slate-400" />
            <Input
              type="time"
              value={horarioInicio}
              onChange={(e) => setHorarioInicio(e.target.value)}
              className="w-28 h-8 bg-slate-800/50 border-slate-600 text-white text-sm"
              title="Horário de início preferencial"
            />
          </div>
          <Button
            onClick={gerarMelhorRota}
            disabled={pedidosProntos.length === 0 || gerandoRota}
            className="bg-gradient-to-r from-emerald-500 to-green-600"
          >
            <Route className="w-4 h-4 mr-2" />
            {gerandoRota ? 'Gerando...' : `Gerar Rota Otimizada (${pedidosProntos.length})`}
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
                <p className="text-sm text-slate-400">{rotaOtimizada.pedidos.length} paradas • Início: {rotaOtimizada.horarioInicio}</p>
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
              <div>
                <p className="text-xl font-bold text-white">{moment(rotaOtimizada.horarioInicio, 'HH:mm').add(rotaOtimizada.tempoEstimado, 'minutes').format('HH:mm')}</p>
                <p className="text-xs text-slate-400">Chegada</p>
              </div>
            </div>
          </div>
          
          {rotaOtimizada.observacoes && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-300">💡 {rotaOtimizada.observacoes}</p>
            </div>
          )}
          
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
              onClick={() => setShowAtribuirRotaModal(true)}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
            >
              <Bike className="w-4 h-4 mr-2" />
              Atribuir ao Motoboy
            </Button>
            <Button
              onClick={abrirRotaGoogleMaps}
              variant="outline"
              className="border-blue-500/50 text-blue-400"
            >
              <Play className="w-4 h-4 mr-2" />
              Abrir Maps
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
        {/* Google Map */}
        <div className={`${viewMode === 'map' ? 'lg:col-span-2' : 'hidden lg:block lg:col-span-2'}`}>
          <Card className="overflow-hidden rounded-2xl bg-white/5 border-white/10 h-[600px]">
            <LoadScript googleMapsApiKey={apiKey}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={13}
                options={mapOptions}
                onLoad={setMap}
              >
                {/* Pizzaria Marker */}
                {pizzaria?.latitude && pizzaria?.longitude && (
                  <Marker
                    position={{ lat: pizzaria.latitude, lng: pizzaria.longitude }}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                              <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
                            </linearGradient>
                          </defs>
                          <rect width="44" height="44" rx="12" fill="url(#grad1)" stroke="white" stroke-width="3"/>
                          <circle cx="14" cy="22" r="2" fill="white"/>
                          <circle cx="22" cy="14" r="2" fill="white"/>
                          <circle cx="30" cy="22" r="2" fill="white"/>
                          <circle cx="22" cy="30" r="2" fill="white"/>
                        </svg>
                      `),
                      scaledSize: new window.google.maps.Size(44, 44),
                      anchor: new window.google.maps.Point(22, 22),
                    }}
                    onClick={() => setSelectedPizzaria(true)}
                  />
                )}
                
                {selectedPizzaria && (
                  <InfoWindow
                    position={{ lat: pizzaria.latitude, lng: pizzaria.longitude }}
                    onCloseClick={() => setSelectedPizzaria(false)}
                  >
                    <div className="p-2">
                      <p className="font-bold">🚀 {pizzaria?.nome || 'NinjaGO Delivery'}</p>
                      <p className="text-sm text-gray-600">Ponto de origem</p>
                      {pizzaria?.endereco && (
                        <p className="text-xs text-gray-500">{pizzaria.endereco}</p>
                      )}
                    </div>
                  </InfoWindow>
                )}

                {/* Entregadores Markers */}
                {entregadores.filter(e => e.latitude && e.longitude).map((entregador) => {
                  const isSelected = selectedEntregadorId === entregador.id;
                  return (
                    <React.Fragment key={entregador.id}>
                      <Marker
                        position={{ lat: entregador.latitude, lng: entregador.longitude }}
                        icon={{
                          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="${isSelected ? '50' : '40'}" height="${isSelected ? '50' : '40'}" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <linearGradient id="grad-bike-${entregador.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style="stop-color:${isSelected ? '#f97316' : '#10b981'};stop-opacity:1" />
                                  <stop offset="100%" style="stop-color:${isSelected ? '#ef4444' : '#059669'};stop-opacity:1" />
                                </linearGradient>
                              </defs>
                              <circle cx="${isSelected ? '25' : '20'}" cy="${isSelected ? '25' : '20'}" r="${isSelected ? '22' : '17'}" fill="url(#grad-bike-${entregador.id})" stroke="white" stroke-width="${isSelected ? '4' : '3'}"/>
                              <path d="M${isSelected ? '13' : '10'} ${isSelected ? '30' : '25'} Q${isSelected ? '25' : '20'} ${isSelected ? '20' : '17'} ${isSelected ? '37' : '30'} ${isSelected ? '30' : '25'}" stroke="white" stroke-width="2.5" fill="none"/>
                              <circle cx="${isSelected ? '37' : '30'}" cy="${isSelected ? '30' : '25'}" r="3.5" stroke="white" stroke-width="2" fill="none"/>
                              <circle cx="${isSelected ? '13' : '10'}" cy="${isSelected ? '30' : '25'}" r="3.5" stroke="white" stroke-width="2" fill="none"/>
                            </svg>
                          `),
                          scaledSize: new window.google.maps.Size(isSelected ? 50 : 40, isSelected ? 50 : 40),
                          anchor: new window.google.maps.Point(isSelected ? 25 : 20, isSelected ? 25 : 20),
                        }}
                        onClick={() => setSelectedEntregador(entregador)}
                      />
                      {selectedEntregador?.id === entregador.id && (
                        <InfoWindow
                          position={{ lat: entregador.latitude, lng: entregador.longitude }}
                          onCloseClick={() => setSelectedEntregador(null)}
                        >
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
                        </InfoWindow>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Entregas Markers */}
                {entregas.filter(e => e.latitude_destino && e.longitude_destino).map((entrega) => (
                  <React.Fragment key={entrega.id}>
                    <Marker
                      position={{ lat: entrega.latitude_destino, lng: entrega.longitude_destino }}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg width="36" height="46" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="grad-dest" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
                              </linearGradient>
                            </defs>
                            <path d="M18 2c-7 0-13 5.5-13 12.5 0 8 13 29.5 13 29.5s13-21.5 13-29.5c0-7-6-12.5-13-12.5z" fill="url(#grad-dest)" stroke="white" stroke-width="3"/>
                            <circle cx="18" cy="14" r="4" fill="white"/>
                          </svg>
                        `),
                        scaledSize: new window.google.maps.Size(36, 46),
                        anchor: new window.google.maps.Point(18, 46),
                      }}
                      onClick={() => setSelectedEntrega(entrega)}
                    />
                    {selectedEntrega?.id === entrega.id && (
                      <InfoWindow
                        position={{ lat: entrega.latitude_destino, lng: entrega.longitude_destino }}
                        onCloseClick={() => setSelectedEntrega(null)}
                      >
                        <div className="p-2 min-w-[220px]">
                          <p className="font-bold">Pedido #{entrega.numero_pedido}</p>
                          <p className="text-sm">{entrega.cliente_nome}</p>
                          <p className="text-sm text-gray-600">{entrega.endereco_completo}</p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            R$ {entrega.valor_pedido?.toFixed(2)}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button 
                              onClick={() => openGoogleMaps(entrega.latitude_destino, entrega.longitude_destino)}
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
                      </InfoWindow>
                    )}
                  </React.Fragment>
                ))}
              </GoogleMap>
            </LoadScript>
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
                              entrega.longitude_destino || -46.6333
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
                  const isSelected = selectedEntregadorId === entregador.id;
                  
                  return (
                    <div
                      key={entregador.id}
                      onClick={() => {
                        if (entregador.latitude && entregador.longitude) {
                          setSelectedEntregadorId(isSelected ? null : entregador.id);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-orange-500/20 border-orange-500/50 shadow-lg' 
                          : 'bg-white/5 border-white/10 hover:bg-white/8'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSelected 
                            ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          <span className="text-white font-bold">{entregador.nome?.charAt(0)}</span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.color} border-2 border-slate-900`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{entregador.nome}</p>
                        <p className="text-xs text-slate-400 capitalize">{entregador.status?.replace('_', ' ')}</p>
                      </div>
                      {isSelected && entregador.latitude && entregador.longitude && (
                        <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          No mapa
                        </Badge>
                      )}
                      <a 
                        href={`tel:${entregador.telefone}`}
                        onClick={(e) => e.stopPropagation()}
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

      {/* Modal Atribuir Rota ao Motoboy */}
      <Dialog open={showAtribuirRotaModal} onOpenChange={setShowAtribuirRotaModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Bike className="w-6 h-6 text-orange-500" />
              Atribuir Rota ao Motoboy
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Total de entregas:</span>
                <span className="text-white font-bold">{rotaOtimizada?.pedidos?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Distância estimada:</span>
                <span className="text-white font-bold">{rotaOtimizada?.distanciaTotal?.toFixed(1)} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tempo estimado:</span>
                <span className="text-white font-bold">{rotaOtimizada?.tempoEstimado} min</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Selecione o Motoboy:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {entregadores.filter(e => e.status === 'disponivel').length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <Bike className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhum motoboy disponível</p>
                  </div>
                ) : (
                  entregadores.filter(e => e.status === 'disponivel').map((motoboy) => (
                    <button
                      key={motoboy.id}
                      onClick={async () => {
                        setAtribuindoRota(true);
                        try {
                          for (const pedido of rotaOtimizada.pedidos) {
                            await base44.entities.Entrega.create({
                              pizzaria_id: pizzaria?.id || 'default',
                              pedido_id: pedido.id,
                              entregador_id: motoboy.id,
                              numero_pedido: pedido.numero_pedido,
                              cliente_nome: pedido.cliente_nome,
                              cliente_telefone: pedido.cliente_telefone,
                              endereco_completo: `${pedido.cliente_endereco}, ${pedido.cliente_numero} - ${pedido.cliente_bairro}`,
                              bairro: pedido.cliente_bairro,
                              valor_pedido: pedido.valor_total,
                              taxa_entregador: pizzaria?.taxa_entrega_base || 5,
                              forma_pagamento: pedido.forma_pagamento,
                              troco_para: pedido.troco_para,
                              status: 'pendente',
                              horario_atribuicao: new Date().toISOString(),
                              itens_resumo: pedido.itens?.map(i => `${i.quantidade}x ${i.nome}`).join(', '),
                            });

                            await base44.entities.Pedido.update(pedido.id, { status: 'em_entrega' });
                          }

                          await base44.entities.Entregador.update(motoboy.id, { status: 'em_entrega' });

                          await base44.entities.Notificacao.create({
                            pizzaria_id: pizzaria?.id,
                            destinatario_id: motoboy.id,
                            tipo: 'nova_entrega',
                            titulo: 'Novas Entregas Atribuídas',
                            mensagem: `Você recebeu ${rotaOtimizada.pedidos.length} entregas. Abra o app para ver a rota.`,
                            dados: { quantidade: rotaOtimizada.pedidos.length },
                          });

                          toast.success('Rota atribuída com sucesso!');
                          setShowAtribuirRotaModal(false);
                          setRotaOtimizada(null);
                          refetch();
                        } catch (error) {
                          console.error('Erro ao atribuir rota:', error);
                          toast.error('Erro ao atribuir rota');
                        } finally {
                          setAtribuindoRota(false);
                        }
                      }}
                      disabled={atribuindoRota}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{motoboy.nome?.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{motoboy.nome}</p>
                        <p className="text-sm text-slate-400">{motoboy.telefone}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Disponível</Badge>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowAtribuirRotaModal(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}