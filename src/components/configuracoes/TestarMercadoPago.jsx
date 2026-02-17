import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function TestarMercadoPago({ accessToken }) {
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'erro'
  const [resultado, setResultado] = useState(null);

  const testar = async () => {
    setStatus('loading');
    setResultado(null);
    try {
      const res = await base44.functions.invoke('testarMercadoPago', { access_token: accessToken });
      const data = res.data;
      if (data.ok) {
        setStatus('ok');
        setResultado(data);
      } else {
        setStatus('erro');
        setResultado(data);
      }
    } catch (e) {
      setStatus('erro');
      setResultado({ erro: e.message });
    }
  };

  return (
    <div className="mt-2 space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={testar}
        disabled={status === 'loading'}
        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
      >
        {status === 'loading' ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando conexão...</>
        ) : (
          '🔍 Testar Conexão com Mercado Pago'
        )}
      </Button>

      {status === 'ok' && resultado && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="font-semibold text-emerald-400">Conexão OK!</p>
          </div>
          <p className="text-sm text-slate-300">Nome: <span className="text-white">{resultado.nome}</span></p>
          <p className="text-sm text-slate-300">Email: <span className="text-white">{resultado.email}</span></p>
        </div>
      )}

      {status === 'erro' && resultado && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="font-semibold text-red-400">Erro na conexão</p>
          </div>
          <p className="text-sm text-slate-300">{resultado.erro}</p>
          <p className="text-xs text-slate-500 mt-1">Verifique se o Access Token está correto e salvo.</p>
        </div>
      )}
    </div>
  );
}