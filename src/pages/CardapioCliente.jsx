import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Search,
  Phone,
  User,
  Mail,
  CreditCard,
  Home,
  Navigation,
  Star,
  Tag,
  X,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProductDetailModal from '../components/cliente/ProductDetailModal';
import ProdutoCard from '../components/cliente/ProdutoCard';
import { enviarNotificacaoStatusPedido } from '../components/pedidos/NotificacaoHelper';
import { Toaster, toast } from 'sonner';
import { useMercadoPago, criarTokenCartao } from '../components/cliente/MercadoPagoHelper';
import PixCheckout from '../components/cliente/PixCheckout';

export default function CardapioCliente() {
  const navigate = useNavigate();
  
  // Inicializar pizzariaId da URL imediatamente
  const getInitialPizzariaId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pizzariaParam = urlParams.get('pizzariaId');
    if (pizzariaParam) return pizzariaParam.split('?')[0].split('&')[0].trim();
    
    const savedPizzariaId = localStorage.getItem('pizzaria_id_atual');
    return savedPizzariaId || '697ea8faa6ffe9fc35c32a91'; // Lanchonete 91 como padrão
  };
  
  const [pizzariaId, setPizzariaId] = useState(getInitialPizzariaId);
  const [mpPublicKey, setMpPublicKey] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [showCarrinho, setShowCarrinho] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [tipoCliente, setTipoCliente] = useState(null); // 'cadastrado', 'convidado' ou 'login'
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [clienteLogado, setClienteLogado] = useState(null);
  const [loginData, setLoginData] = useState({ telefone: '', senha: '' });
  const [loginError, setLoginError] = useState('');
  const [cadastroSenha, setCadastroSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const [distanciaEntrega, setDistanciaEntrega] = useState(null); // km da rota real
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState('');
  const [detalhesEntrega, setDetalhesEntrega] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: dados+endereço, 2: pagamento, 3: revisão, 4: pagar
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [metodoPagamentoOnline, setMetodoPagamentoOnline] = useState(''); // 'pix', 'credit_card', 'debit_card', 'vale_refeicao'
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    cpf: '',
    parcelas: 1
  });
  const [pedidoCriado, setPedidoCriado] = useState(null); // pedido criado antes de pagar

  // Obter pizzaria_id da URL se fornecido
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pizzariaParam = urlParams.get('pizzariaId');
    if (pizzariaParam) {
      setPizzariaId(pizzariaParam);
      localStorage.setItem('pizzaria_id_atual', pizzariaParam);
    } else {
      // Tentar recuperar do localStorage
      const savedPizzariaId = localStorage.getItem('pizzaria_id_atual');
      if (savedPizzariaId) {
        setPizzariaId(savedPizzariaId);
      }
    }
  }, []);
  
  const [formCliente, setFormCliente] = useState({
    nome: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: '',
    forma_pagamento: '',
    troco_para: 0,
  });

  useEffect(() => {
    const clienteData = localStorage.getItem('cliente_logado');
    if (clienteData) {
      const cliente = JSON.parse(clienteData);
      setClienteLogado(cliente);
      setFormCliente({
        ...formCliente,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || '',
        cep: cliente.cep || '',
        endereco: cliente.endereco || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
      });
    }
  }, []);

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-cardapio', pizzariaId],
    queryFn: async () => {
      const result = await base44.entities.Produto.filter({ 
        disponivel: true, 
        restaurante_id: pizzariaId 
      }, 'ordem', 500);
      console.log('Produtos encontrados:', result.length, 'para pizzariaId:', pizzariaId);
      return result;
    },
    enabled: !!pizzariaId,
  });

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento', pizzariaId],
    queryFn: () => base44.entities.MetodoPagamento.filter({ 
      ativo: true,
      restaurante_id: pizzariaId 
    }),
    enabled: !!pizzariaId,
  });

  const { data: pizzariaConfigData, isLoading: loadingPizzaria } = useQuery({
    queryKey: ['pizzaria-config', pizzariaId],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('obterConfigPublicaPizzaria', { pizzariaId });
      return data?.pizzaria || null;
    },
    enabled: !!pizzariaId,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const pizzariaConfig = pizzariaConfigData || {};
  const pizzarias = pizzariaConfig.id ? [pizzariaConfig] : [];

  // Inicializar SDK do MP com a chave pública da pizzaria
  const { mp, isLoaded: mpLoaded } = useMercadoPago(mpPublicKey);

  useEffect(() => {
    if (pizzariaConfig?.configuracoes?.mp_public_key) {
      setMpPublicKey(pizzariaConfig.configuracoes.mp_public_key);
    }
  }, [pizzariaConfig?.configuracoes?.mp_public_key]);
  
  // Debug: mostrar erro se pizzaria não encontrada
  if (!loadingPizzaria && pizzarias.length === 0 && pizzariaId) {
    console.error('❌ Pizzaria não encontrada com ID:', pizzariaId);
  }
  const tema = pizzariaConfig.tema_cliente || 'dark';
  const isLight = tema === 'light';
  const corPrimaria = pizzariaConfig.cor_primaria_cliente || '#f97316';
  const logoUrl = pizzariaConfig.logo_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg';
  const nomeExibicao = pizzariaConfig.nome_exibicao_cliente || pizzariaConfig.nome || 'NinjaGO Delivery';

  // Verificar se a loja está aberta
  // O campo manual loja_aberta tem prioridade ABSOLUTA sobre o horário
  const verificarLojaAberta = () => {
    const config = pizzariaConfig.configuracoes || {};

    // Override manual tem prioridade absoluta
    if (config.loja_aberta === true) return true;
    if (config.loja_aberta === false) return false;

    // Sem override: sem horário configurado = aberto por padrão
    if (!pizzariaConfig.horario_abertura || !pizzariaConfig.horario_fechamento) return true;

    const agora = new Date();
    const [hAbr, mAbr] = pizzariaConfig.horario_abertura.split(':').map(Number);
    const [hFech, mFech] = pizzariaConfig.horario_fechamento.split(':').map(Number);
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const minutosAbertura = hAbr * 60 + mAbr;
    const minutosFechamento = hFech * 60 + mFech;
    if (minutosFechamento < minutosAbertura) {
      return minutosAgora >= minutosAbertura || minutosAgora < minutosFechamento;
    }
    return minutosAgora >= minutosAbertura && minutosAgora < minutosFechamento;
  };
  const lojaAberta = verificarLojaAberta();

  const produtosFiltrados = produtos.filter(p => {
    const matchCategoria = categoriaAtiva === 'todos' || p.categoria === categoriaAtiva;
    const matchBusca = !busca || 
      p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  const produtosDestaque = produtos.filter(p => p.destaque);
  const categorias = [...new Set(produtos.map(p => p.categoria))];

  const categoriaLabels = {
    pizza: { nome: 'Pizzas' },
    esfiha: { nome: 'Esfihas' },
    lanche: { nome: 'Lanches' },
    bebida: { nome: 'Bebidas' },
    acai: { nome: 'Açaí' },
    combo: { nome: 'Combos' },
    sobremesa: { nome: 'Sobremesas' },
    porcao: { nome: 'Porções' },
    salgado: { nome: 'Salgados' },
    doce: { nome: 'Doces' },
    outro: { nome: 'Outros' }
  };

  // Agrupar produtos por categoria para exibição em seções
  const produtosPorCategoria = categorias.reduce((acc, cat) => {
    acc[cat] = produtosFiltrados.filter(p => p.categoria === cat);
    return acc;
  }, {});

  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id && !item.personalizacoes);
    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.id === produto.id && !item.personalizacoes ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1, observacao_item: '' }]);
    }
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(carrinho.filter(item => item.id !== produtoId));
  };

  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
    } else {
      setCarrinho(carrinho.map(item =>
        item.id === produtoId ? { ...item, quantidade: novaQuantidade } : item
      ));
    }
  };

  const calcularSubtotal = () => {
    return carrinho.reduce((total, item) => total + ((item.preco_final || item.preco) * item.quantidade), 0);
  };

  const calcularDesconto = () => {
    if (!cupomAplicado) return 0;
    const subtotal = calcularSubtotal();
    
    if (cupomAplicado.tipo === 'desconto_valor') {
      return cupomAplicado.valor_desconto;
    } else if (cupomAplicado.tipo === 'desconto_percentual') {
      return subtotal * (cupomAplicado.valor_desconto / 100);
    } else if (cupomAplicado.tipo === 'entrega_gratis') {
      return taxaEntrega;
    }
    return 0;
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const desconto = calcularDesconto();
    return subtotal + taxaEntrega - desconto;
  };

  // Calcular distância em km entre dois pontos (fórmula Haversine)
  const calcularDistanciaKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Calcular taxa de entrega respeitando as configurações da pizzaria
  const calcularTaxaEntrega = () => {
    const config = pizzariaConfig;
    if (!config?.id) return;

    const subtotal = calcularSubtotal();

    // 1. Verificar entrega grátis por valor mínimo do pedido
    if (config.valor_minimo_entrega_gratis > 0 && subtotal >= config.valor_minimo_entrega_gratis) {
      setTaxaEntrega(0);
      return;
    }

    // 2. Se tem coordenadas do cliente e da pizzaria, calcular distância real
    if (config.latitude && config.longitude && formCliente.latitude && formCliente.longitude) {
      const distanciaKm = calcularDistanciaKm(
        config.latitude, config.longitude,
        formCliente.latitude, formCliente.longitude
      );

      const raioBase = config.raio_entrega_km || 0;

      if (raioBase === 0 || distanciaKm <= raioBase) {
        // Dentro do raio base
        setTaxaEntrega(config.entrega_gratis_dentro_raio_base ? 0 : (config.taxa_entrega_base || 0));
      } else {
        // Fora do raio base
        const kmExtra = distanciaKm - raioBase;
        const taxaExtra = kmExtra * (config.taxa_adicional_por_km || 0);
        setTaxaEntrega((config.taxa_entrega_base || 0) + taxaExtra);
      }
      return;
    }

    // 3. Sem coordenadas do cliente: usar regras básicas da configuração
    if (config.entrega_gratis_dentro_raio_base) {
      setTaxaEntrega(0);
    } else {
      setTaxaEntrega(config.taxa_entrega_base || 0);
    }
  };

  const aplicarCupom = async () => {
    if (!cupomCodigo.trim()) return;

    try {
      const cupons = await base44.entities.ResgatePontos.filter({ 
        codigo_cupom: cupomCodigo.toUpperCase(),
        status: 'ativo',
        cliente_id: clienteLogado?.id
      });

      if (cupons.length === 0) {
        alert('Cupom inválido ou já utilizado');
        return;
      }

      const cupom = cupons[0];
      const hoje = new Date();
      const validade = new Date(cupom.data_validade);

      if (hoje > validade) {
        alert('Este cupom expirou');
        return;
      }

      // Buscar detalhes da recompensa
      const recompensas = await base44.entities.Recompensa.filter({ id: cupom.recompensa_id });
      if (recompensas.length > 0) {
        setCupomAplicado(recompensas[0]);
        alert('Cupom aplicado com sucesso! 🎉');
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      alert('Erro ao aplicar cupom');
    }
  };

  const buscarCep = async () => {
    if (!formCliente.cep || formCliente.cep.length < 8) return;
    
    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${formCliente.cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormCliente(prev => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setBuscandoCep(false);
    }
  };

  // Recalcular taxa apenas quando coordenadas do cliente estiverem disponíveis (via GPS ou após confirmar endereço)
  // Não recalcular automaticamente — o cálculo correto acontece ao clicar em "Continuar para Pagamento"

  const usarLocalizacao = () => {
    setBuscandoLocalizacao(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Chamar função backend para geocodificação reversa
            const { data } = await base44.functions.invoke('geocodificarEndereco', {
              latitude,
              longitude
            });

            if (data.success && data.endereco) {
              setFormCliente(prev => ({
                ...prev,
                cep: data.endereco.cep || prev.cep,
                endereco: data.endereco.logradouro || prev.endereco,
                numero: data.endereco.numero || prev.numero,
                bairro: data.endereco.bairro || prev.bairro,
                cidade: data.endereco.cidade || prev.cidade,
                estado: data.endereco.estado || prev.estado,
                latitude,
                longitude,
              }));
              
              alert('✅ Localização capturada e endereço preenchido automaticamente!');
            } else {
              throw new Error('Não foi possível obter o endereço');
            }
          } catch (error) {
            console.error('Erro ao geocodificar:', error);
            setFormCliente(prev => ({
              ...prev,
              latitude,
              longitude,
            }));
            alert('⚠️ Localização capturada, mas não foi possível obter o endereço automaticamente. Por favor, preencha manualmente.');
          } finally {
            setBuscandoLocalizacao(false);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização. Por favor, digite o endereço manualmente.');
          setBuscandoLocalizacao(false);
        }
      );
    } else {
      alert('Geolocalização não é suportada pelo seu navegador.');
      setBuscandoLocalizacao(false);
    }
  };

  const handleLogin = async () => {
    if (!loginData.telefone || !loginData.senha) {
      setLoginError('Preencha telefone e senha');
      return;
    }

    try {
      const clientes = await base44.entities.Cliente.filter({ telefone: loginData.telefone, pizzaria_id: pizzariaId });
      if (clientes.length === 0 || clientes[0].senha !== loginData.senha) {
        setLoginError('Telefone ou senha incorretos');
        return;
      }

      const cliente = clientes[0];
      // Salvar cliente com pizzaria_id para futuras referências
      const clienteComPizzaria = { ...cliente, pizzaria_id_atual: pizzariaId };
      localStorage.setItem('cliente_logado', JSON.stringify(clienteComPizzaria));
      setClienteLogado(cliente);
      setFormCliente({
        ...formCliente,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || '',
        cep: cliente.cep || '',
        endereco: cliente.endereco || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
      });
      setTipoCliente('cadastrado');
      setLoginError('');
    } catch (error) {
      setLoginError('Erro ao fazer login');
    }
  };

  // Cria o cliente se necessário e retorna
  const salvarCliente = async () => {
    if (tipoCliente === 'cadastrado') {
      if (clienteLogado) {
        await base44.entities.Cliente.update(clienteLogado.id, {
          nome: formCliente.nome,
          telefone: formCliente.telefone,
          email: formCliente.email,
          cep: formCliente.cep,
          endereco: formCliente.endereco,
          numero: formCliente.numero,
          complemento: formCliente.complemento,
          bairro: formCliente.bairro,
          cidade: formCliente.cidade,
          estado: formCliente.estado,
          total_pedidos: (clienteLogado.total_pedidos || 0) + 1,
          pontos_fidelidade: (clienteLogado.pontos_fidelidade || 0) + Math.floor(calcularSubtotal()),
        });
      } else {
        const clientesExistentes = await base44.entities.Cliente.filter({ telefone: formCliente.telefone, pizzaria_id: pizzariaId });
        if (clientesExistentes.length > 0) {
          alert('Já existe uma conta com este telefone. Faça login.');
          return false;
        }
        const novoCliente = await base44.entities.Cliente.create({
          pizzaria_id: pizzariaId,
          nome: formCliente.nome,
          telefone: formCliente.telefone,
          senha: cadastroSenha,
          email: formCliente.email,
          cep: formCliente.cep,
          endereco: formCliente.endereco,
          numero: formCliente.numero,
          complemento: formCliente.complemento,
          bairro: formCliente.bairro,
          cidade: formCliente.cidade,
          estado: formCliente.estado,
          latitude: formCliente.latitude,
          longitude: formCliente.longitude,
          total_pedidos: 1,
          pontos_fidelidade: Math.floor(calcularSubtotal()),
        });
        localStorage.setItem('cliente_logado', JSON.stringify({ ...novoCliente, pizzaria_id_atual: pizzariaId }));
      }
    }
    return true;
  };

  // Cria o pedido no banco e retorna o objeto
  const criarPedido = async (formaPagamento) => {
    const itensMapeados = carrinho.map(item => {
      let observacaoItem = item.observacao_item || '';
      if (item.personalizacoes) {
        const detalhes = [];
        Object.keys(item.personalizacoes).forEach(grupoKey => {
          const grupoIndex = parseInt(grupoKey.split('_')[1]);
          const grupo = item.opcoes_personalizacao?.[grupoIndex];
          if (grupo && item.personalizacoes[grupoKey].length > 0) {
            detalhes.push(`${grupo.nome_grupo}: ${item.personalizacoes[grupoKey].map(s => s.item.nome).join(', ')}`);
          }
        });
        observacaoItem = [detalhes.join(' | '), observacaoItem].filter(Boolean).join(' • ');
      }
      return { produto_id: item.id, nome: item.nome, quantidade: item.quantidade, preco_unitario: item.preco_final || item.preco, observacao: observacaoItem };
    });

    // Gerar número sequencial do dia para esta pizzaria
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const pedidosHoje = await base44.entities.Pedido.filter({ pizzaria_id: pizzariaId }, '-created_date', 500);
    const pedidosHojeFiltrados = pedidosHoje.filter(p => {
      const dataPedido = new Date(p.created_date);
      dataPedido.setHours(0, 0, 0, 0);
      return dataPedido.getTime() === hoje.getTime();
    });
    let proximoNumero = 1;
    if (pedidosHojeFiltrados.length > 0) {
      const numeros = pedidosHojeFiltrados
        .map(p => parseInt(p.numero_pedido))
        .filter(n => Number.isFinite(n) && n > 0);
      if (numeros.length > 0) {
        proximoNumero = Math.max(...numeros) + 1;
      }
    }
    const numeroPedido = proximoNumero.toString().padStart(2, '0');

    return await base44.entities.Pedido.create({
      pizzaria_id: pizzariaId,
      numero_pedido: numeroPedido,
      tipo_pedido: 'delivery',
      cliente_nome: formCliente.nome,
      cliente_telefone: formCliente.telefone,
      cliente_cep: formCliente.cep,
      cliente_endereco: formCliente.endereco,
      cliente_numero: formCliente.numero,
      cliente_bairro: formCliente.bairro,
      cliente_cidade: formCliente.cidade,
      cliente_estado: formCliente.estado,
      cliente_complemento: formCliente.complemento,
      latitude: formCliente.latitude,
      longitude: formCliente.longitude,
      itens: itensMapeados,
      valor_produtos: calcularSubtotal(),
      taxa_entrega: taxaEntrega,
      desconto: calcularDesconto(),
      valor_total: calcularTotal(),
      forma_pagamento: formaPagamento,
      troco_para: formCliente.troco_para || 0,
      status: 'novo',
      status_pagamento: 'pendente',
      observacoes: formCliente.observacoes,
      horario_pedido: new Date().toISOString(),
      origem: 'site',
    });
  };

  // Confirmar pedido na tela de revisão — cria pedido e avança para pagamento ou redireciona
  const confirmarPedido = async () => {
    setProcessandoPagamento(true);
    try {
      const clienteOk = await salvarCliente();
      if (!clienteOk) { setProcessandoPagamento(false); return; }

      const isPix = metodoPagamentoOnline === 'pix';
      const formaPagFinal = isPix ? 'pix' : formCliente.forma_pagamento;

      const novoPedido = await criarPedido(formaPagFinal);
      setPedidoCriado(novoPedido);

      if (isPix) {
        // Avança para tela de pagamento PIX
        setCheckoutStep(4);
      } else {
        await enviarNotificacaoStatusPedido(novoPedido, 'novo');
        // Mostra tela de aguarde antes de redirecionar
        setCheckoutStep(5);
        setTimeout(() => {
          navigate(createPageUrl('AcompanharPedido') + `?id=${novoPedido.id}&pizzaria_id=${pizzariaId}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      alert('Erro ao confirmar pedido. Tente novamente.');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  const handleProductClick = (produto) => {
    setSelectedProduct(produto);
    setShowProductDetail(true);
  };

  // Componente de Card de Produto
  const ProdutoCardWrapper = ({ produto }) => (
    <ProdutoCard
      produto={produto}
      onClick={handleProductClick}
      onAddCart={adicionarAoCarrinho}
      tema={tema}
      corPrimaria={corPrimaria}
    />
  );

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}
      style={{ '--cor-primaria': corPrimaria }}>
      <Toaster position="top-center" richColors />
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl ${isLight ? 'bg-white/95 border-gray-200' : 'bg-slate-900/95 border-white/10'} border-b shadow-lg`}>
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img 
                src={logoUrl}
                alt="Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className={`text-base sm:text-lg font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{nomeExibicao}</h1>
                <p className={`text-xs hidden sm:block ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Peça agora e receba rapidinho! 🥷</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {clienteLogado && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(createPageUrl('NotificacoesCliente'))}
                  className={`p-2 relative ${isLight ? 'text-gray-700' : 'text-white'}`}
                >
                  <Bell className="w-5 h-5" />
                </Button>
              )}
              {clienteLogado ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(createPageUrl('PerfilCliente'))}
                  className={`p-2 ${isLight ? 'text-gray-700' : 'text-white'}`}
                >
                  <User className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(createPageUrl('AcessoCliente'))}
                  className={`p-2 ${isLight ? 'text-gray-700' : 'text-white'}`}
                >
                  <User className="w-5 h-5" />
                </Button>
              )}
              <button
                onClick={() => setShowCarrinho(true)}
                className="relative p-2.5 sm:p-3 rounded-lg transition-transform active:scale-95"
                style={{ backgroundColor: corPrimaria }}
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                {carrinho.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {carrinho.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-6">
        {/* Banner loja fechada */}
        {pizzariaConfig.id && !lojaAberta && (
          <div className="mb-4 p-4 rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center gap-4">
            <span className="text-3xl">🔒</span>
            <div>
              <p className={`font-bold text-lg ${isLight ? 'text-red-700' : 'text-red-300'}`}>Loja Fechada no Momento</p>
              <p className={`text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                Funcionamento: {pizzariaConfig.horario_abertura} às {pizzariaConfig.horario_fechamento}. Volte em breve!
              </p>
            </div>
          </div>
        )}

        {/* Mensagem de erro se pizzaria não encontrada */}
        {!loadingPizzaria && pizzarias.length === 0 && pizzariaId && (
          <div className="text-center py-12 px-4">
            <div className="text-6xl mb-4">😕</div>
            <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Estabelecimento não encontrado
            </h2>
            <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              O link que você acessou pode estar incorreto ou o estabelecimento não está mais ativo.
            </p>
            <p className={`text-sm mt-4 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
              ID buscado: {pizzariaId}
            </p>
          </div>
        )}

        {/* Mensagem se não há produtos */}
        {!loadingProdutos && produtos.length === 0 && pizzarias.length > 0 && !busca && (
          <div className="text-center py-12 px-4">
            <div className="text-6xl mb-4">📦</div>
            <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Cardápio em breve
            </h2>
            <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Este estabelecimento ainda não cadastrou produtos no cardápio.
            </p>
          </div>
        )}

        {/* Conteúdo normal (apenas se tiver pizzaria e produtos) */}
        {pizzarias.length > 0 && (produtos.length > 0 || busca) && (
          <>
        {/* Busca Otimizada Mobile */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-400'}`} />
            <Input
              placeholder="🔍 Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`pl-11 pr-10 h-12 sm:h-14 text-base rounded-xl shadow-md ${
                isLight 
                  ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400' 
                  : 'bg-white/10 border-white/20 text-white placeholder:text-slate-400 backdrop-blur-xl'
              }`}
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              >
                <X className={`w-4 h-4 ${isLight ? 'text-gray-400 hover:text-gray-600' : 'text-slate-400 hover:text-white'}`} />
              </button>
            )}
          </div>
          {busca && (
            <p className={`mt-2 text-xs sm:text-sm px-1 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              {produtosFiltrados.length} resultado(s)
            </p>
          )}
        </motion.div>

        {/* Abas de Categorias Mobile */}
        <div className="mb-4 sticky top-[60px] sm:top-[72px] z-40 backdrop-blur-xl pb-3 -mx-3 px-3" 
          style={{ backgroundColor: isLight ? 'rgba(249, 250, 251, 0.95)' : 'rgba(2, 6, 23, 0.95)' }}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-proximity">
            <button
              onClick={() => setCategoriaAtiva('todos')}
              className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all whitespace-nowrap font-medium text-sm sm:text-base shadow-sm snap-start ${
                categoriaAtiva === 'todos'
                  ? 'text-white shadow-md scale-105'
                  : isLight
                    ? 'bg-white text-gray-700 active:bg-gray-50 border border-gray-200'
                    : 'bg-white/10 text-slate-300 active:bg-white/15 border border-white/10'
              }`}
              style={categoriaAtiva === 'todos' ? { backgroundColor: corPrimaria } : {}}
            >
              Todos
            </button>
            
            {produtosDestaque.length > 0 && (
              <button
                onClick={() => {
                  setCategoriaAtiva('todos');
                  setTimeout(() => {
                    document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all whitespace-nowrap font-medium text-sm sm:text-base flex items-center gap-1.5 shadow-sm snap-start ${
                  isLight 
                    ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-2 border-yellow-300' 
                    : 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 border-2 border-yellow-500/50'
                }`}
              >
                <Star className="w-4 h-4 fill-current" />
                Destaque
              </button>
            )}
            
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoriaAtiva(cat);
                  setTimeout(() => {
                    document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all whitespace-nowrap font-medium text-sm sm:text-base shadow-sm snap-start ${
                  categoriaAtiva === cat
                    ? 'text-white shadow-md scale-105'
                    : isLight
                      ? 'bg-white text-gray-700 active:bg-gray-50 border border-gray-200'
                      : 'bg-white/10 text-slate-300 active:bg-white/15 border border-white/10'
                }`}
                style={categoriaAtiva === cat ? { backgroundColor: corPrimaria } : {}}
              >
                {categoriaLabels[cat]?.nome || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Produtos em Destaque */}
        {produtosDestaque.length > 0 && (
          <div id="destaques" className="mb-6 sm:mb-8">
            <h2 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 px-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              Em Destaque
            </h2>
            <div className="md:grid md:grid-cols-3 gap-4 hidden">
              {produtosDestaque.map((produto) => (
                <motion.div
                  key={produto.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleProductClick(produto)}
                  className={`rounded-2xl p-6 relative overflow-hidden cursor-pointer ${
                    isLight 
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200'
                      : 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50'
                  }`}
                >
                  <Badge className="absolute top-4 right-4 bg-yellow-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Destaque
                  </Badge>
                  {produto.imagem_url && (
                    <img src={produto.imagem_url} alt={produto.nome} className="w-full h-64 object-cover rounded-xl mb-4" />
                  )}
                  <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>{produto.nome}</h3>
                  <p className={`text-sm mb-4 line-clamp-2 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>{produto.descricao}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-emerald-500">R$ {produto.preco?.toFixed(2)}</p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        adicionarAoCarrinho(produto);
                      }}
                      className="text-white"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Carrossel Mobile Otimizado */}
            <div className="flex md:hidden gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-3 px-3">
              {produtosDestaque.map((produto) => (
                <div
                  key={produto.id}
                  onClick={() => handleProductClick(produto)}
                  className={`flex-shrink-0 w-[80vw] rounded-xl p-4 relative overflow-hidden active:scale-95 transition-transform snap-center ${
                    isLight 
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200'
                      : 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50'
                  }`}
                >
                  <Badge className="absolute top-3 right-3 bg-yellow-500 text-white text-xs">
                    <Star className="w-3 h-3" />
                  </Badge>
                  {produto.imagem_url && (
                    <img src={produto.imagem_url} alt={produto.nome} className="w-full h-40 object-cover rounded-lg mb-3" />
                  )}
                  <h3 className={`text-base font-bold mb-1 line-clamp-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{produto.nome}</h3>
                  <p className={`text-xs mb-3 line-clamp-2 ${isLight ? 'text-gray-600' : 'text-slate-300'}`}>{produto.descricao}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-emerald-500">R$ {produto.preco?.toFixed(2)}</p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        adicionarAoCarrinho(produto);
                      }}
                      className="text-white h-8 w-8 p-0"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Produtos por Categoria */}
        {busca ? (
          /* Resultados da Busca */
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Resultados da Busca
            </h2>
            {produtosFiltrados.length === 0 ? (
              <div className={`text-center py-16 ${isLight ? 'bg-white' : 'bg-white/5'} rounded-2xl`}>
                <Search className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
                <p className={`text-lg ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                  Nenhum produto encontrado para "{busca}"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {produtosFiltrados.map((produto) => (
                  <ProdutoCardWrapper key={produto.id} produto={produto} />
                ))}
              </div>
            )}
          </div>
        ) : categoriaAtiva === 'todos' ? (
          /* Todas as Categorias */
          <div className="space-y-12">
            {categorias.map((cat) => {
              const produtosCat = produtosPorCategoria[cat] || [];
              if (produtosCat.length === 0) return null;
              
              return (
                <motion.section
                  key={cat}
                  id={`cat-${cat}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="scroll-mt-32"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {categoriaLabels[cat]?.nome || cat}
                    </h2>
                    <div className={`h-1 flex-1 rounded-full ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {produtosCat.map((produto) => (
                   <ProdutoCardWrapper key={produto.id} produto={produto} />
                  ))}
                  </div>
                </motion.section>
              );
            })}
          </div>
        ) : (
          /* Categoria Específica */
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <h2 className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {categoriaLabels[categoriaAtiva]?.nome || categoriaAtiva}
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {produtosFiltrados.map((produto) => (
                <ProdutoCardWrapper key={produto.id} produto={produto} />
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* Modal de Detalhes do Produto */}
      <ProductDetailModal
        produto={selectedProduct}
        open={showProductDetail}
        onClose={() => {
          setShowProductDetail(false);
          setSelectedProduct(null);
        }}
        onAddToCart={adicionarAoCarrinho}
        tema={tema}
      />

      {/* Modal do Carrinho */}
      <Dialog open={showCarrinho} onOpenChange={setShowCarrinho}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
              Seu Carrinho
            </DialogTitle>
          </DialogHeader>

          {carrinho.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              {/* Área dos itens com scroll */}
              <div className="overflow-y-auto space-y-4 pr-1" style={{ maxHeight: 'calc(60vh - 120px)' }}>
              {carrinho.map((item, idx) => {
                // Montar descrição das personalizações
                const linhasPersonalizacao = [];
                if (item.personalizacoes && item.opcoes_personalizacao) {
                  Object.keys(item.personalizacoes).forEach(grupoKey => {
                    const grupoIndex = parseInt(grupoKey.split('_')[1]);
                    const grupo = item.opcoes_personalizacao[grupoIndex];
                    const sels = item.personalizacoes[grupoKey] || [];
                    sels.forEach(s => {
                      linhasPersonalizacao.push({
                        nome: s.item.nome,
                        preco: s.item.preco_adicional || 0,
                        comPreco: grupo?.permite_precificacao && s.item.preco_adicional > 0
                      });
                    });
                  });
                }

                return <div key={`${item.id}-${idx}`} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{item.nome}</h3>
                      <p className="text-slate-400 text-xs">R$ {(item.preco)?.toFixed(2)}</p>
                      {linhasPersonalizacao.map((l, i) => (
                        <p key={i} className="text-xs text-slate-400">
                          + {l.nome}{l.comPreco ? ` — R$ ${l.preco.toFixed(2)}` : ' — R$ 0,00'}
                        </p>
                      ))}
                      <p className="text-emerald-400 font-semibold text-sm mt-1">
                        Subtotal: R$ {(item.preco_final || item.preco)?.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                        className="border-slate-600 h-8 w-8"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center font-bold text-white">{item.quantidade}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                        className="border-slate-600 h-8 w-8"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removerDoCarrinho(item.id)}
                      className="text-red-400 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* Observação por item */}
                  <input
                    type="text"
                    value={item.observacao_item || ''}
                    onChange={(e) => setCarrinho(prev => prev.map((c, i) => i === idx ? { ...c, observacao_item: e.target.value } : c))}
                    placeholder="📝 Observação (ex: sem cebola, bem passado...)"
                    className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>;
              })}

              </div>{/* fim scroll area */}

              {/* Rodapé fixo */}
              <div className="border-t border-white/10 pt-4 space-y-2 mt-2">
                <div className="flex justify-between text-lg">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white font-semibold">R$ {calcularSubtotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 italic">* Taxa de entrega calculada após confirmar endereço</p>
              </div>

              <Button
                onClick={() => {
                  if (!lojaAberta) {
                    alert(`🔒 A loja está fechada no momento.\nHorário de funcionamento: ${pizzariaConfig.horario_abertura} às ${pizzariaConfig.horario_fechamento}`);
                    return;
                  }
                  setShowCarrinho(false);
                  setTaxaEntrega(0);
                  setDistanciaEntrega(null);
                  setErroFrete('');
                  setDetalhesEntrega(null);
                  setCheckoutStep(1);
                  setShowCheckout(true);
                }}
                className={`w-full h-14 text-lg font-bold ${!lojaAberta ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}
              >
                {!lojaAberta ? '🔒 Loja Fechada' : 'Finalizar Pedido'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Finalizar Pedido</span>
              {checkoutStep > 1 && (
                <div className="flex items-center gap-2 text-sm font-normal text-slate-400">
                  {checkoutStep === 2 && <span>Passo 2 de 3</span>}
                  {checkoutStep === 3 && <span>Passo 3 de 3 - Revisão</span>}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Escolha do Tipo de Cliente */}
            {!tipoCliente && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-white">Como deseja continuar?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setTipoCliente('cadastrado');
                      // Limpar formulário para novo cadastro (ignorar dados do cliente logado)
                      setFormCliente({
                        nome: '', telefone: '', email: '', cep: '', endereco: '',
                        numero: '', complemento: '', bairro: '', cidade: '', estado: '',
                        observacoes: '', forma_pagamento: '', troco_para: 0,
                      });
                      setClienteLogado(null);
                    }}
                    className="p-6 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                  >
                    <User className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
                    <p className="font-bold text-white mb-1">Novo Cadastro</p>
                    <p className="text-sm text-slate-400">Ganhe pontos de fidelidade</p>
                  </button>
                  <button
                    onClick={() => setTipoCliente('convidado')}
                    className="p-6 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition-all"
                  >
                    <User className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                    <p className="font-bold text-white mb-1">Como Convidado</p>
                    <p className="text-sm text-slate-400">Compra rápida</p>
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => setTipoCliente('login')}
                    className="text-orange-400 hover:text-orange-300 font-medium underline"
                  >
                    Já possuo cadastro - Fazer Login
                  </button>
                </div>
              </div>
            )}

            {/* Login */}
            {tipoCliente === 'login' && (
              <div className="space-y-4 p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                <h3 className="font-semibold text-white text-lg mb-4">Login</h3>
                {loginError && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                    {loginError}
                  </div>
                )}
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={loginData.telefone}
                    onChange={(e) => setLoginData({ ...loginData, telefone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={loginData.senha}
                    onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Digite sua senha"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setTipoCliente(null);
                      setLoginError('');
                      setLoginData({ telefone: '', senha: '' });
                    }}
                    variant="outline"
                    className="flex-1 border-slate-600"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleLogin}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                  >
                    Entrar
                  </Button>
                </div>
              </div>
            )}

            {/* Formulário */}
            {tipoCliente && tipoCliente !== 'login' && (
              <>
                {/* Resumo do Pedido (sempre visível) */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Resumo do Pedido
                    </h3>
                    <button 
                      onClick={() => setShowCheckout(false)}
                      className="text-orange-400 text-sm hover:underline"
                    >
                      Editar carrinho
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {carrinho.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.quantidade}x {item.nome}</span>
                        <span className="text-white font-medium">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="text-white font-semibold">R$ {calcularSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Taxa de entrega:</span>
                      <span className={`font-semibold ${checkoutStep === 1 ? 'text-slate-500 italic' : taxaEntrega === 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {checkoutStep === 1 ? 'A calcular após endereço' : taxaEntrega === 0 ? 'GRÁTIS' : `R$ ${taxaEntrega.toFixed(2)}`}
                      </span>
                    </div>
                    {distanciaEntrega && checkoutStep > 1 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Distância (rota):</span>
                        <span className="text-slate-400">{distanciaEntrega} km</span>
                      </div>
                    )}
                    {cupomAplicado && (
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Desconto:</span>
                        <span className="text-emerald-400 font-semibold">- R$ {calcularDesconto().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                      <span className="text-white">Total:</span>
                      <span className="text-emerald-400">R$ {calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {checkoutStep === 1 && (
                  <>
                    <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                      <h3 className="font-semibold text-white">Seus Dados</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Completo</Label>
                      <Input
                        value={formCliente.nome}
                        onChange={(e) => setFormCliente({ ...formCliente, nome: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        disabled={!!clienteLogado}
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={formCliente.telefone}
                        onChange={(e) => setFormCliente({ ...formCliente, telefone: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="(00) 00000-0000"
                        disabled={!!clienteLogado}
                      />
                    </div>
                    {tipoCliente === 'cadastrado' && (
                      <>
                        <div className="col-span-2">
                          <Label>Email (opcional)</Label>
                          <Input
                            type="email"
                            value={formCliente.email}
                            onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                        {!clienteLogado && (
                          <>
                            <div>
                              <Label>Criar Senha</Label>
                              <Input
                                type="password"
                                value={cadastroSenha}
                                onChange={(e) => setCadastroSenha(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Crie uma senha"
                              />
                            </div>
                            <div>
                              <Label>Confirmar Senha</Label>
                              <Input
                                type="password"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Confirme a senha"
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Endereço de Entrega</h3>
                    <Button
                      size="sm"
                      onClick={usarLocalizacao}
                      disabled={buscandoLocalizacao}
                      variant="outline"
                      className="border-slate-600"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      {buscandoLocalizacao ? 'Buscando...' : 'Usar Localização'}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>CEP</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formCliente.cep}
                          onChange={(e) => setFormCliente({ ...formCliente, cep: e.target.value })}
                          onBlur={buscarCep}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>Endereço</Label>
                      <Input
                        value={formCliente.endereco}
                        onChange={(e) => setFormCliente({ ...formCliente, endereco: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={formCliente.numero}
                        onChange={(e) => setFormCliente({ ...formCliente, numero: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input
                        value={formCliente.bairro}
                        onChange={(e) => setFormCliente({ ...formCliente, bairro: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={formCliente.cidade}
                        onChange={(e) => setFormCliente({ ...formCliente, cidade: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Complemento (opcional)</Label>
                      <Input
                        value={formCliente.complemento}
                        onChange={(e) => setFormCliente({ ...formCliente, complemento: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Apto, bloco, etc."
                      />
                    </div>
                      </div>
                    </div>

                    {erroFrete && (
                      <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                        ⚠️ {erroFrete}
                      </div>
                    )}

                    {distanciaEntrega && detalhesEntrega && !erroFrete && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm space-y-1">
                        <p className="text-emerald-300 font-semibold">✅ Endereço calculado com sucesso</p>
                        <p className="text-slate-300">📍 Distância por rota: <strong>{distanciaEntrega} km</strong></p>
                        {detalhesEntrega.dentro_raio_base ? (
                          <p className="text-slate-300">Taxa de entrega: <strong className="text-white">R$ {taxaEntrega.toFixed(2)}</strong> (dentro do raio base de {detalhesEntrega.raio_base} km)</p>
                        ) : (
                          <p className="text-slate-300">
                            Taxa: R$ {detalhesEntrega.taxa_base.toFixed(2)} base + {detalhesEntrega.km_cobrado} km cobrados × R$ {detalhesEntrega.taxa_adicional_por_km.toFixed(2)} = <strong className="text-white">R$ {taxaEntrega.toFixed(2)}</strong>
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={async () => {
                        if (!formCliente.cep || !formCliente.endereco || !formCliente.numero) {
                          alert('Preencha o endereço completo (CEP, endereço e número)');
                          return;
                        }

                        setCalculandoFrete(true);
                        setErroFrete('');
                        setDistanciaEntrega(null);
                        setDetalhesEntrega(null);

                        try {
                          // Passo 1: Geocodificar endereço do cliente
                          let latCliente = formCliente.latitude;
                          let lngCliente = formCliente.longitude;

                          if (!latCliente || !lngCliente) {
                            const enderecoCompleto = `${formCliente.endereco}, ${formCliente.numero}, ${formCliente.bairro}, ${formCliente.cidade}, ${formCliente.estado}, ${formCliente.cep}, Brasil`;
                            const { data: geoData } = await base44.functions.invoke('geocodificarEndereco', { endereco: enderecoCompleto });
                            if (geoData?.success && geoData?.latitude && geoData?.longitude) {
                              // Se a precisão for apenas "cidade", não usar para calcular rota (evita distância errada)
                              if (geoData.precisao === 'cidade') {
                                console.warn('[checkout] Geocodificação retornou apenas cidade — usando taxa base sem cálculo de rota');
                                setTaxaEntrega(Number(pizzariaConfig.taxa_entrega_base) || 0);
                                setCheckoutStep(2);
                                setCalculandoFrete(false);
                                return;
                              }
                              latCliente = geoData.latitude;
                              lngCliente = geoData.longitude;
                              setFormCliente(prev => ({ ...prev, latitude: geoData.latitude, longitude: geoData.longitude }));
                            } else {
                              // Falha total: usar taxa base e deixar continuar
                              console.warn('[checkout] Geocodificação falhou — usando taxa base');
                              setTaxaEntrega(Number(pizzariaConfig.taxa_entrega_base) || 0);
                              setCheckoutStep(2);
                              setCalculandoFrete(false);
                              return;
                            }
                          }

                          // Passo 2: Verificar valor mínimo para entrega grátis
                          const config = pizzariaConfig;
                          const subtotal = calcularSubtotal();
                          if (config.valor_minimo_entrega_gratis > 0 && subtotal >= Number(config.valor_minimo_entrega_gratis)) {
                            setTaxaEntrega(0);
                            setDistanciaEntrega(null);
                            setDetalhesEntrega({ dentro_raio_base: true, raio_base: 0, taxa_base: 0, km_excedente: 0, valor_adicional: 0 });
                            setCheckoutStep(2);
                            return;
                          }

                          // Passo 3: Se a pizzaria tem coordenadas, calcular rota real
                          if (config.latitude && config.longitude) {
                            const { data: rotaData } = await base44.functions.invoke('calcularRotaEntrega', {
                              origemLat: config.latitude,
                              origemLng: config.longitude,
                              destinoLat: latCliente,
                              destinoLng: lngCliente,
                              pizzariaId: pizzariaId
                            });

                            if (!rotaData?.success) {
                              setErroFrete(rotaData?.error || 'Erro ao calcular rota. Tente novamente.');
                              setCalculandoFrete(false);
                              return;
                            }

                            if (rotaData.foraAreaEntrega) {
                              setErroFrete(rotaData.erro || 'Endereço fora da área de entrega.');
                              setCalculandoFrete(false);
                              return;
                            }

                            setDistanciaEntrega(rotaData.distanciaKm);
                            setTaxaEntrega(rotaData.taxaEntrega ?? (Number(config.taxa_entrega_base) || 0));
                            setDetalhesEntrega(rotaData.detalhes);
                          } else {
                            // Pizzaria sem coordenadas: usar taxa base
                            setTaxaEntrega(Number(config.taxa_entrega_base) || 0);
                          }

                          setCheckoutStep(2);
                        } catch (e) {
                          console.error('Erro ao calcular frete:', e);
                          setErroFrete('Erro ao calcular frete. Verifique o endereço e tente novamente.');
                        } finally {
                          setCalculandoFrete(false);
                        }
                      }}
                      disabled={calculandoFrete}
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 disabled:opacity-60"
                    >
                      {calculandoFrete ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Calculando frete...
                        </span>
                      ) : 'Continuar para Pagamento'}
                    </Button>
                  </>
                )}

                {checkoutStep === 2 && (
                  <>
                    {/* Pagamento Online - Opções */}
                    <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                      <h3 className="font-semibold text-white">Forma de Pagamento</h3>

                      {/* PIX online */}
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => { setMetodoPagamentoOnline('pix'); setFormCliente({ ...formCliente, forma_pagamento: 'online' }); }}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            metodoPagamentoOnline === 'pix'
                              ? 'border-orange-500 bg-orange-500/20'
                              : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-3xl mb-1">🔳</div>
                          <p className="font-bold text-white text-sm">PIX</p>
                          <p className="text-xs text-slate-400 mt-0.5">Aprovação instantânea • Pague agora</p>
                        </button>
                      </div>

                      {/* Pagar na entrega */}
                      <div className="border-t border-slate-700 pt-4">
                        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide">Pagar na entrega</p>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { id: 'pagar_na_entrega', label: '💵 Dinheiro' },
                            { id: 'cartao_credito', label: '💳 Crédito (maquininha)' },
                            { id: 'cartao_debito', label: '💳 Débito (maquininha)' },
                            ...formasPagamento
                              .filter(f => !['pix','cartao_credito','cartao_debito','online','vale_refeicao'].includes(f.tipo))
                              .map(f => ({ id: f.tipo, label: f.nome }))
                          ].map(({ id, label }) => (
                            <button
                              key={id}
                              onClick={() => { setFormCliente({ ...formCliente, forma_pagamento: id }); setMetodoPagamentoOnline(''); }}
                              className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                                formCliente.forma_pagamento === id && !metodoPagamentoOnline
                                  ? 'border-orange-500 bg-orange-500/20 text-white'
                                  : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Troco se pagar na entrega com dinheiro */}
                      {formCliente.forma_pagamento === 'pagar_na_entrega' && !metodoPagamentoOnline && (
                        <div className="space-y-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                          <Label className="text-white">Precisa de troco?</Label>
                          <Select
                            value={formCliente.troco_para !== 0 ? 'sim' : 'nao'}
                            onValueChange={(v) => setFormCliente({ ...formCliente, troco_para: v === 'sim' ? '' : 0 })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="nao">Não preciso de troco</SelectItem>
                              <SelectItem value="sim">Sim, preciso de troco</SelectItem>
                            </SelectContent>
                          </Select>
                          {formCliente.troco_para !== 0 && (
                            <div>
                              <Label>Troco para quanto?</Label>
                              <Input type="number" value={formCliente.troco_para || ''} onChange={(e) => setFormCliente({ ...formCliente, troco_para: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border-slate-700 text-white" placeholder="Ex: 50.00" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cupom */}
                    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Tag className="w-5 h-5 text-emerald-400" /> Cupom de Desconto
                      </h3>
                      {cupomAplicado ? (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
                          <div>
                            <p className="font-bold text-emerald-300">{cupomAplicado.titulo}</p>
                            <p className="text-sm text-emerald-400">Desconto: R$ {calcularDesconto().toFixed(2)}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => { setCupomAplicado(null); setCupomCodigo(''); }} className="text-red-400">Remover</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input value={cupomCodigo} onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())} className="bg-slate-800 border-slate-700 text-white" placeholder="Código do cupom" />
                          <Button onClick={aplicarCupom} variant="outline" className="border-emerald-500/50 text-emerald-400">Aplicar</Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Observações (opcional)</Label>
                      <Textarea value={formCliente.observacoes} onChange={(e) => setFormCliente({ ...formCliente, observacoes: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Alguma observação sobre o pedido?" rows={2} />
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={() => setCheckoutStep(1)} variant="outline" className="flex-1 border-slate-600">Voltar</Button>
                      <Button
                        onClick={() => {
                          const temPagamento = metodoPagamentoOnline || formCliente.forma_pagamento;
                          if (!temPagamento) { alert('Selecione uma forma de pagamento'); return; }
                          setCheckoutStep(3);
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                      >
                        Revisar Pedido
                      </Button>
                    </div>
                  </>
                )}

                {checkoutStep === 3 && (
                  <>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <h3 className="font-semibold text-white mb-3">📍 Endereço de Entrega</h3>
                        <p className="text-slate-300">{formCliente.endereco}, {formCliente.numero}{formCliente.complemento && ` - ${formCliente.complemento}`}</p>
                        <p className="text-slate-300">{formCliente.bairro} - {formCliente.cidade}/{formCliente.estado}</p>
                        <p className="text-slate-400 text-sm">CEP: {formCliente.cep}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <h3 className="font-semibold text-white mb-3">💳 Pagamento</h3>
                        <p className="text-slate-300">
                          {metodoPagamentoOnline === 'pix' ? '🔳 PIX (online)' :
                           formCliente.forma_pagamento === 'pagar_na_entrega' ? '💵 Dinheiro na entrega' :
                           formCliente.forma_pagamento === 'cartao_credito' ? '💳 Crédito na entrega (maquininha)' :
                           formCliente.forma_pagamento === 'cartao_debito' ? '💳 Débito na entrega (maquininha)' :
                           formCliente.forma_pagamento}
                        </p>
                        {formCliente.troco_para > 0 && <p className="text-slate-400 text-sm">Troco para: R$ {formCliente.troco_para.toFixed(2)}</p>}
                      </div>

                      {formCliente.observacoes && (
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                          <h3 className="font-semibold text-white mb-2">📝 Observações</h3>
                          <p className="text-slate-300">{formCliente.observacoes}</p>
                        </div>
                      )}
                    </div>

                    {tipoCliente === 'convidado' && (
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm text-yellow-300">⚠️ Comprando como convidado, você não acumula pontos no programa de fidelidade.</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button onClick={() => setCheckoutStep(2)} variant="outline" className="flex-1 border-slate-600">Voltar</Button>
                      <Button
                        onClick={confirmarPedido}
                        disabled={processandoPagamento}
                        className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-bold"
                      >
                        {processandoPagamento ? 'Processando...' : metodoPagamentoOnline === 'pix' ? 'Confirmar e Pagar' : 'Confirmar Pedido'}
                      </Button>
                    </div>
                  </>
                )}

                    {checkoutStep === 4 && pedidoCriado && (
                    <>
                      {/* Step 4: Efetuar pagamento (pedido já criado) */}
                      {metodoPagamentoOnline === 'pix' && (
                        <PixCheckout
                          pedidoId={pedidoCriado.id}
                          valorTotal={calcularTotal()}
                          pizzariaId={pizzariaId}
                          clienteEmail={formCliente.email || `${formCliente.telefone}@cliente.com`}
                          onVoltar={() => { setCheckoutStep(3); setPedidoCriado(null); }}
                        />
                      )}


                    </>
                    )}

                    {checkoutStep === 5 && (
                      <div className="flex flex-col items-center justify-center py-12 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center animate-pulse">
                          <span className="text-4xl">🥷</span>
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="text-2xl font-bold text-white">Pedido Confirmado!</h3>
                          <p className="text-slate-400">Seu pedido foi recebido com sucesso.</p>
                          <p className="text-slate-400 text-sm">Aguarde, estamos preparando tudo para você...</p>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-xs text-slate-500">Redirecionando para acompanhar seu pedido...</p>
                      </div>
                    )}
                    </>
                    )}
                    </div>
                    </DialogContent>
                    </Dialog>
                    </div>
                    );
                    }