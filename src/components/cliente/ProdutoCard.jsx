import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProdutoCard({ produto, onAddCart, onClick, tema = 'dark', corPrimaria = '#f97316' }) {
  const isLight = tema === 'light';
  
  return (
    <div
      onClick={() => onClick?.(produto)}
      className={`group rounded-xl overflow-hidden active:scale-95 transition-transform ${
        isLight 
          ? 'bg-white border border-gray-200 shadow-sm'
          : 'bg-white/5 border border-white/10 backdrop-blur-xl'
      }`}
    >
      {/* Imagem do Produto */}
      <div className="relative overflow-hidden aspect-square">
        {produto.imagem_url ? (
          <img 
            src={produto.imagem_url} 
            alt={produto.nome} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-4xl sm:text-5xl ${
            isLight ? 'bg-gradient-to-br from-gray-100 to-gray-200' : 'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}>
            🍽️
          </div>
        )}
        
        {/* Badges */}
        {produto.destaque && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-white text-xs py-0.5 px-1.5">
            <Star className="w-3 h-3 fill-current" />
          </Badge>
        )}
      </div>

      {/* Informações do Produto */}
      <div className="p-2.5 sm:p-3">
        <h3 className={`text-sm sm:text-base font-bold mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] ${isLight ? 'text-gray-900' : 'text-white'}`}>
          {produto.nome}
        </h3>
        
        {produto.descricao && (
          <p className={`text-xs mb-2 line-clamp-1 hidden sm:block ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            {produto.descricao}
          </p>
        )}

        {/* Opções de Personalização */}
        {produto.opcoes_personalizacao && produto.opcoes_personalizacao.length > 0 && (
          <div className={`text-xs mb-2 flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            <Tag className="w-3 h-3" />
            <span className="hidden sm:inline">{produto.opcoes_personalizacao.length} opção(ões)</span>
            <span className="sm:hidden">{produto.opcoes_personalizacao.length} opções</span>
          </div>
        )}

        {/* Preço e Ação */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-base sm:text-lg font-bold text-emerald-500 truncate">
              R$ {produto.preco?.toFixed(2)}
            </p>
          </div>
          
          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAddCart?.(produto);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: corPrimaria }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}