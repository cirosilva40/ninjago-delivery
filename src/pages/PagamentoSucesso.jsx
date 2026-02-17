import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Clock, ShoppingBag, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PagamentoSucesso() {
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('pedidoId');
  const pizzariaId = urlParams.get('pizzariaId');
  const statusParam = urlParams.get('status');
  const isPending = statusParam === 'pending';

  useEffect(() => {
    if (pedidoId) {
      loadPedido();
    } else {
      setLoading(false);
    }
  }, [pedidoId]);

  const loadPedido = async () => {
    try {
      const p = await base44.entities.Pedido.get(pedidoId);
      setPedido(p);

      // Se o pagamento foi aprovado, atualizar status
      if (!isPending && p && p.status_pagamento !== 'pago') {
        await base44.entities.Pedido.update(pedidoId, {
          status_pagamento: 'pago',
          status: p.status === 'novo' ? 'em_preparo' : p.status
        });
      }
    } catch (e) {
      console.error('Erro ao buscar pedido:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Ícone de sucesso */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isPending
                ? 'bg-yellow-500/20 border-2 border-yellow-500'
                : 'bg-emerald-500/20 border-2 border-emerald-500'
            }`}
          >
            {isPending
              ? <Clock className="w-12 h-12 text-yellow-400" />
              : <CheckCircle className="w-12 h-12 text-emerald-400" />
            }
          </motion.div>

          <h1 className={`text-3xl font-bold mb-2 ${isPending ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {isPending ? 'Pagamento em Análise' : 'Pagamento Confirmado!'}
          </h1>
          <p className="text-slate-400 text-lg">
            {isPending
              ? 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.'
              : 'Seu pedido foi recebido e está sendo preparado. 🎉'
            }
          </p>
        </div>

        {/* Card do pedido */}
        {pedido && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-3"
          >
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
              <h2 className="font-semibold text-white text-lg">Detalhes do Pedido</h2>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Número do Pedido</span>
              <span className="text-white font-medium">{pedido.numero_pedido}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Cliente</span>
              <span className="text-white font-medium">{pedido.cliente_nome}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Pago</span>
              <span className="text-emerald-400 font-bold text-base">R$ {pedido.valor_total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Status</span>
              <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                isPending
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isPending ? '⏳ Em análise' : '✅ Confirmado'}
              </span>
            </div>

            {pedido.itens && pedido.itens.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-slate-400 text-xs mb-2">Itens do pedido:</p>
                {pedido.itens.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-slate-300">
                    <span>{item.quantidade}x {item.nome}</span>
                    <span>R$ {(item.preco_unitario * item.quantidade).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {pedidoId && (
            <Button
              onClick={() => navigate(createPageUrl('AcompanharPedido') + `?id=${pedidoId}&pizzaria_id=${pizzariaId}`)}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 font-semibold text-base"
            >
              Acompanhar Pedido
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          {pizzariaId && (
            <Button
              onClick={() => navigate(createPageUrl('CardapioCliente') + `?pizzariaId=${pizzariaId}`)}
              variant="outline"
              className="w-full h-12 border-slate-600 text-slate-300"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Cardápio
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}