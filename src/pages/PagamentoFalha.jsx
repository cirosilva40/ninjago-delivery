import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { XCircle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PagamentoFalha() {
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const pedidoId = urlParams.get('pedidoId');
  const pizzariaId = urlParams.get('pizzariaId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Ícone de falha */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 bg-red-500/20 border-2 border-red-500"
        >
          <XCircle className="w-12 h-12 text-red-400" />
        </motion.div>

        <h1 className="text-3xl font-bold text-red-400 mb-3">
          Pagamento não realizado
        </h1>
        <p className="text-slate-400 text-base mb-8 leading-relaxed">
          Não foi possível processar seu pagamento. Isso pode ter ocorrido por dados incorretos, limite insuficiente ou cancelamento da operação.
        </p>

        {/* Dicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-2"
        >
          <p className="text-slate-300 font-semibold mb-3 text-sm">O que você pode fazer:</p>
          {[
            'Verifique os dados do cartão e tente novamente',
            'Tente outro método de pagamento (PIX é instantâneo!)',
            'Confirme se há limite disponível no cartão',
            'Entre em contato com seu banco se o problema persistir'
          ].map((dica, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-orange-400 mt-0.5">•</span>
              <span>{dica}</span>
            </div>
          ))}
        </motion.div>

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {pizzariaId && (
            <Button
              onClick={() => navigate(createPageUrl('CardapioCliente') + `?pizzariaId=${pizzariaId}`)}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 font-semibold text-base"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          )}

          <Button
            onClick={() => navigate(createPageUrl('CardapioCliente') + (pizzariaId ? `?pizzariaId=${pizzariaId}` : ''))}
            variant="outline"
            className="w-full h-12 border-slate-600 text-slate-300"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Cardápio
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}