import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Frown, Store, ShoppingCart, Trash2, Plus, Minus, ArrowRight, User, MapPin, Phone, CreditCard, DollarSign, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';
import ProdutoCard from '@/components/cliente/ProdutoCard';
import ProductDetailModal from '@/components/cliente/ProductDetailModal';
import CheckoutPagamento from '@/components/cliente/CheckoutPagamento';

export default function CardapioCliente() {
  const location = useLocation();
  const [restauranteId, setRestauranteId] = useState(null);
  const [estabelecimento, setEstabelecimento] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [showCarrinho, setShowCarrinho] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPagamento, setShowPagamento] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [pedidoConcluido, setPedidoConcluido] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [salvandoPedido, setSalvandoPedido] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('restauranteId');
    if (id) {
      setRestauranteId(id);
    } else {
      setError('ID do restaurante não fornecido na URL.');
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchEstabelecimento = async () => {
      if (!restauranteId) return;
      setLoading(true);
      setError(null);
      try {
        const estab = await base44.entities.Pizzaria.get(restauranteId);
        setEstabelecimento(estab);
        
        const prods = await base44.entities.Produto.filter({ restaurante_id: restauranteId, disponivel: true });
        setProdutos(prods);
      } catch (err) {
        console.error('Erro ao buscar estabelecimento:', err);
        setError('Não foi possível carregar os dados do estabelecimento.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstabelecimento();
  }, [restauranteId]);

  const adicionarAoCarrinho = (produto) => {
    const itemCarrinho = {
      id: `${produto.id}_${Date.now()}`,
      produto_id: produto.id,
      nome: produto.nome,
      preco: produto.preco_final || produto.preco,
      quantidade: 1,
      personalizacoes: produto.personalizacoes || {}
    };
    
    setCarrinho([...carrinho, itemCarrinho]);
    toast.success('Produto adicionado ao carrinho!');
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  const alterarQuantidade = (id, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id) {
        const novaQuantidade = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: novaQuantidade };
      }
      return item;
    }));
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const finalizarPedido = async () => {
    if (!clienteForm.nome || !clienteForm.telefone || !clienteForm.endereco) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSalvandoPedido(true);
    try {
      // Buscar pedidos de hoje para gerar número sequencial
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const pedidosHoje = await base44.entities.Pedido.list('-created_date', 500);
      
      const pedidosHojeFiltrados = pedidosHoje.filter(p => {
        const dataPedido = new Date(p.created_date);
        dataPedido.setHours(0, 0, 0, 0);
        return dataPedido.getTime() === hoje.getTime();
      });

      let proximoNumero = 1;
      if (pedidosHojeFiltrados.length > 0) {
        const numeros = pedidosHojeFiltrados.map(p => parseInt(p.numero_pedido) || 0);
        const maiorNumero = Math.max(...numeros);
        proximoNumero = maiorNumero + 1;
      }

      const numeroPedido = proximoNumero.toString().padStart(2, '0');

      const pedidoData = {
        pizzaria_id: restauranteId,
        numero_pedido: numeroPedido,
        tipo_pedido: 'delivery',
        cliente_nome: clienteForm.nome,
        cliente_telefone: clienteForm.telefone,
        cliente_cep: clienteForm.cep,
        cliente_endereco: clienteForm.endereco,
        cliente_numero: clienteForm.numero,
        cliente_bairro: clienteForm.bairro,
        cliente_cidade: clienteForm.cidade,
        cliente_estado: clienteForm.estado,
        cliente_complemento: clienteForm.complemento,
        itens: carrinho.map(item => ({
          produto_id: item.produto_id,
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        })),
        valor_produtos: calcularTotal(),
        taxa_entrega: estabelecimento.taxa_entrega_base || 0,
        valor_total: calcularTotal() + (estabelecimento.taxa_entrega_base || 0),
        forma_pagamento: 'online',
        status_pagamento: 'pendente',
        status: 'novo',
        origem: 'site',
        horario_pedido: new Date().toISOString()
      };

      const novoPedido = await base44.entities.Pedido.create(pedidoData);
      setPedidoId(novoPedido.id);
      setShowCheckout(false);
      setShowPagamento(true);
      toast.success('Pedido criado! Prossiga para o pagamento.');
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setSalvandoPedido(false);
    }
  };

  const handlePagamentoSucesso = () => {
    setPedidoConcluido(true);
    setShowPagamento(false);
    setCarrinho([]);
    setClienteForm({
      nome: '',
      telefone: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      complemento: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Carregando cardápio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Frown className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Erro ao carregar cardápio</h2>
        <p className="text-center text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!estabelecimento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Store className="w-16 h-16 text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Estabelecimento não encontrado</h2>
        <p className="text-center text-gray-600 dark:text-gray-400">O ID do restaurante fornecido não corresponde a nenhum estabelecimento válido.</p>
      </div>
    );
  }

  const isLight = estabelecimento?.tema_cliente === 'light';

  if (pedidoConcluido) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isLight ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}>
        <Card className={`max-w-md w-full ${isLight ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>Pedido Enviado!</h2>
            <p className={`mb-6 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
              Seu pedido foi recebido e está sendo preparado. Em breve você receberá atualizações.
            </p>
            <Button onClick={() => setPedidoConcluido(false)} className="bg-gradient-to-r from-orange-500 to-red-600">
              Fazer Novo Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'} pb-24`}>
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className={`sticky top-0 z-40 ${isLight ? 'bg-white/95 border-b border-gray-200' : 'bg-slate-900/95 border-b border-white/10'} backdrop-blur-xl`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {estabelecimento?.logo_url && (
              <img src={estabelecimento.logo_url} alt={estabelecimento.nome} className="w-12 h-12 rounded-full object-cover" />
            )}
            <div>
              <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {estabelecimento?.nome_exibicao_cliente || estabelecimento?.nome}
              </h1>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                {estabelecimento?.cidade} - {estabelecimento?.estado}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCarrinho(true)} className="bg-gradient-to-r from-orange-500 to-red-600 relative">
            <ShoppingCart className="w-5 h-5" />
            {carrinho.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">{carrinho.length}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Produtos */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtos.map(produto => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onClick={setProdutoSelecionado}
              onAddCart={adicionarAoCarrinho}
              tema={estabelecimento?.tema_cliente}
              corPrimaria={estabelecimento?.cor_primaria_cliente}
            />
          ))}
        </div>
      </div>

      {/* Modal Detalhes do Produto */}
      <ProductDetailModal
        produto={produtoSelecionado}
        open={!!produtoSelecionado}
        onClose={() => setProdutoSelecionado(null)}
        onAddToCart={adicionarAoCarrinho}
        tema={estabelecimento?.tema_cliente}
      />

      {/* Modal Carrinho */}
      <Dialog open={showCarrinho} onOpenChange={setShowCarrinho}>
        <DialogContent className={`max-w-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={isLight ? 'text-gray-900' : 'text-white'}>Meu Carrinho</DialogTitle>
          </DialogHeader>
          
          {carrinho.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-slate-600'}`} />
              <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {carrinho.map(item => (
                  <div key={item.id} className={`p-4 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.nome}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removerDoCarrinho(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => alterarQuantidade(item.id, -1)} className="h-8 w-8">
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className={`w-8 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.quantidade}</span>
                        <Button variant="outline" size="icon" onClick={() => alterarQuantidade(item.id, 1)} className="h-8 w-8">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="font-bold text-emerald-500">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`pt-4 border-t ${isLight ? 'border-gray-200' : 'border-slate-700'}`}>
                <div className="flex justify-between mb-2">
                  <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>Subtotal</span>
                  <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>R$ {calcularTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className={isLight ? 'text-gray-700' : 'text-slate-300'}>Taxa de entrega</span>
                  <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>R$ {(estabelecimento?.taxa_entrega_base || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4 text-xl">
                  <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Total</span>
                  <span className="font-bold text-emerald-500">R$ {(calcularTotal() + (estabelecimento?.taxa_entrega_base || 0)).toFixed(2)}</span>
                </div>
                <Button onClick={() => { setShowCarrinho(false); setShowCheckout(true); }} className="w-full bg-gradient-to-r from-orange-500 to-red-600">
                  Finalizar Pedido <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={isLight ? 'text-gray-900' : 'text-white'}>Finalizar Pedido</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}><User className="w-4 h-4 inline mr-2" />Nome Completo *</Label>
              <Input value={clienteForm.nome} onChange={(e) => setClienteForm({...clienteForm, nome: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
            </div>
            
            <div>
              <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}><Phone className="w-4 h-4 inline mr-2" />Telefone *</Label>
              <Input value={clienteForm.telefone} onChange={(e) => setClienteForm({...clienteForm, telefone: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
            </div>

            <div>
              <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}>Email (opcional)</Label>
              <Input type="email" value={clienteForm.email} onChange={(e) => setClienteForm({...clienteForm, email: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} placeholder="seu@email.com" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}><MapPin className="w-4 h-4 inline mr-2" />CEP</Label>
                <Input value={clienteForm.cep} onChange={(e) => setClienteForm({...clienteForm, cep: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
              </div>
              <div>
                <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}>Número *</Label>
                <Input value={clienteForm.numero} onChange={(e) => setClienteForm({...clienteForm, numero: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
              </div>
            </div>
            
            <div>
              <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}>Endereço *</Label>
              <Input value={clienteForm.endereco} onChange={(e) => setClienteForm({...clienteForm, endereco: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}>Bairro</Label>
                <Input value={clienteForm.bairro} onChange={(e) => setClienteForm({...clienteForm, bairro: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
              </div>
              <div>
                <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}>Cidade</Label>
                <Input value={clienteForm.cidade} onChange={(e) => setClienteForm({...clienteForm, cidade: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
              </div>
              <div>
                <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}>Estado</Label>
                <Input value={clienteForm.estado} onChange={(e) => setClienteForm({...clienteForm, estado: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} maxLength={2} />
              </div>
            </div>
            
            <div>
              <Label className={isLight ? 'text-gray-700' : 'text-slate-300'}>Complemento</Label>
              <Input value={clienteForm.complemento} onChange={(e) => setClienteForm({...clienteForm, complemento: e.target.value})} className={isLight ? 'bg-white' : 'bg-slate-800'} />
            </div>
            
            <div className={`p-4 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>R$ {calcularTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Taxa de entrega</span>
                <span>R$ {(estabelecimento?.taxa_entrega_base || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-700">
                <span>Total</span>
                <span className="text-emerald-500">R$ {(calcularTotal() + (estabelecimento?.taxa_entrega_base || 0)).toFixed(2)}</span>
              </div>
            </div>
            
            <Button onClick={finalizarPedido} disabled={salvandoPedido} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-lg py-6">
              {salvandoPedido ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Criando pedido...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Ir para Pagamento
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Pagamento */}
      <Dialog open={showPagamento} onOpenChange={setShowPagamento}>
        <DialogContent className={`max-w-4xl max-h-[95vh] overflow-y-auto ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={isLight ? 'text-gray-900' : 'text-white'}>Pagamento</DialogTitle>
          </DialogHeader>
          
          {pedidoId && (
            <CheckoutPagamento
              pedidoId={pedidoId}
              valorTotal={calcularTotal() + (estabelecimento?.taxa_entrega_base || 0)}
              pizzariaId={restauranteId}
              clienteEmail={clienteForm.email}
              clienteNome={clienteForm.nome}
              clienteTelefone={clienteForm.telefone}
              onSuccess={handlePagamentoSucesso}
              onCancel={() => setShowPagamento(false)}
              tema={estabelecimento?.tema_cliente}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}