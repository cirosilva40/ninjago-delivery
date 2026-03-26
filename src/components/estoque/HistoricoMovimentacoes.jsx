import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, History } from 'lucide-react';
import moment from 'moment';

const tipoConfig = {
  entrada: { label: 'Entrada', icon: ArrowUpCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  saida: { label: 'Saída', icon: ArrowDownCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ajuste: { label: 'Ajuste', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

const motivoLabel = {
  compra: 'Compra', venda: 'Venda', perda: 'Perda',
  vencimento: 'Vencimento', ajuste_manual: 'Ajuste Manual', devolucao: 'Devolução',
};

export default function HistoricoMovimentacoes({ pizzariaId }) {
  const [mesAtual, setMesAtual] = useState(moment().format('YYYY-MM'));
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes', pizzariaId, mesAtual],
    queryFn: async () => {
      const inicio = moment(mesAtual).startOf('month').format('YYYY-MM-DD');
      const fim = moment(mesAtual).endOf('month').format('YYYY-MM-DD');
      const all = await base44.entities.MovimentacaoEstoque.filter({ pizzaria_id: pizzariaId }, '-created_date', 1000);
      return all.filter(m => moment(m.data).isBetween(inicio, fim, null, '[]'));
    },
    enabled: !!pizzariaId,
  });

  const filtered = movimentacoes.filter(m => filtroTipo === 'todos' || m.tipo === filtroTipo);
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + (m.custo_total || 0), 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (m.custo_total || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-slate-400 shrink-0">Mês:</Label>
          <Input type="month" value={mesAtual} onChange={(e) => { setMesAtual(e.target.value); setPage(1); }}
            className="w-40 bg-white/5 border-white/10 text-white" />
        </div>
        <Select value={filtroTipo} onValueChange={(v) => { setFiltroTipo(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="ajuste">Ajustes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo do período */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <ArrowUpCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-400">R$ {totalEntradas.toFixed(2)}</p>
          <p className="text-xs text-slate-400">Total em entradas</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <ArrowDownCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-400">R$ {totalSaidas.toFixed(2)}</p>
          <p className="text-xs text-slate-400">CMV (saídas)</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <History className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{movimentacoes.length}</p>
          <p className="text-xs text-slate-400">Movimentações</p>
        </div>
      </div>

      {/* Lista */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-white/5 border border-white/10">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma movimentação neste período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map(mov => {
            const tipo = tipoConfig[mov.tipo] || tipoConfig.ajuste;
            const TipoIcon = tipo.icon;
            return (
              <Card key={mov.id} className="glass-card border-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${tipo.bg} flex items-center justify-center shrink-0`}>
                      <TipoIcon className={`w-5 h-5 ${tipo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-white truncate">{mov.estoque_item_nome}</span>
                        <Badge className={`${tipo.bg} ${tipo.color} border-0 text-xs`}>{tipo.label}</Badge>
                        <Badge className="bg-white/10 text-slate-300 border-0 text-xs">{motivoLabel[mov.motivo] || mov.motivo}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{moment(mov.data).format('DD/MM/YYYY')}</span>
                        <span>Qtd: <span className="text-white">{mov.quantidade}</span></span>
                        {mov.nota_compra && <span>NF: {mov.nota_compra}</span>}
                        {mov.quantidade_anterior !== undefined && (
                          <span className="text-xs">{mov.quantidade_anterior} → {mov.quantidade_posterior}</span>
                        )}
                      </div>
                      {mov.observacoes && <p className="text-xs text-slate-500 mt-1">{mov.observacoes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold ${tipo.color}`}>
                        {mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : ''}R$ {(mov.custo_total || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">R$ {(mov.custo_unitario || 0).toFixed(2)}/un</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-white"
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
          <span className="text-white px-4">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" className="border-white/10 text-white"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</Button>
        </div>
      )}
    </div>
  );
}