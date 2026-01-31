import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike,
  Plus,
  Search,
  Filter,
  Star,
  Phone,
  MapPin,
  Package,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Circle,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const statusConfig = {
  disponivel: { label: 'Disponível', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  em_entrega: { label: 'Em Entrega', color: 'bg-blue-500', textColor: 'text-blue-400' },
  offline: { label: 'Offline', color: 'bg-slate-500', textColor: 'text-slate-400' },
  pausado: { label: 'Pausado', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
};

export default function Entregadores() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingEntregador, setEditingEntregador] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [user, setUser] = useState(null);
  const [pizzariaId, setPizzariaId] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    veiculo: 'moto',
    placa_veiculo: '',
    status: 'offline',
  });

  React.useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      setPizzariaId(userData.pizzaria_id || 'default');
    };
    loadUser();
  }, []);

  const { data: entregadores = [], refetch } = useQuery({
    queryKey: ['entregadores', pizzariaId],
    queryFn: async () => {
      if (!pizzariaId) return [];
      if (user?.role === 'admin') {
        return base44.entities.Entregador.list('-created_date', 100);
      }
      return base44.entities.Entregador.filter({ pizzaria_id: pizzariaId }, '-created_date', 100);
    },
    enabled: !!pizzariaId,
  });

  const { data: entregas = [] } = useQuery({
    queryKey: ['entregas-stats'],
    queryFn: () => base44.entities.Entrega.list('-created_date', 500),
  });

  const filteredEntregadores = entregadores.filter(e => {
    const matchSearch = !search || 
      e.nome?.toLowerCase().includes(search.toLowerCase()) ||
      e.telefone?.includes(search);
    const matchStatus = statusFilter === 'todos' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredEntregadores.length / itemsPerPage);
  const paginatedEntregadores = filteredEntregadores.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getEntregasCount = (entregadorId) => {
    return entregas.filter(e => e.entregador_id === entregadorId && e.status === 'entregue').length;
  };

  const handleSave = async () => {
    try {
      if (editingEntregador) {
        await base44.entities.Entregador.update(editingEntregador.id, {
          ...form,
          pizzaria_id: pizzariaId,
        });
      } else {
        await base44.entities.Entregador.create({
          ...form,
          pizzaria_id: pizzariaId,
          saldo_taxas: 0,
          total_entregas: 0,
          avaliacao_media: 5,
          ativo: true,
        });
      }
      refetch();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleEdit = (entregador) => {
    setEditingEntregador(entregador);
    setForm({
      nome: entregador.nome || '',
      email: entregador.email || '',
      telefone: entregador.telefone || '',
      cpf: entregador.cpf || '',
      veiculo: entregador.veiculo || 'moto',
      placa_veiculo: entregador.placa_veiculo || '',
      status: entregador.status || 'offline',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este entregador?')) {
      await base44.entities.Entregador.delete(id);
      refetch();
    }
  };

  const resetForm = () => {
    setEditingEntregador(null);
    setForm({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      veiculo: 'moto',
      placa_veiculo: '',
      status: 'offline',
    });
  };

  const VeiculoIcon = ({ tipo }) => {
    return tipo === 'moto' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Entregadores</h1>
          <p className="text-slate-400 mt-1">{entregadores.length} entregadores cadastrados</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregador
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="disponivel">Disponíveis</SelectItem>
            <SelectItem value="em_entrega">Em Entrega</SelectItem>
            <SelectItem value="pausado">Pausados</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = entregadores.filter(e => e.status === key).length;
          return (
            <div 
              key={key}
              className="rounded-xl bg-white/5 border border-white/10 p-4 text-center"
            >
              <div className={`w-3 h-3 rounded-full ${config.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-sm text-slate-400">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Entregadores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {paginatedEntregadores.length === 0 && filteredEntregadores.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full rounded-2xl bg-white/5 border border-white/10 p-12 text-center"
            >
              <Bike className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Nenhum entregador encontrado</p>
            </motion.div>
          ) : (
            paginatedEntregadores.map((entregador, index) => {
              const status = statusConfig[entregador.status] || statusConfig.offline;
              const entregasCount = getEntregasCount(entregador.id);
              
              return (
                <motion.div
                  key={entregador.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/8 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          {entregador.foto_url ? (
                            <img 
                              src={entregador.foto_url} 
                              alt={entregador.nome}
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            <span className="text-white text-2xl font-bold">
                              {entregador.nome?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${status.color} border-3 border-slate-900 flex items-center justify-center`}>
                          <Circle className="w-2 h-2 text-white fill-current" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{entregador.nome}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${status.color}/20 ${status.textColor} text-xs`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                        <DropdownMenuItem onClick={() => handleEdit(entregador)} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(entregador.id)}
                          className="cursor-pointer text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span>{entregador.telefone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <VeiculoIcon tipo={entregador.veiculo} />
                      <span className="capitalize">{entregador.veiculo}</span>
                      {entregador.placa_veiculo && (
                        <span className="text-slate-500">• {entregador.placa_veiculo}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{entregasCount}</p>
                      <p className="text-xs text-slate-500">Entregas</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-lg font-bold text-white">
                          {entregador.avaliacao_media?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Avaliação</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-400">
                        R$ {entregador.saldo_taxas?.toFixed(0) || '0'}
                      </p>
                      <p className="text-xs text-slate-500">Saldo</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link 
                      to={createPageUrl('EntregadorDetalhe') + `?id=${entregador.id}`}
                      className="flex-1 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors text-center text-orange-400 text-sm"
                    >
                      Ver Detalhes
                    </Link>
                    <a 
                      href={`tel:${entregador.telefone}`}
                      className="py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-center text-white text-sm"
                    >
                      <Phone className="w-4 h-4 inline" />
                    </a>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-white/10 text-white"
          >
            Anterior
          </Button>
          <span className="px-4 text-white">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-white/10 text-white"
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Bike className="w-6 h-6 text-emerald-500" />
              {editingEntregador ? 'Editar Entregador' : 'Novo Entregador'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-400">Nome Completo</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Nome do entregador"
                />
              </div>
              <div>
                <Label className="text-slate-400">Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label className="text-slate-400">CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label className="text-slate-400">Veículo</Label>
                <Select value={form.veiculo} onValueChange={(v) => setForm({ ...form, veiculo: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="bicicleta">Bicicleta</SelectItem>
                    <SelectItem value="a_pe">A pé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Placa</Label>
                <Input
                  value={form.placa_veiculo}
                  onChange={(e) => setForm({ ...form, placa_veiculo: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="ABC-1234"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-400">Email (opcional)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            {/* Info de Vinculação */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-300 font-medium mb-1">📱 Como vincular ao app:</p>
              <p className="text-xs text-slate-400">
                O entregador faz login no app e informa o <strong className="text-white">telefone cadastrado</strong> ({form.telefone || '(00) 00000-0000'}) para vincular sua conta e receber entregas.
              </p>
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
                className="bg-gradient-to-r from-emerald-500 to-green-600"
              >
                {editingEntregador ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}