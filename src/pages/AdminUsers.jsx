import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  ArrowLeft,
  LogOut,
  Building2,
  User,
  Phone,
  CreditCard,
  DollarSign,
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
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [cadastroForm, setCadastroForm] = useState({
    tipo_pessoa: 'fisica',
    nome_completo: '',
    cpf: '',
    cnpj: '',
    telefone: '',
    email: '',
    plano: 'basico',
    data_pagamento: '',
    valor_pagamento: '',
    forma_pagamento: 'pix',
    role: 'user'
  });
  const [cadastrando, setCadastrando] = useState(false);
  const [cadastroSuccess, setCadastroSuccess] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-slate-400 mb-4">
            Apenas administradores podem acessar esta página.
          </p>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-gradient-to-r from-orange-500 to-red-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao App
            </Button>
          </Link>
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

  const handleCadastro = async () => {
    if (!cadastroForm.email || !cadastroForm.nome_completo) return;
    
    // Validar CPF/CNPJ conforme tipo
    if (cadastroForm.tipo_pessoa === 'fisica' && !cadastroForm.cpf) {
      alert('CPF é obrigatório para pessoa física');
      return;
    }
    if (cadastroForm.tipo_pessoa === 'juridica' && !cadastroForm.cnpj) {
      alert('CNPJ é obrigatório para pessoa jurídica');
      return;
    }
    
    setCadastrando(true);
    try {
      // Convidar usuário através do sistema base44
      await base44.users.inviteUser(cadastroForm.email, cadastroForm.role);
      
      // Salvar dados adicionais no usuário (após convite ser aceito, os dados já estarão lá)
      // Por enquanto, apenas enviamos o convite
      
      setCadastroSuccess(true);
      setTimeout(() => {
        setCadastroSuccess(false);
        setShowCadastroModal(false);
        setCadastroForm({
          tipo_pessoa: 'fisica',
          nome_completo: '',
          cpf: '',
          cnpj: '',
          telefone: '',
          email: '',
          plano: 'basico',
          data_pagamento: '',
          valor_pagamento: '',
          forma_pagamento: 'pix',
          role: 'user'
        });
      }, 2000);
      refetch();
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      alert('Erro ao cadastrar usuário. Tente novamente.');
    } finally {
      setCadastrando(false);
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

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg" 
                alt="NinjaGO"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-lg font-bold text-white">Painel de Administração</h1>
                <p className="text-xs text-slate-400">Gestão de Usuários</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao App
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-slate-600 text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Usuários do Sistema</h2>
              <p className="text-slate-400 mt-1">{usuarios.length} usuários cadastrados</p>
            </div>
            <Button 
              onClick={() => setShowCadastroModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Usuário
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

      {/* Modal Cadastrar Usuário */}
      <Dialog open={showCadastroModal} onOpenChange={setShowCadastroModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-500" />
              Cadastrar Novo Usuário
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Tipo de Pessoa */}
            <div>
              <Label className="text-slate-400 mb-3 block">Tipo de Pessoa</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCadastroForm({ ...cadastroForm, tipo_pessoa: 'fisica' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    cadastroForm.tipo_pessoa === 'fisica'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                  <p className="text-white font-medium">Pessoa Física</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCadastroForm({ ...cadastroForm, tipo_pessoa: 'juridica' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    cadastroForm.tipo_pessoa === 'juridica'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                  <p className="text-white font-medium">Pessoa Jurídica</p>
                </button>
              </div>
            </div>

            {/* Dados da Empresa/Pessoa */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" />
                Dados {cadastroForm.tipo_pessoa === 'fisica' ? 'Pessoais' : 'da Empresa'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">
                    {cadastroForm.tipo_pessoa === 'fisica' ? 'Nome Completo' : 'Razão Social'}
                  </Label>
                  <Input
                    value={cadastroForm.nome_completo}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, nome_completo: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder={cadastroForm.tipo_pessoa === 'fisica' ? 'João da Silva' : 'Empresa LTDA'}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">
                    {cadastroForm.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                  </Label>
                  <Input
                    value={cadastroForm.tipo_pessoa === 'fisica' ? cadastroForm.cpf : cadastroForm.cnpj}
                    onChange={(e) => setCadastroForm({ 
                      ...cadastroForm, 
                      [cadastroForm.tipo_pessoa === 'fisica' ? 'cpf' : 'cnpj']: e.target.value 
                    })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder={cadastroForm.tipo_pessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Telefone</Label>
                  <Input
                    value={cadastroForm.telefone}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, telefone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Email</Label>
                  <Input
                    type="email"
                    value={cadastroForm.email}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="usuario@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Plano */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                Plano de Acesso
              </h3>
              <Select 
                value={cadastroForm.plano} 
                onValueChange={(v) => setCadastroForm({ ...cadastroForm, plano: v })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="basico">Plano Básico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dados de Pagamento */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-400" />
                Dados de Pagamento
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Data de Pagamento</Label>
                  <Input
                    type="date"
                    value={cadastroForm.data_pagamento}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, data_pagamento: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cadastroForm.valor_pagamento}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, valor_pagamento: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="0,00"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Forma de Pagamento</Label>
                  <Select 
                    value={cadastroForm.forma_pagamento} 
                    onValueChange={(v) => setCadastroForm({ ...cadastroForm, forma_pagamento: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Permissão */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                Nível de Acesso
              </h3>
              <Select 
                value={cadastroForm.role} 
                onValueChange={(v) => setCadastroForm({ ...cadastroForm, role: v })}
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
                📧 Um email será enviado para <strong>{cadastroForm.email || 'o endereço informado'}</strong> com instruções para criar a senha e acessar o sistema.
              </p>
            </div>

            {cadastroSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-300 font-medium">
                  ✅ Usuário cadastrado com sucesso!
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowCadastroModal(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCadastro}
                disabled={!cadastroForm.email || !cadastroForm.nome_completo || cadastrando || cadastroSuccess}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {cadastrando ? 'Cadastrando...' : cadastroSuccess ? 'Cadastrado!' : 'Cadastrar Usuário'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
}