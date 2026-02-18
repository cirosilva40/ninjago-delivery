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
import { Toaster } from 'sonner';
import { useMercadoPago, criarTokenCartao } from '../components/cliente/MercadoPagoHelper';

export default function CardapioCliente() {
  const navigate = useNavigate();
  
  // Inicializar pizzariaId da URL imediatamente
  const getInitialPizzariaId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pizzariaParam = urlParams.get('pizzariaId');
    if (pizzariaParam) return pizzariaParam;
    
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
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: endereço, 2: pagamento, 3: revisão, 4: dados pagamento
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [metodoPagamentoOnline, setMetodoPagamentoOnline] = useState(''); // 'pix', 'credit_card', 'debit_card'
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    cpf: '',
    parcelas: 1
  });
  const [pixData, setPixData] = useState(null);
  const [aguardandoPix, setAguardandoPix] = useState(false);

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
      }, '-created_date', 100);
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

  const { data: pizzarias = [], isLoading: loadingPizzaria } = useQuery({
    queryKey: ['pizzaria-config', pizzariaId],
    queryFn: async () => {
      const result = await base44.entities.Pizzaria.filter({ id: pizzariaId });
      console.log('Pizzaria encontrada:', result.length > 0, 'ID:', pizzariaId);
      return result;
    },
    enabled: !!pizzariaId,
  });

  const pizzariaConfig = pizzarias[0] || {};

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
    pizza: { nome: '🍕 Pizzas', icone: '🍕' },
    esfiha: { nome: '🥟 Esfihas', icone: '🥟' },
    lanche: { nome: '🍔 Lanches', icone: '🍔' },
    bebida: { nome: '🥤 Bebidas', icone: '🥤' },
    acai: { nome: '🍨 Açaí', icone: '🍨' },
    combo: { nome: '🍽️ Combos', icone: '🍽️' },
    sobremesa: { nome: '🍰 Sobremesas', icone: '🍰' },
    porcao: { nome: '🍟 Porções', icone: '🍟' },
    salgado: { nome: '🥐 Salgados', icone: '🥐' },
    doce: { nome: '🍩 Doces', icone: '🍩' },
    outro: { nome: '🍴 Outros', icone: '🍴' }
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
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
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

  // Calcular taxa de entrega dinamicamente
  const calcularTaxaEntrega = async () => {
    if (!formCliente.cep || !pizzariaConfig.latitude || !pizzariaConfig.longitude) {
      setTaxaEntrega(pizzariaConfig.taxa_entrega_base || 5);
      return;
    }

    try {
      // Buscar coordenadas do CEP do cliente
      const response = await fetch(`https://viacep.com.br/ws/${formCliente.cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setTaxaEntrega(pizzariaConfig.taxa_entrega_base || 5);
        return;
      }

      // Calcular distância (simplificado - em produção usar API de distância real)
      // Aqui estamos usando uma aproximação básica
      const subtotal = calcularSubtotal();
      
      // Verificar entrega grátis
      if (pizzariaConfig.valor_minimo_entrega_gratis > 0 && 
          subtotal >= pizzariaConfig.valor_minimo_entrega_gratis) {
        setTaxaEntrega(0);
        return;
      }

      // Simular distância (5-20km)
      const distanciaKm = Math.random() * 15 + 5;
      
      if (distanciaKm <= pizzariaConfig.raio_entrega_km) {
        // Dentro do raio base
        if (pizzariaConfig.entrega_gratis_dentro_raio_base) {
          setTaxaEntrega(0);
        } else {
          setTaxaEntrega(pizzariaConfig.taxa_entrega_base || 5);
        }
      } else {
        // Fora do raio base
        const kmExtra = distanciaKm - pizzariaConfig.raio_entrega_km;
        const taxaExtra = kmExtra * (pizzariaConfig.taxa_adicional_por_km || 0);
        setTaxaEntrega((pizzariaConfig.taxa_entrega_base || 5) + taxaExtra);
      }
    } catch (error) {
      console.error('Erro ao calcular taxa:', error);
      setTaxaEntrega(pizzariaConfig.taxa_entrega_base || 5);
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
        setFormCliente({
          ...formCliente,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        });
        // Recalcular taxa após preencher CEP
        calcularTaxaEntrega();
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setBuscandoCep(false);
    }
  };

  // Recalcular taxa quando CEP mudar
  useEffect(() => {
    if (formCliente.cep && formCliente.cep.length >= 8) {
      calcularTaxaEntrega();
    }
  }, [formCliente.cep, pizzariaConfig]);

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
              setFormCliente({
                ...formCliente,
                cep: data.endereco.cep || '',
                endereco: data.endereco.logradouro || '',
                numero: data.endereco.numero || '',
                bairro: data.endereco.bairro || '',
                cidade: data.endereco.cidade || '',
                estado: data.endereco.estado || '',
                latitude,
                longitude,
              });
              
              // Recalcular taxa de entrega após preencher o endereço
              calcularTaxaEntrega();
              
              alert('✅ Localização capturada e endereço preenchido automaticamente!');
            } else {
              throw new Error('Não foi possível obter o endereço');
            }
          } catch (error) {
            console.error('Erro ao geocodificar:', error);
            setFormCliente({
              ...formCliente,
              latitude,
              longitude,
            });
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
      const clientes = await base44.entities.Cliente.filter({ telefone: loginData.telefone });
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

  const finalizarPedido = async () => {
    if (!formCliente.nome || !formCliente.telefone || !formCliente.endereco) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!formCliente.forma_pagamento) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    if (tipoCliente === 'cadastrado' && !clienteLogado && (!cadastroSenha || cadastroSenha !== confirmarSenha)) {
      alert('Por favor, crie uma senha válida (as senhas devem ser iguais).');
      return;
    }

    // Se for pagamento online, ir para o step 4 (checkout transparente)
    if (formCliente.forma_pagamento === 'online') {
      setCheckoutStep(4);
      return;
    }

    // Se não for pagamento online, criar pedido normalmente
    setProcessandoPagamento(true);
    
    try {
      // Se for cliente cadastrado, salvar/atualizar dados
      let clienteId = null;
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
          clienteId = clienteLogado.id;
        } else {
          const clientesExistentes = await base44.entities.Cliente.filter({ telefone: formCliente.telefone });
          
          if (clientesExistentes.length > 0) {
            alert('Já existe uma conta com este telefone. Faça login.');
            setProcessandoPagamento(false);
            return;
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
          clienteId = novoCliente.id;
          const clienteComPizzaria = { ...novoCliente, pizzaria_id_atual: pizzariaId };
          localStorage.setItem('cliente_logado', JSON.stringify(clienteComPizzaria));
        }
      }

      // Criar o pedido
      const pedidoData = {
        pizzaria_id: pizzariaId,
        numero_pedido: `PED${Date.now()}`,
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
        itens: carrinho.map(item => {
          let observacaoItem = '';
          
          if (item.personalizacoes) {
            const detalhes = [];
            Object.keys(item.personalizacoes).forEach(grupoKey => {
              const grupoIndex = parseInt(grupoKey.split('_')[1]);
              const grupo = item.opcoes_personalizacao?.[grupoIndex];
              if (grupo && item.personalizacoes[grupoKey].length > 0) {
                const itensGrupo = item.personalizacoes[grupoKey]
                  .map(sel => sel.item.nome)
                  .join(', ');
                detalhes.push(`${grupo.nome_grupo}: ${itensGrupo}`);
              }
            });
            observacaoItem = detalhes.join(' | ');
          }
          
          return {
            produto_id: item.id,
            nome: item.nome,
            quantidade: item.quantidade,
            preco_unitario: item.preco_final || item.preco,
            observacao: observacaoItem,
          };
        }),
        valor_produtos: calcularSubtotal(),
        taxa_entrega: taxaEntrega,
        desconto: calcularDesconto(),
        valor_total: calcularTotal(),
        forma_pagamento: formCliente.forma_pagamento,
        troco_para: formCliente.troco_para || 0,
        status: 'novo',
        observacoes: formCliente.observacoes,
        horario_pedido: new Date().toISOString(),
        origem: 'site',
      };

      const novoPedido = await base44.entities.Pedido.create(pedidoData);
      await enviarNotificacaoStatusPedido(novoPedido, 'novo');
      navigate(createPageUrl('AcompanharPedido') + `?id=${novoPedido.id}&pizzaria_id=${pizzariaId}`);
      
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar pedido. Tente novamente.');
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
              🍽️ <span className="hidden xs:inline">Todos</span>
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
                onClick={() => setCategoriaAtiva(cat)}
                className={`flex-shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all whitespace-nowrap font-medium text-sm sm:text-base shadow-sm snap-start ${
                  categoriaAtiva === cat
                    ? 'text-white shadow-md scale-105'
                    : isLight
                      ? 'bg-white text-gray-700 active:bg-gray-50 border border-gray-200'
                      : 'bg-white/10 text-slate-300 active:bg-white/15 border border-white/10'
                }`}
                style={categoriaAtiva === cat ? { backgroundColor: corPrimaria } : {}}
              >
                {categoriaLabels[cat]?.icone} <span className="hidden xs:inline">{cat}</span>
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
                    <span className="text-4xl">{categoriaLabels[cat]?.icone}</span>
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
              <span className="text-4xl">{categoriaLabels[categoriaAtiva]?.icone}</span>
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
            <div className="space-y-4">
              {carrinho.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{item.nome}</h3>
                    <p className="text-emerald-400 font-semibold">R$ {item.preco?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      className="border-slate-600"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-bold">{item.quantidade}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="border-slate-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removerDoCarrinho(item.id)}
                    className="text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white font-semibold">R$ {calcularSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-slate-400">Taxa de entrega:</span>
                  <span className={`font-semibold ${taxaEntrega === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {taxaEntrega === 0 ? 'GRÁTIS' : `R$ ${taxaEntrega.toFixed(2)}`}
                  </span>
                </div>
                {cupomAplicado && (
                  <div className="flex justify-between text-lg">
                    <span className="text-emerald-400">Desconto (cupom):</span>
                    <span className="text-emerald-400 font-semibold">- R$ {calcularDesconto().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold pt-2 border-t border-white/10">
                  <span className="text-white">Total:</span>
                  <span className="text-emerald-400">R$ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowCarrinho(false);
                  setShowCheckout(true);
                }}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-bold"
              >
                Finalizar Pedido
              </Button>
            </div>
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
                    onClick={() => setTipoCliente('cadastrado')}
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
                      <span className={`font-semibold ${taxaEntrega === 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {taxaEntrega === 0 ? 'GRÁTIS' : `R$ ${taxaEntrega.toFixed(2)}`}
                      </span>
                    </div>
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

                    <Button
                      onClick={() => {
                        if (!formCliente.cep || !formCliente.endereco || !formCliente.numero) {
                          alert('Preencha o endereço completo');
                          return;
                        }
                        setCheckoutStep(2);
                      }}
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600"
                    >
                      Continuar para Pagamento
                    </Button>
                  </>
                )}

                {checkoutStep === 2 && (
                  <>
                    <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                      <h3 className="font-semibold text-white">Forma de Pagamento</h3>
                      <div>
                        <Label>Forma de Pagamento</Label>
                        <Select value={formCliente.forma_pagamento} onValueChange={(v) => setFormCliente({ ...formCliente, forma_pagamento: v })}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="online">💳 Pagamento Online</SelectItem>
                            {formasPagamento
                              .filter(forma => !['pix', 'cartao_credito', 'cartao_debito', 'online', 'vale_refeicao'].includes(forma.tipo))
                              .map((forma) => (
                                <SelectItem key={forma.id} value={forma.tipo}>
                                  {forma.nome}
                                </SelectItem>
                              ))}
                            <SelectItem value="pagar_na_entrega">Pagar na Entrega</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {formCliente.forma_pagamento === 'dinheiro' && (
                        <div className="space-y-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                          <Label className="text-white">Precisa de troco?</Label>
                          <Select 
                            value={formCliente.troco_para > 0 ? 'sim' : 'nao'} 
                            onValueChange={(v) => {
                              if (v === 'nao') {
                                setFormCliente({ ...formCliente, troco_para: 0 });
                              } else {
                                setFormCliente({ ...formCliente, troco_para: 0.01 });
                              }
                            }}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="nao">Não preciso de troco</SelectItem>
                              <SelectItem value="sim">Sim, preciso de troco</SelectItem>
                            </SelectContent>
                          </Select>
                          {formCliente.troco_para > 0 && (
                            <div>
                              <Label>Troco para quanto?</Label>
                              <Input
                                type="number"
                                value={formCliente.troco_para}
                                onChange={(e) => setFormCliente({ ...formCliente, troco_para: parseFloat(e.target.value) })}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Ex: 50.00"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {formCliente.forma_pagamento === 'pagar_na_entrega' && (
                        <div className="space-y-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <Label className="text-white">Como vai pagar na entrega?</Label>
                          <Select 
                            value={formCliente.metodo_entrega || ''} 
                            onValueChange={(v) => setFormCliente({ ...formCliente, metodo_entrega: v })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Selecione o método" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                              <SelectItem value="pix">🔳 PIX</SelectItem>
                              <SelectItem value="cartao">💳 Cartão (Crédito/Débito)</SelectItem>
                            </SelectContent>
                          </Select>
                          {formCliente.metodo_entrega === 'dinheiro' && (
                            <div className="space-y-3">
                              <Label className="text-white">Precisa de troco?</Label>
                              <Select 
                                value={formCliente.troco_para > 0 ? 'sim' : 'nao'} 
                                onValueChange={(v) => {
                                  if (v === 'nao') {
                                    setFormCliente({ ...formCliente, troco_para: 0 });
                                  } else {
                                    setFormCliente({ ...formCliente, troco_para: 0.01 });
                                  }
                                }}
                              >
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="nao">Não preciso de troco</SelectItem>
                                  <SelectItem value="sim">Sim, preciso de troco</SelectItem>
                                </SelectContent>
                              </Select>
                              {formCliente.troco_para > 0 && (
                                <div>
                                  <Label>Troco para quanto?</Label>
                                  <Input
                                    type="number"
                                    value={formCliente.troco_para}
                                    onChange={(e) => setFormCliente({ ...formCliente, troco_para: parseFloat(e.target.value) })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    placeholder="Ex: 50.00"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {formCliente.forma_pagamento === 'online' && (
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                          <p className="text-sm text-blue-300">
                            💳 Você escolherá a forma de pagamento online (PIX ou cartão de crédito/débito) na próxima etapa, sem sair do site.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Cupom de Desconto */}
                    <div className="space-y-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Tag className="w-5 h-5 text-emerald-400" />
                        Cupom de Desconto
                      </h3>
                      {cupomAplicado ? (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
                          <div>
                            <p className="font-bold text-emerald-300">{cupomAplicado.titulo}</p>
                            <p className="text-sm text-emerald-400">Desconto: R$ {calcularDesconto().toFixed(2)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setCupomAplicado(null);
                              setCupomCodigo('');
                            }}
                            className="text-red-400"
                          >
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={cupomCodigo}
                            onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                            className="bg-slate-800 border-slate-700 text-white"
                            placeholder="Digite o código do cupom"
                          />
                          <Button
                            onClick={aplicarCupom}
                            variant="outline"
                            className="border-emerald-500/50 text-emerald-400"
                          >
                            Aplicar
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Observações (opcional)</Label>
                      <Textarea
                        value={formCliente.observacoes}
                        onChange={(e) => setFormCliente({ ...formCliente, observacoes: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Alguma observação sobre o pedido?"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setCheckoutStep(1)}
                        variant="outline"
                        className="flex-1 border-slate-600"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={() => {
                          if (!formCliente.forma_pagamento) {
                            alert('Selecione uma forma de pagamento');
                            return;
                          }

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
                    {/* Revisão Final */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <h3 className="font-semibold text-white mb-3">📍 Endereço de Entrega</h3>
                        <p className="text-slate-300">
                          {formCliente.endereco}, {formCliente.numero}
                          {formCliente.complemento && ` - ${formCliente.complemento}`}
                        </p>
                        <p className="text-slate-300">
                          {formCliente.bairro} - {formCliente.cidade}/{formCliente.estado}
                        </p>
                        <p className="text-slate-400 text-sm">CEP: {formCliente.cep}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <h3 className="font-semibold text-white mb-3">💳 Pagamento</h3>
                        <p className="text-slate-300 capitalize">
                          {formCliente.forma_pagamento === 'online' ? (
                            <>
                              Pagamento Online - {
                                metodoPagamentoOnline === 'pix' ? 'PIX' :
                                metodoPagamentoOnline === 'credit_card' ? 'Cartão de Crédito' :
                                metodoPagamentoOnline === 'debit_card' ? 'Cartão de Débito' : ''
                              }
                            </>
                          ) : (
                            formCliente.forma_pagamento.replace('_', ' ')
                          )}
                        </p>
                        {formCliente.troco_para > 0 && (
                          <p className="text-slate-400 text-sm">Troco para: R$ {formCliente.troco_para.toFixed(2)}</p>
                        )}
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
                        <p className="text-sm text-yellow-300">
                          ⚠️ Comprando como convidado, você não acumula pontos no programa de fidelidade.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setCheckoutStep(2)}
                        variant="outline"
                        className="flex-1 border-slate-600"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={finalizarPedido}
                        disabled={processandoPagamento}
                        className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-bold"
                      >
                        {processandoPagamento ? 'Processando...' : 
                         formCliente.forma_pagamento === 'online' ? 'Escolher Pagamento Online' : 'Confirmar Pedido'}
                      </Button>
                    </div>
                    </>
                    )}

                    {checkoutStep === 4 && (
                    <>
                     {/* Dados de Pagamento Online */}
                     <div className="space-y-4">

                       {/* Seleção do método de pagamento online */}
                       {!metodoPagamentoOnline && (
                         <div className="space-y-4">
                           <h3 className="font-semibold text-white text-lg">Como deseja pagar online?</h3>
                           <div className="grid grid-cols-2 gap-4">
                             <button
                               onClick={() => setMetodoPagamentoOnline('pix')}
                               className="p-6 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-center"
                             >
                               <div className="text-4xl mb-2">🔳</div>
                               <p className="font-bold text-white">PIX</p>
                               <p className="text-xs text-slate-400 mt-1">Aprovação instantânea</p>
                             </button>
                             <button
                               onClick={() => setMetodoPagamentoOnline('credit_card')}
                               className="p-6 rounded-xl border-2 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-center"
                             >
                               <div className="text-4xl mb-2">💳</div>
                               <p className="font-bold text-white">Cartão de Crédito</p>
                               <p className="text-xs text-slate-400 mt-1">Parcelamento disponível</p>
                             </button>
                             <button
                               onClick={() => setMetodoPagamentoOnline('debit_card')}
                               className="p-6 rounded-xl border-2 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 transition-all text-center"
                             >
                               <div className="text-4xl mb-2">💳</div>
                               <p className="font-bold text-white">Cartão de Débito</p>
                               <p className="text-xs text-slate-400 mt-1">À vista</p>
                             </button>
                             <button
                               onClick={() => setMetodoPagamentoOnline('vale_refeicao')}
                               className="p-6 rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 transition-all text-center"
                             >
                               <div className="text-4xl mb-2">🎫</div>
                               <p className="font-bold text-white">Vale Refeição</p>
                               <p className="text-xs text-slate-400 mt-1">À vista</p>
                             </button>
                           </div>
                           <Button
                             onClick={() => setCheckoutStep(3)}
                             variant="outline"
                             className="w-full border-slate-600"
                           >
                             Voltar
                           </Button>
                         </div>
                       )}

                       {metodoPagamentoOnline === 'pix' && (
                         <div className="space-y-4">
                           <button onClick={() => setMetodoPagamentoOnline('')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
                             ← Voltar à escolha de pagamento
                           </button>
                           <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                             <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                               <div className="text-2xl">🔳</div>
                               Pagamento via PIX
                             </h3>
                             {!pixData ? (
                               <div className="text-center py-6">
                                 <p className="text-slate-300 mb-4">Clique no botão abaixo para gerar o código PIX</p>
                                 <Button
                                   onClick={async () => {
                                     setAguardandoPix(true);
                                     try {
                                       // Primeiro, criar o pedido
                                       let clienteId = null;
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
                                           clienteId = clienteLogado.id;
                                         } else {
                                           const clientesExistentes = await base44.entities.Cliente.filter({ telefone: formCliente.telefone });
                                           if (clientesExistentes.length > 0) {
                                             alert('Já existe uma conta com este telefone. Faça login.');
                                             return;
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
                                           clienteId = novoCliente.id;
                                           localStorage.setItem('cliente_logado', JSON.stringify({ ...novoCliente, pizzaria_id_atual: pizzariaId }));
                                         }
                                       }

                                       const pedidoData = {
                                         pizzaria_id: pizzariaId,
                                         numero_pedido: `PED${Date.now()}`,
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
                                         itens: carrinho.map(item => ({
                                           produto_id: item.id,
                                           nome: item.nome,
                                           quantidade: item.quantidade,
                                           preco_unitario: item.preco_final || item.preco,
                                           observacao: ''
                                         })),
                                         valor_produtos: calcularSubtotal(),
                                         taxa_entrega: taxaEntrega,
                                         desconto: calcularDesconto(),
                                         valor_total: calcularTotal(),
                                         forma_pagamento: 'pix',
                                         status: 'novo',
                                         status_pagamento: 'pendente',
                                         observacoes: formCliente.observacoes,
                                         horario_pedido: new Date().toISOString(),
                                         origem: 'site',
                                       };

                                       const novoPedido = await base44.entities.Pedido.create(pedidoData);

                                       // Agora gerar o PIX
                                       const { data } = await base44.functions.invoke('processarPagamentoMercadoPago', {
                                         pedidoId: novoPedido.id,
                                         valorTotal: calcularTotal(),
                                         pizzariaId,
                                         metodoPagamento: 'pix',
                                         clienteEmail: formCliente.email || `${formCliente.telefone}@cliente.com`
                                       });

                                       if (data.success) {
                                         setPixData(data);
                                         localStorage.setItem('pedido_aguardando_pagamento', novoPedido.id);
                                       } else {
                                         alert('Erro ao gerar PIX: ' + (data.error || 'Tente novamente'));
                                       }
                                     } catch (error) {
                                       alert('Erro ao gerar PIX. Tente novamente.');
                                       console.error(error);
                                     } finally {
                                       setAguardandoPix(false);
                                     }
                                   }}
                                   disabled={aguardandoPix}
                                   className="bg-emerald-500 hover:bg-emerald-600"
                                 >
                                   {aguardandoPix ? 'Gerando...' : 'Gerar Código PIX'}
                                 </Button>
                               </div>
                             ) : (
                               <div className="space-y-4">
                                 {pixData.qr_code_base64 && (
                                   <div className="flex justify-center">
                                     <img 
                                       src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                                       alt="QR Code PIX"
                                       className="w-64 h-64"
                                     />
                                   </div>
                                 )}
                                 <div>
                                   <Label className="text-white">Código PIX (Copia e Cola)</Label>
                                   <div className="flex gap-2">
                                     <Input
                                       value={pixData.qr_code || ''}
                                       readOnly
                                       className="bg-slate-800 border-slate-700 text-white font-mono text-xs"
                                     />
                                     <Button
                                       onClick={() => {
                                         navigator.clipboard.writeText(pixData.qr_code);
                                         alert('Código PIX copiado!');
                                       }}
                                       variant="outline"
                                       className="border-emerald-500 text-emerald-400"
                                     >
                                       Copiar
                                     </Button>
                                   </div>
                                 </div>
                                 <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                                   <p className="text-sm text-yellow-300">
                                     ⏱️ Após realizar o pagamento, aguarde alguns instantes. O pedido será confirmado automaticamente.
                                   </p>
                                 </div>
                                 <Button
                                   onClick={() => {
                                     const pedidoId = localStorage.getItem('pedido_aguardando_pagamento');
                                     localStorage.removeItem('pedido_aguardando_pagamento');
                                     navigate(createPageUrl('AcompanharPedido') + `?id=${pedidoId}&pizzaria_id=${pizzariaId}`);
                                   }}
                                   className="w-full bg-gradient-to-r from-orange-500 to-red-600"
                                 >
                                   Já paguei - Acompanhar Pedido
                                 </Button>
                               </div>
                             )}
                           </div>
                         </div>
                       )}

                       {(metodoPagamentoOnline === 'credit_card' || metodoPagamentoOnline === 'debit_card' || metodoPagamentoOnline === 'vale_refeicao') && (
                           <div className="space-y-4">
                             <button onClick={() => setMetodoPagamentoOnline('')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
                               ← Voltar à escolha de pagamento
                             </button>
                             <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <div className="text-2xl">{metodoPagamentoOnline === 'vale_refeicao' ? '🎫' : '💳'}</div>
                                Dados do {metodoPagamentoOnline === 'credit_card' ? 'Cartão de Crédito' : metodoPagamentoOnline === 'debit_card' ? 'Cartão de Débito' : 'Vale Refeição'}
                              </h3>
                             <div className="space-y-4">
                               <div>
                                 <Label>Número do Cartão</Label>
                                 <Input
                                   value={dadosCartao.numero}
                                   onChange={(e) => setDadosCartao({...dadosCartao, numero: e.target.value.replace(/\D/g, '')})}
                                   className="bg-slate-800 border-slate-700 text-white"
                                   placeholder="0000 0000 0000 0000"
                                   maxLength={16}
                                 />
                               </div>
                               <div>
                                 <Label>Nome do Titular (como está no cartão)</Label>
                                 <Input
                                   value={dadosCartao.nome}
                                   onChange={(e) => setDadosCartao({...dadosCartao, nome: e.target.value.toUpperCase()})}
                                   className="bg-slate-800 border-slate-700 text-white"
                                   placeholder="NOME COMPLETO"
                                 />
                               </div>
                               <div className="grid grid-cols-3 gap-4">
                                 <div>
                                   <Label>Validade</Label>
                                   <Input
                                     value={dadosCartao.validade}
                                     onChange={(e) => setDadosCartao({...dadosCartao, validade: e.target.value})}
                                     className="bg-slate-800 border-slate-700 text-white"
                                     placeholder="MM/AA"
                                     maxLength={5}
                                   />
                                 </div>
                                 <div>
                                   <Label>CVV</Label>
                                   <Input
                                     value={dadosCartao.cvv}
                                     onChange={(e) => setDadosCartao({...dadosCartao, cvv: e.target.value.replace(/\D/g, '')})}
                                     className="bg-slate-800 border-slate-700 text-white"
                                     placeholder="000"
                                     maxLength={4}
                                   />
                                 </div>
                                 <div>
                                   <Label>CPF</Label>
                                   <Input
                                     value={dadosCartao.cpf}
                                     onChange={(e) => setDadosCartao({...dadosCartao, cpf: e.target.value.replace(/\D/g, '')})}
                                     className="bg-slate-800 border-slate-700 text-white"
                                     placeholder="000.000.000-00"
                                     maxLength={11}
                                   />
                                 </div>
                               </div>
                               {metodoPagamentoOnline === 'credit_card' && (
                                 <div>
                                   <Label>Número de Parcelas</Label>
                                   <Select 
                                     value={dadosCartao.parcelas.toString()} 
                                     onValueChange={(v) => setDadosCartao({...dadosCartao, parcelas: parseInt(v)})}
                                   >
                                     <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent className="bg-slate-800 border-slate-700">
                                       {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => (
                                         <SelectItem key={p} value={p.toString()}>
                                           {p}x de R$ {(calcularTotal() / p).toFixed(2)}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </div>
                               )}
                               {metodoPagamentoOnline === 'vale_refeicao' && (
                                 <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                                   <p className="text-sm text-yellow-300">
                                     ℹ️ Vale refeição não permite parcelamento - pagamento à vista
                                   </p>
                                 </div>
                               )}
                             </div>
                           </div>

                           <div className="flex gap-3">
                             <Button
                               onClick={() => setCheckoutStep(3)}
                               variant="outline"
                               className="flex-1 border-slate-600"
                             >
                               Voltar
                             </Button>
                             <Button
                               onClick={async () => {
                                 if (!dadosCartao.numero || !dadosCartao.nome || !dadosCartao.validade || !dadosCartao.cvv || !dadosCartao.cpf) {
                                   alert('Preencha todos os dados do cartão');
                                   return;
                                 }

                                 if (!mpLoaded || !mp) {
                                   alert('Aguarde o carregamento do sistema de pagamento...');
                                   return;
                                 }

                                 setProcessandoPagamento(true);
                                 try {
                                   // 1. Criar token seguro do cartão usando SDK do Mercado Pago
                                   const tokenData = await criarTokenCartao(mp, dadosCartao);

                                   // 2. Criar pedido e processar pagamento com cartão
                                   let clienteId = null;
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
                                       clienteId = clienteLogado.id;
                                     } else {
                                       const clientesExistentes = await base44.entities.Cliente.filter({ telefone: formCliente.telefone });
                                       if (clientesExistentes.length > 0) {
                                         alert('Já existe uma conta com este telefone. Faça login.');
                                         setProcessandoPagamento(false);
                                         return;
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
                                       clienteId = novoCliente.id;
                                       localStorage.setItem('cliente_logado', JSON.stringify({ ...novoCliente, pizzaria_id_atual: pizzariaId }));
                                     }
                                   }

                                   const pedidoData = {
                                     pizzaria_id: pizzariaId,
                                     numero_pedido: `PED${Date.now()}`,
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
                                     itens: carrinho.map(item => ({
                                       produto_id: item.id,
                                       nome: item.nome,
                                       quantidade: item.quantidade,
                                       preco_unitario: item.preco_final || item.preco,
                                       observacao: ''
                                     })),
                                     valor_produtos: calcularSubtotal(),
                                     taxa_entrega: taxaEntrega,
                                     desconto: calcularDesconto(),
                                     valor_total: calcularTotal(),
                                     forma_pagamento: metodoPagamentoOnline === 'credit_card' ? 'cartao_credito' : metodoPagamentoOnline === 'debit_card' ? 'cartao_debito' : 'vale_refeicao',
                                     status: 'novo',
                                     status_pagamento: 'pendente',
                                     observacoes: formCliente.observacoes,
                                     horario_pedido: new Date().toISOString(),
                                     origem: 'site',
                                   };

                                   const novoPedido = await base44.entities.Pedido.create(pedidoData);

                                   // 3. Processar pagamento com token seguro
                                   const { data } = await base44.functions.invoke('processarPagamentoMercadoPago', {
                                     pedidoId: novoPedido.id,
                                     valorTotal: calcularTotal(),
                                     pizzariaId,
                                     metodoPagamento: metodoPagamentoOnline,
                                     clienteEmail: formCliente.email || `${formCliente.telefone}@cliente.com`,
                                     dadosCartao: {
                                       token: tokenData.token,
                                       payment_method_id: tokenData.payment_method_id,
                                       cardholder_name: tokenData.cardholder_name,
                                       cardholder_cpf: tokenData.cardholder_cpf,
                                       installments: metodoPagamentoOnline === 'credit_card' ? dadosCartao.parcelas : 1
                                     }
                                   });

                                   if (data.success) {
                                     navigate(createPageUrl('AcompanharPedido') + `?id=${novoPedido.id}&pizzaria_id=${pizzariaId}`);
                                   } else {
                                     alert('Erro ao processar pagamento: ' + (data.error || 'Tente novamente'));
                                   }
                                 } catch (error) {
                                   alert('Erro ao processar pagamento: ' + (error.message || 'Verifique os dados do cartão'));
                                   console.error(error);
                                 } finally {
                                   setProcessandoPagamento(false);
                                 }
                               }}
                               disabled={processandoPagamento || !mpLoaded}
                               className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                             >
                               {processandoPagamento ? 'Processando...' : !mpLoaded ? 'Carregando...' : 'Pagar Agora'}
                             </Button>
                           </div>
                         </div>
                       )}
                     </div>
                    </>
                    )}
                    </>
                    )}
                    </div>
                    </DialogContent>
                    </Dialog>
                    </div>
                    );
                    }