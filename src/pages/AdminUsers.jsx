import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  Edit,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Card } from '@/components/ui/card';
import moment from 'moment';

export default function AdminUsers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user' });
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (e) {
      console.log('Erro ao carregar usuário');
    }
  };

  const { data: usuarios = [], refetch } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  // Verificar se usuário atual é admin
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-slate-400">
            Apenas administradores podem acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  const filteredUsuarios = usuarios.filter(u => {
    const matchSearch = !search || 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'todos' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteForm.email, inviteForm.role);
      setInviteSuccess(true);
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
        setInviteForm({ email: '', role: 'user' });
      }, 2000);
      refetch();
    } catch (error) {
      console.error('Erro ao convidar usuário:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
    }
  };

  const admins = usuarios.filter(u => u.role === 'admin').length;
  const regularUsers = usuarios.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Usuários do Sistema</h1>
          <p className="text-slate-400 mt-1">{usuarios.length} usuários cadastrados</p>
        </div>
        <Button 
          onClick={() => setShowInviteModal(true)}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{usuarios.length}</p>
              <p className="text-sm text-slate-400">Total de Usuários</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{admins}</p>
              <p className="text-sm text-slate-400">Administradores</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{regularUsers}</p>
              <p className="text-sm text-slate-400">Usuários Comuns</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredUsuarios.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full rounded-2xl bg-white/5 border border-white/10 p-12 text-center"
            >
              <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Nenhum usuário encontrado</p>
            </motion.div>
          ) : (
            filteredUsuarios.map((usuario, index) => (
              <motion.div
                key={usuario.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/8 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {usuario.full_name?.charAt(0) || usuario.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {usuario.full_name || 'Sem nome'}
                      </h3>
                      <Badge className={
                        usuario.role === 'admin' 
                          ? 'bg-orange-500/20 text-orange-400 text-xs' 
                          : 'bg-blue-500/20 text-blue-400 text-xs'
                      }>
                        {usuario.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                      {usuario.role === 'user' ? (
                        <DropdownMenuItem 
                          onClick={() => handleUpdateRole(usuario.id, 'admin')}
                          className="cursor-pointer"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Tornar Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleUpdateRole(usuario.id, 'user')}
                          className="cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Tornar Usuário
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{usuario.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Cadastro: {moment(usuario.created_date).format('DD/MM/YYYY')}</span>
                  </div>
                </div>

                {usuario.id === currentUser?.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                      Você
                    </Badge>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal Convidar Usuário */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6 text-orange-500" />
              Convidar Novo Usuário
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Email</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div>
              <Label className="text-slate-400">Função</Label>
              <Select 
                value={inviteForm.role} 
                onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-300">
                📧 Um email de convite será enviado para o endereço informado com instruções de acesso.
              </p>
            </div>

            {inviteSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-300 font-medium">
                  ✅ Convite enviado com sucesso!
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowInviteModal(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleInvite}
                disabled={!inviteForm.email || inviting || inviteSuccess}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {inviting ? 'Enviando...' : inviteSuccess ? 'Enviado!' : 'Enviar Convite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}