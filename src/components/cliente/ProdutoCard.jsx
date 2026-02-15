import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProdutoCard({ produto, onAddCart, onClick, tema = 'dark', corPrimaria = '#f97316' }) {
  const isLight = tema === 'light';
  
  // Extrair ingredientes da descrição (formato simples)
  const ingredientes = produto.descricao 
    ? produto.descricao.split(',').map(i => i.trim()).filter(i => i.length > 0) 
    : [];
  
  return (
    <div
      onClick={() => onClick?.(produto)}
      className={`group rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all ${
        isLight 
          ? 'bg-white border border-gray-200 shadow-sm hover:border-gray-300'
          : 'bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10'
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Imagem do Produto */}
        <div className="relative overflow-hidden rounded-lg flex-shrink-0 w-full sm:w-32 h-32 sm:h-32">
          {produto.imagem_url ? (
            <img 
              src={produto.imagem_url} 
              alt={produto.nome} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-4xl ${
              isLight ? 'bg-gradient-to-br from-gray-100 to-gray-200' : 'bg-gradient-to-br from-slate-800 to-slate-900'
            }`}>
              🍽️
            </div>
          )}
          
          {produto.destaque && (
            <Badge className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-xs py-0.5 px-1.5">
              <Star className="w-3 h-3 fill-current" />
            </Badge>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`text-base sm:text-lg font-bold line-clamp-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {produto.nome}
              </h3>
              <p className="text-lg sm:text-xl font-bold text-emerald-500 flex-shrink-0">
                R$ {produto.preco?.toFixed(2)}
              </p>
            </div>
            
            {/* Ingredientes */}
            {ingredientes.length > 0 && (
              <div className="mb-2">
                <p className={`text-xs font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-slate-400'}`}>
                  Ingredientes:
                </p>
                <div className="flex flex-wrap gap-1">
                  {ingredientes.slice(0, 4).map((ing, idx) => (
                    <span 
                      key={idx}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isLight 
                          ? 'bg-gray-100 text-gray-700' 
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ing}
                    </span>
                  ))}
                  {ingredientes.length > 4 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isLight ? 'bg-gray-100 text-gray-500' : 'bg-slate-800 text-slate-500'
                    }`}>
                      +{ingredientes.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Opções de Personalização */}
            {produto.opcoes_personalizacao && produto.opcoes_personalizacao.length > 0 && (
              <div className={`text-xs flex items-center gap-1 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                <Tag className="w-3 h-3" />
                <span>Personalizável ({produto.opcoes_personalizacao.length} opções)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(produto);
              }}
              variant="outline"
              className={`flex-1 ${
                isLight 
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                  : 'border-slate-600 text-white hover:bg-slate-800'
              }`}
            >
              Ver detalhes
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (produto.opcoes_personalizacao && produto.opcoes_personalizacao.length > 0) {
                  onClick?.(produto);
                } else {
                  onAddCart?.(produto);
                }
              }}
              className="flex-1 text-white"
              style={{ backgroundColor: corPrimaria }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}