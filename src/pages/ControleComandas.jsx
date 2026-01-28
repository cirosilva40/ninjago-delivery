import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Upload,
  AlertCircle,
  Search
} from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function ControleComandas() {
  const [theme] = useState(() => localStorage.getItem('theme') || 'dark');
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [observacoesFinanceiras, setObservacoesFinanceiras] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState(null);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar pedidos entregues
  const { data: pedidosEntregues = [], isLoading } = useQuery({
    queryKey: ['pedidos-entregues'],
    queryFn: () => base44.entities.Pedido.filter({ status: 'entregue' }),
    refetchInterval: 10000,
  });

  // Buscar usuário atual
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Mutation para finalizar pedido
  const finalizarPedidoMutation = useMutation({
    mutationFn: async ({ pedidoId, data }) => {
      return await base44.entities.Pedido.update(pedidoId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-entregues'] });
      setSelectedPedido(null);
      setObservacoesFinanceiras('');
      setComprovanteFile(null);
      toast.success('Comanda finalizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao finalizar comanda: ' + error.message);
    },
  });

  const handleUploadComprovante = async () => {
    if (!comprovanteFile) return null;
    
    setUploadingComprovante(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file: comprovanteFile });
      setUploadingComprovante(false);
      return result.file_url;
    } catch (error) {
      setUploadingComprovante(false);
      toast.error('Erro ao fazer upload do comprovante');
      return null;
    }
  };

  const handleFinalizarComanda = async () => {
    if (!selectedPedido) return;

    let comprovanteUrl = selectedPedido.comprovante_url;
    
    // Se houver novo comprovante, fazer upload
    if (comprovanteFile) {
      comprovanteUrl = await handleUploadComprovante();
      if (!comprovanteUrl) return;
    }

    const updateData = {
      status: 'finalizada',
      observacoes_financeiras: observacoesFinanceiras,
      comprovante_url: comprovanteUrl,
      conferido_por: user?.email,
      data_conferencia: new Date().toISOString(),
    };

    finalizarPedidoMutation.mutate({ 
      pedidoId: selectedPedido.id, 
      data: updateData 
    });
  };

  const openPedidoModal = (pedido) => {
    setSelectedPedido(pedido);
    setObservacoesFinanceiras(pedido.observacoes_financeiras || '');
    setComprovanteFile(null);
  };

  const filteredPedidos = pedidosEntregues.filter(p => 
    p.numero_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cliente_telefone?.includes(searchTerm)
  );

  const formasPagamento = {
    dinheiro: { label: 'Dinheiro', color: 'bg-green-500' },
    pix: { label: 'PIX', color: 'bg-blue-500' },
    cartao_credito: { label: 'Crédito', color: 'bg-purple-500' },
    cartao_debito: { label: 'Débito', color: 'bg-orange-500' },
    online: { label: 'Online', color: 'bg-cyan-500' },
    outro: { label: 'Outro', color: 'bg-gray-500' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className={`mt-4 ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Carregando comandas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Controle de Comandas
          </h1>
          <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
            Confira e finalize pedidos entregues
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredPedidos.length} aguardando
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-slate-500'}`} />
        <Input
          placeholder="Buscar por número, cliente ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-10 ${isLight ? 'bg-white' : 'glass-card'}`}
        />
      </div>

      {/* Lista de Comandas */}
      {filteredPedidos.length === 0 ? (
        <Card className={`${isLight ? 'bg-white' : 'glass-card'} border-none`}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className={`text-xl font-semibold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Tudo em dia!
            </h3>
            <p className={isLight ? 'text-gray-600' : 'text-slate-400'}>
              Não há comandas aguardando conferência
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPedidos.map((pedido) => {
            const formaPag = formasPagamento[pedido.forma_pagamento] || formasPagamento.outro;
            
            return (
              <Card 
                key={pedido.id} 
                className={`${isLight ? 'bg-white hover:bg-gray-50' : 'glass-card hover:bg-white/5'} border-none cursor-pointer transition-all`}
                onClick={() => openPedidoModal(pedido)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                          #{pedido.numero_pedido}
                        </Badge>
                        <Badge className={`${formaPag.color} text-white`}>
                          {formaPag.label}
                        </Badge>
                        {pedido.troco_para && (
                          <Badge variant="outline" className={isLight ? 'border-gray-300 text-gray-700' : 'border-white/30 text-white'}>
                            Troco p/ R$ {pedido.troco_para.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Cliente</p>
                          <p className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {pedido.cliente_nome}
                          </p>
                          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                            {pedido.cliente_telefone}
                          </p>
                        </div>
                        
                        <div>
                          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Entregue em</p>
                          <p className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {moment(pedido.created_date).format('DD/MM/YYYY HH:mm')}
                          </p>
                        </div>
                      </div>

                      {pedido.observacoes && (
                        <div className="mt-3">
                          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Observações</p>
                          <p className={`text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {pedido.observacoes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        R$ {pedido.valor_total?.toFixed(2)}
                      </p>
                      <Button className="mt-4 bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Conferir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Conferência */}
      <Dialog open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
        <DialogContent className={`max-w-2xl ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          <DialogHeader>
            <DialogTitle className={isLight ? 'text-gray-900' : 'text-white'}>
              Conferir Comanda #{selectedPedido?.numero_pedido}
            </DialogTitle>
            <DialogDescription className={isLight ? 'text-gray-600' : 'text-slate-400'}>
              Confirme os valores e anexe comprovante se necessário
            </DialogDescription>
          </DialogHeader>

          {selectedPedido && (
            <div className="space-y-6 mt-4">
              {/* Resumo do Pedido */}
              <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50' : 'bg-white/5'}`}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Cliente</p>
                    <p className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {selectedPedido.cliente_nome}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>Forma de Pagamento</p>
                    <Badge className={`${formasPagamento[selectedPedido.forma_pagamento]?.color} text-white`}>
                      {formasPagamento[selectedPedido.forma_pagamento]?.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    Valor Total
                  </span>
                  <span className="text-2xl font-bold text-green-500">
                    R$ {selectedPedido.valor_total?.toFixed(2)}
                  </span>
                </div>

                {selectedPedido.troco_para && (
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                      Troco para
                    </span>
                    <span className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      R$ {selectedPedido.troco_para.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload de Comprovante */}
              <div>
                <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                  Comprovante de Pagamento
                </Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setComprovanteFile(e.target.files[0])}
                    className="hidden"
                    id="comprovante-upload"
                  />
                  <label htmlFor="comprovante-upload">
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors ${
                      isLight ? 'border-gray-300' : 'border-white/20'
                    }`}>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-gray-400' : 'text-slate-400'}`} />
                      <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                        {comprovanteFile 
                          ? comprovanteFile.name 
                          : selectedPedido.comprovante_url 
                            ? 'Comprovante já anexado - Clique para substituir'
                            : 'Clique para anexar comprovante (opcional)'
                        }
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Observações Financeiras */}
              <div>
                <Label className={isLight ? 'text-gray-900' : 'text-white'}>
                  Observações Financeiras
                </Label>
                <Textarea
                  value={observacoesFinanceiras}
                  onChange={(e) => setObservacoesFinanceiras(e.target.value)}
                  placeholder="Adicione observações sobre a conferência (opcional)"
                  className={`mt-2 ${isLight ? 'bg-white' : 'bg-white/5'}`}
                  rows={3}
                />
              </div>

              {/* Aviso */}
              <div className={`flex items-start gap-3 p-4 rounded-lg ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    Atenção
                  </p>
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
                    Ao finalizar, o status da comanda será alterado para "FINALIZADA" e não poderá ser revertido.
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPedido(null)}
                  disabled={finalizarPedidoMutation.isPending || uploadingComprovante}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleFinalizarComanda}
                  disabled={finalizarPedidoMutation.isPending || uploadingComprovante}
                >
                  {finalizarPedidoMutation.isPending || uploadingComprovante ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Comanda
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}