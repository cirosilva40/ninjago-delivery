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
  Trash2,
  X,
  Key,
  Copy,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CepInput, TelefoneInput, CnpjInput, CpfInput, CurrencyInput } from '@/components/ui/masked-input';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
    role: 'user',
    foto_url: ''
  });
  const [cadastrando, setCadastrando] = useState(false);
  const [cadastroSuccess, setCadastroSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios', 'estabelecimentos' ou 'financeiro'
  const [showCadastroEstabelecimento, setShowCadastroEstabelecimento] = useState(false);
  const [estabelecimentoForm, setEstabelecimentoForm] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    nome_exibicao_cliente: '',
    horario_abertura: '18:00',
    horario_fechamento: '23:00',
    taxa_entrega_base: 5,
    raio_entrega_km: 5,
    status: 'ativa',
    plano: 'basico',
    logo_url: '',
    // Dados do cliente inicial
    cliente_nome: '',
    cliente_email: '',
    cliente_telefone: ''
  });
  const [cadastrandoEstabelecimento, setCadastrandoEstabelecimento] = useState(false);
  const [showEditEstabelecimento, setShowEditEstabelecimento] = useState(false);
  const [editingEstabelecimento, setEditingEstabelecimento] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFotoUsuario, setUploadingFotoUsuario] = useState(false);
  const [generatingPassword, setGeneratingPassword] = useState(false);
  
  // Validação de e-mail
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  const { data: estabelecimentos = [], refetch: refetchEstabelecimentos } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: () => base44.entities.Pizzaria.list('-created_date', 500),
  });

  // Buscar dados financeiros
  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-financeiro'],
    queryFn: () => base44.entities.Pedido.list('-created_date', 1000),
  });

  const { data: custos = [] } = useQuery({
    queryKey: ['custos-financeiro'],
    queryFn: () => base44.entities.Custo.list('-data', 500),
  });

  const { data: pagamentosEntregadores = [] } = useQuery({
    queryKey: ['pagamentos-financeiro'],
    queryFn: () => base44.entities.Pagamento.list('-created_date', 500),
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
    if (!cadastroForm.email || !cadastroForm.nome_completo) {
      alert('Preencha o email e o nome completo');
      return;
    }
    
    if (!isValidEmail(cadastroForm.email)) {
      alert('Por favor, insira um e-mail válido');
      return;
    }
    
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
      console.log('🔵 Tentando convidar usuário:', {
        email: cadastroForm.email,
        role: cadastroForm.role,
        nome: cadastroForm.nome_completo
      });
      
      // Convidar usuário como 'user' primeiro (limitação do sistema)
      // Admins só podem ser criados após o usuário aceitar o convite
      const resultado = await base44.users.inviteUser(cadastroForm.email, 'user');
      
      console.log('✅ Usuário convidado com sucesso:', resultado);
      
      // Se era para ser admin, mostrar mensagem explicativa
      if (cadastroForm.role === 'admin') {
        alert('✅ Convite enviado! Após o usuário aceitar o convite, você poderá promovê-lo a administrador clicando nas opções do usuário.');
      }
      
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
          role: 'user',
          foto_url: ''
        });
      }, 2000);
      refetch();
    } catch (error) {
      console.error('❌ Erro completo ao cadastrar usuário:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Error.message:', error.message);
      console.error('❌ Error.stack:', error.stack);
      console.error('❌ Error stringified:', JSON.stringify(error, null, 2));
      
      // Mensagem amigável para erros comuns
      const errorMsg = error.message || error.toString() || '';
      console.log('📝 Mensagem de erro para análise:', errorMsg);
      
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate') || errorMsg.toLowerCase().includes('email')) {
        alert('❌ Este email já está cadastrado no sistema.');
      } else if (errorMsg.includes('invalid') || errorMsg.includes('CPF') || errorMsg.includes('CNPJ') || errorMsg.includes('document')) {
        alert('❌ O CPF/CNPJ informado parece estar inválido. Por favor, verifique o número e tente novamente.');
      } else {
        alert(`❌ Erro ao cadastrar usuário: ${errorMsg || 'Erro desconhecido'}`);
      }
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

  const handleEditUser = (usuario) => {
    setEditingUser(usuario);
    setCadastroForm({
      tipo_pessoa: 'fisica',
      nome_completo: usuario.full_name || '',
      cpf: '',
      cnpj: '',
      telefone: '',
      email: usuario.email || '',
      plano: 'basico',
      data_pagamento: '',
      valor_pagamento: '',
      forma_pagamento: 'pix',
      role: usuario.role || 'user',
      foto_url: usuario.foto_url || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    setCadastrando(true);
    try {
      await base44.entities.User.update(editingUser.id, {
        full_name: cadastroForm.nome_completo,
        email: cadastroForm.email,
        role: cadastroForm.role,
        foto_url: cadastroForm.foto_url
      });
      
      setCadastroSuccess(true);
      setTimeout(() => {
        setCadastroSuccess(false);
        setShowEditModal(false);
        setEditingUser(null);
      }, 1500);
      refetch();
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      alert('Erro ao editar usuário. Tente novamente.');
    } finally {
      setCadastrando(false);
    }
  };

  const handleDeleteUser = async (usuario) => {
    if (usuario.id === currentUser?.id) {
      alert('Você não pode excluir seu próprio usuário.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.full_name || usuario.email}?`)) {
      return;
    }

    try {
      await base44.entities.User.delete(usuario.id);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  const handleCadastroEstabelecimento = async () => {
    if (!estabelecimentoForm.nome || !estabelecimentoForm.telefone || !estabelecimentoForm.endereco) {
      alert('Preencha os campos obrigatórios: Nome, Telefone e Endereço');
      return;
    }
    
    if (estabelecimentoForm.email && !isValidEmail(estabelecimentoForm.email)) {
      alert('Por favor, insira um e-mail válido para o estabelecimento');
      return;
    }

    if (estabelecimentoForm.cliente_email && !isValidEmail(estabelecimentoForm.cliente_email)) {
      alert('Por favor, insira um e-mail válido para o cliente');
      return;
    }

    setCadastrandoEstabelecimento(true);
    try {
      let estabelecimentoData = { ...estabelecimentoForm };
      // Remover campos do cliente do objeto de estabelecimento
      delete estabelecimentoData.cliente_nome;
      delete estabelecimentoData.cliente_email;
      delete estabelecimentoData.cliente_telefone;

      if (editingEstabelecimento) {
        await base44.entities.Pizzaria.update(editingEstabelecimento.id, estabelecimentoData);
      } else {
        const novoEstabelecimento = await base44.entities.Pizzaria.create(estabelecimentoData);
        
        // Criar cliente inicial se fornecido
        if (estabelecimentoForm.cliente_email && estabelecimentoForm.cliente_nome) {
          try {
            await base44.entities.Cliente.create({
              nome: estabelecimentoForm.cliente_nome,
              email: estabelecimentoForm.cliente_email,
              telefone: estabelecimentoForm.cliente_telefone || '',
              senha: 'temp_' + Math.random().toString(36).substring(7) // Senha temporária que será alterada no primeiro acesso
            });
          } catch (clienteError) {
            console.log('Aviso: Não foi possível criar cliente inicial:', clienteError);
            // Não falha o cadastro do estabelecimento se o cliente falhar
          }
        }
      }
      
      setCadastroSuccess(true);
      setTimeout(() => {
        setCadastroSuccess(false);
        setShowCadastroEstabelecimento(false);
        setShowEditEstabelecimento(false);
        setEditingEstabelecimento(null);
        setEstabelecimentoForm({
          nome: '',
          cnpj: '',
          telefone: '',
          email: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          nome_exibicao_cliente: '',
          horario_abertura: '18:00',
          horario_fechamento: '23:00',
          taxa_entrega_base: 5,
          raio_entrega_km: 5,
          status: 'ativa',
          plano: 'basico',
          logo_url: '',
          cliente_nome: '',
          cliente_email: '',
          cliente_telefone: ''
        });
      }, 2000);
      refetchEstabelecimentos();
    } catch (error) {
      console.error('Erro ao cadastrar estabelecimento:', error);
      alert('Erro ao cadastrar estabelecimento. Tente novamente.');
    } finally {
      setCadastrandoEstabelecimento(false);
    }
  };

  const handleDeleteEstabelecimento = async (estabelecimento) => {
    if (!confirm(`Tem certeza que deseja excluir o estabelecimento ${estabelecimento.nome}?`)) {
      return;
    }

    try {
      await base44.entities.Pizzaria.delete(estabelecimento.id);
      refetchEstabelecimentos();
    } catch (error) {
      console.error('Erro ao excluir estabelecimento:', error);
      alert('Erro ao excluir estabelecimento. Tente novamente.');
    }
  };
  
  const handleEditEstabelecimento = (estabelecimento) => {
    setEditingEstabelecimento(estabelecimento);
    setEstabelecimentoForm({
      nome: estabelecimento.nome || '',
      cnpj: estabelecimento.cnpj || '',
      telefone: estabelecimento.telefone || '',
      email: estabelecimento.email || '',
      endereco: estabelecimento.endereco || '',
      cidade: estabelecimento.cidade || '',
      estado: estabelecimento.estado || '',
      cep: estabelecimento.cep || '',
      nome_exibicao_cliente: estabelecimento.nome_exibicao_cliente || '',
      horario_abertura: estabelecimento.horario_abertura || '18:00',
      horario_fechamento: estabelecimento.horario_fechamento || '23:00',
      taxa_entrega_base: estabelecimento.taxa_entrega_base || 5,
      raio_entrega_km: estabelecimento.raio_entrega_km || 5,
      status: estabelecimento.status || 'ativa',
      plano: estabelecimento.plano || 'basico',
      logo_url: estabelecimento.logo_url || '',
      cliente_nome: '',
      cliente_email: '',
      cliente_telefone: ''
    });
    setShowEditEstabelecimento(true);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const { data } = await base44.functions.invoke('uploadLogoEstabelecimento', { file });
      
      if (data.file_url) {
        setEstabelecimentoForm({ ...estabelecimentoForm, logo_url: data.file_url });
      } else {
        alert('Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFotoUsuarioUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingFotoUsuario(true);
    try {
      const { data } = await base44.functions.invoke('uploadLogoEstabelecimento', { file });
      
      if (data.file_url) {
        setCadastroForm({ ...cadastroForm, foto_url: data.file_url });
      } else {
        alert('Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingFotoUsuario(false);
    }
  };

  const admins = usuarios.filter(u => u.role === 'admin').length;
  const regularUsers = usuarios.filter(u => u.role === 'user').length;

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleGenerarSenhaTemporaria = async (clienteId) => {
    setGeneratingPassword(true);
    try {
      const { data } = await base44.functions.invoke('gerarNovaSenha', { clienteId });
      alert(`✅ Nova senha temporária gerada: ${data.senhaTemporaria}`);
      refetchEstabelecimentos();
    } catch (error) {
      console.error('Erro ao gerar senha:', error);
      alert('Erro ao gerar nova senha. Tente novamente.');
    } finally {
      setGeneratingPassword(false);
    }
  };

  const getClienteInfo = async (clienteEmail) => {
    try {
      const clientes = await base44.entities.Cliente.filter({ email: clienteEmail });
      return clientes.length > 0 ? clientes[0] : null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
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
                <Button variant="outline" className="border-slate-600 text-slate-900 dark:text-slate-100">
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
          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
            <Button
              variant={activeTab === 'usuarios' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('usuarios')}
              className={activeTab === 'usuarios' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'text-slate-400'}
            >
              <Users className="w-4 h-4 mr-2" />
              Usuários ({usuarios.length})
            </Button>
            <Button
              variant={activeTab === 'estabelecimentos' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('estabelecimentos')}
              className={activeTab === 'estabelecimentos' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'text-slate-400'}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Estabelecimentos ({estabelecimentos.length})
            </Button>
            <Button
              variant={activeTab === 'financeiro' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('financeiro')}
              className={activeTab === 'financeiro' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'text-slate-400'}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Financeiro
            </Button>
          </div>

          {activeTab === 'usuarios' && (
            <>
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
                    {usuario.foto_url ? (
                      <img 
                        src={usuario.foto_url} 
                        alt={usuario.full_name} 
                        className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {usuario.full_name?.charAt(0) || usuario.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
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
                      <DropdownMenuItem 
                        onClick={() => handleEditUser(usuario)}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
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
                      <DropdownMenuItem 
                        onClick={() => handleDeleteUser(usuario)}
                        className="cursor-pointer text-red-400 focus:text-red-300"
                        disabled={usuario.id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
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
            </>
          )}

          {activeTab === 'estabelecimentos' && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">Estabelecimentos Cadastrados</h2>
                  <p className="text-slate-400 mt-1">{estabelecimentos.length} estabelecimentos no sistema</p>
                </div>
                <Button 
                  onClick={() => setShowCadastroEstabelecimento(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Estabelecimento
                </Button>
              </div>

              {/* Lista de Estabelecimentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {estabelecimentos.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full rounded-2xl bg-white/5 border border-white/10 p-12 text-center"
                    >
                      <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">Nenhum estabelecimento cadastrado</p>
                    </motion.div>
                  ) : (
                    estabelecimentos.map((estab, index) => (
                      <motion.div
                        key={estab.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/8 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {estab.logo_url ? (
                              <img src={estab.logo_url} alt={estab.nome} className="w-16 h-16 rounded-xl object-cover" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-white text-lg">{estab.nome}</h3>
                              <Badge className={
                                estab.status === 'ativa' 
                                  ? 'bg-emerald-500/20 text-emerald-400 text-xs' 
                                  : 'bg-red-500/20 text-red-400 text-xs'
                              }>
                                {estab.status === 'ativa' ? 'Ativo' : 'Inativo'}
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
                              <DropdownMenuItem 
                                onClick={() => handleEditEstabelecimento(estab)}
                                className="cursor-pointer"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteEstabelecimento(estab)}
                                className="cursor-pointer text-red-400 focus:text-red-300"
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
                            <span>{estab.telefone || 'Sem telefone'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{estab.email || 'Sem email'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <Building2 className="w-4 h-4" />
                            <span className="truncate">{estab.cidade || 'Sem cidade'} - {estab.estado || 'UF'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <Shield className="w-4 h-4" />
                            <span>Plano: {estab.plano || 'Básico'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
                            <span className="font-mono">ID: {estab.id}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {activeTab === 'financeiro' && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">Financeiro da Plataforma</h2>
                  <p className="text-slate-400 mt-1">Acompanhamento de pagamentos dos estabelecimentos</p>
                </div>
              </div>

              {/* Métricas Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Estabelecimentos Ativos */}
                <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400">Ativos</Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Estabelecimentos</p>
                  <p className="text-3xl font-bold text-white">
                    {estabelecimentos.filter(e => e.status === 'ativa').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">de {estabelecimentos.length} total</p>
                </Card>

                {/* MRR - Receita Mensal */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">MRR</Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Receita Mensal</p>
                  <p className="text-3xl font-bold text-white">
                    R$ {(estabelecimentos.filter(e => e.status === 'ativa').length * 
                      (estabelecimentos.filter(e => e.plano === 'profissional').length * 99 + 
                       estabelecimentos.filter(e => e.plano === 'basico').length * 49 +
                       estabelecimentos.filter(e => e.plano === 'enterprise').length * 199) / 
                      (estabelecimentos.length || 1)).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Receita recorrente</p>
                </Card>

                {/* Planos Distribuição */}
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-400">Planos</Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Mais Popular</p>
                  <p className="text-3xl font-bold text-white capitalize">
                    {(() => {
                      const basicoCount = estabelecimentos.filter(e => e.plano === 'basico').length;
                      const profissionalCount = estabelecimentos.filter(e => e.plano === 'profissional').length;
                      const enterpriseCount = estabelecimentos.filter(e => e.plano === 'enterprise').length;
                      
                      if (basicoCount >= profissionalCount && basicoCount >= enterpriseCount) return 'Básico';
                      if (profissionalCount >= enterpriseCount) return 'Profissional';
                      return 'Enterprise';
                    })()}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {Math.max(
                      estabelecimentos.filter(e => e.plano === 'basico').length,
                      estabelecimentos.filter(e => e.plano === 'profissional').length,
                      estabelecimentos.filter(e => e.plano === 'enterprise').length
                    )} clientes
                  </p>
                </Card>

                {/* Taxa de Conversão */}
                <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-orange-400" />
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400">
                      {estabelecimentos.length > 0 
                        ? ((estabelecimentos.filter(e => e.status === 'ativa').length / estabelecimentos.length) * 100).toFixed(0)
                        : 0}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Taxa Ativação</p>
                  <p className="text-3xl font-bold text-white">
                    {estabelecimentos.length > 0 
                      ? ((estabelecimentos.filter(e => e.status === 'ativa').length / estabelecimentos.length) * 100).toFixed(1)
                      : 0}%
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Estabelecimentos ativos</p>
                </Card>
              </div>

              {/* Distribuição por Plano */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Plano Básico</h4>
                    <Badge className="bg-blue-500/20 text-blue-400">R$ 49/mês</Badge>
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">
                    {estabelecimentos.filter(e => e.plano === 'basico').length}
                  </p>
                  <p className="text-sm text-slate-400">
                    R$ {(estabelecimentos.filter(e => e.plano === 'basico' && e.status === 'ativa').length * 49).toFixed(2)}/mês
                  </p>
                </Card>

                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Plano Profissional</h4>
                    <Badge className="bg-purple-500/20 text-purple-400">R$ 99/mês</Badge>
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">
                    {estabelecimentos.filter(e => e.plano === 'profissional').length}
                  </p>
                  <p className="text-sm text-slate-400">
                    R$ {(estabelecimentos.filter(e => e.plano === 'profissional' && e.status === 'ativa').length * 99).toFixed(2)}/mês
                  </p>
                </Card>

                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Plano Enterprise</h4>
                    <Badge className="bg-orange-500/20 text-orange-400">R$ 199/mês</Badge>
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">
                    {estabelecimentos.filter(e => e.plano === 'enterprise').length}
                  </p>
                  <p className="text-sm text-slate-400">
                    R$ {(estabelecimentos.filter(e => e.plano === 'enterprise' && e.status === 'ativa').length * 199).toFixed(2)}/mês
                  </p>
                </Card>
              </div>

              {/* Lista de Estabelecimentos */}
              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-orange-400" />
                    Todos os Estabelecimentos
                  </h3>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {estabelecimentos.map((estab) => (
                    <div key={estab.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        {estab.logo_url ? (
                          <img src={estab.logo_url} alt={estab.nome} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-white">{estab.nome}</h4>
                            <Badge className={
                              estab.status === 'ativa' 
                                ? 'bg-emerald-500/20 text-emerald-400 text-xs' 
                                : 'bg-red-500/20 text-red-400 text-xs'
                            }>
                              {estab.status === 'ativa' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Badge className="bg-slate-700 text-slate-300 text-xs capitalize">
                              {estab.plano || 'Básico'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {estab.telefone}
                            </span>
                            <span>{estab.cidade} - {estab.estado}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Desde {moment(estab.created_date).format('MMM/YYYY')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-white">
                          R$ {estab.plano === 'enterprise' ? '199' : estab.plano === 'profissional' ? '99' : '49'}/mês
                        </p>
                      </div>
                    </div>
                  ))}

                  {estabelecimentos.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">Nenhum estabelecimento cadastrado</p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>

      {/* Modal Cadastrar Estabelecimento */}
      <Dialog open={showCadastroEstabelecimento} onOpenChange={setShowCadastroEstabelecimento}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-orange-500" />
              Cadastrar Novo Estabelecimento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Dados Básicos */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-400" />
                Dados do Estabelecimento
              </h3>

              {/* Upload de Logo */}
              <div className="col-span-2">
                <Label className="text-slate-400 mb-3 block">Logotipo do Estabelecimento</Label>
                <div className="flex items-center gap-4">
                  {estabelecimentoForm.logo_url ? (
                    <div className="relative">
                      <img 
                        src={estabelecimentoForm.logo_url} 
                        alt="Logo" 
                        className="w-24 h-24 rounded-xl object-cover border-2 border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setEstabelecimentoForm({ ...estabelecimentoForm, logo_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logo-upload-cadastro"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <label htmlFor="logo-upload-cadastro">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-600 text-slate-900 dark:text-slate-100 cursor-pointer"
                        disabled={uploadingLogo}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('logo-upload-cadastro').click();
                        }}
                      >
                        {uploadingLogo ? 'Enviando...' : estabelecimentoForm.logo_url ? 'Alterar Logo' : 'Fazer Upload do Logo'}
                      </Button>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      PNG, JPG ou JPEG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">Nome do Estabelecimento *</Label>
                  <Input
                    value={estabelecimentoForm.nome}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, nome: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Pizzaria do João"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Nome de Exibição para o Cliente</Label>
                  <Input
                    value={estabelecimentoForm.nome_exibicao_cliente}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, nome_exibicao_cliente: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Nome que aparece no cardápio"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">CNPJ</Label>
                  <CnpjInput
                    value={estabelecimentoForm.cnpj}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cnpj: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Telefone *</Label>
                  <TelefoneInput
                    value={estabelecimentoForm.telefone}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, telefone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Email</Label>
                  <Input
                    type="email"
                    value={estabelecimentoForm.email}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="contato@estabelecimento.com"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white">Endereço</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">Endereço Completo *</Label>
                  <Input
                    value={estabelecimentoForm.endereco}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, endereco: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Cidade</Label>
                  <Input
                    value={estabelecimentoForm.cidade}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cidade: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Estado</Label>
                  <Input
                    value={estabelecimentoForm.estado}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, estado: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">CEP</Label>
                  <CepInput
                    value={estabelecimentoForm.cep}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cep: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white">Configurações</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Horário de Abertura</Label>
                  <Input
                    type="time"
                    value={estabelecimentoForm.horario_abertura}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, horario_abertura: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Horário de Fechamento</Label>
                  <Input
                    type="time"
                    value={estabelecimentoForm.horario_fechamento}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, horario_fechamento: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Taxa de Entrega Base (R$)</Label>
                  <CurrencyInput
                    value={estabelecimentoForm.taxa_entrega_base}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, taxa_entrega_base: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Raio de Entrega (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={estabelecimentoForm.raio_entrega_km}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, raio_entrega_km: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Plano</Label>
                  <Select 
                    value={estabelecimentoForm.plano} 
                    onValueChange={(v) => setEstabelecimentoForm({ ...estabelecimentoForm, plano: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-400">Status</Label>
                  <Select 
                    value={estabelecimentoForm.status} 
                    onValueChange={(v) => setEstabelecimentoForm({ ...estabelecimentoForm, status: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="ativa">Ativo</SelectItem>
                      <SelectItem value="inativa">Inativo</SelectItem>
                      <SelectItem value="suspensa">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cliente Inicial (opcional) */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" />
                Cliente Inicial (Opcional)
              </h3>
              <p className="text-xs text-slate-400">Cadastre um cliente para poder fazer pedidos neste estabelecimento</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">Nome do Cliente</Label>
                  <Input
                    value={estabelecimentoForm.cliente_nome}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cliente_nome: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Email do Cliente</Label>
                  <Input
                    type="email"
                    value={estabelecimentoForm.cliente_email}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cliente_email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Telefone do Cliente</Label>
                  <TelefoneInput
                    value={estabelecimentoForm.cliente_telefone}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cliente_telefone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="col-span-2 p-3 rounded-lg bg-slate-700/30 border border-slate-700 text-xs text-slate-300">
                  <p>💡 A senha temporária será gerada automaticamente. Você poderá visualizá-la e gerar uma nova na edição do estabelecimento.</p>
                </div>
              </div>
            </div>

            {cadastroSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-300 font-medium">
                  ✅ Estabelecimento cadastrado com sucesso!
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowCadastroEstabelecimento(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCadastroEstabelecimento}
                disabled={!estabelecimentoForm.nome || !estabelecimentoForm.telefone || !estabelecimentoForm.endereco || cadastrandoEstabelecimento || cadastroSuccess}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {cadastrandoEstabelecimento ? 'Cadastrando...' : cadastroSuccess ? 'Cadastrado!' : 'Cadastrar Estabelecimento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Estabelecimento */}
      <Dialog open={showEditEstabelecimento} onOpenChange={setShowEditEstabelecimento}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="w-6 h-6 text-orange-500" />
              Editar Estabelecimento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Dados Básicos */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-400" />
                Dados do Estabelecimento
              </h3>

              {/* Upload de Logo */}
              <div className="col-span-2">
                <Label className="text-slate-400 mb-3 block">Logotipo do Estabelecimento</Label>
                <div className="flex items-center gap-4">
                  {estabelecimentoForm.logo_url ? (
                    <div className="relative">
                      <img 
                        src={estabelecimentoForm.logo_url} 
                        alt="Logo" 
                        className="w-24 h-24 rounded-xl object-cover border-2 border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setEstabelecimentoForm({ ...estabelecimentoForm, logo_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logo-upload-edit"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <label htmlFor="logo-upload-edit">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-600 text-slate-300 cursor-pointer"
                        disabled={uploadingLogo}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('logo-upload-edit').click();
                        }}
                      >
                        {uploadingLogo ? 'Enviando...' : estabelecimentoForm.logo_url ? 'Alterar Logo' : 'Fazer Upload do Logo'}
                      </Button>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      PNG, JPG ou JPEG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">Nome do Estabelecimento *</Label>
                  <Input
                    value={estabelecimentoForm.nome}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, nome: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Pizzaria do João"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Nome de Exibição para o Cliente</Label>
                  <Input
                    value={estabelecimentoForm.nome_exibicao_cliente}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, nome_exibicao_cliente: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Nome que aparece no cardápio"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">CNPJ</Label>
                  <CnpjInput
                    value={estabelecimentoForm.cnpj}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cnpj: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Telefone *</Label>
                  <TelefoneInput
                    value={estabelecimentoForm.telefone}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, telefone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Email</Label>
                  <Input
                    type="email"
                    value={estabelecimentoForm.email}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="contato@estabelecimento.com"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white">Endereço</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">Endereço Completo *</Label>
                  <Input
                    value={estabelecimentoForm.endereco}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, endereco: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Cidade</Label>
                  <Input
                    value={estabelecimentoForm.cidade}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cidade: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Estado</Label>
                  <Input
                    value={estabelecimentoForm.estado}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, estado: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">CEP</Label>
                  <CepInput
                    value={estabelecimentoForm.cep}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cep: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white">Configurações</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Horário de Abertura</Label>
                  <Input
                    type="time"
                    value={estabelecimentoForm.horario_abertura}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, horario_abertura: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Horário de Fechamento</Label>
                  <Input
                    type="time"
                    value={estabelecimentoForm.horario_fechamento}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, horario_fechamento: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Taxa de Entrega Base (R$)</Label>
                  <CurrencyInput
                    value={estabelecimentoForm.taxa_entrega_base}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, taxa_entrega_base: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Raio de Entrega (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={estabelecimentoForm.raio_entrega_km}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, raio_entrega_km: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Plano</Label>
                  <Select 
                    value={estabelecimentoForm.plano} 
                    onValueChange={(v) => setEstabelecimentoForm({ ...estabelecimentoForm, plano: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-400">Status</Label>
                  <Select 
                    value={estabelecimentoForm.status} 
                    onValueChange={(v) => setEstabelecimentoForm({ ...estabelecimentoForm, status: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="ativa">Ativo</SelectItem>
                      <SelectItem value="inativa">Inativo</SelectItem>
                      <SelectItem value="suspensa">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {cadastroSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-300 font-medium">
                  ✅ Estabelecimento cadastrado com sucesso!
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => setShowCadastroEstabelecimento(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCadastroEstabelecimento}
                disabled={!estabelecimentoForm.nome || !estabelecimentoForm.telefone || !estabelecimentoForm.endereco || cadastrandoEstabelecimento || cadastroSuccess}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {cadastrandoEstabelecimento ? 'Cadastrando...' : cadastroSuccess ? 'Cadastrado!' : 'Cadastrar Estabelecimento'}
              </Button>
            </div>
            </div>
            </DialogContent>
            </Dialog>

            {/* Modal Editar Estabelecimento (conteúdo duplicado do cadastro) */}
            <Dialog open={showEditEstabelecimento} onOpenChange={setShowEditEstabelecimento}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="w-6 h-6 text-orange-500" />
              Editar Estabelecimento
            </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
            {/* Dados Básicos */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-400" />
                Dados do Estabelecimento
              </h3>

              {/* Upload de Logo */}
              <div className="col-span-2">
                <Label className="text-slate-400 mb-3 block">Logotipo do Estabelecimento</Label>
                <div className="flex items-center gap-4">
                  {estabelecimentoForm.logo_url ? (
                    <div className="relative">
                      <img 
                        src={estabelecimentoForm.logo_url} 
                        alt="Logo" 
                        className="w-24 h-24 rounded-xl object-cover border-2 border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setEstabelecimentoForm({ ...estabelecimentoForm, logo_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logo-upload-edit"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <label htmlFor="logo-upload-edit">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-600 text-slate-300 cursor-pointer"
                        disabled={uploadingLogo}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('logo-upload-edit').click();
                        }}
                      >
                        {uploadingLogo ? 'Enviando...' : estabelecimentoForm.logo_url ? 'Alterar Logo' : 'Fazer Upload do Logo'}
                      </Button>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      PNG, JPG ou JPEG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">Nome do Estabelecimento *</Label>
                  <Input
                    value={estabelecimentoForm.nome}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, nome: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Pizzaria do João"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Nome de Exibição para o Cliente</Label>
                  <Input
                    value={estabelecimentoForm.nome_exibicao_cliente}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, nome_exibicao_cliente: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Nome que aparece no cardápio"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">CNPJ</Label>
                  <CnpjInput
                    value={estabelecimentoForm.cnpj}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cnpj: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Telefone *</Label>
                  <TelefoneInput
                    value={estabelecimentoForm.telefone}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, telefone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-slate-400">Email</Label>
                  <Input
                    type="email"
                    value={estabelecimentoForm.email}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="contato@estabelecimento.com"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white">Endereço</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-400">Endereço Completo *</Label>
                  <Input
                    value={estabelecimentoForm.endereco}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, endereco: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Cidade</Label>
                  <Input
                    value={estabelecimentoForm.cidade}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cidade: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Estado</Label>
                  <Input
                    value={estabelecimentoForm.estado}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, estado: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label className="text-slate-400">CEP</Label>
                  <CepInput
                    value={estabelecimentoForm.cep}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, cep: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-white">Configurações</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Horário de Abertura</Label>
                  <Input
                    type="time"
                    value={estabelecimentoForm.horario_abertura}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, horario_abertura: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Horário de Fechamento</Label>
                  <Input
                    type="time"
                    value={estabelecimentoForm.horario_fechamento}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, horario_fechamento: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Taxa de Entrega Base (R$)</Label>
                  <CurrencyInput
                    value={estabelecimentoForm.taxa_entrega_base}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, taxa_entrega_base: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Raio de Entrega (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={estabelecimentoForm.raio_entrega_km}
                    onChange={(e) => setEstabelecimentoForm({ ...estabelecimentoForm, raio_entrega_km: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">Plano</Label>
                  <Select 
                    value={estabelecimentoForm.plano} 
                    onValueChange={(v) => setEstabelecimentoForm({ ...estabelecimentoForm, plano: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-400">Status</Label>
                  <Select 
                    value={estabelecimentoForm.status} 
                    onValueChange={(v) => setEstabelecimentoForm({ ...estabelecimentoForm, status: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="ativa">Ativo</SelectItem>
                      <SelectItem value="inativa">Inativo</SelectItem>
                      <SelectItem value="suspensa">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Gerenciar Senha do Cliente */}
            {editingEstabelecimento && (
              <div className="space-y-4 p-4 rounded-xl bg-blue-900/30 border border-blue-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" />
                  Gerenciar Acesso do Cliente
                </h3>
                <p className="text-xs text-slate-400">Gere uma nova senha temporária para o cliente</p>
                
                <Button
                  type="button"
                  onClick={() => handleGenerarSenhaTemporaria(editingEstabelecimento.id)}
                  disabled={generatingPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {generatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Gerar Nova Senha Temporária
                    </>
                  )}
                </Button>
              </div>
            )}

            {cadastroSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-300 font-medium">
                  ✅ Estabelecimento atualizado com sucesso!
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditEstabelecimento(false);
                  setEditingEstabelecimento(null);
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCadastroEstabelecimento}
                disabled={!estabelecimentoForm.nome || !estabelecimentoForm.telefone || !estabelecimentoForm.endereco || cadastrandoEstabelecimento || cadastroSuccess}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {cadastrandoEstabelecimento ? 'Salvando...' : cadastroSuccess ? 'Salvo!' : 'Salvar Alterações'}
              </Button>
            </div>
            </div>
            </DialogContent>
            </Dialog>

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

              {/* Upload de Foto */}
              <div className="col-span-2">
                <Label className="text-slate-400 mb-3 block">Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                  {cadastroForm.foto_url ? (
                    <div className="relative">
                      <img 
                        src={cadastroForm.foto_url} 
                        alt="Foto" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setCadastroForm({ ...cadastroForm, foto_url: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="foto-usuario-upload"
                      accept="image/*"
                      onChange={handleFotoUsuarioUpload}
                      className="hidden"
                      disabled={uploadingFotoUsuario}
                    />
                    <label htmlFor="foto-usuario-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-600 text-slate-900 dark:text-slate-100 cursor-pointer"
                        disabled={uploadingFotoUsuario}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('foto-usuario-upload').click();
                        }}
                      >
                        {uploadingFotoUsuario ? 'Enviando...' : cadastroForm.foto_url ? 'Alterar Foto' : 'Fazer Upload da Foto'}
                      </Button>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      PNG, JPG ou JPEG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>
              
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
                  {cadastroForm.tipo_pessoa === 'fisica' ? (
                    <CpfInput
                      value={cadastroForm.cpf}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, cpf: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  ) : (
                    <CnpjInput
                      value={cadastroForm.cnpj}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, cnpj: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-slate-400">Telefone</Label>
                  <TelefoneInput
                    value={cadastroForm.telefone}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, telefone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
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
                  <CurrencyInput
                    value={cadastroForm.valor_pagamento}
                    onChange={(e) => setCadastroForm({ ...cadastroForm, valor_pagamento: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
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
              {cadastroForm.role === 'admin' && (
                <p className="text-sm text-yellow-300 mt-2">
                  ⚠️ O usuário será convidado como Usuário comum. Após aceitar o convite, você poderá promovê-lo a Administrador.
                </p>
              )}
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

      {/* Modal Editar Usuário */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="w-6 h-6 text-orange-500" />
              Editar Usuário
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Upload de Foto */}
            <div>
              <Label className="text-slate-400 mb-3 block">Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {cadastroForm.foto_url ? (
                  <div className="relative">
                    <img 
                      src={cadastroForm.foto_url} 
                      alt="Foto" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setCadastroForm({ ...cadastroForm, foto_url: '' })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="foto-usuario-edit-upload"
                    accept="image/*"
                    onChange={handleFotoUsuarioUpload}
                    className="hidden"
                    disabled={uploadingFotoUsuario}
                  />
                  <label htmlFor="foto-usuario-edit-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-900 dark:text-slate-100 cursor-pointer"
                      disabled={uploadingFotoUsuario}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('foto-usuario-edit-upload').click();
                      }}
                    >
                      {uploadingFotoUsuario ? 'Enviando...' : cadastroForm.foto_url ? 'Alterar Foto' : 'Upload Foto'}
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-slate-400">Nome Completo</Label>
              <Input
                value={cadastroForm.nome_completo}
                onChange={(e) => setCadastroForm({ ...cadastroForm, nome_completo: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-400">Email</Label>
              <Input
                type="email"
                value={cadastroForm.email}
                onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-400">Nível de Acesso</Label>
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

            {cadastroSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-300 font-medium">
                  ✅ Usuário editado com sucesso!
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={cadastrando || cadastroSuccess}
                className="bg-gradient-to-r from-orange-500 to-red-600"
              >
                {cadastrando ? 'Salvando...' : cadastroSuccess ? 'Salvo!' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}