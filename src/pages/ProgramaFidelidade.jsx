import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Gift,
  Award,
  TrendingUp,
  History,
  Ticket,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Crown,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function ProgramaFidelidade() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clienteLogado, setClienteLogado] = useState(null);
  const [showResgateModal, setShowResgateModal] = useState(false);
  const [recompensaSelecionada, setRecompensaSelecionada] = useState(null);
  const [theme] = useState(() => localStorage.getItem('theme') || 'dark');
  const isLight = theme === 'light';

  useEffect(() => {
    const clienteData = localStorage.getItem('cliente_logado');
    if (!clienteData) {
      navigate(createPageUrl('AcessoCliente'));
      return;
    }
    setClienteLogado(JSON.parse(clienteData));
  }, [navigate]);

  const { data: cliente, refetch: refetchCliente } = useQuery({
    queryKey: ['cliente-fidelidade', clienteLogado?.id],
    queryFn: async () => {
      if (!clienteLogado?.id) return null;
      const clientes = await base44.entities.Cliente.filter({ id: clienteLogado.id });
      return clientes[0];
    },
    enabled: !!clienteLogado?.id,
  });

  const { data: recompensas = [] } = useQuery({
    queryKey: ['recompensas'],
    queryFn: () => base44.entities.Recompensa.filter({ ativa: true }, 'pontos_necessarios'),
  });

  const { data: resgates = [] } = useQuery({
    queryKey: ['resgates-cliente', clienteLogado?.id],
    queryFn: async () => {
      if (!clienteLogado?.id) return [];
      return base44.entities.ResgatePontos.filter({ cliente_id: clienteLogado.id }, '-created_date');
    },
    enabled: !!clienteLogado?.id,
  });

  const resgateMutation = useMutation({
    mutationFn: async (recompensa) => {
      const pontosAtuais = cliente?.pontos_fidelidade || 0;
      if (pontosAtuais < recompensa.pontos_necessarios) {
        throw new Error('Pontos insuficientes');
      }

      // Gerar código único
      const codigo = `FIDELIDADE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Calcular validade
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + (recompensa.validade_dias || 30));

      // Criar resgate
      await base44.entities.ResgatePontos.create({
        cliente_id: clienteLogado.id,
        recompensa_id: recompensa.id,
        pontos_gastos: recompensa.pontos_necessarios,
        codigo_cupom: codigo,
        status: 'ativo',
        data_resgate: new Date().toISOString(),
        data_validade: dataValidade.toISOString(),
      });

      // Atualizar pontos do cliente
      await base44.entities.Cliente.update(clienteLogado.id, {
        pontos_fidelidade: pontosAtuais - recompensa.pontos_necessarios,
      });

      return codigo;
    },
    onSuccess: (codigo) => {
      queryClient.invalidateQueries(['cliente-fidelidade']);
      queryClient.invalidateQueries(['resgates-cliente']);
      refetchCliente();
      toast.success(`Recompensa resgatada! Código: ${codigo}`, {
        description: 'Use este código no seu próximo pedido',
      });
      setShowResgateModal(false);
      setRecompensaSelecionada(null);
    },
    onError: (error) => {
      toast.error('Erro ao resgatar recompensa', {
        description: error.message,
      });
    },
  });

  const pontos = cliente?.pontos_fidelidade || 0;
  const totalPedidos = cliente?.total_pedidos || 0;

  // Calcular nível
  const getNivel = (pontos) => {
    if (pontos >= 1000) return { nome: 'Diamante', cor: 'from-cyan-500 to-blue-600', icone: Crown };
    if (pontos >= 500) return { nome: 'Ouro', cor: 'from-yellow-500 to-amber-600', icone: Trophy };
    if (pontos >= 200) return { nome: 'Prata', cor: 'from-gray-300 to-gray-500', icone: Award };
    return { nome: 'Bronze', cor: 'from-orange-400 to-orange-600', icone: Star };
  };

  const nivel = getNivel(pontos);
  const proximoNivel = pontos < 200 ? 200 : pontos < 500 ? 500 : pontos < 1000 ? 1000 : null;
  const progressoNivel = proximoNivel ? ((pontos / proximoNivel) * 100) : 100;

  if (!clienteLogado) return null;

  const IconeNivel = nivel.icone;

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header com Pontos */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={`border-2 ${isLight ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-3xl ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    Olá, {cliente?.nome?.split(' ')[0]}! 🎉
                  </CardTitle>
                  <p className={`${isLight ? 'text-gray-600' : 'text-slate-300'}`}>
                    Seja bem-vindo ao programa de fidelidade
                  </p>
                </div>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${nivel.cor} flex items-center justify-center`}>
                  <IconeNivel className="w-10 h-10 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/10'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6 text-orange-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Seus Pontos</span>
                  </div>
                  <p className={`text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent`}>
                    {pontos}
                  </p>
                </div>

                <div className={`p-6 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/10'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-6 h-6 text-blue-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Nível Atual</span>
                  </div>
                  <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {nivel.nome}
                  </p>
                </div>

                <div className={`p-6 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-white/10'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Total de Pedidos</span>
                  </div>
                  <p className={`text-4xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {totalPedidos}
                  </p>
                </div>
              </div>

              {proximoNivel && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                      Progresso para o próximo nível
                    </span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {pontos} / {proximoNivel} pontos
                    </span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressoNivel}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-600"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="recompensas" className="space-y-6">
          <TabsList className={`w-full grid grid-cols-2 ${isLight ? 'bg-white' : 'bg-slate-800'}`}>
            <TabsTrigger value="recompensas" className="gap-2">
              <Gift className="w-4 h-4" />
              Recompensas
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="w-4 h-4" />
              Meus Resgates
            </TabsTrigger>
          </TabsList>

          {/* Recompensas Disponíveis */}
          <TabsContent value="recompensas">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recompensas.map((recompensa) => {
                const podeResgatar = pontos >= recompensa.pontos_necessarios;
                
                return (
                  <motion.div
                    key={recompensa.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className={`h-full ${isLight ? 'bg-white' : 'bg-white/5'} ${podeResgatar ? 'border-2 border-orange-500' : ''}`}>
                      {recompensa.imagem_url && (
                        <div className="aspect-video overflow-hidden rounded-t-xl">
                          <img
                            src={recompensa.imagem_url}
                            alt={recompensa.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className={`text-lg ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {recompensa.titulo}
                          </CardTitle>
                          {podeResgatar && (
                            <Badge className="bg-orange-500 text-white">Disponível</Badge>
                          )}
                        </div>
                        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          {recompensa.descricao}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-orange-500" />
                            <span className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                              {recompensa.pontos_necessarios}
                            </span>
                            <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>pontos</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            setRecompensaSelecionada(recompensa);
                            setShowResgateModal(true);
                          }}
                          disabled={!podeResgatar}
                          className="w-full"
                          style={podeResgatar ? { backgroundColor: '#f97316' } : {}}
                        >
                          {podeResgatar ? 'Resgatar Agora' : `Faltam ${recompensa.pontos_necessarios - pontos} pontos`}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {recompensas.length === 0 && (
              <Card className={isLight ? 'bg-white' : 'bg-white/5'}>
                <CardContent className="py-12 text-center">
                  <Gift className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
                  <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                    Nenhuma recompensa disponível no momento
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Histórico de Resgates */}
          <TabsContent value="historico">
            <div className="space-y-4">
              {resgates.map((resgate) => (
                <Card key={resgate.id} className={isLight ? 'bg-white' : 'bg-white/5'}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Ticket className="w-5 h-5 text-orange-500" />
                          <h3 className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Código: {resgate.codigo_cupom}
                          </h3>
                          <Badge variant={resgate.status === 'ativo' ? 'default' : resgate.status === 'usado' ? 'secondary' : 'destructive'}>
                            {resgate.status === 'ativo' ? 'Ativo' : resgate.status === 'usado' ? 'Usado' : 'Expirado'}
                          </Badge>
                        </div>
                        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                          {resgate.pontos_gastos} pontos gastos • Resgatado em {new Date(resgate.created_date).toLocaleDateString('pt-BR')}
                        </p>
                        {resgate.data_validade && (
                          <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
                            Válido até {new Date(resgate.data_validade).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      {resgate.status === 'ativo' && (
                        <ChevronRight className={isLight ? 'text-gray-400' : 'text-slate-600'} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {resgates.length === 0 && (
                <Card className={isLight ? 'bg-white' : 'bg-white/5'}>
                  <CardContent className="py-12 text-center">
                    <History className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-300' : 'text-slate-600'}`} />
                    <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
                      Você ainda não resgatou nenhuma recompensa
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Confirmação */}
      <Dialog open={showResgateModal} onOpenChange={setShowResgateModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmar Resgate</DialogTitle>
          </DialogHeader>

          {recompensaSelecionada && (
            <div className="space-y-6">
              <div className={`p-6 rounded-xl bg-white/5`}>
                <h3 className="text-xl font-bold mb-2">{recompensaSelecionada.titulo}</h3>
                <p className="text-slate-400 mb-4">{recompensaSelecionada.descricao}</p>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/20 border border-orange-500/50">
                  <span>Pontos necessários:</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {recompensaSelecionada.pontos_necessarios}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 mt-2">
                  <span>Seus pontos após resgate:</span>
                  <span className="text-xl font-bold">
                    {pontos - recompensaSelecionada.pontos_necessarios}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowResgateModal(false)}
                  className="flex-1 border-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => resgateMutation.mutate(recompensaSelecionada)}
                  disabled={resgateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
                >
                  {resgateMutation.isPending ? 'Resgatando...' : 'Confirmar Resgate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}