import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search, User, Phone, Mail, MapPin, ShoppingBag,
  Star, Eye, EyeOff, Package, Clock, ChevronRight, X
} from 'lucide-react';

export default function Clientes() {
  const [pizzariaId, setPizzariaId] = useState(null);
  const [busca, setBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [senhasVisiveis, setSenhasVisiveis] = useState({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('pizzariaId');
    if (idFromUrl) {
      setPizzariaId(idFromUrl);
    } else {
      const id = localStorage.getItem('pizzaria_id');
      if (id) setPizzariaId(id);
      else base44.auth.me().then(u => u?.pizzaria_id && setPizzariaId(u.pizzaria_id));
    }
  }, []);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes', pizzariaId],
    enabled: !!pizzariaId,
    queryFn: () => base44.entities.Cliente.filter({ pizzaria_id: pizzariaId }, '-created_date', 200),
  });

  const { data: pedidosCliente = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos-cliente', clienteSelecionado?.telefone, pizzariaId],
    enabled: !!clienteSelecionado && !!pizzariaId,
    queryFn: () => base44.entities.Pedido.filter(
      { pizzaria_id: pizzariaId, cliente_telefone: clienteSelecionado.telefone },
      '-created_date', 50
    ),
  });

  const clientesFiltrados = clientes.filter(c =>
    !busca || c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca) || c.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleSenha = (id) => setSenhasVisiveis(prev => ({ ...prev, [id]: !prev[id] }));

  const totalGasto = (pedidos) =>
    pedidos.filter(p => p.status !== 'cancelado').reduce((s, p) => s + (p.valor_total || 0), 0);

  const formatarData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
  const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;

  const statusCores = {
    novo: 'bg-blue-500/20 text-blue-400',
    em_preparo: 'bg-yellow-500/20 text-yellow-400',
    pronto: 'bg-green-500/20 text-green-400',
    em_entrega: 'bg-orange-500/20 text-orange-400',
    entregue: 'bg-emerald-500/20 text-emerald-400',
    finalizada: 'bg-slate-500/20 text-slate-400',
    cancelado: 'bg-red-500/20 text-red-400',
  };

  const statusLabels = {
    novo: 'Novo', em_preparo: 'Em Preparo', pronto: 'Pronto',
    em_entrega: 'Em Entrega', entregue: 'Entregue', finalizada: 'Finalizado', cancelado: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clientesFiltrados.map(cliente => (
            <Card key={cliente.id} className="bg-slate-800/50 border-slate-700 hover:border-orange-500/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + Nome */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">
                        {cliente.nome?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{cliente.nome}</p>
                      <p className="text-xs text-slate-400">Cadastrado em {formatarData(cliente.created_date)}</p>
                    </div>
                  </div>

                  {/* Dados de contato */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{cliente.telefone || '-'}</span>
                    </div>
                    {cliente.email && (
                      <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-sm text-slate-300 truncate">{cliente.email}</span>
                      </div>
                    )}
                    {/* Senha (dado de login) */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 shrink-0">Senha:</span>
                      <span className="text-sm text-slate-300 font-mono">
                        {senhasVisiveis[cliente.id] ? (cliente.senha || '-') : '••••••'}
                      </span>
                      <button onClick={() => toggleSenha(cliente.id)} className="text-slate-500 hover:text-slate-300">
                        {senhasVisiveis[cliente.id]
                          ? <EyeOff className="w-3.5 h-3.5" />
                          : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Stats + Ação */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-400">{cliente.total_pedidos || 0}</p>
                      <p className="text-xs text-slate-500">pedidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-400">{cliente.pontos_fidelidade || 0}</p>
                      <p className="text-xs text-slate-500">pontos</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setClienteSelecionado(cliente)}
                      className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Endereço */}
                {cliente.bairro && (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-400">
                      {[cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Histórico de Pedidos */}
      <Dialog open={!!clienteSelecionado} onOpenChange={() => setClienteSelecionado(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <span className="text-white font-bold">
                  {clienteSelecionado?.nome?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              {clienteSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          {clienteSelecionado && (
            <div className="space-y-4 mt-2">
              {/* Dados de login */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm text-slate-400">Dados de Login</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Telefone (login)</p>
                    <p className="text-white font-medium">{clienteSelecionado.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Senha</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono">
                        {senhasVisiveis[clienteSelecionado.id + '_modal']
                          ? (clienteSelecionado.senha || '-')
                          : '••••••'}
                      </p>
                      <button onClick={() => toggleSenha(clienteSelecionado.id + '_modal')} className="text-slate-500 hover:text-slate-300">
                        {senhasVisiveis[clienteSelecionado.id + '_modal']
                          ? <EyeOff className="w-3.5 h-3.5" />
                          : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {clienteSelecionado.email && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-white">{clienteSelecionado.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-orange-400">{pedidosCliente.length}</p>
                  <p className="text-xs text-slate-400">Total Pedidos</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-400">{formatarMoeda(totalGasto(pedidosCliente))}</p>
                  <p className="text-xs text-slate-400">Total Gasto</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-yellow-400">{clienteSelecionado.pontos_fidelidade || 0}</p>
                  <p className="text-xs text-slate-400">Pontos</p>
                </div>
              </div>

              {/* Histórico de pedidos */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Histórico de Pedidos
                </h3>
                {loadingPedidos ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : pedidosCliente.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">Nenhum pedido encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {pedidosCliente.map(pedido => (
                      <div key={pedido.id} className="bg-slate-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">#{pedido.numero_pedido}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusCores[pedido.status] || 'bg-slate-700 text-slate-300'}`}>
                              {statusLabels[pedido.status] || pedido.status}
                            </span>
                          </div>
                          <span className="text-green-400 font-semibold text-sm">{formatarMoeda(pedido.valor_total)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatarData(pedido.created_date)}
                          </span>
                          <span>{pedido.forma_pagamento?.replace('_', ' ')}</span>
                          <span>{pedido.tipo_pedido === 'balcao' ? 'Balcão' : 'Delivery'}</span>
                        </div>
                        {pedido.itens?.length > 0 && (
                          <div className="mt-2 text-xs text-slate-400">
                            {pedido.itens.map((item, i) => (
                              <span key={i}>{item.quantidade}x {item.nome}{i < pedido.itens.length - 1 ? ', ' : ''}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}