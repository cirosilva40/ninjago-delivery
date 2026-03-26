import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, FlaskConical, History } from 'lucide-react';
import EstoqueAtual from '@/components/estoque/EstoqueAtual';
import RegistrarCompra from '@/components/estoque/RegistrarCompra';
import ComposicaoProdutos from '@/components/estoque/ComposicaoProdutos';
import HistoricoMovimentacoes from '@/components/estoque/HistoricoMovimentacoes';

export default function Estoque() {
  const [pizzariaId, setPizzariaId] = useState(null);

  useEffect(() => {
    const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
    if (estabelecimentoLogado) {
      try {
        const estab = JSON.parse(estabelecimentoLogado);
        if (estab?.id) { setPizzariaId(estab.id); return; }
      } catch (e) {}
    }
    base44.auth.me().then(u => { if (u?.pizzaria_id) setPizzariaId(u.pizzaria_id); }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Estoque</h1>
        <p className="text-slate-400 mt-1">Controle de insumos, descartáveis e CMV</p>
      </div>

      <Tabs defaultValue="atual" className="space-y-6">
        <TabsList className="bg-white/5 flex-wrap h-auto">
          <TabsTrigger value="atual" className="gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <Package className="w-4 h-4" /> Estoque Atual
          </TabsTrigger>
          <TabsTrigger value="compra" className="gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <ShoppingCart className="w-4 h-4" /> Registrar Compra
          </TabsTrigger>
          <TabsTrigger value="composicao" className="gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <FlaskConical className="w-4 h-4" /> Composição / CMV
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <History className="w-4 h-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="atual">
          <EstoqueAtual pizzariaId={pizzariaId} />
        </TabsContent>

        <TabsContent value="compra">
          <RegistrarCompra pizzariaId={pizzariaId} />
        </TabsContent>

        <TabsContent value="composicao">
          <ComposicaoProdutos pizzariaId={pizzariaId} />
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoMovimentacoes pizzariaId={pizzariaId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}