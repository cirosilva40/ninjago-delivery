import React from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, CreditCard, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TestarMercadoPago from '@/components/configuracoes/TestarMercadoPago';
import TestarWebhookMercadoPago from '@/components/configuracoes/TestarWebhookMercadoPago';

export default function PagamentoTab({ pizzaria, pizzarias, updateConfig, setPizzaria, setLoading, refetch, getWebhookUrl }) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Formas de Pagamento
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure as formas de pagamento aceitas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Dinheiro</p>
                  <p className="text-sm text-slate-400">Pagamento em espécie</p>
                </div>
              </div>
              <Switch checked={pizzaria.configuracoes?.aceitar_dinheiro} onCheckedChange={(checked) => updateConfig('aceitar_dinheiro', checked)} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-500 font-bold text-sm">PIX</span>
                </div>
                <div>
                  <p className="font-medium text-white">PIX</p>
                  <p className="text-sm text-slate-400">Transferência instantânea</p>
                </div>
              </div>
              <Switch checked={pizzaria.configuracoes?.aceitar_pix} onCheckedChange={(checked) => updateConfig('aceitar_pix', checked)} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Cartão</p>
                  <p className="text-sm text-slate-400">Crédito ou débito na entrega</p>
                </div>
              </div>
              <Switch checked={pizzaria.configuracoes?.aceitar_cartao} onCheckedChange={(checked) => updateConfig('aceitar_cartao', checked)} />
            </div>
          </div>

          {/* Taxas de Pagamento */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
            <h4 className="font-medium text-white mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Taxas por Forma de Pagamento
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Defina a taxa percentual cobrada pela operadora. Serão usadas no cálculo real de lucro e CMV.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-400">Taxa PIX (%)</Label>
                <div className="relative">
                  <Input type="number" step="0.01" min="0" max="100" value={pizzaria.configuracoes?.taxa_pix ?? 0.99} onChange={(e) => updateConfig('taxa_pix', parseFloat(e.target.value) || 0)} className="bg-slate-800 border-slate-700 text-white pr-8" placeholder="0.99" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Ex: 0,99%</p>
              </div>
              <div>
                <Label className="text-slate-400">Taxa Débito (%)</Label>
                <div className="relative">
                  <Input type="number" step="0.01" min="0" max="100" value={pizzaria.configuracoes?.taxa_debito ?? 1.5} onChange={(e) => updateConfig('taxa_debito', parseFloat(e.target.value) || 0)} className="bg-slate-800 border-slate-700 text-white pr-8" placeholder="1.50" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Ex: 1,50%</p>
              </div>
              <div>
                <Label className="text-slate-400">Taxa Crédito (%)</Label>
                <div className="relative">
                  <Input type="number" step="0.01" min="0" max="100" value={pizzaria.configuracoes?.taxa_credito ?? 2.5} onChange={(e) => updateConfig('taxa_credito', parseFloat(e.target.value) || 0)} className="bg-slate-800 border-slate-700 text-white pr-8" placeholder="2.50" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Ex: 2,50%</p>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-white/5 text-xs text-slate-400">
              💡 <strong className="text-slate-300">Dinheiro</strong> não tem taxa. Os valores acima serão deduzidos no cálculo de lucro real por pedido.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Pagamento Online */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Recebimento de Pagamentos Online
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure sua conta do Mercado Pago para receber pagamentos online dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Como funciona?</p>
              <p className="text-slate-400">Os clientes pagam online no cardápio e o dinheiro vai diretamente para sua conta do Mercado Pago. Acesse <a href="https://www.mercadopago.com.br/developers/pt/docs" target="_blank" rel="noreferrer" className="text-blue-400 underline">mercadopago.com.br/developers</a> para obter suas chaves.</p>
            </div>
          </div>

          {/* URL do Webhook */}
          {pizzarias[0]?.id && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div>
                <p className="font-semibold text-amber-400 flex items-center gap-2 mb-1">
                  🔗 URL do Webhook (Notificações)
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Configure esta URL no painel do Mercado Pago em <strong>Seu negócio → Configurações → Notificações</strong> para receber confirmações de pagamento automáticas.
                </p>
                <div className="flex gap-2">
                  <Input value={getWebhookUrl()} readOnly className="bg-slate-900 border-slate-700 text-amber-300 font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(getWebhookUrl()); alert('✅ URL copiada!'); }} className="border-slate-600 text-slate-300 hover:bg-white/10 shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <TestarWebhookMercadoPago webhookUrl={getWebhookUrl()} pizzariaId={pizzarias[0].id} />
            </div>
          )}

          {pizzaria.configuracoes?.mp_credenciais_salvas ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-lg">✅</span>
                  <div>
                    <p className="font-semibold text-emerald-400">Mercado Pago conectado</p>
                    <p className="text-xs text-slate-400">Credenciais salvas e ocultas por segurança</p>
                  </div>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => updateConfig('mp_credenciais_salvas', false)} className="border-slate-600 text-slate-300 hover:bg-white/10 text-xs">
                  Alterar credenciais
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-400">Chave Pública (Public Key)</Label>
                  <Input value={pizzaria.configuracoes?.mp_public_key || ''} onChange={(e) => updateConfig('mp_public_key', e.target.value)} className="bg-slate-800 border-slate-700 text-white font-mono text-sm" placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  <p className="text-xs text-slate-500 mt-1">Usada no frontend para inicializar o checkout</p>
                </div>
                <div>
                  <Label className="text-slate-400">Access Token (Chave Privada)</Label>
                  <Input value={pizzaria.configuracoes?.mp_access_token || ''} onChange={(e) => updateConfig('mp_access_token', e.target.value)} className="bg-slate-800 border-slate-700 text-white font-mono text-sm" placeholder="APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx" />
                  <p className="text-xs text-slate-500 mt-1">Chave secreta para processar pagamentos no servidor</p>
                </div>
              </div>

              {pizzaria.configuracoes?.mp_access_token && (
                <TestarMercadoPago
                  accessToken={pizzaria.configuracoes.mp_access_token}
                  onSalvarCredenciais={async () => {
                    const configAtualizada = { ...pizzaria.configuracoes, mp_credenciais_salvas: true };
                    const updated = { ...pizzaria, configuracoes: configAtualizada };
                    const idParaSalvar = pizzaria.id || pizzarias[0]?.id;
                    if (!idParaSalvar) throw new Error('ID da pizzaria não encontrado');
                    await base44.entities.Pizzaria.update(idParaSalvar, updated);
                    setPizzaria(updated);
                    await refetch();
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}