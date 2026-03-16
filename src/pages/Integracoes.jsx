import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plug,
  Copy,
  Check,
  Info,
  Zap,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import IfoodConfig from '@/components/integracoes/IfoodConfig';

const WEBHOOK_BASE_URL = 'https://api.base44.com/api/apps/6925e1fdd6376091844799ad/functions/webhookPedidoExterno';

export default function Integracoes() {
  const [pizzariaId, setPizzariaId] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');
  const [ifoodOpen, setIfoodOpen] = useState(true);
  const [food99Open, setFood99Open] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      const estab = localStorage.getItem('estabelecimento_logado');
      if (estab) {
        setPizzariaId(JSON.parse(estab).id);
      } else {
        setPizzariaId(userData.pizzaria_id || null);
      }
    };
    loadUser();
  }, []);

  const { data: pizzaria, refetch: refetchPizzaria } = useQuery({
    queryKey: ['pizzaria-integracoes', pizzariaId],
    queryFn: () => pizzariaId ? base44.entities.Pizzaria.get(pizzariaId) : null,
    enabled: !!pizzariaId,
  });

  const webhookIfood = pizzariaId
    ? `${WEBHOOK_BASE_URL}`
    : 'Carregando...';

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copiado!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const CopyButton = ({ text, keyId }) => (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8 text-slate-400 hover:text-white"
      onClick={() => copyToClipboard(text, keyId)}
    >
      {copiedKey === keyId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </Button>
  );

  const HeaderBlock = ({ source, label, color }) => (
    <div className="rounded-lg bg-slate-900 border border-white/10 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">X-Source</span>
        <CopyButton text={source} keyId={`source-${source}`} />
      </div>
      <code className={`text-sm font-bold ${color}`}>{source}</code>
    </div>
  );

  const EndpointBlock = ({ source }) => {
    const url = WEBHOOK_BASE_URL;
    const headers = {
      'Content-Type': 'application/json',
      'X-Source': source,
      'X-Pizzaria-Id': pizzariaId || 'SEU_PIZZARIA_ID',
    };
    const curl = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "X-Source: ${source}" \\
  -H "X-Pizzaria-Id: ${pizzariaId || 'SEU_PIZZARIA_ID'}" \\
  -d '{"displayId":"001","customer":{"name":"João","phone":{"number":"11999999999"}},"items":[{"name":"Pizza Calabresa","quantity":1,"totalPrice":4500}],"total":{"orderAmount":5000},"deliveryFee":500}'`;

    return (
      <div className="space-y-4">
        {/* URL */}
        <div>
          <Label className="text-slate-400 text-sm mb-2 block">URL do Webhook</Label>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-white/10 p-3">
            <code className="text-emerald-400 text-sm flex-1 break-all">{url}</code>
            <CopyButton text={url} keyId={`url-${source}`} />
          </div>
        </div>

        {/* Headers necessários */}
        <div>
          <Label className="text-slate-400 text-sm mb-2 block">Headers obrigatórios</Label>
          <div className="rounded-lg bg-slate-900 border border-white/10 divide-y divide-white/5">
            {Object.entries(headers).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between px-3 py-2">
                <div className="flex gap-3 items-center">
                  <code className="text-xs text-slate-400 font-mono w-44">{key}</code>
                  <code className="text-sm text-white font-mono">{value}</code>
                </div>
                <CopyButton text={value} keyId={`header-${key}-${source}`} />
              </div>
            ))}
          </div>
        </div>

        {/* ID da Pizzaria */}
        <div>
          <Label className="text-slate-400 text-sm mb-2 block flex items-center gap-2">
            <Info className="w-4 h-4" /> Seu ID de Pizzaria
          </Label>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-orange-500/30 p-3">
            <code className="text-orange-400 text-sm font-bold flex-1">{pizzariaId || 'Carregando...'}</code>
            {pizzariaId && <CopyButton text={pizzariaId} keyId="pizzaria-id" />}
          </div>
          <p className="text-xs text-slate-500 mt-1">Use este ID no header X-Pizzaria-Id ao configurar o webhook na plataforma.</p>
        </div>

        {/* Exemplo cURL */}
        <div>
          <Label className="text-slate-400 text-sm mb-2 block">Exemplo cURL</Label>
          <div className="relative rounded-lg bg-slate-950 border border-white/10 p-4 overflow-x-auto">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap">{curl}</pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={curl} keyId={`curl-${source}`} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Plug className="w-8 h-8 text-orange-400" />
          Integrações
        </h1>
        <p className="text-slate-400 mt-1">Conecte plataformas externas de pedidos ao seu sistema</p>
      </div>

      {/* Como funciona */}
      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 font-medium mb-1">Como funciona?</p>
            <p className="text-slate-300 text-sm">
              Cada plataforma (iFood, 99Food) possui uma configuração de webhook — um endereço de URL que elas chamam automaticamente quando um pedido é feito. 
              Basta configurar a URL e os headers abaixo nas plataformas e os pedidos aparecerão automaticamente na sua tela de <strong>Pedidos</strong> com a flag de origem correta.
            </p>
          </div>
        </div>
      </Card>

      {/* iFood */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <button
          className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
          onClick={() => setIfoodOpen(o => !o)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-white">iFood</h2>
              <p className="text-slate-400 text-sm">Integração via Webhook</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Disponível</Badge>
          </div>
          {ifoodOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {ifoodOpen && (
          <div className="px-5 pb-5 border-t border-white/10 pt-5 space-y-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm">
                No painel do iFood (Portal do Parceiro), acesse <strong>Configurações → Integrações → Webhook</strong> e cadastre a URL abaixo com os headers indicados.
              </p>
            </div>
            <EndpointBlock source="ifood" />
          </div>
        )}
      </Card>

      {/* 99Food */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <button
          className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
          onClick={() => setFood99Open(o => !o)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-white">99Food</h2>
              <p className="text-slate-400 text-sm">Integração via Webhook</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Disponível</Badge>
          </div>
          {food99Open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {food99Open && (
          <div className="px-5 pb-5 border-t border-white/10 pt-5 space-y-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm">
                No painel do 99Food, acesse <strong>Configurações → Webhooks</strong> e cadastre a URL abaixo com os headers indicados.
              </p>
            </div>
            <EndpointBlock source="99food" />
          </div>
        )}
      </Card>

      {/* Status dos pedidos integrados */}
      <Card className="bg-white/5 border-white/10 p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          O que acontece quando um pedido chega?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Pedido recebido', desc: 'A plataforma envia os dados automaticamente via webhook' },
            { step: '2', title: 'Processado', desc: 'O sistema converte e salva o pedido com a flag de origem (iFood/99Food)' },
            { step: '3', title: 'Notificado', desc: 'Aparece na tela de Pedidos e uma notificação é gerada' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                {item.step}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{item.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}