import { useEffect, useState } from 'react';

/**
 * Hook para carregar o SDK do Mercado Pago
 */
// Aceita a chave pública como parâmetro (vinda do banco de dados da pizzaria)
// Chave pública de fallback vinda do secret global da plataforma
const FALLBACK_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;

export const useMercadoPago = (publicKey) => {
  const [mp, setMp] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const keyToUse = publicKey || FALLBACK_PUBLIC_KEY;

  const initMP = (key) => {
    try {
      // Remover instância anterior se existir
      if (window._mpInstance) {
        try { window._mpInstance = null; } catch(e) {}
      }
      const mpInstance = new window.MercadoPago(key, { locale: 'pt-BR' });
      window._mpInstance = mpInstance;
      setMp(mpInstance);
      setIsLoaded(true);
      console.log('✅ MercadoPago SDK inicializado com sucesso');
    } catch (e) {
      console.error('Erro ao inicializar MP SDK:', e);
      setIsLoaded(true);
    }
  };

  const loadScript = (key) => {
    // Script já carregado
    if (window.MercadoPago) {
      initMP(key);
      return;
    }

    // Script já sendo carregado - aguardar
    if (document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]')) {
      const interval = setInterval(() => {
        if (window.MercadoPago) {
          clearInterval(interval);
          initMP(key);
        }
      }, 200);
      return () => clearInterval(interval);
    }

    // Carregar script
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      if (window.MercadoPago) initMP(key);
      else {
        console.error('MercadoPago não disponível após carregar script');
        setIsLoaded(true);
      }
    };
    script.onerror = () => {
      console.error('Falha ao carregar SDK do Mercado Pago');
      setIsLoaded(true);
    };
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (!keyToUse) {
      setMp(null);
      setIsLoaded(false); // Manter false até a chave chegar
      return;
    }

    setIsLoaded(false);
    setMp(null);
    loadScript(keyToUse);
  }, [keyToUse]);

  return { mp, isLoaded: isLoaded && !!mp };
};

/**
 * Cria um token de cartão usando o SDK do Mercado Pago
 * @param {Object} mp - Instância do MercadoPago
 * @param {Object} dadosCartao - Dados do cartão
 * @returns {Promise<Object>} Token e informações do cartão
 */
export const criarTokenCartao = async (mp, dadosCartao) => {
  if (!mp) {
    throw new Error('SDK do Mercado Pago não está carregado. Aguarde ou recarregue a página.');
  }

  try {
    const [mes, ano] = dadosCartao.validade.split('/');
    const anoCompleto = ano.length === 2 ? `20${ano}` : ano;

    const cardData = {
      cardNumber: dadosCartao.numero.replace(/\D/g, ''),
      cardholderName: dadosCartao.nome.trim(),
      cardExpirationMonth: mes.padStart(2, '0'),
      cardExpirationYear: anoCompleto,
      securityCode: dadosCartao.cvv,
      identificationType: 'CPF',
      identificationNumber: dadosCartao.cpf.replace(/\D/g, '')
    };

    console.log('Criando token com dados:', { ...cardData, cardNumber: '****', securityCode: '***' });

    // SDK v2: usar fields ou createCardToken conforme disponível
    let response;
    if (typeof mp.createCardToken === 'function') {
      response = await mp.createCardToken(cardData);
    } else {
      throw new Error('Método createCardToken não disponível no SDK. Verifique a chave pública.');
    }

    if (!response || response.status === 'active' === false) {
      const errMsg = response?.cause?.[0]?.description || response?.error || 'Erro ao tokenizar cartão';
      throw new Error(errMsg);
    }

    if (!response.id) {
      const errMsg = response?.cause?.[0]?.description || 'Não foi possível gerar o token do cartão';
      throw new Error(errMsg);
    }

    console.log('✅ Token criado:', response.id);

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
    // Traduzir erros comuns do MP
    const msg = error.message || '';
    if (msg.includes('cardNumber') || msg.includes('card_number')) throw new Error('Número do cartão inválido');
    if (msg.includes('expirationDate') || msg.includes('expiration')) throw new Error('Data de validade inválida');
    if (msg.includes('securityCode') || msg.includes('security_code')) throw new Error('CVV inválido');
    if (msg.includes('identificationNumber')) throw new Error('CPF inválido');
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