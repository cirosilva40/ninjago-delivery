import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import { Store } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix do ícone padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícone customizado para a pizzaria
const pizzariaIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="transform: rotate(45deg); font-size: 20px;">🍕</div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Componente para ajustar o zoom do mapa
function MapUpdater({ center, raio }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && raio && map) {
      setTimeout(() => {
        try {
          const bounds = L.circle(center, raio * 1000).getBounds();
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {
          console.log('Erro ao ajustar mapa:', e);
        }
      }, 100);
    }
  }, [map, center, raio]);
  
  return null;
}

export default function MapaRaioEntrega({ latitude, longitude, raioKm, taxaBase, taxaAdicional }) {
  const center = latitude && longitude ? [latitude, longitude] : [-23.5505, -46.6333];
  const hasLocation = latitude && longitude;

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-white/10">
      {hasLocation ? (
        <MapContainer
          center={center}
          zoom={13}
          className="w-full h-full"
          zoomControl={true}
          whenReady={(map) => {
            setTimeout(() => map.target.invalidateSize(), 100);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater center={center} raio={raioKm} />
          
          {/* Marcador da Pizzaria */}
          <Marker position={center} icon={pizzariaIcon}>
            <Popup>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">📍 Sua Pizzaria</div>
                <p className="text-sm text-gray-600 mt-1">Centro de distribuição</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Círculo do Raio Base */}
          <Circle
            center={center}
            radius={raioKm * 1000}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900">Raio Base: {raioKm} km</div>
                <p className="text-xs text-gray-600">Taxa: R$ {taxaBase?.toFixed(2)}</p>
                {taxaAdicional > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Além deste raio: +R$ {taxaAdicional?.toFixed(2)}/km
                  </p>
                )}
              </div>
            </Popup>
          </Circle>
        </MapContainer>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50 text-slate-400">
          <Store className="w-16 h-16 mb-4" />
          <p className="text-center px-4">
            Configure o endereço da sua pizzaria na aba <strong>Geral</strong><br />
            para visualizar o mapa de cobertura
          </p>
        </div>
      )}
      
      {/* Legenda */}
      {hasLocation && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[999]">
          <div className="text-xs font-bold text-gray-900 mb-2">Legenda</div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-gray-700">Raio base ({raioKm} km)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg">🍕</div>
            <span className="text-xs text-gray-700">Sua pizzaria</span>
          </div>
        </div>
      )}
    </div>
  );
}