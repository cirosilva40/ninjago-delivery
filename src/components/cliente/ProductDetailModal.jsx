import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductDetailModal({ produto, open, onClose, onAddToCart, tema = 'dark' }) {
  if (!produto) return null;

  const isLight = tema === 'light';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${isLight ? 'bg-white text-gray-900' : 'bg-slate-900 text-white'} border-${isLight ? 'gray-200' : 'slate-700'}`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Detalhes do Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem do Produto */}
          {produto.imagem_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-64 rounded-2xl overflow-hidden"
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
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {produto.nome}
              </h3>
              {produto.destaque && (
                <Badge className="bg-yellow-500 text-white">
                  Destaque
                </Badge>
              )}
            </div>
            <Badge className={`${isLight ? 'bg-gray-200 text-gray-700' : 'bg-slate-800 text-slate-300'} capitalize`}>
              <Tag className="w-3 h-3 mr-1" />
              {produto.categoria}
            </Badge>
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div>
              <h4 className={`font-semibold mb-2 ${isLight ? 'text-gray-700' : 'text-slate-300'}`}>
                Descrição
              </h4>
              <p className={`${isLight ? 'text-gray-600' : 'text-slate-400'} leading-relaxed`}>
                {produto.descricao}
              </p>
            </div>
          )}

          {/* Preço e Ação */}
          <div className={`flex items-center justify-between p-6 rounded-xl ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
            <div>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-slate-400'} mb-1`}>
                Preço
              </p>
              <p className="text-4xl font-bold text-emerald-500">
                R$ {produto.preco?.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={() => {
                onAddToCart(produto);
                onClose();
              }}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar ao Carrinho
            </Button>
          </div>

          {/* Informações Adicionais */}
          {produto.disponivel && (
            <p className={`text-sm text-center ${isLight ? 'text-green-600' : 'text-green-400'}`}>
              ✓ Disponível para entrega
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}