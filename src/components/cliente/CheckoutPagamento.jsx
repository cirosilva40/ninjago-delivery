import React, { useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CpfInput } from '@/components/ui/masked-input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, QrCode, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// Inicializar Mercado Pago
initMercadoPago('APP_USR-6d6eed8d-16c5-4cd0-844e-623853c8e949', { locale: 'pt-BR' });

export default function CheckoutPagamento({ 
  pedidoId, 
  valorTotal, 
  pizzariaId,
  clienteEmail,
  clienteNome,
  clienteTelefone,
  onSuccess,
  onCancel,
  tema = 'dark'
}) {
  const [metodoPagamento, setMetodoPagamento] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [pagamentoStatus, setPagamentoStatus] = useState(null);
  const [qrCodePix, setQrCodePix] = useState(null);

  const isLight = tema === 'light';

  const processarPagamentoPix = async () => {
    setProcessando(true);
    try {
      const response = await base44.functions.invoke('processarPagamentoMercadoPago', {
        pedidoId,
        valorTotal,
        pizzariaId,
        metodoPagamento: 'pix',
        clienteEmail: clienteEmail || `${clienteTelefone}@cliente.com`
      });

      if (response.data.success && response.data.qr_code) {
        setQrCodePix({
          qr_code: response.data.qr_code,
          qr_code_base64: response.data.qr_code_base64,
          payment_id: response.data.payment_id
        });
        setPagamentoStatus('aguardando_pix');
        toast.success('QR Code PIX gerado! Escaneie para pagar.');
      } else {
        throw new Error('Erro ao gerar QR Code PIX');
      }
    } catch (error) {
      console.error('Erro ao processar PIX:', error);
      toast.error('Erro ao processar pagamento PIX');
      setPagamentoStatus('erro');
    } finally {
      setProcessando(false);
    }
  };

  const handleCardPaymentSubmit = async (formData) => {
    setProcessando(true);
    try {
      const response = await base44.functions.invoke('processarPagamentoMercadoPago', {
        pedidoId,
        valorTotal,
        pizzariaId,
        metodoPagamento: metodoPagamento === 'credito' ? 'credit_card' : 'debit_card',
        dadosCartao: {
          token: formData.token,
          payment_method_id: formData.payment_method_id,
          installments: formData.installments,
          cardholder_cpf: formData.payer.identification.number
        },
        clienteEmail: clienteEmail || `${clienteTelefone}@cliente.com`
      });

      if (response.data.success) {
        if (response.data.status === 'approved') {
          setPagamentoStatus('aprovado');
          toast.success('Pagamento aprovado!');
          setTimeout(() => onSuccess(), 2000);
        } else if (response.data.status === 'pending' || response.data.status === 'in_process') {
          setPagamentoStatus('pendente');
          toast.info('Pagamento em análise');
          setTimeout(() => onSuccess(), 2000);
        } else {
          setPagamentoStatus('recusado');
          toast.error('Pagamento recusado');
        }
      }
    } catch (error) {
      console.error('Erro ao processar cartão:', error);
      toast.error('Erro ao processar pagamento');
      setPagamentoStatus('erro');
    } finally {
      setProcessando(false);
    }
  };

  if (pagamentoStatus === 'aprovado') {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Pagamento Aprovado!
        </h3>
        <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
          Seu pedido foi confirmado e está sendo preparado.
        </p>
      </div>
    );
  }

  if (pagamentoStatus === 'pendente') {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
        <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Pagamento em Análise
        </h3>
        <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
          Aguarde a confirmação do pagamento.
        </p>
      </div>
    );
  }

  if (pagamentoStatus === 'aguardando_pix' && qrCodePix) {
    return (
      <div className="text-center py-8">
        <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Pague com PIX
        </h3>
        
        <div className={`max-w-sm mx-auto p-6 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
          <div className="bg-white p-4 rounded-lg mb-4">
            <img 
              src={`data:image/png;base64,${qrCodePix.qr_code_base64}`}
              alt="QR Code PIX"
              className="w-full max-w-xs mx-auto"
            />
          </div>
          
          <div className={`text-sm mb-4 p-3 rounded-lg ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
            <p className={`font-mono break-all ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
              {qrCodePix.qr_code}
            </p>
          </div>

          <Button
            onClick={() => {
              navigator.clipboard.writeText(qrCodePix.qr_code);
              toast.success('Código PIX copiado!');
            }}
            className="w-full mb-3"
          >
            Copiar Código PIX
          </Button>

          <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            Escaneie o QR Code ou copie o código para pagar
          </p>
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={onCancel}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!metodoPagamento) {
    return (
      <div className="py-6">
        <h3 className={`text-2xl font-bold mb-6 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Escolha a forma de pagamento
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <button
            onClick={() => setMetodoPagamento('pix')}
            className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
              isLight 
                ? 'bg-white border-gray-200 hover:border-orange-500'
                : 'bg-slate-800/50 border-slate-700 hover:border-orange-500'
            }`}
          >
            <QrCode className="w-12 h-12 mx-auto mb-3 text-orange-500" />
            <p className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>PIX</p>
            <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Aprovação instantânea
            </p>
          </button>

          <button
            onClick={() => setMetodoPagamento('credito')}
            className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
              isLight 
                ? 'bg-white border-gray-200 hover:border-orange-500'
                : 'bg-slate-800/50 border-slate-700 hover:border-orange-500'
            }`}
          >
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-blue-500" />
            <p className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Crédito</p>
            <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Parcelado em até 12x
            </p>
          </button>

          <button
            onClick={() => setMetodoPagamento('debito')}
            className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
              isLight 
                ? 'bg-white border-gray-200 hover:border-orange-500'
                : 'bg-slate-800/50 border-slate-700 hover:border-orange-500'
            }`}
          >
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Débito</p>
            <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Pagamento à vista
            </p>
          </button>
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (metodoPagamento === 'pix') {
    return (
      <div className="max-w-md mx-auto py-6">
        <h3 className={`text-2xl font-bold mb-6 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Pagamento via PIX
        </h3>

        <div className={`p-6 rounded-xl mb-6 ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
          <div className="flex justify-between mb-2">
            <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>Total a pagar:</span>
            <span className={`text-2xl font-bold text-green-500`}>R$ {valorTotal.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={processarPagamentoPix}
          disabled={processando}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 text-lg"
        >
          {processando ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando QR Code...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5 mr-2" />
              Gerar QR Code PIX
            </>
          )}
        </Button>

        <Button variant="outline" onClick={() => setMetodoPagamento(null)} className="w-full mt-3">
          Voltar
        </Button>
      </div>
    );
  }

  if (metodoPagamento === 'credito' || metodoPagamento === 'debito') {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <h3 className={`text-2xl font-bold mb-6 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Pagamento com {metodoPagamento === 'credito' ? 'Cartão de Crédito' : 'Cartão de Débito'}
        </h3>

        <div className={`p-4 rounded-xl mb-6 ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
          <div className="flex justify-between">
            <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>Total:</span>
            <span className="text-xl font-bold text-green-500">R$ {valorTotal.toFixed(2)}</span>
          </div>
        </div>

        <CardPayment
          initialization={{
            amount: valorTotal,
            payer: {
              email: clienteEmail || `${clienteTelefone}@cliente.com`,
            }
          }}
          customization={{
            visual: {
              style: {
                theme: isLight ? 'default' : 'dark',
              }
            },
            paymentMethods: {
              maxInstallments: metodoPagamento === 'credito' ? 12 : 1,
              types: {
                excluded: metodoPagamento === 'credito' ? ['debit_card'] : ['credit_card']
              }
            }
          }}
          onSubmit={handleCardPaymentSubmit}
          onError={(error) => {
            console.error('Erro no formulário:', error);
            toast.error('Erro no formulário de pagamento');
          }}
        />

        <Button 
          variant="outline" 
          onClick={() => setMetodoPagamento(null)} 
          className="w-full mt-6"
          disabled={processando}
        >
          Voltar
        </Button>
      </div>
    );
  }

  return null;
}