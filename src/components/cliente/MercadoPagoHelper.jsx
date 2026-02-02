import { useEffect, useState } from 'react';

/**
 * Hook para carregar o SDK do Mercado Pago
 */
export const useMercadoPago = () => {
  const [mp, setMp] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
    
    // Se não tiver chave pública, não tentar carregar
    if (!publicKey) {
      console.warn('Chave pública do Mercado Pago não configurada');
      return;
    }

    // Verificar se já foi carregado
    if (window.MercadoPago) {
      const mpInstance = new window.MercadoPago(publicKey);
      setMp(mpInstance);
      setIsLoaded(true);
      return;
    }

    // Carregar o script do SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    script.onload = () => {
      if (window.MercadoPago) {
        const mpInstance = new window.MercadoPago(publicKey);
        setMp(mpInstance);
        setIsLoaded(true);
      }
    };

    document.body.appendChild(script);

    return () => {
      // Não remover o script para reutilização
    };
  }, []);

  return { mp, isLoaded };
};

/**
 * Cria um token de cartão usando o SDK do Mercado Pago
 * @param {Object} mp - Instância do MercadoPago
 * @param {Object} dadosCartao - Dados do cartão
 * @returns {Promise<Object>} Token e informações do cartão
 */
export const criarTokenCartao = async (mp, dadosCartao) => {
  if (!mp) {
    throw new Error('SDK do Mercado Pago não está carregado');
  }

  try {
    // Extrair mês e ano da validade
    const [mes, ano] = dadosCartao.validade.split('/');
    const anoCompleto = ano.length === 2 ? `20${ano}` : ano;

    const cardData = {
      cardNumber: dadosCartao.numero.replace(/\s/g, ''),
      cardholderName: dadosCartao.nome,
      cardExpirationMonth: mes,
      cardExpirationYear: anoCompleto,
      securityCode: dadosCartao.cvv,
      identificationType: 'CPF',
      identificationNumber: dadosCartao.cpf.replace(/\D/g, '')
    };

    // Criar token
    const response = await mp.createCardToken(cardData);
    
    if (response.error) {
      throw new Error(response.error.message || 'Erro ao processar cartão');
    }

    return {
      token: response.id,
      payment_method_id: response.payment_method_id,
      last_four_digits: response.last_four_digits,
      first_six_digits: response.first_six_digits,
      cardholder_name: dadosCartao.nome,
      cardholder_cpf: dadosCartao.cpf.replace(/\D/g, '')
    };
  } catch (error) {
    console.error('Erro ao criar token:', error);
    throw error;
  }
};

/**
 * Identifica o método de pagamento com base no número do cartão
 * @param {Object} mp - Instância do MercadoPago
 * @param {string} bin - Primeiros 6 dígitos do cartão
 * @returns {Promise<Object>} Informações do método de pagamento
 */
export const identificarMetodoPagamento = async (mp, bin) => {
  if (!mp || !bin || bin.length < 6) {
    return null;
  }

  try {
    const paymentMethods = await mp.getPaymentMethods({ bin });
    return paymentMethods.results[0] || null;
  } catch (error) {
    console.error('Erro ao identificar método de pagamento:', error);
    return null;
  }
};