import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Package,
  Star,
  LogOut,
  ArrowLeft,
  Phone,
  Mail,
  Edit,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function PerfilCliente() {
  const navigate = useNavigate();
  const [clienteLogado, setClienteLogado] = useState(null);

  useEffect(() => {
    const clienteData = localStorage.getItem('cliente_logado');
    if (clienteData) {
      setClienteLogado(JSON.parse(clienteData));
    } else {
      navigate(createPageUrl('AcessoCliente'));
    }
  }, [navigate]);

  const { data: pedidos = [] } = useQuery({
    queryKey: ['meus-pedidos', clienteLogado?.telefone],
    queryFn: () => base44.entities.Pedido.filter({ cliente_telefone: clienteLogado?.telefone }, '-created_date', 50),
    enabled: !!clienteLogado,
  });

  const handleLogout = () => {
    localStorage.removeItem('cliente_logado');
    navigate(createPageUrl('CardapioCliente'));
  };

  if (!clienteLogado) return null;

  const statusConfig = {
    novo: { label: 'Novo', color: 'bg-blue-500/20 text-blue-400' },
    em_preparo: { label: 'Em Preparo', color: 'bg-yellow-500/20 text-yellow-400' },
    pronto: { label: 'Pronto', color: 'bg-emerald-500/20 text-emerald-400' },
    em_entrega: { label: 'Em Rota', color: 'bg-purple-500/20 text-purple-400' },
    entregue: { label: 'Entregue', color: 'bg-green-500/20 text-green-400' },
    cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl('CardapioCliente'))}
              className="text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Perfil */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{clienteLogado.nome}</h1>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Phone className="w-4 h-4" />
                  {clienteLogado.telefone}
                </div>
                {clienteLogado.email && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Mail className="w-4 h-4" />
                    {clienteLogado.email}
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" className="border-white/10 text-white">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-slate-400">Total de Pedidos</span>
              </div>
              <p className="text-3xl font-bold text-white">{clienteLogado.total_pedidos || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-slate-400">Pontos de Fidelidade</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">{clienteLogado.pontos_fidelidade || 0}</p>
            </div>
          </div>
        </Card>

        {/* Endereço Cadastrado */}
        {clienteLogado.endereco && (
          <Card className="bg-white/5 border-white/10 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Endereço Cadastrado</h2>
            </div>
            <div className="text-slate-300">
              <p>{clienteLogado.endereco}, {clienteLogado.numero}</p>
              {clienteLogado.complemento && <p>{clienteLogado.complemento}</p>}
              <p>{clienteLogado.bairro} - {clienteLogado.cidade}/{clienteLogado.estado}</p>
              <p className="text-slate-400 text-sm mt-1">CEP: {clienteLogado.cep}</p>
            </div>
          </Card>
        )}

        {/* Histórico de Pedidos */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-500" />
            Histórico de Pedidos
          </h2>

          {pedidos.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Você ainda não fez nenhum pedido</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => {
                const status = statusConfig[pedido.status] || statusConfig.novo;
                return (
                  <motion.div
                    key={pedido.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/8 transition-all cursor-pointer"
                    onClick={() => navigate(createPageUrl('AcompanharPedido') + `?id=${pedido.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-white">Pedido #{pedido.numero_pedido}</p>
                          <p className="text-sm text-slate-400">
                            {moment(pedido.created_date).format('DD/MM/YYYY [às] HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>

                    {/* Itens */}
                    {pedido.itens && pedido.itens.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {pedido.itens.map((item, i) => (
                            <span 
                              key={i}
                              className="px-2 py-1 rounded-lg bg-white/5 text-xs text-slate-300"
                            >
                              {item.quantidade}x {item.nome}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-slate-400">Total</span>
                      <span className="text-xl font-bold text-emerald-400">
                        R$ {pedido.valor_total?.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}