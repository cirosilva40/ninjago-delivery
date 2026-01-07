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

export default function CardapioCliente() {
  const navigate = useNavigate();
  const [carrinho, setCarrinho] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [showCarrinho, setShowCarrinho] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tipoCliente, setTipoCliente] = useState(null); // 'cadastrado', 'convidado' ou 'login'
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [clienteLogado, setClienteLogado] = useState(null);
  const [loginData, setLoginData] = useState({ telefone: '', senha: '' });
  const [loginError, setLoginError] = useState('');
  const [cadastroSenha, setCadastroSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
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

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-cardapio'],
    queryFn: () => base44.entities.Produto.filter({ disponivel: true }, '-created_date', 100),
  });

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: () => base44.entities.MetodoPagamento.filter({ ativo: true }),
  });

  const { data: pizzarias = [] } = useQuery({
    queryKey: ['pizzaria-config'],
    queryFn: () => base44.entities.Pizzaria.list('-created_date', 1),
  });

  const pizzariaConfig = pizzarias[0] || {};
  const tema = pizzariaConfig.tema_cliente || 'dark';
  const isLight = tema === 'light';
  const corPrimaria = pizzariaConfig.cor_primaria_cliente || '#f97316';
  const logoUrl = pizzariaConfig.logo_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg';
  const nomeExibicao = pizzariaConfig.nome_exibicao_cliente || pizzariaConfig.nome || 'NinjaGO Delivery';

  const produtosFiltrados = produtos.filter(p => {
    const matchCategoria = categoriaFiltro === 'todos' || p.categoria === categoriaFiltro;
    const matchBusca = !busca || p.nome?.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  const produtosDestaque = produtos.filter(p => p.destaque);
  const categorias = [...new Set(produtos.map(p => p.categoria))];

  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
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

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
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
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setBuscandoCep(false);
    }
  };

  const usarLocalizacao = () => {
    setBuscandoLocalizacao(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Usar API de geocoding reverso (aqui simulado)
          setFormCliente({
            ...formCliente,
            latitude,
            longitude,
          });
          
          alert(`Localização capturada!\nLat: ${latitude}, Lng: ${longitude}\nPor favor, preencha o endereço completo.`);
          setBuscandoLocalizacao(false);
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
      localStorage.setItem('cliente_logado', JSON.stringify(cliente));
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

    try {
      // Se for cliente cadastrado, salvar/atualizar dados
      let clienteId = null;
      if (tipoCliente === 'cadastrado') {
        if (clienteLogado) {
          // Cliente já logado - atualizar
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
            pontos_fidelidade: (clienteLogado.pontos_fidelidade || 0) + Math.floor(calcularTotal()),
          });
          clienteId = clienteLogado.id;
        } else {
          // Criar novo cliente com senha
          const clientesExistentes = await base44.entities.Cliente.filter({ telefone: formCliente.telefone });
          
          if (clientesExistentes.length > 0) {
            alert('Já existe uma conta com este telefone. Faça login.');
            return;
          }

          const novoCliente = await base44.entities.Cliente.create({
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
            pontos_fidelidade: Math.floor(calcularTotal()),
          });
          clienteId = novoCliente.id;
          localStorage.setItem('cliente_logado', JSON.stringify(novoCliente));
        }
      }

      // Criar o pedido
      const novoPedido = await base44.entities.Pedido.create({
        pizzaria_id: 'default',
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
          preco_unitario: item.preco,
        })),
        valor_produtos: calcularTotal(),
        taxa_entrega: 5, // Valor fixo por enquanto
        desconto: 0,
        valor_total: calcularTotal() + 5,
        forma_pagamento: formCliente.forma_pagamento,
        troco_para: formCliente.troco_para || 0,
        status: 'novo',
        observacoes: formCliente.observacoes,
        horario_pedido: new Date().toISOString(),
        origem: 'site',
      });

      // Redirecionar para página de acompanhamento
      navigate(createPageUrl('AcompanharPedido') + `?id=${novoPedido.id}`);
      
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar pedido. Tente novamente.');
    }
  };

  const handleProductClick = (produto) => {
    setSelectedProduct(produto);
    setShowProductDetail(true);
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}
      style={{ '--cor-primaria': corPrimaria }}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl ${isLight ? 'bg-white/90 border-gray-200' : 'bg-slate-900/80 border-white/10'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logoUrl}
                alt="Logo"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{nomeExibicao}</h1>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Peça agora e receba rapidinho! 🥷</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {clienteLogado && (
                <Button
                  variant="ghost"
                  onClick={() => navigate(createPageUrl('PerfilCliente'))}
                  className={`flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-white'}`}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{clienteLogado.nome.split(' ')[0]}</span>
                </Button>
              )}
              <button
              onClick={() => setShowCarrinho(true)}
              className="relative p-3 rounded-xl transition-colors"
              style={{ backgroundColor: corPrimaria }}
            >
              <ShoppingCart className="w-6 h-6 text-white" />
              {carrinho.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {carrinho.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Busca */}
        <div className="mb-8">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-slate-400'}`} />
            <Input
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`pl-12 h-14 text-lg ${isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white'}`}
            />
          </div>
        </div>

        {/* Filtro de Categorias (Guias de Atalho) */}
        <div className="mb-6 sticky top-[88px] z-40 backdrop-blur-xl pb-4" style={{ backgroundColor: isLight ? 'rgba(249, 250, 251, 0.9)' : 'rgba(2, 6, 23, 0.9)' }}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setCategoriaFiltro('todos')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                categoriaFiltro === 'todos'
                  ? 'text-white'
                  : isLight
                    ? 'bg-white text-gray-600 hover:bg-gray-100'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              style={categoriaFiltro === 'todos' ? { backgroundColor: corPrimaria } : {}}
            >
              Todos
            </button>
            {produtosDestaque.length > 0 && (
              <button
                onClick={() => {
                  setCategoriaFiltro('todos');
                  document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                  isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                <Star className="w-4 h-4" />
                Em Destaque
              </button>
            )}
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-4 py-2 rounded-xl transition-all capitalize whitespace-nowrap ${
                  categoriaFiltro === cat
                    ? 'text-white'
                    : isLight
                      ? 'bg-white text-gray-600 hover:bg-gray-100'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
                style={categoriaFiltro === cat ? { backgroundColor: corPrimaria } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Produtos em Destaque */}
        {produtosDestaque.length > 0 && (
          <div id="destaques" className="mb-12">
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              <Star className="w-6 h-6 text-yellow-500" />
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
                    <img src={produto.imagem_url} alt={produto.nome} className="w-full h-40 object-cover rounded-xl mb-4" />
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
            {/* Carrossel Mobile */}
            <div className="flex md:hidden gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {produtosDestaque.map((produto) => (
                <motion.div
                  key={produto.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleProductClick(produto)}
                  className={`flex-shrink-0 w-[85vw] rounded-2xl p-6 relative overflow-hidden cursor-pointer snap-center ${
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
                    <img src={produto.imagem_url} alt={produto.nome} className="w-full h-40 object-cover rounded-xl mb-4" />
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
          </div>
        )}



        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => (
            <motion.div
              key={produto.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleProductClick(produto)}
              className={`rounded-xl p-4 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-white border border-gray-200 hover:shadow-lg'
                  : 'bg-white/5 border border-white/10 hover:bg-white/8'
              }`}
            >
              {produto.imagem_url && (
                <img src={produto.imagem_url} alt={produto.nome} className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <h3 className={`font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{produto.nome}</h3>
              <p className={`text-sm mb-3 line-clamp-2 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>{produto.descricao}</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-emerald-500">R$ {produto.preco?.toFixed(2)}</p>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    adicionarAoCarrinho(produto);
                  }}
                  className="text-white"
                  style={{ backgroundColor: corPrimaria }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
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

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-lg mb-2">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white font-semibold">R$ {calcularTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg mb-4">
                  <span className="text-slate-400">Taxa de entrega:</span>
                  <span className="text-white font-semibold">R$ 5,00</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span className="text-white">Total:</span>
                  <span className="text-emerald-400">R$ {(calcularTotal() + 5).toFixed(2)}</span>
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Finalizar Pedido</DialogTitle>
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

                <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h3 className="font-semibold text-white">Pagamento</h3>
                  <div>
                    <Label>Forma de Pagamento</Label>
                    <Select value={formCliente.forma_pagamento} onValueChange={(v) => setFormCliente({ ...formCliente, forma_pagamento: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {formasPagamento.map((forma) => (
                          <SelectItem key={forma.id} value={forma.tipo}>
                            {forma.nome}
                          </SelectItem>
                        ))}
                        <SelectItem value="pagar_na_entrega">Pagar na Entrega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formCliente.forma_pagamento === 'dinheiro' && (
                    <div>
                      <Label>Troco para (opcional)</Label>
                      <Input
                        type="number"
                        value={formCliente.troco_para}
                        onChange={(e) => setFormCliente({ ...formCliente, troco_para: parseFloat(e.target.value) })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="R$ 0,00"
                      />
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

                {tipoCliente === 'convidado' && (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-300">
                      ⚠️ Comprando como convidado, você não acumula pontos no programa de fidelidade.
                    </p>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between text-2xl font-bold mb-4">
                    <span className="text-white">Total:</span>
                    <span className="text-emerald-400">R$ {(calcularTotal() + 5).toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={finalizarPedido}
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-bold"
                  >
                    Confirmar Pedido
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}