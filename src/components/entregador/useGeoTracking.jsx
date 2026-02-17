import { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook para rastreamento GPS do entregador.
 * - Solicita permissão de localização
 * - Envia lat/lng para a entidade Entregador a cada ~20s
 * - Para automaticamente quando status não requer rastreamento
 * - Usa watchPosition com accuracy alta mas timeout generoso para poupar bateria
 */
export function useGeoTracking(entregador) {
  const intervalRef = useRef(null);
  const watchRef = useRef(null);
  const lastPositionRef = useRef(null);
  const entregadorRef = useRef(entregador);

  // Mantém referência atualizada sem recriar o effect
  useEffect(() => {
    entregadorRef.current = entregador;
  }, [entregador]);

  const sendLocation = useCallback(async (lat, lng) => {
    const current = entregadorRef.current;
    if (!current?.id) return;
    try {
      await base44.entities.Entregador.update(current.id, {
        latitude: lat,
        longitude: lng,
        ultima_localizacao: new Date().toISOString(),
      });
    } catch (e) {
      // silencia erros de rede para não travar o app
    }
  }, []);

  useEffect(() => {
    const shouldTrack =
      entregador?.id &&
      (entregador.status === 'disponivel' || entregador.status === 'em_entrega');

    if (!shouldTrack) {
      // Para o rastreamento se não deve rastrear
      if (watchRef.current !== null) {
        navigator.geolocation?.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) return;

    // Captura a posição atual imediatamente ao ativar
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lastPositionRef.current = pos.coords;
        sendLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // watchPosition mantém posição atualizada localmente (bateria eficiente)
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPositionRef.current = pos.coords;
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        // distanceFilter equivalente — usa maximumAge para reduzir updates desnecessários
      }
    );

    // Envia ao servidor a cada 20 segundos usando a última posição conhecida
    intervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendLocation(
          lastPositionRef.current.latitude,
          lastPositionRef.current.longitude
        );
      }
    }, 20000);

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [entregador?.id, entregador?.status, sendLocation]);
}