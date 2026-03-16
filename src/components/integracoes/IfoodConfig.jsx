import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function IfoodConfig({ pizzaria, onSaved }) {
  const [form, setForm] = useState({
    ifood_client_id: pizzaria?.ifood_client_id || '',
    ifood_client_secret: pizzaria?.ifood_client_secret || '',
    ifood_merchant_id: pizzaria?.ifood_merchant_id || '',
    ifood_polling_ativo: pizzaria?.ifood_polling_ativo || false,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const credenciaisSalvas = !!(pizzaria?.ifood_client_id && pizzaria?.ifood_merchant_id);

  const handleSave = async () => {
    if (!form.ifood_client_id || !form.ifood_client_secret || !form.ifood_merchant_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Pizzaria.update(pizzaria.id, form);
      toast.success('Credenciais iFood salvas!');
      onSaved?.();
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const resp = await base44.functions.invoke('ifoodPolling', {});
      setTestResult({ success: true, data: resp.data });
      toast.success('Polling executado com sucesso!');
    } catch (e) {
      setTestResult({ success: false, error: e.message });
      toast.error('Erro no polling: ' + e.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="flex items-center gap-3">
        {credenciaisSalvas ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Credenciais configuradas
          </Badge>
        ) : (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Pendente de configuração
          </Badge>
        )}
        {pizzaria?.ifood_polling_ativo && (
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Polling ativo
          </Badge>
        )}
      </div>

      {/* Instruções */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-slate-300 space-y-2">
        <p className="font-semibold text-blue-300">Como obter as credenciais:</p>
        <ol className="list-decimal list-inside space-y-1 text-slate-400">
          <li>Acesse <a href="https://developer.ifood.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">developer.ifood.com.br <ExternalLink className="w-3 h-3" /></a></li>
          <li>Crie uma conta e um aplicativo</li>
          <li>Solicite acesso à API de Orders e Events</li>
          <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong></li>
          <li>No Portal do Parceiro, copie o <strong>Merchant ID</strong> da sua loja</li>
        </ol>
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        <div>
          <Label className="text-slate-400">Client ID *</Label>
          <Input
            value={form.ifood_client_id}
            onChange={e => setForm(f => ({ ...f, ifood_client_id: e.target.value }))}
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm mt-1"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>

        <div>
          <Label className="text-slate-400">Client Secret *</Label>
          <Input
            type="password"
            value={form.ifood_client_secret}
            onChange={e => setForm(f => ({ ...f, ifood_client_secret: e.target.value }))}
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm mt-1"
            placeholder="••••••••••••••••"
          />
        </div>

        <div>
          <Label className="text-slate-400">Merchant ID (ID da loja no iFood) *</Label>
          <Input
            value={form.ifood_merchant_id}
            onChange={e => setForm(f => ({ ...f, ifood_merchant_id: e.target.value }))}
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm mt-1"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>

        {/* Toggle polling */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="font-medium text-white">Polling Automático</p>
            <p className="text-sm text-slate-400">Verificar novos pedidos no iFood a cada 30 segundos</p>
          </div>
          <Switch
            checked={form.ifood_polling_ativo}
            onCheckedChange={v => setForm(f => ({ ...f, ifood_polling_ativo: v }))}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-red-500 to-orange-600"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {saving ? 'Salvando...' : 'Salvar Credenciais'}
        </Button>

        {credenciaisSalvas && (
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="border-slate-600 text-slate-300 hover:bg-white/10"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Resultado do teste */}
      {testResult && (
        <div className={`p-4 rounded-xl text-sm ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
          {testResult.success ? (
            <div>
              <p className="font-semibold mb-1">✅ Polling executado!</p>
              <pre className="text-xs text-slate-400 overflow-auto max-h-32">{JSON.stringify(testResult.data, null, 2)}</pre>
            </div>
          ) : (
            <p>❌ {testResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
}