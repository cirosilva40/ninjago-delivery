import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
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

const DEFAULT_CENTER = [-23.5505, -46.6333]; // São Paulo

export default function MapaRaioEntrega({ latitude, longitude, raioKm, raioMaximoKm, taxaBase, taxaAdicional, onLocationChange }) {
  const hasLocation = !!(latitude && longitude);
  const [markerPosition, setMarkerPosition] = useState(
    hasLocation ? [latitude, longitude] : DEFAULT_CENTER
  );

  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Componente para capturar cliques no mapa
  function LocationMarker() {
    useMapEvents({
      click(e) {
        if (onLocationChange) {
          const { lat, lng } = e.latlng;
          setMarkerPosition([lat, lng]);
          onLocationChange(lat, lng);
        }
      },
    });
    return null;
  }

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-white/10">
      <MapContainer
        center={markerPosition}
        zoom={hasLocation ? 13 : 11}
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
        
        {hasLocation && <MapUpdater center={markerPosition} raio={raioKm} />}
        <LocationMarker />
        
        {/* Marcador da Pizzaria */}
        <Marker 
          position={markerPosition} 
          icon={pizzariaIcon}
          draggable={!!onLocationChange}
          eventHandlers={{
            dragend: (e) => {
              if (onLocationChange) {
                const { lat, lng } = e.target.getLatLng();
                setMarkerPosition([lat, lng]);
                onLocationChange(lat, lng);
              }
            },
          }}
        >
          <Popup>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">📍 Sua Pizzaria</div>
              <p className="text-sm text-gray-600 mt-1">
                {onLocationChange ? 'Arraste para ajustar' : 'Centro de distribuição'}
              </p>
            </div>
          </Popup>
        </Marker>
        
        {/* Círculo do Raio Base */}
        {raioKm > 0 && (
          <Circle
            center={markerPosition}
            radius={raioKm * 1000}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: hasLocation ? null : '8 4',
            }}
          >
            <Popup>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900">Raio Base: {raioKm} km</div>
                <p className="text-xs text-gray-600">Taxa: R$ {(parseFloat(taxaBase) || 0).toFixed(2)}</p>
                {parseFloat(taxaAdicional) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Além deste raio: +R$ {(parseFloat(taxaAdicional) || 0).toFixed(2)}/km
                  </p>
                )}
              </div>
            </Popup>
          </Circle>
        )}
      </MapContainer>

      {/* Aviso quando localização não está definida */}
      {!hasLocation && onLocationChange && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          📍 Clique no mapa para fixar a localização da sua pizzaria
        </div>
      )}
      {!hasLocation && !onLocationChange && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] bg-slate-800/90 text-slate-300 text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          ⚠️ Configure o endereço na aba Geral para fixar a localização
        </div>
      )}
      
      {/* Legenda */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[999]">
        <div className="text-xs font-bold text-gray-900 mb-2">Legenda</div>
        {raioKm > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-70"></div>
            <span className="text-xs text-gray-700">Raio base ({raioKm} km) · R$ {(parseFloat(taxaBase)||0).toFixed(2)}</span>
          </div>
        )}
        {parseFloat(taxaAdicional) > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span className="text-xs text-gray-700">+R$ {(parseFloat(taxaAdicional)||0).toFixed(2)}/km fora do raio</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="text-base">🍕</div>
          <span className="text-xs text-gray-700">{hasLocation ? 'Sua pizzaria' : 'Posição estimada'}</span>
        </div>
      </div>
    </div>
  );
}