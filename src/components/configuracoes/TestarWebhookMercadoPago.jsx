import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function TestarWebhookMercadoPago({ webhookUrl, pizzariaId }) {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);

  const enviarTeste = async () => {
    if (!pizzariaId) {
      setMessage('Erro: ID da pizzaria não disponível para teste.');
      setStatus('erro');
      return;
    }
    setStatus('loading');
    setMessage(null);
    try {
      const response = await base44.functions.invoke('enviarWebhookMercadoPagoTeste', {
        pizzaria_id: pizzariaId,
        webhook_url: webhookUrl,
      });

      if (response.data.success) {
        setStatus('ok');
        setMessage('Evento de teste enviado com sucesso! Webhook está configurado corretamente.');
      } else {
        setStatus('erro');
        setMessage(response.data.message || 'Erro ao enviar evento de teste.');
      }
    } catch (e) {
      setStatus('erro');
      setMessage(`Erro: ${e.message}`);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-amber-500/20">
      <p className="text-xs text-slate-400">
        Clique abaixo para verificar se a URL do webhook está corretamente configurada:
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={enviarTeste}
        disabled={status === 'loading' || !pizzariaId}
        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
      >
        {status === 'loading' ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando teste...</>
        ) : (
          '🚀 Testar Configuração do Webhook'
        )}
      </Button>

      {status === 'ok' && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">{message}</p>
        </div>
      )}

      {status === 'erro' && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{message}</p>
        </div>
      )}
    </div>
  );
}