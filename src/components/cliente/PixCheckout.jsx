import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle2, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PixCheckout({ pedidoId, valorTotal, pizzariaId, clienteEmail, onVoltar }) {
  const navigate = useNavigate();
  const [pixData, setPixData] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [statusPagamento, setStatusPagamento] = useState('pendente'); // pendente | pago | expirado
  const [tempoRestante, setTempoRestante] = useState(15 * 60); // 15 minutos em segundos
  const [pollingAtivo, setPollingAtivo] = useState(false);

  // Gerar PIX automaticamente ao montar
  useEffect(() => {
    gerarPix();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!pixData || statusPagamento !== 'pendente') return;
    const interval = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatusPagamento('expirado');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pixData, statusPagamento]);

  // Polling para verificar status do pagamento a cada 5 segundos
  useEffect(() => {
    if (!pedidoId || !pollingAtivo || statusPagamento !== 'pendente') return;
    
    const interval = setInterval(async () => {
      try {
        const pedidos = await base44.entities.Pedido.filter({ id: pedidoId });
        const pedido = pedidos?.[0];
        if (pedido?.status_pagamento === 'pago') {
          setStatusPagamento('pago');
          setPollingAtivo(false);
          clearInterval(interval);
          // Redirecionar para acompanhamento após 2 segundos
          setTimeout(() => {
            navigate(createPageUrl('AcompanharPedido') + `?id=${pedidoId}&pizzaria_id=${pizzariaId}`);
          }, 2000);
        }
      } catch (e) {
        console.error('Erro ao verificar status PIX:', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pedidoId, pollingAtivo, statusPagamento]);

  const gerarPix = async () => {
    setGerando(true);
    setTempoRestante(15 * 60);
    setStatusPagamento('pendente');
    try {
      const { data } = await base44.functions.invoke('processarPagamentoMercadoPago', {
        pedidoId,
        valorTotal,
        pizzariaId,
        metodoPagamento: 'pix',
        clienteEmail: clienteEmail || `cliente@ninja.com`
      });

      if (data.success) {
        setPixData(data);
        setPollingAtivo(true);
      } else {
        const detalhe = data.details ? `\n\nDetalhe: ${data.details}` : '';
        alert('Erro ao gerar PIX: ' + (data.error || 'Tente novamente') + detalhe);
        console.error('Erro PIX:', data);
      }
    } catch (error) {
      alert('Erro ao gerar PIX: ' + (error.message || 'Tente novamente'));
      console.error('Erro PIX catch:', error);
    } finally {
      setGerando(false);
    }
  };

  const copiarCodigo = () => {
    if (!pixData?.qr_code) return;
    navigator.clipboard.writeText(pixData.qr_code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progressoTempo = ((15 * 60 - tempoRestante) / (15 * 60)) * 100;

  if (statusPagamento === 'pago') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-4"
      >
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">Pagamento Confirmado! 🎉</h3>
        <p className="text-slate-300">Seu pedido foi confirmado e já está sendo preparado!</p>
        <p className="text-sm text-slate-400">Redirecionando para o acompanhamento...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onVoltar} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Voltar à escolha de pagamento
      </button>

      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <span className="text-2xl">🔳</span> Pagar com PIX
          </h3>
          <span className="text-2xl font-bold text-emerald-400">R$ {valorTotal?.toFixed(2)}</span>
        </div>

        {gerando ? (
          <div className="text-center py-8">
            <RefreshCw className="w-10 h-10 mx-auto text-emerald-400 animate-spin mb-3" />
            <p className="text-slate-300">Gerando código PIX...</p>
          </div>
        ) : pixData && statusPagamento === 'pendente' ? (
          <>
            {/* QR Code */}
            {pixData.qr_code_base64 && (
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-2xl">
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-52 h-52"
                  />
                </div>
              </div>
            )}

            {/* Código Copia e Cola */}
            <div className="space-y-2">
              <p className="text-sm text-slate-400 font-medium">Código PIX (Copia e Cola)</p>
              <div className="flex gap-2">
                <Input
                  value={pixData.qr_code || ''}
                  readOnly
                  className="bg-slate-800/80 border-slate-700 text-white font-mono text-xs flex-1"
                />
                <Button
                  onClick={copiarCodigo}
                  className={`shrink-0 transition-all ${copiado ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {copiado ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Expira em
                </span>
                <span className={`font-bold font-mono ${tempoRestante < 120 ? 'text-red-400' : 'text-white'}`}>
                  {formatarTempo(tempoRestante)}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${tempoRestante < 120 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${100 - progressoTempo}%` }}
                />
              </div>
            </div>

            {/* Status polling */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/50">
              <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />
              <p className="text-sm text-slate-300">Aguardando confirmação do pagamento...</p>
            </div>

            <Button
              onClick={() => navigate(createPageUrl('AcompanharPedido') + `?id=${pedidoId}&pizzaria_id=${pizzariaId}`)}
              variant="outline"
              className="w-full border-slate-600 text-slate-300"
            >
              Já paguei — Acompanhar Pedido
            </Button>
          </>
        ) : statusPagamento === 'expirado' ? (
          <div className="text-center space-y-4 py-4">
            <p className="text-red-400 font-semibold">⏰ QR Code expirado</p>
            <Button onClick={gerarPix} className="bg-emerald-500 hover:bg-emerald-600">
              <RefreshCw className="w-4 h-4 mr-2" /> Gerar novo PIX
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}