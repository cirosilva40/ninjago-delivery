import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ChefHat,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  Bell,
  BellOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NinjaAnimation from '@/components/cliente/NinjaAnimation';
import moment from 'moment';

const statusSteps = [
  { key: 'novo', label: 'Pedido Recebido', icon: Package, color: 'blue' },
  { key: 'em_preparo', label: 'Preparando', icon: ChefHat, color: 'yellow' },
  { key: 'pronto', label: 'Pronto', icon: CheckCircle2, color: 'emerald' },
  { key: 'em_entrega', label: 'Em Rota de Entrega', icon: Bike, color: 'purple' },
  { key: 'entregue', label: 'Entregue', icon: CheckCircle2, color: 'green' },
];

export default function AcompanharPedido() {
  const [pedidoId, setPedidoId] = useState(null);
  const [pizzariaId, setPizzariaId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPedidoId(params.get('id'));
    const pizzaria = params.get('pizzaria_id');
    if (pizzaria) {
      setPizzariaId(pizzaria);
      localStorage.setItem('pizzaria_id_atual', pizzaria);
    }
  }, []);

  const { data: pedido } = useQuery({
    queryKey: ['pedido-cliente', pedidoId],
    queryFn: () => base44.entities.Pedido.filter({ id: pedidoId }),
    enabled: !!pedidoId,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const pedidoAtual = pedido?.[0];

  if (!pedidoId || !pedidoAtual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">Carregando pedido...</p>
        </Card>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === pedidoAtual.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg"
                alt="Logo"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Acompanhe seu Pedido</h1>
                <p className="text-xs text-slate-400">Pedido #{pedidoAtual.numero_pedido}</p>
              </div>
            </div>
            <Link to={createPageUrl('CardapioCliente') + (pizzariaId ? `?pizzaria_id=${pizzariaId}` : '')}>
              <Button variant="outline" className="border-slate-600 text-slate-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Animação do Ninja */}
        <div className="mb-8">
          <NinjaAnimation status={pedidoAtual.status} />
        </div>

        {/* Status Atual */}
        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 p-6 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-4">
              {React.createElement(statusSteps[currentStepIndex]?.icon || Package, {
                className: 'w-10 h-10 text-white'
              })}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {statusSteps[currentStepIndex]?.label}
            </h2>
            <p className="text-slate-300">
              {pedidoAtual.status === 'novo' && 'Aguardando confirmação do restaurante...'}
              {pedidoAtual.status === 'em_preparo' && 'Seu pedido está sendo preparado com carinho!'}
              {pedidoAtual.status === 'pronto' && 'Seu pedido está pronto e aguardando entregador!'}
              {pedidoAtual.status === 'em_entrega' && 'O entregador está a caminho!'}
              {pedidoAtual.status === 'entregue' && 'Pedido entregue! Bom apetite! 🎉'}
            </p>
          </div>
        </Card>

        {/* Timeline de Status */}
        <Card className="bg-white/5 border-white/10 p-6 mb-8">
          <h3 className="font-bold text-white mb-6">Progresso do Pedido</h3>
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'bg-slate-800 border-slate-700'
                  }`}>
                    {React.createElement(step.icon, {
                      className: `w-6 h-6 ${isCompleted ? 'text-white' : 'text-slate-600'}`
                    })}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isCompleted ? 'text-white' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-orange-400">Em andamento...</p>
                    )}
                  </div>
                  {isCompleted && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Detalhes do Pedido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              Itens do Pedido
            </h3>
            <div className="space-y-3">
              {pedidoAtual.itens?.map((item, i) => (
                <div key={i} className="flex justify-between text-slate-300">
                  <span>{item.quantidade}x {item.nome}</span>
                  <span className="text-emerald-400">R$ {(item.preco_unitario * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                <span className="text-white">Total:</span>
                <span className="text-emerald-400 text-xl">R$ {pedidoAtual.valor_total?.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-400" />
              Endereço de Entrega
            </h3>
            <div className="space-y-2 text-slate-300">
              <p className="font-semibold text-white">{pedidoAtual.cliente_nome}</p>
              <p>{pedidoAtual.cliente_endereco}, {pedidoAtual.cliente_numero}</p>
              {pedidoAtual.cliente_complemento && <p>{pedidoAtual.cliente_complemento}</p>}
              <p>{pedidoAtual.cliente_bairro} - {pedidoAtual.cliente_cidade}/{pedidoAtual.cliente_estado}</p>
              <div className="flex items-center gap-2 pt-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{pedidoAtual.cliente_telefone}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Horários */}
        <Card className="bg-white/5 border-white/10 p-6 mt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-sm mb-1">Pedido Realizado</p>
              <p className="text-white font-semibold">
                {moment(pedidoAtual.horario_pedido || pedidoAtual.created_date).format('HH:mm')}
              </p>
            </div>
            {pedidoAtual.horario_pronto && (
              <div>
                <p className="text-slate-400 text-sm mb-1">Ficou Pronto</p>
                <p className="text-white font-semibold">
                  {moment(pedidoAtual.horario_pronto).format('HH:mm')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Observações */}
        {pedidoAtual.observacoes && (
          <Card className="bg-white/5 border-white/10 p-6 mt-6">
            <h3 className="font-bold text-white mb-2">Observações</h3>
            <p className="text-slate-300">{pedidoAtual.observacoes}</p>
          </Card>
        )}
      </main>
    </div>
  );
}