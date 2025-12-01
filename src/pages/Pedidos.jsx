import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Clock,
  Check,
  Truck,
  X,
  ChefHat,
  Bike,
  Eye,
  MoreVertical,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PedidoModal from '@/components/pedidos/PedidoModal';
import AtribuirEntregaModal from '@/components/pedidos/AtribuirEntregaModal';
import moment from 'moment';

const statusConfig = {
  novo: { label: 'Novo', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  em_preparo: { label: 'Em Preparo', color: 'bg-yellow-500/20 text-yellow-400', icon: ChefHat },
  pronto: { label: 'Pronto', color: 'bg-emerald-500/20 text-emerald-400', icon: Check },
  em_entrega: { label: 'Em Entrega', color: 'bg-purple-500/20 text-purple-400', icon: Truck },
  entregue: { label: 'Entregue', color: 'bg-green-500/20 text-green-400', icon: Check },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400', icon: X },
};

export default function Pedidos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [showAtribuirModal, setShowAtribuirModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [editingPedido, setEditingPedido] = useState(null);

  const { data: pedidos = [], refetch } = useQuery({
    queryKey: ['pedidos'],
    queryFn: () => base44.entities.Pedido.list('-created_date', 100),
    refetchInterval: 10000,
  });

  const updateStatus = async (pedido, newStatus) => {
    try {
      await base44.entities.Pedido.update(pedido.id, { 
        status: newStatus,
        ...(newStatus === 'pronto' ? { horario_pronto: new Date().toISOString() } : {})
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const filteredPedidos = pedidos.filter(p => {
    const matchSearch = !search || 
      p.numero_pedido?.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_telefone?.includes(search);
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAtribuir = (pedido) => {
    setSelectedPedido(pedido);
    setShowAtribuirModal(true);
  };

  const handleEdit = (pedido) => {
    setEditingPedido(pedido);
    setShowPedidoModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Pedidos</h1>
          <p className="text-slate-400 mt-1">{pedidos.length} pedidos no total</p>
        </div>

      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por número, cliente ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="novo">Novos</SelectItem>
            <SelectItem value="em_preparo">Em Preparo</SelectItem>
            <SelectItem value="pronto">Prontos</SelectItem>
            <SelectItem value="em_entrega">Em Entrega</SelectItem>
            <SelectItem value="entregue">Entregues</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = pedidos.filter(p => p.status === key).length;
          const StatusIcon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'todos' : key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl border transition-all
                ${statusFilter === key 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
                }
              `}
            >
              <StatusIcon className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-white">{config.label}</span>
              <Badge className={`${config.color} text-xs`}>{count}</Badge>
            </button>
          );
        })}
      </div>

      {/* Pedidos List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredPedidos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center"
            >
              <Package className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Nenhum pedido encontrado</p>
            </motion.div>
          ) : (
            filteredPedidos.map((pedido, index) => {
              const status = statusConfig[pedido.status] || statusConfig.novo;
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/8 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                        <Package className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-white">#{pedido.numero_pedido}</span>
                          <Badge className={`${status.color} border border-white/10`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-white font-medium">{pedido.cliente_nome}</p>
                        <p className="text-sm text-slate-400">{pedido.cliente_endereco}</p>
                        <p className="text-sm text-slate-500">{pedido.cliente_bairro}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">R$ {pedido.valor_total?.toFixed(2)}</p>
                        <p className="text-sm text-slate-400">{pedido.forma_pagamento}</p>
                        <p className="text-xs text-slate-500">{moment(pedido.created_date).format('DD/MM HH:mm')}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${pedido.cliente_telefone}`}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <Phone className="w-5 h-5 text-white" />
                        </a>

                        {(pedido.status === 'novo' || pedido.status === 'pronto') && (
                          <Button
                            size="sm"
                            onClick={() => handleAtribuir(pedido)}
                            className="bg-gradient-to-r from-orange-500 to-red-600"
                          >
                            <Bike className="w-4 h-4 mr-1" />
                            Entregar
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                            <DropdownMenuItem onClick={() => handleEdit(pedido)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />
                              Ver/Editar
                            </DropdownMenuItem>
                            {pedido.status === 'novo' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatus(pedido, 'em_preparo')}
                                className="cursor-pointer"
                              >
                                <ChefHat className="w-4 h-4 mr-2" />
                                Iniciar Preparo
                              </DropdownMenuItem>
                            )}
                            {pedido.status === 'em_preparo' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatus(pedido, 'pronto')}
                                className="cursor-pointer"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Marcar como Pronto
                              </DropdownMenuItem>
                            )}
                            {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatus(pedido, 'cancelado')}
                                className="cursor-pointer text-red-400"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar Pedido
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  {pedido.itens && pedido.itens.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-slate-400 mb-2">Itens:</p>
                      <div className="flex flex-wrap gap-2">
                        {pedido.itens.map((item, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 rounded-full bg-white/5 text-sm text-white"
                          >
                            {item.quantidade}x {item.nome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modais */}
      <PedidoModal
        open={showPedidoModal}
        onClose={() => {
          setShowPedidoModal(false);
          setEditingPedido(null);
        }}
        pedido={editingPedido}
        pizzariaId="default"
        onSave={refetch}
      />

      <AtribuirEntregaModal
        open={showAtribuirModal}
        onClose={() => {
          setShowAtribuirModal(false);
          setSelectedPedido(null);
        }}
        pedido={selectedPedido}
        pizzariaId="default"
        onAtribuir={refetch}
      />
    </div>
  );
}