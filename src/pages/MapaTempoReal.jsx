import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Search,
  CheckCircle,
  RotateCcw,
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

// Fix dos ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícones customizados
const pizzariaIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); font-size: 20px;">🍕</div></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const entregadorIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="font-size: 18px;">🚴</div></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const entregaIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="font-size: 16px;">📦</div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const clienteIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="font-size: 16px;">🏠</div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Componente para ajustar bounds do mapa
function MapUpdater({ entregadores, entregas, pizzaria }) {
  const map = useMap();
  
  useEffect(() => {
    if (map && (entregadores.length > 0 || entregas.length > 0)) {
      const bounds = L.latLngBounds([]);
      
      if (pizzaria?.latitude && pizzaria?.longitude) {
        bounds.extend([pizzaria.latitude, pizzaria.longitude]);
      }
      
      entregadores.forEach(e => {
        if (e.latitude && e.longitude) {
          bounds.extend([e.latitude, e.longitude]);
        }
      });
      
      entregas.forEach(e => {
        if (e.latitude_destino && e.longitude_destino) {
          bounds.extend([e.latitude_destino, e.longitude_destino]);
        }
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, entregadores, entregas, pizzaria]);
  
  return null;
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500' },
  aceita: { label: 'Aceita', color: 'bg-blue-500' },
  em_rota: { label: 'Em Rota', color: 'bg-purple-500' },
  entregue: { label: 'Entregue', color: 'bg-emerald-500' },
};

export default function MapaTempoReal() {
  const [viewMode, setViewMode] = useState('list');
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [selectedEntregador, setSelectedEntregador] = useState(null);
  const [selectedPizzaria, setSelectedPizzaria] = useState(false);
  const [gerandoRota, setGerandoRota] = useState(false);
  const [rotaOtimizada, setRotaOtimizada] = useState(null);
  const [showAtribuirRotaModal, setShowAtribuirRotaModal] = useState(false);
  const [atribuindoRota, setAtribuindoRota] = useState(false);
  const [selectedEntregadorId, setSelectedEntregadorId] = useState(null);

  const [buscaMotoboy, setBuscaMotoboy] = useState('');

  const [horarioInicio, setHorarioInicio] = useState(() => {
    const now = moment();
    return now.format('HH:mm');
  });

  const [pizzariaId, setPizzariaId] = useState(null);

  useEffect(() => {
    const loadPizzariaId = async () => {
      const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
      if (estabelecimentoLogado) {
        const estab = JSON.parse(estabelecimentoLogado);
        setPizzariaId(estab.id);
      } else {
        const userData = await base44.auth.me();
        setPizzariaId(userData.pizzaria_id || null);
      }
    };
    loadPizzariaId();
  }, []);

  // Buscar configurações da pizzaria para pegar coordenadas
  const { data: pizzarias = [], refetch: refetchPizzaria } = useQuery({
    queryKey: ['pizzaria-config-mapa', pizzariaId],
    queryFn: () => base44.entities.Pizzaria.filter({ id: pizzariaId }),
    enabled: !!pizzariaId,
    refetchInterval: 10000,
  });

  const pizzaria = pizzarias[0];
  const defaultCenter = {
    lat: pizzaria?.latitude || -23.5505,
    lng: pizzaria?.longitude || -46.6333
  };

  const { data: entregas = [], refetch } = useQuery({
    queryKey: ['entregas-mapa', pizzariaId],
    queryFn: () => base44.entities.Entrega.filter({
      pizzaria_id: pizzariaId,
      status: { $in: ['pendente', 'aceita', 'em_rota'] }
    }, '-created_date', 50),
    enabled: !!pizzariaId,
    refetchInterval: 5000,
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ['entregadores-mapa', pizzariaId],
    queryFn: () => base44.entities.Entregador.filter({
      pizzaria_id: pizzariaId,
      status: { $in: ['disponivel', 'em_entrega'] }
    }),
    enabled: !!pizzariaId,
    refetchInterval: 5000,
  });

  const { data: pedidosProntos = [] } = useQuery({
    queryKey: ['pedidos-prontos-rota', pizzariaId],
    queryFn: () => base44.entities.Pedido.filter({ pizzaria_id: pizzariaId, status: 'pronto' }, '-created_date', 50),
    enabled: !!pizzariaId,
    refetchInterval: 10000,
  });

  const { data: pedidosAtivos = [] } = useQuery({
    queryKey: ['pedidos-ativos-mapa', pizzariaId],
    queryFn: () => base44.entities.Pedido.filter({ pizzaria_id: pizzariaId, status: { $in: ['novo', 'em_preparo', 'pronto'] } }, '-created_date', 50),
    enabled: !!pizzariaId,
    refetchInterval: 10000,
  });



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

      {/* Mapa + busca/entregadores lado a lado */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Mapa */}
        <div className={`${viewMode === 'map' ? 'lg:col-span-2' : 'hidden lg:block lg:col-span-2'}`}>
          <Card className="overflow-hidden rounded-2xl bg-white/5 border-white/10 h-[600px]">
            <MapContainer
              center={[defaultCenter.lat, defaultCenter.lng]}
              zoom={13}
              className="w-full h-full"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapUpdater entregadores={entregadores} entregas={entregas} pizzaria={pizzaria} />
              
              {/* Marcador da Pizzaria */}
              {pizzaria?.latitude && pizzaria?.longitude && (
                <Marker position={[pizzaria.latitude, pizzaria.longitude]} icon={pizzariaIcon}>
                  <Popup>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">🚀 {pizzaria?.nome || 'NinjaGO Delivery'}</div>
                      <p className="text-sm text-gray-600">Ponto de origem</p>
                      {pizzaria?.endereco && (
                        <p className="text-xs text-gray-500 mt-1">{pizzaria.endereco}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Marcadores dos Entregadores */}
              {entregadores.filter(e => e.latitude && e.longitude).map((entregador) => (
                <Marker 
                  key={entregador.id} 
                  position={[entregador.latitude, entregador.longitude]} 
                  icon={entregadorIcon}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <p className="font-bold text-lg text-gray-900">{entregador.nome}</p>
                      <p className="text-sm text-gray-600 capitalize">{entregador.veiculo}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusConfig[entregador.status]?.color || 'bg-gray-400'}`} />
                        <span className="text-sm capitalize">{entregador.status?.replace('_', ' ')}</span>
                      </div>
                      <a 
                        href={`tel:${entregador.telefone}`}
                        className="mt-2 block text-blue-600 text-sm hover:underline"
                      >
                        📞 {entregador.telefone}
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Marcadores dos Pedidos dos Clientes */}
              {pedidosAtivos.filter(p => p.latitude && p.longitude && p.tipo_pedido === 'delivery').map((pedido) => (
                <Marker
                  key={`pedido-${pedido.id}`}
                  position={[pedido.latitude, pedido.longitude]}
                  icon={clienteIcon}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <p className="font-bold text-gray-900">🏠 {pedido.cliente_nome}</p>
                      <p className="text-sm text-gray-600">Pedido #{pedido.numero_pedido}</p>
                      <p className="text-xs text-gray-500 mt-1">{pedido.cliente_endereco}, {pedido.cliente_numero} - {pedido.cliente_bairro}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">R$ {pedido.valor_total?.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">{pedido.status?.replace('_', ' ')}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Marcadores das Entregas */}
              {entregas.filter(e => e.latitude_destino && e.longitude_destino).map((entrega) => (
                <Marker 
                  key={entrega.id} 
                  position={[entrega.latitude_destino, entrega.longitude_destino]} 
                  icon={entregaIcon}
                >
                  <Popup>
                    <div className="min-w-[220px]">
                      <p className="font-bold text-gray-900">Pedido #{entrega.numero_pedido}</p>
                      <p className="text-sm text-gray-700">{entrega.cliente_nome}</p>
                      <p className="text-sm text-gray-600">{entrega.endereco_completo}</p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        R$ {entrega.valor_pedido?.toFixed(2)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => openGoogleMaps(entrega.latitude_destino, entrega.longitude_destino)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Google Maps
                        </button>
                        <button 
                          onClick={() => openWaze(entrega.latitude_destino, entrega.longitude_destino)}
                          className="text-xs bg-cyan-500 text-white px-2 py-1 rounded hover:bg-cyan-600"
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

        {/* Painel lateral - busca + entregadores online */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {/* Campo de busca de motoboy */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={buscaMotoboy}
                onChange={(e) => setBuscaMotoboy(e.target.value)}
                placeholder="Buscar motoboy..."
                className="pl-9 w-full bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
              {buscaMotoboy && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {entregadores.filter(e =>
                    e.nome?.toLowerCase().includes(buscaMotoboy.toLowerCase()) ||
                    e.telefone?.includes(buscaMotoboy)
                  ).length === 0 ? (
                    <div className="p-3 text-sm text-slate-400 text-center">Nenhum motoboy encontrado</div>
                  ) : (
                    entregadores.filter(e =>
                      e.nome?.toLowerCase().includes(buscaMotoboy.toLowerCase()) ||
                      e.telefone?.includes(buscaMotoboy)
                    ).map((motoboy) => (
                      <button
                        key={motoboy.id}
                        onClick={() => { setSelectedEntregadorId(motoboy.id); setBuscaMotoboy(''); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-slate-700/50 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{motoboy.nome?.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{motoboy.nome}</p>
                          <p className="text-slate-400 text-xs capitalize">{motoboy.status?.replace('_', ' ')}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          motoboy.status === 'disponivel' ? 'bg-emerald-400' :
                          motoboy.status === 'em_entrega' ? 'bg-purple-400' : 'bg-slate-500'
                        }`} />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Entregadores Online */}
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
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
                      onClick={() => { if (entregador.latitude && entregador.longitude) setSelectedEntregadorId(isSelected ? null : entregador.id); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected ? 'bg-orange-500/20 border-orange-500/50 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/8'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
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
                          <MapPin className="w-3 h-3 mr-1" />No mapa
                        </Badge>
                      )}
                      <a href={`tel:${entregador.telefone}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
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

      {/* Entregas Ativas - abaixo do mapa, em lista horizontal */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-500" />
          Entregas Ativas
          <Badge className="bg-orange-500/20 text-orange-400">{entregas.length}</Badge>
        </h3>

        {entregas.length === 0 ? (
          <Card className="rounded-xl bg-white/5 border-white/10 p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nenhuma entrega em andamento</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                          <Badge className={`${status.color}/20 text-white text-xs`}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{entrega.cliente_nome}</p>
                      </div>
                      <p className="text-lg font-bold text-emerald-400">R$ {entrega.valor_pedido?.toFixed(2)}</p>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-slate-400 mb-3">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{entrega.endereco_completo}</span>
                    </div>

                    {entregador && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 mb-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                          <Bike className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-sm font-medium text-white flex-1 truncate">{entregador.nome}</p>
                        <button
                          title="Recalcular rota do entregador"
                          onClick={async () => {
                            toast.loading('Recalculando rota...');
                            try {
                              await base44.functions.invoke('otimizarRotaEntregador', { entregador_id: entregador.id });
                              toast.success(`Rota de ${entregador.nome} recalculada!`);
                            } catch(e) {
                              toast.error('Erro ao recalcular rota');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-400"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <a href={`tel:${entregador.telefone}`} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                          <Phone className="w-3.5 h-3.5 text-white" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-300 text-xs"
                        onClick={() => openGoogleMaps(entrega.latitude_destino || -23.5505, entrega.longitude_destino || -46.6333)}>
                        <Navigation className="w-3.5 h-3.5 mr-1" />Maps
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-300 text-xs"
                        onClick={() => openWaze(entrega.latitude_destino || -23.5505, entrega.longitude_destino || -46.6333)}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />Waze
                      </Button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(entrega.horario_atribuicao).fromNow()}</span>
                      <span>{entrega.forma_pagamento}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal Atribuir Rota ao Motoboy */}
      <Dialog open={showAtribuirRotaModal} onOpenChange={setShowAtribuirRotaModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg z-[9999]">
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
                        // Captura a rota localmente para evitar problema de null durante a execução
                        const rotaSnapshot = rotaOtimizada;
                        if (!rotaSnapshot || !rotaSnapshot.pedidos?.length) {
                          toast.error('Rota inválida, gere novamente.');
                          return;
                        }
                        setAtribuindoRota(true);
                        try {
                          for (const pedido of rotaSnapshot.pedidos) {
                            await base44.entities.Entrega.create({
                              pizzaria_id: pizzaria?.id || 'default',
                              pedido_id: pedido.id,
                              entregador_id: motoboy.id,
                              numero_pedido: pedido.numero_pedido,
                              cliente_nome: pedido.cliente_nome,
                              cliente_telefone: pedido.cliente_telefone,
                              endereco_completo: `${pedido.cliente_endereco}, ${pedido.cliente_numero} - ${pedido.cliente_bairro}`,
                              bairro: pedido.cliente_bairro,
                              latitude_destino: pedido.latitude,
                              longitude_destino: pedido.longitude,
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

                          // Não alterar status do entregador aqui — ele muda quando aceitar no app

                          await base44.entities.Notificacao.create({
                            pizzaria_id: pizzaria?.id,
                            destinatario_id: motoboy.id,
                            tipo: 'nova_entrega',
                            titulo: 'Novas Entregas Atribuídas',
                            mensagem: `Você recebeu ${rotaSnapshot.pedidos.length} entregas. Abra o app para ver a rota.`,
                            dados: { quantidade: rotaSnapshot.pedidos.length },
                            lida: false,
                          });

                          toast.success(`Rota atribuída para ${motoboy.nome} com sucesso!`);
                          setShowAtribuirRotaModal(false);
                          setRotaOtimizada(null);
                          refetch();
                        } catch (error) {
                          console.error('Erro ao atribuir rota:', error);
                          toast.error('Erro ao atribuir rota: ' + error.message);
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