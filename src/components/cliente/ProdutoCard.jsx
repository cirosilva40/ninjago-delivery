import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProdutoCard({ produto, onAddCart, onClick, tema = 'dark', corPrimaria = '#f97316' }) {
  const isLight = tema === 'light';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={() => onClick?.(produto)}
      className={`group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isLight 
          ? 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-2xl'
          : 'bg-white/5 border-2 border-white/10 hover:border-white/20 hover:bg-white/10 backdrop-blur-xl'
      }`}
    >
      {/* Imagem do Produto */}
      <div className="relative overflow-hidden aspect-square">
        {produto.imagem_url ? (
          <img 
            src={produto.imagem_url} 
            alt={produto.nome} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-6xl ${
            isLight ? 'bg-gradient-to-br from-gray-100 to-gray-200' : 'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}>
            🍽️
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {produto.destaque && (
            <Badge className="bg-yellow-500 text-white shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Destaque
            </Badge>
          )}
        </div>

        {/* Overlay com Botão de Adicionar */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddCart?.(produto);
            }}
            size="lg"
            className="text-white shadow-2xl transform scale-90 group-hover:scale-100 transition-transform"
            style={{ backgroundColor: corPrimaria }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>

      {/* Informações do Produto */}
      <div className="p-5">
        <h3 className={`text-xl font-bold mb-2 line-clamp-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
          {produto.nome}
        </h3>
        
        {produto.descricao && (
          <p className={`text-sm mb-4 line-clamp-2 min-h-[40px] ${isLight ? 'text-gray-600' : 'text-slate-400'}`}>
            {produto.descricao}
          </p>
        )}

        {/* Opções de Personalização */}
        {produto.opcoes_personalizacao && produto.opcoes_personalizacao.length > 0 && (
          <div className={`text-xs mb-3 flex items-center gap-1 ${isLight ? 'text-gray-500' : 'text-slate-500'}`}>
            <Tag className="w-3 h-3" />
            {produto.opcoes_personalizacao.length} opção(ões) disponível(is)
          </div>
        )}

        {/* Preço e Ação */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-emerald-500">
              R$ {produto.preco?.toFixed(2)}
            </p>
            <p className={`text-xs ${isLight ? 'text-gray-400' : 'text-slate-500'}`}>
              Clique para ver detalhes
            </p>
          </div>
          
          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAddCart?.(produto);
            }}
            className="w-12 h-12 rounded-full text-white shadow-lg"
            style={{ backgroundColor: corPrimaria }}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}