import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react';
import { Banknote, QrCode, CreditCard } from 'lucide-react';

const pagamentoConfig = {
  dinheiro: { label: 'Dinheiro', icon: Banknote, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  pix: { label: 'PIX', icon: QrCode, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  cartao_credito: { label: 'Cartão Crédito', icon: CreditCard, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  cartao_debito: { label: 'Cartão Débito', icon: CreditCard, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
};

export default function PagamentoCard({ entrega }) {
  const jaPago = entrega.forma_pagamento !== 'dinheiro';
  const config = pagamentoConfig[entrega.forma_pagamento];

  return (
    <Card className={`${jaPago ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-yellow-500/10 border-yellow-500/50'} border-2 p-4 mb-6`}>
      {/* Badge PAGO / COBRAR DO CLIENTE */}
      <div className={`flex items-center justify-center gap-2 rounded-xl py-2 px-4 mb-4 font-bold text-lg ${
        jaPago ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'
      }`}>
        {jaPago ? (
          <><CheckCircle2 className="w-5 h-5" /> PAGO</>
        ) : (
          <><AlertTriangle className="w-5 h-5" /> COBRAR DO CLIENTE</>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
          {config
            ? React.createElement(config.icon, { className: `w-8 h-8 ${config.color}` })
            : <DollarSign className="w-8 h-8 text-emerald-400" />
          }
        </div>
        <div className="flex-1">
          <p className="text-white/70 text-sm">Forma de Pagamento</p>
          <p className="text-xl font-bold text-white">{config?.label || entrega.forma_pagamento}</p>
        </div>
        {!jaPago && (
          <div className="text-right">
            <p className="text-white/70 text-sm">Valor a Cobrar</p>
            <p className="text-xl font-bold text-yellow-300">R$ {entrega.valor_pedido?.toFixed(2)}</p>
          </div>
        )}
      </div>

      {entrega.troco_para > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200 font-medium">Troco Necessário</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-yellow-200/70">Cliente pagará com</p>
              <p className="text-lg font-bold text-yellow-400">R$ {entrega.troco_para?.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-yellow-500/20 flex items-center justify-between">
            <span className="text-yellow-200/70">Troco a dar:</span>
            <span className="text-xl font-bold text-yellow-400">
              R$ {(entrega.troco_para - entrega.valor_pedido).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}