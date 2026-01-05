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

export default function CardapioCliente() {
  const navigate = useNavigate();
  const [carrinho, setCarrinho] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [showCarrinho, setShowCarrinho] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [tipoCliente, setTipoCliente] = useState(null); // 'cadastrado' ou 'convidado'
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  
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

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-cardapio'],
    queryFn: () => base44.entities.Produto.filter({ disponivel: true }, '-created_date', 100),
  });

  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: () => base44.entities.MetodoPagamento.filter({ ativo: true }),
  });

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

  const finalizarPedido = async () => {
    if (!formCliente.nome || !formCliente.telefone || !formCliente.endereco) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!formCliente.forma_pagamento) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }

    try {
      // Se for cliente cadastrado, salvar/atualizar dados
      let clienteId = null;
      if (tipoCliente === 'cadastrado' && formCliente.email) {
        const clientesExistentes = await base44.entities.Cliente.filter({ email: formCliente.email });
        
        if (clientesExistentes.length > 0) {
          // Atualizar cliente existente
          await base44.entities.Cliente.update(clientesExistentes[0].id, {
            nome: formCliente.nome,
            telefone: formCliente.telefone,
            cep: formCliente.cep,
            endereco: formCliente.endereco,
            numero: formCliente.numero,
            complemento: formCliente.complemento,
            bairro: formCliente.bairro,
            cidade: formCliente.cidade,
            estado: formCliente.estado,
            total_pedidos: (clientesExistentes[0].total_pedidos || 0) + 1,
            pontos_fidelidade: (clientesExistentes[0].pontos_fidelidade || 0) + Math.floor(calcularTotal()),
          });
          clienteId = clientesExistentes[0].id;
        } else {
          // Criar novo cliente
          const novoCliente = await base44.entities.Cliente.create({
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
            latitude: formCliente.latitude,
            longitude: formCliente.longitude,
            total_pedidos: 1,
            pontos_fidelidade: Math.floor(calcularTotal()),
          });
          clienteId = novoCliente.id;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg"
                alt="Logo"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-white">NinjaGO Delivery</h1>
                <p className="text-xs text-slate-400">Peça agora e receba rapidinho! 🥷</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCarrinho(true)}
              className="relative p-3 rounded-xl bg-orange-500 hover:bg-orange-600 transition-colors"
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/10 text-white text-lg"
            />
          </div>
        </div>

        {/* Produtos em Destaque */}
        {produtosDestaque.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Em Destaque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {produtosDestaque.map((produto) => (
                <motion.div
                  key={produto.id}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 p-6 relative overflow-hidden"
                >
                  <Badge className="absolute top-4 right-4 bg-yellow-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Destaque
                  </Badge>
                  {produto.imagem_url && (
                    <img src={produto.imagem_url} alt={produto.nome} className="w-full h-40 object-cover rounded-xl mb-4" />
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{produto.nome}</h3>
                  <p className="text-slate-300 text-sm mb-4">{produto.descricao}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-emerald-400">R$ {produto.preco?.toFixed(2)}</p>
                    <Button
                      onClick={() => adicionarAoCarrinho(produto)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Filtro de Categorias */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaFiltro('todos')}
            className={`px-4 py-2 rounded-xl transition-all ${
              categoriaFiltro === 'todos'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-4 py-2 rounded-xl transition-all capitalize ${
                categoriaFiltro === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => (
            <motion.div
              key={produto.id}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/8 transition-all"
            >
              {produto.imagem_url && (
                <img src={produto.imagem_url} alt={produto.nome} className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <h3 className="font-bold text-white mb-1">{produto.nome}</h3>
              <p className="text-slate-400 text-sm mb-3 line-clamp-2">{produto.descricao}</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-emerald-400">R$ {produto.preco?.toFixed(2)}</p>
                <Button
                  size="sm"
                  onClick={() => adicionarAoCarrinho(produto)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

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
                    <p className="font-bold text-white mb-1">Com Cadastro</p>
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
              </div>
            )}

            {/* Formulário */}
            {tipoCliente && (
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
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={formCliente.telefone}
                        onChange={(e) => setFormCliente({ ...formCliente, telefone: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    {tipoCliente === 'cadastrado' && (
                      <div className="col-span-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formCliente.email}
                          onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
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