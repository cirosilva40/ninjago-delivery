import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Image,
  DollarSign,
  Tag,
  Check,
  X,
  Pizza,
  Coffee,
  UtensilsCrossed,
  IceCream,
  Sandwich,
  Wine,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import OpcoesPersonalizacaoManager from '@/components/produtos/OpcoesPersonalizacaoManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const categoriaConfig = {
  pizza: { label: 'Pizza', icon: Pizza, color: 'bg-red-500' },
  esfiha: { label: 'Esfiha', icon: UtensilsCrossed, color: 'bg-orange-500' },
  lanche: { label: 'Lanche', icon: Sandwich, color: 'bg-yellow-500' },
  bebida: { label: 'Bebida', icon: Coffee, color: 'bg-blue-500' },
  acai: { label: 'Açaí', icon: IceCream, color: 'bg-purple-500' },
  combo: { label: 'Combo', icon: Package, color: 'bg-green-500' },
  sobremesa: { label: 'Sobremesa', icon: IceCream, color: 'bg-pink-500' },
  porcao: { label: 'Porção', icon: UtensilsCrossed, color: 'bg-amber-500' },
  salgado: { label: 'Salgado', icon: UtensilsCrossed, color: 'bg-orange-600' },
  doce: { label: 'Doce', icon: IceCream, color: 'bg-rose-500' },
  outro: { label: 'Outro', icon: Package, color: 'bg-slate-500' },
};

export default function Produtos() {
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [user, setUser] = useState(null);
  const [pizzariaId, setPizzariaId] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    categoria: 'outro',
    preco: '',
    imagem_url: '',
    disponivel: true,
    destaque: false,
    opcoes_personalizacao: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState({ key: '', label: '' });
  const [categoriasCustom, setCategoriasCustom] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('categoriasCustom') || '{}');
    } catch {
      return {};
    }
  });

  const todasCategorias = { ...categoriaConfig, ...categoriasCustom };

  React.useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Obter pizzaria_id do localStorage se disponível
      const estabelecimentoLogado = localStorage.getItem('estabelecimento_logado');
      if (estabelecimentoLogado) {
        const estab = JSON.parse(estabelecimentoLogado);
        setPizzariaId(estab.id);
      } else {
        setPizzariaId(userData.pizzaria_id || 'default');
      }
    };
    loadUser();
  }, []);

  const salvarNovaCategoria = () => {
    if (!novaCategoria.key || !novaCategoria.label) return;
    const key = novaCategoria.key.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const novasCategorias = {
      ...categoriasCustom,
      [key]: { label: novaCategoria.label, icon: Package, color: 'bg-slate-500' }
    };
    setCategoriasCustom(novasCategorias);
    localStorage.setItem('categoriasCustom', JSON.stringify(novasCategorias));
    setNovaCategoria({ key: '', label: '' });
    setShowCategoriaModal(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, imagem_url: file_url });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const { data: produtos = [], refetch } = useQuery({
    queryKey: ['produtos', pizzariaId],
    queryFn: async () => {
      if (!pizzariaId) return [];
      return base44.entities.Produto.filter({ restaurante_id: pizzariaId }, '-created_date', 500);
    },
    enabled: !!pizzariaId,
  });

  const filteredProdutos = produtos.filter(p => {
    const matchSearch = !search || 
      p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = categoriaFilter === 'todas' || p.categoria === categoriaFilter;
    return matchSearch && matchCategoria;
  });

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        preco: parseFloat(form.preco) || 0,
        restaurante_id: pizzariaId,
      };

      if (editingProduto) {
        await base44.entities.Produto.update(editingProduto.id, data);
      } else {
        await base44.entities.Produto.create(data);
      }
      refetch();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setForm({
      nome: produto.nome || '',
      descricao: produto.descricao || '',
      categoria: produto.categoria || 'outro',
      preco: produto.preco?.toString() || '',
      imagem_url: produto.imagem_url || '',
      disponivel: produto.disponivel !== false,
      destaque: produto.destaque || false,
      opcoes_personalizacao: produto.opcoes_personalizacao || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await base44.entities.Produto.delete(id);
      refetch();
    }
  };

  const toggleDisponivel = async (produto) => {
    await base44.entities.Produto.update(produto.id, { disponivel: !produto.disponivel });
    refetch();
  };

  const resetForm = () => {
    setEditingProduto(null);
    setForm({
      nome: '',
      descricao: '',
      categoria: 'outro',
      preco: '',
      imagem_url: '',
      disponivel: true,
      destaque: false,
      opcoes_personalizacao: [],
    });
  };

  // Agrupar por categoria
  const produtosPorCategoria = filteredProdutos.reduce((acc, p) => {
    const cat = p.categoria || 'outro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Produtos Cadastrados</h1>
          <p className="text-slate-400 mt-1">{produtos.length} produtos no cardápio</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCategoriaModal(true)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
          <Button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="todas">Todas Categorias</SelectItem>
            {Object.entries(todasCategorias).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats por Categoria */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(todasCategorias).map(([key, config]) => {
          const count = produtos.filter(p => p.categoria === key).length;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <Badge 
              key={key}
              className={`${config.color}/20 text-white cursor-pointer hover:opacity-80`}
              onClick={() => setCategoriaFilter(key)}
            >
              <Icon className="w-3 h-3 mr-1" />
              {config.label}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Produtos Grid */}
      {Object.keys(produtosPorCategoria).length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center"
        >
          <Package className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">Nenhum produto cadastrado</p>
          <p className="text-sm text-slate-500">Clique em "Novo Produto" para começar</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(produtosPorCategoria).map(([categoria, items]) => {
            const config = todasCategorias[categoria] || categoriaConfig.outro;
            const Icon = config.icon;
            return (
              <div key={categoria}>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${config.color}/20 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color.replace('bg-', 'text-')}`} />
                  </div>
                  {config.label}
                  <span className="text-sm text-slate-500">({items.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {items.map((produto, index) => (
                      <motion.div
                        key={produto.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={`rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/8 transition-all ${
                          !produto.disponivel ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Imagem */}
                        <div className="aspect-video bg-slate-800 relative overflow-hidden">
                          {produto.imagem_url ? (
                            <img 
                              src={produto.imagem_url} 
                              alt={produto.nome}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                              <Icon className="w-12 h-12 text-slate-600" />
                              <p className="text-xs text-slate-600">Sem imagem</p>
                            </div>
                          )}
                          {produto.destaque && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                              ⭐ Destaque
                            </Badge>
                          )}
                          {!produto.disponivel && (
                            <Badge className="absolute top-2 right-2 bg-red-500">
                              Indisponível
                            </Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-white">{produto.nome}</h3>
                              {produto.descricao && (
                                <p className="text-sm text-slate-400 line-clamp-2 mt-1">{produto.descricao}</p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-400 h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                                <DropdownMenuItem onClick={() => handleEdit(produto)} className="cursor-pointer">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleDisponivel(produto)} className="cursor-pointer">
                                  {produto.disponivel ? (
                                    <><X className="w-4 h-4 mr-2" /> Marcar Indisponível</>
                                  ) : (
                                    <><Check className="w-4 h-4 mr-2" /> Marcar Disponível</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(produto.id)}
                                  className="cursor-pointer text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-xl font-bold text-emerald-400 mt-3">
                            R$ {produto.preco?.toFixed(2)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-500" />
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Nome do Produto</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ex: Pizza Margherita"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(todasCategorias).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-400">Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Descrição do produto..."
                rows={3}
              />
            </div>

            <div>
              <Label className="text-slate-400 mb-2 block">Imagem do Produto</Label>
              
              {/* Orientações de Dimensões */}
              <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Image className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-300 mb-2">📐 Dimensões Recomendadas</p>
                    <div className="space-y-1 text-xs text-slate-400">
                      <p>• <span className="text-blue-300 font-medium">Proporção ideal: 16:9</span> (landscape)</p>
                      <p>• Resolução mínima: 800x450 pixels</p>
                      <p>• Resolução recomendada: 1200x675 pixels</p>
                      <p>• Formato: JPG, PNG ou WEBP</p>
                      <p>• Tamanho máximo: 2MB</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      💡 Imagens com essas dimensões ficam perfeitas em todos os dispositivos
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Preview da Imagem */}
                {form.imagem_url && (
                  <div className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-800 border-2 border-blue-500/30">
                      <img 
                        src={form.imagem_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '';
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setForm({ ...form, imagem_url: '' })}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white h-8 w-8 backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-sm">
                      <p className="text-xs text-white">✓ Proporção 16:9</p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <label className="block">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-3 h-12 px-4 rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50 text-slate-300 cursor-pointer hover:bg-slate-700/50 hover:border-blue-500/50 transition-all group">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <div className="flex-1 text-center">
                          <p className="text-sm font-medium text-blue-400">Enviando imagem...</p>
                          <p className="text-xs text-slate-500">Aguarde</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                        <div className="flex-1 text-center">
                          <p className="text-sm font-medium group-hover:text-white transition-colors">
                            Clique para fazer upload
                          </p>
                          <p className="text-xs text-slate-500">ou arraste a imagem aqui</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>

                {/* URL Input */}
                <div className="relative">
                  <Input
                    value={form.imagem_url}
                    onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white pl-10"
                    placeholder="Ou cole a URL da imagem aqui..."
                  />
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>

                {/* Dica de Proporção */}
                {!form.imagem_url && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="text-amber-400">💡</div>
                    <p className="text-xs text-amber-300/80">
                      Use imagens horizontais (mais largas que altas) para melhor visualização
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="text-white">Disponível para venda</span>
              </div>
              <Switch
                checked={form.disponivel}
                onCheckedChange={(v) => setForm({ ...form, disponivel: v })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Produto em destaque</span>
              </div>
              <Switch
                checked={form.destaque}
                onCheckedChange={(v) => setForm({ ...form, destaque: v })}
              />
            </div>

            {/* Opções de Personalização */}
            <div className="pt-4 border-t border-slate-700">
              <OpcoesPersonalizacaoManager
                opcoes={form.opcoes_personalizacao}
                onChange={(opcoes) => setForm({ ...form, opcoes_personalizacao: opcoes })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowModal(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!form.nome || !form.preco}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {editingProduto ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Categoria */}
      <Dialog open={showCategoriaModal} onOpenChange={setShowCategoriaModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Tag className="w-6 h-6 text-orange-500" />
              Nova Categoria
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Nome da Categoria</Label>
              <Input
                value={novaCategoria.label}
                onChange={(e) => setNovaCategoria({ 
                  key: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  label: e.target.value 
                })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ex: Massas, Saladas, etc."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowCategoriaModal(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={salvarNovaCategoria}
                disabled={!novaCategoria.label}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                Criar Categoria
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}