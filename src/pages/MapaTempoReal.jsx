import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  Search,
  CheckCircle,
  RotateCcw,
  Hash,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import moment from 'moment';
import { toast } from 'sonner';

// Fix dos ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

function MapUpdater({ entregadores, entregas, pizzaria }) {
  const map = useMap();
  useEffect(() => {
    if (map && (entregadores.length > 0 || entregas.length > 0)) {
      const bounds = L.latLngBounds([]);
      if (pizzaria?.latitude && pizzaria?.longitude) bounds.extend([pizzaria.latitude, pizzaria.longitude]);
      entregadores.forEach(e => { if (e.latitude && e.longitude) bounds.extend([e.latitude, e.longitude]); });
      entregas.forEach(e => { if (e.latitude_destino && e.longitude_destino) bounds.extend([e.latitude_destino, e.longitude_destino]); });
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
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
  const [selectedEntregadorId, setSelectedEntregadorId] = useState(null);
  const [buscaMotoboy, setBuscaMotoboy] = useState('');
  const [numeroComanda, setNumeroComanda] = useState('');
  const [atribuindo, setAtribuindo] = useState(false);
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

  const { data: pizzarias = [] } = useQuery({
    queryKey: ['pizzaria-config-mapa', pizzariaId],
    queryFn: () => base44.entities.Pizzaria.filter({ id: pizzariaId }),
    enabled: !!pizzariaId,
    refetchInterval: 10000,
  });

  const pizzaria = pizzarias[0];
  const defaultCenter = { lat: pizzaria?.latitude || -23.5505, lng: pizzaria?.longitude || -46.6333 };

  const { data: entregas = [], refetch } = useQuery({
    queryKey: ['entregas-mapa', pizzariaId],
    queryFn: () => !pizzariaId ? [] : base44.entities.Entrega.filter({
      pizzaria_id: pizzariaId,
      status: { $in: ['pendente', 'aceita', 'em_rota'] }
    }, '-created_date', 50),
    enabled: !!pizzariaId,
    refetchInterval: 5000,
  });

  const { data: entregadores = [] } = useQuery({
    queryKey: ['entregadores-mapa', pizzariaId],
    queryFn: () => !pizzariaId ? [] : base44.entities.Entregador.filter({
      pizzaria_id: pizzariaId,
      status: { $in: ['disponivel', 'em_entrega'] }
    }),
    enabled: !!pizzariaId,
    refetchInterval: 5000,
  });

  const { data: pedidosAtivos = [] } = useQuery({
    queryKey: ['pedidos-ativos-mapa', pizzariaId],
    queryFn: () => !pizzariaId ? [] : base44.entities.Pedido.filter({ pizzaria_id: pizzariaId, status: { $in: ['novo', 'em_preparo', 'pronto'] } }, '-created_date', 50),
    enabled: !!pizzariaId,
    refetchInterval: 5000,
  });

  const openGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
  };

  const openWaze = (lat, lng) => {
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  const atribuirComanda = async () => {
    if (!selectedEntregadorId) { toast.error('Selecione um motoboy primeiro!'); return; }
    if (!numeroComanda.trim()) { toast.error('Digite o número da comanda!'); return; }

    const motoboy = entregadores.find(e => e.id === selectedEntregadorId);
    if (!motoboy) { toast.error('Motoboy não encontrado'); return; }

    setAtribuindo(true);
    try {
      // Busca o pedido pelo número da comanda
      const pedidos = await base44.entities.Pedido.filter({ pizzaria_id: pizzariaId, numero_pedido: numeroComanda.trim() });
      const pedido = pedidos[0];

      if (!pedido) { toast.error(`Comanda #${numeroComanda} não encontrada!`); return; }
      if (pedido.status === 'em_entrega' || pedido.status === 'entregue') {
        toast.error(`Comanda #${numeroComanda} já está em entrega ou finalizada!`); return;
      }

      // Cria o registro de entrega
      await base44.entities.Entrega.create({
        pizzaria_id: pizzariaId,
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

      // Atualiza status do pedido
      await base44.entities.Pedido.update(pedido.id, { status: 'em_entrega' });

      toast.success(`Comanda #${numeroComanda} atribuída para ${motoboy.nome}!`);
      setNumeroComanda('');
      refetch();
    } finally {
      setAtribuindo(false);
    }
  };

  const selectedMotoboy = entregadores.find(e => e.id === selectedEntregadorId);

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
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-white/5 p-1">
            <Button variant="ghost" size="sm" onClick={() => setViewMode('map')} className={viewMode === 'map' ? 'bg-white/10 text-white' : 'text-slate-400'}>
              <MapIcon className="w-4 h-4 mr-1" />Mapa
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400'}>
              <List className="w-4 h-4 mr-1" />Lista
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="border-slate-700 text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mapa + painel lateral */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Mapa */}
        <div className={`${viewMode === 'map' ? 'lg:col-span-2' : 'hidden lg:block lg:col-span-2'}`}>
          <Card className="overflow-hidden rounded-2xl bg-white/5 border-white/10 h-[600px]">
            <MapContainer center={[defaultCenter.lat, defaultCenter.lng]} zoom={13} className="w-full h-full" zoomControl={true}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater entregadores={entregadores} entregas={entregas} pizzaria={pizzaria} />
              {pizzaria?.latitude && pizzaria?.longitude && (
                <Marker position={[pizzaria.latitude, pizzaria.longitude]} icon={pizzariaIcon}>
                  <Popup><div className="text-center"><div className="text-lg font-bold">🚀 {pizzaria?.nome}</div><p className="text-sm text-gray-600">Ponto de origem</p></div></Popup>
                </Marker>
              )}
              {entregadores.filter(e => e.latitude && e.longitude).map((entregador) => (
                <Marker key={entregador.id} position={[entregador.latitude, entregador.longitude]} icon={entregadorIcon}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <p className="font-bold text-lg">{entregador.nome}</p>
                      <p className="text-sm text-gray-600 capitalize">{entregador.veiculo}</p>
                      <a href={`tel:${entregador.telefone}`} className="mt-2 block text-blue-600 text-sm hover:underline">📞 {entregador.telefone}</a>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {pedidosAtivos.filter(p => p.latitude && p.longitude && p.tipo_pedido === 'delivery').map((pedido) => (
                <Marker key={`pedido-${pedido.id}`} position={[pedido.latitude, pedido.longitude]} icon={clienteIcon}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <p className="font-bold">🏠 {pedido.cliente_nome}</p>
                      <p className="text-sm text-gray-600">Pedido #{pedido.numero_pedido}</p>
                      <p className="text-xs text-gray-500 mt-1">{pedido.cliente_endereco}, {pedido.cliente_numero} - {pedido.cliente_bairro}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">R$ {pedido.valor_total?.toFixed(2)}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {entregas.filter(e => e.latitude_destino && e.longitude_destino).map((entrega) => (
                <Marker key={entrega.id} position={[entrega.latitude_destino, entrega.longitude_destino]} icon={entregaIcon}>
                  <Popup>
                    <div className="min-w-[220px]">
                      <p className="font-bold">Pedido #{entrega.numero_pedido}</p>
                      <p className="text-sm">{entrega.cliente_nome}</p>
                      <p className="text-sm text-gray-600">{entrega.endereco_completo}</p>
                      <p className="text-lg font-bold text-green-600 mt-2">R$ {entrega.valor_pedido?.toFixed(2)}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => openGoogleMaps(entrega.latitude_destino, entrega.longitude_destino)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Google Maps</button>
                        <button onClick={() => openWaze(entrega.latitude_destino, entrega.longitude_destino)} className="text-xs bg-cyan-500 text-white px-2 py-1 rounded">Waze</button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Card>
        </div>

        {/* Painel lateral */}
        <div className="lg:col-span-1 space-y-4">

          {/* Busca de motoboy */}
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
                {entregadores.filter(e => e.nome?.toLowerCase().includes(buscaMotoboy.toLowerCase()) || e.telefone?.includes(buscaMotoboy)).length === 0 ? (
                  <div className="p-3 text-sm text-slate-400 text-center">Nenhum motoboy encontrado</div>
                ) : (
                  entregadores.filter(e => e.nome?.toLowerCase().includes(buscaMotoboy.toLowerCase()) || e.telefone?.includes(buscaMotoboy)).map((motoboy) => (
                    <button key={motoboy.id} onClick={() => { setSelectedEntregadorId(motoboy.id); setBuscaMotoboy(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-slate-700/50 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{motoboy.nome?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{motoboy.nome}</p>
                        <p className="text-slate-400 text-xs capitalize">{motoboy.status?.replace('_', ' ')}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Card de atribuição de comanda — aparece quando motoboy selecionado */}
          <AnimatePresence>
            {selectedMotoboy && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="bg-gradient-to-br from-orange-500/15 to-red-500/10 border-orange-500/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <span className="text-white font-bold">{selectedMotoboy.nome?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{selectedMotoboy.nome}</p>
                        <p className="text-orange-400 text-xs capitalize">{selectedMotoboy.status?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedEntregadorId(null); setNumeroComanda(''); }} className="text-slate-400 hover:text-white p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-300 text-xs mb-3">Digite o número da comanda para atribuir a este motoboy:</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        value={numeroComanda}
                        onChange={(e) => setNumeroComanda(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && atribuirComanda()}
                        placeholder="Nº da comanda"
                        className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
                      />
                    </div>
                    <Button
                      onClick={atribuirComanda}
                      disabled={atribuindo || !numeroComanda.trim()}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-4"
                    >
                      {atribuindo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de entregadores online */}
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
                    onClick={() => setSelectedEntregadorId(isSelected ? null : entregador.id)}
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
                    {isSelected && <Badge className="bg-orange-500/20 text-orange-400 text-xs">Selecionado</Badge>}
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

      {/* Entregas Ativas */}
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
                          title="Recalcular rota"
                          onClick={async () => {
                            toast.loading('Recalculando rota...');
                            try {
                              await base44.functions.invoke('otimizarRotaEntregador', { entregador_id: entregador.id });
                              toast.success(`Rota de ${entregador.nome} recalculada!`);
                            } catch (e) {
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
    </div>
  );
}