import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Store,
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  Phone,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Printer,
  Power,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CepInput, TelefoneInput, CurrencyInput } from '@/components/ui/masked-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categoriaConfig = {
  pizza: { label: 'Pizza', color: 'bg-red-500' },
  esfiha: { label: 'Esfiha', color: 'bg-orange-500' },
  lanche: { label: 'Lanche', color: 'bg-yellow-500' },
  bebida: { label: 'Bebida', color: 'bg-blue-500' },
  acai: { label: 'Açaí', color: 'bg-purple-500' },
  combo: { label: 'Combo', color: 'bg-green-500' },
  sobremesa: { label: 'Sobremesa', color: 'bg-pink-500' },
  porcao: { label: 'Porção', color: 'bg-amber-500' },
  outro: { label: 'Outro', color: 'bg-slate-500' },
};

const pagamentoConfig = {
  dinheiro: { label: 'Dinheiro', icon: Banknote },
  pix: { label: 'PIX', icon: QrCode },
  cartao_credito: { label: 'Cartão Crédito', icon: CreditCard },
  cartao_debito: { label: 'Cartão Débito', icon: CreditCard },
};

export default function NovoPedido() {
  const [tipoPedido, setTipoPedido] = useState('delivery');
  const [searchProduto, setSearchProduto] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [carrinho, setCarrinho] = useState([]);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(null);
  const [user, setUser] = useState(null);
  const [pizzariaId, setPizzariaId] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      // 1. Prioridade: estabelecimento logado via localStorage
      const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
      if (estabelecimentoLogado) {
        try {
          const estab = JSON.parse(estabelecimentoLogado);
          if (estab?.id) {
            setPizzariaId(estab.id);
            return;
          }
        } catch (e) {}
      }
      // 2. Fallback: usuário base44 autenticado
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData?.pizzaria_id) {
          setPizzariaId(userData.pizzaria_id);
        }
      } catch (e) {
        console.error('Erro ao carregar usuário:', e);
      }
    };
    loadUser();
  }, []);

  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_cep: '',
    cliente_endereco: '',
    cliente_numero: '',
    cliente_bairro: '',
    cliente_cidade: '',
    cliente_estado: '',
    cliente_complemento: '',
    cliente_referencia: '',
    forma_pagamento: 'dinheiro',
    status_pagamento: 'pendente',
    troco_para: '',
    taxa_entrega: '5',
    desconto: '0',
    observacoes: '',
  });

  const [calculandoTaxa, setCalculandoTaxa] = useState(false);
  const [distanciaCalculada, setDistanciaCalculada] = useState(null);
  const [salvandoIntegracao, setSalvandoIntegracao] = useState(null);
  const [salvandoStatusLoja, setSalvandoStatusLoja] = useState(false);

  const toggleStatusLoja = async () => {
    if (!pizzaria.id) return;
    setSalvandoStatusLoja(true);
    // Se nunca foi definido ou está fechado (false), abre (true). Se está aberto (true), fecha (false).
    const lojaAbertaAtual = pizzaria.configuracoes?.loja_aberta;
    const novoValor = lojaAbertaAtual === true ? false : true;
    try {
      await base44.entities.Pizzaria.update(pizzaria.id, {
        configuracoes: {
          ...pizzaria.configuracoes,
          loja_aberta: novoValor,
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSalvandoStatusLoja(false);
    }
  };


  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-disponiveis', pizzariaId],
    queryFn: () => base44.entities.Produto.filter({ disponivel: true, restaurante_id: pizzariaId }, 'categoria', 500),
    enabled: !!pizzariaId,
  });

  const { data: pizzarias = [] } = useQuery({
    queryKey: ['pizzarias', pizzariaId],
    queryFn: () => base44.entities.Pizzaria.filter({ id: pizzariaId }, '-created_date', 1),
    enabled: !!pizzariaId,
  });

  const pizzaria = pizzarias[0] || {};

  const toggleIntegracao = async (plataforma) => {
    if (!pizzaria.id) return;
    setSalvandoIntegracao(plataforma);
    const campo = plataforma === 'ifood' ? 'ifood_ativo' : '99food_ativo';
    const valorAtual = pizzaria.configuracoes?.[campo] ?? false;
    try {
      await base44.entities.Pizzaria.update(pizzaria.id, {
        configuracoes: {
          ...pizzaria.configuracoes,
          [campo]: !valorAtual,
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSalvandoIntegracao(null);
    }
  };

  // Atualiza a taxa de entrega padrão quando a pizzaria for carregada
  useEffect(() => {
    if (pizzaria.taxa_entrega_base !== undefined) {
      setForm(prev => ({
        ...prev,
        taxa_entrega: String(pizzaria.taxa_entrega_base ?? 0),
      }));
    }
  }, [pizzaria.id]);

  const filteredProdutos = produtos.filter(p => {
    const matchSearch = !searchProduto || 
      p.nome?.toLowerCase().includes(searchProduto.toLowerCase());
    const matchCategoria = categoriaFilter === 'todas' || p.categoria === categoriaFilter;
    return matchSearch && matchCategoria;
  });

  // Buscar CEP
  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setBuscandoCep(true);
    setCepError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado. Preencha manualmente.');
      } else {
        setForm(prev => ({
          ...prev,
          cliente_endereco: data.logradouro || '',
          cliente_bairro: data.bairro || '',
          cliente_cidade: data.localidade || '',
          cliente_estado: data.uf || '',
        }));
      }
    } catch (error) {
      setCepError('Erro ao buscar CEP. Preencha manualmente.');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Calcular taxa de entrega por distância
  const calcularTaxaEntrega = async () => {
    if (!form.cliente_endereco || !form.cliente_numero || !pizzaria.endereco) {
      return;
    }

    setCalculandoTaxa(true);
    try {
      const enderecoCliente = `${form.cliente_endereco}, ${form.cliente_numero} - ${form.cliente_bairro}, ${form.cliente_cidade}`;
      const enderecoEstabelecimento = `${pizzaria.endereco}, ${pizzaria.cidade}`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Calcule a distância real (em quilômetros) entre estes dois endereços:
        
Origem: ${enderecoEstabelecimento}
Destino: ${enderecoCliente}

Retorne APENAS a distância em km considerando as rotas reais de carro.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            distancia_km: {
              type: "number",
              description: "Distância em quilômetros"
            }
          }
        }
      });

      const distancia = resultado.distancia_km;
      setDistanciaCalculada(distancia);

      // Calcular taxa baseada na distância
      const taxaBase = pizzaria.taxa_entrega_base || 5;
      const raioBase = pizzaria.raio_entrega_km || 5;
      const taxaPorKm = pizzaria.taxa_adicional_por_km || 0;

      let taxaFinal = taxaBase;
      if (distancia > raioBase) {
        const kmAdicionais = distancia - raioBase;
        taxaFinal = taxaBase + (kmAdicionais * taxaPorKm);
      }

      setForm(prev => ({
        ...prev,
        taxa_entrega: taxaFinal.toFixed(2)
      }));

    } catch (error) {
      console.error('Erro ao calcular taxa:', error);
      setCepError('Não foi possível calcular a distância. Taxa padrão aplicada.');
    } finally {
      setCalculandoTaxa(false);
    }
  };

  // Calcular taxa quando o endereço estiver completo
  useEffect(() => {
    if (tipoPedido === 'delivery' && form.cliente_endereco && form.cliente_numero && form.cliente_cidade) {
      calcularTaxaEntrega();
    }
  }, [form.cliente_endereco, form.cliente_numero, form.cliente_cidade]);

  // Imprimir comanda
  const imprimirComanda = () => {
    if (!pedidoCriado) return;

    const nomeEstabelecimento = pizzaria.nome || 'Estabelecimento';
    const telefoneEstabelecimento = pizzaria.telefone || '';
    const enderecoEstabelecimento = pizzaria.endereco || '';

    const htmlComanda = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            font-size: 12px;
            line-height: 1.3;
          }
          .centro {
            text-align: center;
          }
          .negrito {
            font-weight: bold;
          }
          .grande {
            font-size: 18px;
            font-weight: bold;
          }
          .linha {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .total {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
          }
          .destaque {
            background-color: #f0f0f0;
            padding: 3px;
            margin: 3px 0;
          }
        </style>
      </head>
      <body>
        <div class="centro">
          <div class="negrito">${nomeEstabelecimento}</div>
          ${telefoneEstabelecimento ? `<div>${telefoneEstabelecimento}</div>` : ''}
          ${enderecoEstabelecimento ? `<div style="font-size: 10px;">${enderecoEstabelecimento}</div>` : ''}
        </div>
        
        <div class="linha"></div>
        
        <div class="centro grande">PEDIDO #${pedidoCriado.numero_pedido}</div>
        <div class="centro">${new Date(pedidoCriado.horario_pedido).toLocaleString('pt-BR')}</div>
        
        <div class="linha"></div>
        
        <div class="negrito">CLIENTE:</div>
        <div>${pedidoCriado.cliente_nome}</div>
        <div>${pedidoCriado.cliente_telefone}</div>
        
        ${pedidoCriado.tipo_pedido === 'delivery' ? `
          <div style="margin-top: 5px;">
            <div class="negrito">ENTREGAR EM:</div>
            <div>${pedidoCriado.cliente_endereco}, ${pedidoCriado.cliente_numero}</div>
            ${pedidoCriado.cliente_complemento ? `<div>${pedidoCriado.cliente_complemento}</div>` : ''}
            <div>${pedidoCriado.cliente_bairro} - ${pedidoCriado.cliente_cidade}/${pedidoCriado.cliente_estado}</div>
            ${pedidoCriado.cliente_referencia ? `<div>Ref: ${pedidoCriado.cliente_referencia}</div>` : ''}
          </div>
        ` : `
          <div style="margin-top: 5px;">
            <div class="negrito centro">*** RETIRADA NO BALCÃO ***</div>
          </div>
        `}
        
        <div class="linha"></div>
        
        <div class="negrito">ITENS:</div>
        ${pedidoCriado.itens.map(item => `
          <div class="item">
            <span>${item.quantidade}x ${item.nome}</span>
            <span>R$ ${(item.preco_unitario * item.quantidade).toFixed(2)}</span>
          </div>
          ${item.observacao ? `<div style="font-size: 10px; margin-left: 10px;">Obs: ${item.observacao}</div>` : ''}
        `).join('')}
        
        <div class="linha"></div>
        
        <div class="item">
          <span>Subtotal:</span>
          <span>R$ ${pedidoCriado.valor_produtos.toFixed(2)}</span>
        </div>
        
        ${pedidoCriado.tipo_pedido === 'delivery' && pedidoCriado.taxa_entrega > 0 ? `
          <div class="item destaque">
            <span class="negrito">Taxa de Entrega:</span>
            <span class="negrito">R$ ${pedidoCriado.taxa_entrega.toFixed(2)}</span>
          </div>
        ` : ''}
        
        ${pedidoCriado.desconto > 0 ? `
          <div class="item">
            <span>Desconto:</span>
            <span>- R$ ${pedidoCriado.desconto.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="linha"></div>
        
        <div class="item total">
          <span>TOTAL:</span>
          <span>R$ ${pedidoCriado.valor_total.toFixed(2)}</span>
        </div>
        
        <div class="linha"></div>
        
        <div class="negrito">PAGAMENTO:</div>
        <div>${pedidoCriado.forma_pagamento.toUpperCase().replace('_', ' ')}</div>
        ${pedidoCriado.forma_pagamento === 'dinheiro' && pedidoCriado.troco_para > 0 ? `
          <div>Troco para: R$ ${pedidoCriado.troco_para.toFixed(2)}</div>
          <div>Troco: R$ ${(pedidoCriado.troco_para - pedidoCriado.valor_total).toFixed(2)}</div>
        ` : ''}
        
        ${pedidoCriado.observacoes ? `
          <div style="margin-top: 8px;">
            <div class="negrito">OBSERVAÇÕES:</div>
            <div>${pedidoCriado.observacoes}</div>
          </div>
        ` : ''}
        
        <div class="linha"></div>
        
        <div class="centro" style="margin-top: 10px;">
          <div>Obrigado pela preferência!</div>
        </div>
      </body>
      </html>
    `;

    const janelaImpressao = window.open('', '_blank', 'width=300,height=600');
    janelaImpressao.document.write(htmlComanda);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    
    setTimeout(() => {
      janelaImpressao.print();
    }, 250);
  };

  // Carrinho
  const addToCart = (produto) => {
    setCarrinho(prev => {
      const existing = prev.find(i => i.produto_id === produto.id);
      if (existing) {
        return prev.map(i => 
          i.produto_id === produto.id 
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, {
        produto_id: produto.id,
        nome: produto.nome,
        preco_unitario: produto.preco,
        quantidade: 1,
        observacao: '',
      }];
    });
  };

  const updateQtd = (produtoId, delta) => {
    setCarrinho(prev => prev.map(i => {
      if (i.produto_id === produtoId) {
        const newQtd = Math.max(0, i.quantidade + delta);
        return { ...i, quantidade: newQtd };
      }
      return i;
    }).filter(i => i.quantidade > 0));
  };

  const updateObs = (produtoId, obs) => {
    setCarrinho(prev => prev.map(i => 
      i.produto_id === produtoId ? { ...i, observacao: obs } : i
    ));
  };

  const removeFromCart = (produtoId) => {
    setCarrinho(prev => prev.filter(i => i.produto_id !== produtoId));
  };

  // Cálculos
  const subtotal = carrinho.reduce((acc, i) => acc + (i.preco_unitario * i.quantidade), 0);
  const taxaEntrega = tipoPedido === 'delivery' ? parseFloat(form.taxa_entrega) || 0 : 0;
  const desconto = parseFloat(form.desconto) || 0;
  const total = subtotal + taxaEntrega - desconto;

  // Salvar Pedido
  const salvarPedido = async () => {
    if (carrinho.length === 0) return;
    if (tipoPedido === 'delivery' && (!form.cliente_endereco || !form.cliente_numero)) {
      alert('Preencha o endereço completo para delivery');
      return;
    }

    setSalvando(true);
    try {
      // Buscar pedidos de hoje para gerar número sequencial
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const pedidosHojeTodos = await base44.entities.Pedido.filter({ pizzaria_id: pizzariaId }, '-created_date', 500);
      
      // Filtrar pedidos de hoje e pegar o maior número
      const pedidosHojeFiltrados = pedidosHojeTodos.filter(p => {
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
      
      const pedido = await base44.entities.Pedido.create({
        pizzaria_id: pizzariaId,
        numero_pedido: numeroPedido,
        tipo_pedido: tipoPedido,
        cliente_nome: form.cliente_nome,
        cliente_telefone: form.cliente_telefone,
        cliente_cep: form.cliente_cep,
        cliente_endereco: form.cliente_endereco,
        cliente_numero: form.cliente_numero,
        cliente_bairro: form.cliente_bairro,
        cliente_cidade: form.cliente_cidade,
        cliente_estado: form.cliente_estado,
        cliente_complemento: form.cliente_complemento,
        cliente_referencia: form.cliente_referencia,
        itens: carrinho,
        valor_produtos: subtotal,
        taxa_entrega: taxaEntrega,
        desconto: desconto,
        valor_total: total,
        forma_pagamento: form.forma_pagamento,
        status_pagamento: form.status_pagamento,
        troco_para: parseFloat(form.troco_para) || 0,
        status: 'novo',
        observacoes: form.observacoes,
        horario_pedido: new Date().toISOString(),
        origem: 'balcao',
      });

      setPedidoCriado(pedido);
      setCarrinho([]);
      setForm({
        cliente_nome: '',
        cliente_telefone: '',
        cliente_cep: '',
        cliente_endereco: '',
        cliente_numero: '',
        cliente_bairro: '',
        cliente_cidade: '',
        cliente_estado: '',
        cliente_complemento: '',
        cliente_referencia: '',
        forma_pagamento: 'dinheiro',
        status_pagamento: 'pendente',
        troco_para: '',
        taxa_entrega: String(pizzaria.taxa_entrega_base ?? 0),
        desconto: '0',
        observacoes: '',
      });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
    } finally {
      setSalvando(false);
    }
  };

  // Agrupar produtos por categoria
  const produtosPorCategoria = filteredProdutos.reduce((acc, p) => {
    const cat = p.categoria || 'outro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (pedidoCriado) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pedido Criado!</h2>
          <p className="text-4xl font-bold text-orange-400 mb-4">#{pedidoCriado.numero_pedido}</p>
          <p className="text-slate-400 mb-6">
            {tipoPedido === 'delivery' ? 'Pedido para entrega' : 'Pedido para retirada no balcão'}
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center gap-2"
              onClick={imprimirComanda}
            >
              <Printer className="w-5 h-5" />
              Imprimir Comanda
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-slate-600"
                onClick={() => setPedidoCriado(null)}
              >
                Novo Pedido
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                onClick={() => window.location.href = '/Pedidos'}
              >
                Ver Pedidos
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Novo Pedido</h1>
          <p className="text-slate-400 mt-1">Cadastre um novo pedido</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Loja Aberta/Fechada */}
          {(() => {
            const lojaAberta = pizzaria.configuracoes?.loja_aberta === true;
            return (
              <button
                onClick={toggleStatusLoja}
                disabled={salvandoStatusLoja}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium text-sm ${
                  lojaAberta
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                }`}
              >
                {salvandoStatusLoja ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className={`w-4 h-4 ${lojaAberta ? 'text-emerald-400' : 'text-red-400'}`} />
                )}
                Loja {lojaAberta ? 'Aberta' : 'Fechada'}
              </button>
            );
          })()}
          {/* Toggle iFood */}
          <button
            onClick={() => toggleIntegracao('ifood')}
            disabled={salvandoIntegracao === 'ifood'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium text-sm ${
              pizzaria.configuracoes?.ifood_ativo
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {salvandoIntegracao === 'ifood' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className={`w-4 h-4 ${pizzaria.configuracoes?.ifood_ativo ? 'text-red-400' : 'text-slate-500'}`} />
            )}
            iFood {pizzaria.configuracoes?.ifood_ativo ? 'ON' : 'OFF'}
          </button>
          {/* Toggle 99Food */}
          <button
            onClick={() => toggleIntegracao('99food')}
            disabled={salvandoIntegracao === '99food'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium text-sm ${
              pizzaria.configuracoes?.['99food_ativo']
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {salvandoIntegracao === '99food' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className={`w-4 h-4 ${pizzaria.configuracoes?.['99food_ativo'] ? 'text-yellow-400' : 'text-slate-500'}`} />
            )}
            99Food {pizzaria.configuracoes?.['99food_ativo'] ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Tipo de Pedido */}
      <div className="flex gap-3">
        <Button
          onClick={() => setTipoPedido('delivery')}
          className={`flex-1 h-16 text-lg ${
            tipoPedido === 'delivery' 
              ? 'bg-gradient-to-r from-orange-500 to-red-600' 
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          <MapPin className="w-6 h-6 mr-2" />
          Pedido Delivery
        </Button>
        <Button
          onClick={() => setTipoPedido('balcao')}
          className={`flex-1 h-16 text-lg ${
            tipoPedido === 'balcao' 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Store className="w-6 h-6 mr-2" />
          Pedido Balcão
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchProduto}
                  onChange={(e) => setSearchProduto(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="todas">Todas</SelectItem>
                  {Object.entries(categoriaConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de Produtos */}
            <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
              {Object.entries(produtosPorCategoria).map(([categoria, items]) => {
                const config = categoriaConfig[categoria] || categoriaConfig.outro;
                return (
                  <div key={categoria}>
                    <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                      {config.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((produto) => {
                        const inCart = carrinho.find(i => i.produto_id === produto.id);
                        return (
                          <div
                            key={produto.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              inCart
                                ? 'bg-orange-500/10 border-orange-500/50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                            onClick={() => addToCart(produto)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{produto.nome}</p>
                                <p className="text-emerald-400 font-semibold text-sm">R$ {produto.preco?.toFixed(2)}</p>
                              </div>
                              {inCart ? (
                                <Badge className="bg-orange-500 text-white ml-2">{inCart.quantidade}x</Badge>
                              ) : (
                                <Plus className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {(!pizzariaId || loadingProdutos) && (
                <div className="text-center py-8 text-slate-400">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                  <p>Carregando produtos...</p>
                </div>
              )}
              {pizzariaId && !loadingProdutos && filteredProdutos.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Dados do Cliente */}
          <Card className="bg-white/5 border-white/10 p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Nome</Label>
                <Input
                  value={form.cliente_nome}
                  onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label className="text-slate-400">Telefone</Label>
                <TelefoneInput
                  value={form.cliente_telefone}
                  onChange={(e) => setForm({ ...form, cliente_telefone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Endereço - Apenas para Delivery */}
            {tipoPedido === 'delivery' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  Endereço de Entrega
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400">CEP</Label>
                    <div className="relative">
                      <CepInput
                        value={form.cliente_cep}
                        onChange={(e) => setForm({ ...form, cliente_cep: e.target.value })}
                        onBlur={(e) => e.target.value && buscarCep(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white pr-10"
                      />
                      {buscandoCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />
                      )}
                    </div>
                    {cepError && (
                      <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {cepError}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-slate-400">Rua</Label>
                    <Input
                      value={form.cliente_endereco}
                      onChange={(e) => setForm({ ...form, cliente_endereco: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Rua/Avenida"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Número *</Label>
                    <Input
                      value={form.cliente_numero}
                      onChange={(e) => setForm({ ...form, cliente_numero: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Bairro</Label>
                    <Input
                      value={form.cliente_bairro}
                      onChange={(e) => setForm({ ...form, cliente_bairro: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Cidade</Label>
                    <Input
                      value={form.cliente_cidade}
                      onChange={(e) => setForm({ ...form, cliente_cidade: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-slate-400">Complemento</Label>
                    <Input
                      value={form.cliente_complemento}
                      onChange={(e) => setForm({ ...form, cliente_complemento: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Apto, bloco..."
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Referência</Label>
                    <Input
                      value={form.cliente_referencia}
                      onChange={(e) => setForm({ ...form, cliente_referencia: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Próximo a..."
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Carrinho / Resumo */}
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10 p-4 sticky top-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-400" />
              Carrinho
              {carrinho.length > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400">{carrinho.length}</Badge>
              )}
            </h3>

            {carrinho.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Carrinho vazio</p>
                <p className="text-sm">Clique nos produtos para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {carrinho.map((item) => (
                  <div key={item.produto_id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{item.nome}</p>
                        <p className="text-emerald-400 text-sm">R$ {item.preco_unitario?.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400"
                          onClick={() => updateQtd(item.produto_id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-white font-medium w-6 text-center">{item.quantidade}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400"
                          onClick={() => updateQtd(item.produto_id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-400"
                          onClick={() => removeFromCart(item.produto_id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Observação..."
                      value={item.observacao}
                      onChange={(e) => updateObs(item.produto_id, e.target.value)}
                      className="mt-2 h-8 text-xs bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagamento */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div>
                <Label className="text-slate-400 text-sm">Forma de Pagamento</Label>
                <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {Object.entries(pagamentoConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="w-4 h-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.forma_pagamento === 'dinheiro' && (
                <div>
                  <Label className="text-slate-400 text-sm">Troco para</Label>
                  <CurrencyInput
                    value={form.troco_para}
                    onChange={(e) => setForm({ ...form, troco_para: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              <div>
                <Label className="text-slate-400 text-sm">Status Pagamento</Label>
                <Select value={form.status_pagamento} onValueChange={(v) => setForm({ ...form, status_pagamento: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="receber_depois">Receber Depois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipoPedido === 'delivery' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-slate-400 text-sm flex items-center justify-between">
                      <span>Taxa Entrega</span>
                      {distanciaCalculada && (
                        <span className="text-xs text-emerald-400">{distanciaCalculada.toFixed(1)} km</span>
                      )}
                    </Label>
                    <div className="relative">
                      <CurrencyInput
                        value={form.taxa_entrega}
                        onChange={(e) => setForm({ ...form, taxa_entrega: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      {calculandoTaxa && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />
                      )}
                    </div>
                    {distanciaCalculada && (
                      <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Desconto</Label>
                    <CurrencyInput
                      value={form.desconto}
                      onChange={(e) => setForm({ ...form, desconto: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-slate-400 text-sm">Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-16"
                  placeholder="Observações gerais..."
                />
              </div>
            </div>

            {/* Totais */}
            <div className="space-y-2 pt-4 border-t border-white/10 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">R$ {subtotal.toFixed(2)}</span>
              </div>
              {tipoPedido === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Taxa Entrega</span>
                  <span className="text-white">R$ {taxaEntrega.toFixed(2)}</span>
                </div>
              )}
              {desconto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Desconto</span>
                  <span className="text-red-400">- R$ {desconto.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                <span className="text-white">Total</span>
                <span className="text-emerald-400">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botão Finalizar */}
            <Button
              onClick={salvarPedido}
              disabled={carrinho.length === 0 || salvando}
              className="w-full h-14 mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-semibold"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Finalizar Pedido
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}