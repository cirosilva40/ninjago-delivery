import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ProductDetailModal({ produto, open, onClose, onAddToCart, tema = 'dark' }) {
  const [selecoes, setSelecoes] = useState({});
  const [precoTotal, setPrecoTotal] = useState(0);

  useEffect(() => {
    if (open && produto) {
      setSelecoes({});
      setPrecoTotal(produto.preco || 0);
    }
  }, [open, produto]);

  if (!produto) return null;

  const isLight = tema === 'light';
  const temOpcoes = produto.opcoes_personalizacao && produto.opcoes_personalizacao.length > 0;

  const handleToggleItem = (grupoIndex, itemIndex, item, grupo) => {
    const grupoKey = `grupo_${grupoIndex}`;
    const selecoesGrupo = selecoes[grupoKey] || [];
    
    const jaExiste = selecoesGrupo.some(s => s.itemIndex === itemIndex);
    
    let novasSelecoes;
    if (jaExiste) {
      novasSelecoes = selecoesGrupo.filter(s => s.itemIndex !== itemIndex);
    } else {
      if (grupo.max_selecoes && selecoesGrupo.length >= grupo.max_selecoes) {
        toast.error(`Máximo de ${grupo.max_selecoes} ${grupo.max_selecoes === 1 ? 'item' : 'itens'} permitido${grupo.max_selecoes === 1 ? '' : 's'}`);
        return;
      }
      novasSelecoes = [...selecoesGrupo, { itemIndex, item }];
    }
    
    const todasSelecoes = { ...selecoes, [grupoKey]: novasSelecoes };
    setSelecoes(todasSelecoes);
    
    // Calcular preço total
    let total = produto.preco || 0;
    Object.values(todasSelecoes).forEach(grupoSel => {
      grupoSel.forEach(sel => {
        total += sel.item.preco_adicional || 0;
      });
    });
    setPrecoTotal(total);
  };

  const validarSelecoes = () => {
    if (!temOpcoes) return true;
    
    for (let i = 0; i < produto.opcoes_personalizacao.length; i++) {
      const grupo = produto.opcoes_personalizacao[i];
      const grupoKey = `grupo_${i}`;
      const selecoesGrupo = selecoes[grupoKey] || [];
      
      if (grupo.obrigatorio && selecoesGrupo.length === 0) {
        toast.error(`Selecione pelo menos um item em "${grupo.nome_grupo}"`);
        return false;
      }
      
      if (grupo.min_selecoes && selecoesGrupo.length < grupo.min_selecoes) {
        toast.error(`Selecione pelo menos ${grupo.min_selecoes} ${grupo.min_selecoes === 1 ? 'item' : 'itens'} em "${grupo.nome_grupo}"`);
        return false;
      }
    }
    
    return true;
  };

  const handleAddToCart = () => {
    if (!validarSelecoes()) return;
    
    const produtoComSelecoes = {
      ...produto,
      preco_final: precoTotal,
      personalizacoes: selecoes,
    };
    
    onAddToCart(produtoComSelecoes);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto ${isLight ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'} border-${isLight ? 'gray-200' : 'slate-700'}`}>
        <DialogHeader>
          <DialogTitle className={`text-xl sm:text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Detalhes do Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Imagem do Produto */}
          {produto.imagem_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full aspect-square max-h-[280px] sm:max-h-[500px] rounded-xl sm:rounded-2xl overflow-hidden mx-auto"
            >
              <img 
                src={produto.imagem_url} 
                alt={produto.nome} 
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {/* Nome e Categoria */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <h3 className={`text-xl sm:text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {produto.nome}
              </h3>
              {produto.destaque && (
                <Badge className="bg-yellow-500 text-white text-xs">
                  Destaque
                </Badge>
              )}
            </div>
            <Badge className={`${isLight ? 'bg-gray-200 text-gray-700' : 'bg-slate-800 text-slate-300'} capitalize text-xs`}>
              <Tag className="w-3 h-3 mr-1" />
              {produto.categoria}
            </Badge>
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div>
              <h4 className={`font-semibold mb-2 text-sm sm:text-base ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Descrição
              </h4>
              <p className={`${isLight ? 'text-gray-600' : 'text-slate-400'} leading-relaxed text-sm sm:text-base`}>
                {produto.descricao}
              </p>
            </div>
          )}

          {/* Opções de Personalização */}
          {temOpcoes && (
            <div className="space-y-3 sm:space-y-4">
              <h4 className={`font-semibold text-sm sm:text-base ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Personalize seu produto
              </h4>
              
              {produto.opcoes_personalizacao.map((grupo, grupoIndex) => {
                const grupoKey = `grupo_${grupoIndex}`;
                const selecoesGrupo = selecoes[grupoKey] || [];
                const itensDisponiveis = grupo.itens?.filter(i => i.disponivel) || [];
                
                if (itensDisponiveis.length === 0) return null;
                
                return (
                  <div 
                    key={grupoIndex} 
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-slate-800/30 border-slate-700'}`}
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div>
                        <h5 className={`font-semibold text-sm sm:text-base ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {grupo.nome_grupo}
                          {grupo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                        </h5>
                        <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-500'} mt-1`}>
                          {grupo.min_selecoes > 0 && `Mínimo: ${grupo.min_selecoes} • `}
                          {grupo.max_selecoes && `Máximo: ${grupo.max_selecoes} ${grupo.max_selecoes === 1 ? 'item' : 'itens'}`}
                        </p>
                      </div>
                      {grupo.max_selecoes && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${selecoesGrupo.length >= grupo.max_selecoes ? 'border-orange-500 text-orange-500' : ''}`}
                        >
                          {selecoesGrupo.length}/{grupo.max_selecoes}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {itensDisponiveis.map((item, itemIndex) => {
                        const itemOriginalIndex = grupo.itens.indexOf(item);
                        const isSelected = selecoesGrupo.some(s => s.itemIndex === itemOriginalIndex);
                        
                        return (
                          <label
                            key={itemOriginalIndex}
                            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected 
                                ? isLight 
                                  ? 'bg-orange-50 border-orange-300' 
                                  : 'bg-orange-500/10 border-orange-500/30'
                                : isLight
                                  ? 'bg-white border-gray-200 hover:border-gray-300'
                                  : 'bg-slate-900/30 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleItem(grupoIndex, itemOriginalIndex, item, grupo)}
                              />
                              <span className={`font-medium text-sm sm:text-base ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                {item.nome}
                              </span>
                            </div>
                            {grupo.permite_precificacao && item.preco_adicional > 0 && (
                              <span className="text-xs sm:text-sm font-semibold text-emerald-500">
                                + R$ {item.preco_adicional.toFixed(2)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Preço e Ação */}
          <div className={`flex flex-col gap-3 p-4 sm:p-6 rounded-lg sm:rounded-xl ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'} mb-1`}>
                  {temOpcoes && precoTotal > produto.preco ? 'Preço Total' : 'Preço'}
                </p>
                <div className="flex items-baseline gap-2">
                  {temOpcoes && precoTotal > produto.preco && (
                    <p className="text-base sm:text-lg font-medium text-slate-500 line-through">
                      R$ {produto.preco?.toFixed(2)}
                    </p>
                  )}
                  <p className="text-2xl sm:text-4xl font-bold text-emerald-500">
                    R$ {precoTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-base px-6 w-full h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar ao Carrinho
            </Button>
            {produto.disponivel && (
              <p className={`text-xs sm:text-sm text-center ${isLight ? 'text-green-600' : 'text-green-400'}`}>
                ✓ Disponível para entrega
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}