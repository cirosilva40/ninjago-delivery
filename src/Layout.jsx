import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Users,
  Bike,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Pizza,
  Home,
  Package,
  ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Toaster } from 'sonner';

const menuItems = [
  { name: 'Novo Pedido', icon: ClipboardList, page: 'NovoPedido' },
  { name: 'Pedidos', icon: ClipboardList, page: 'Pedidos' },
  { name: 'Cozinha', icon: Pizza, page: 'Cozinha' },
  { name: 'Produtos', icon: Pizza, page: 'Produtos' },
  { name: 'Mapa ao Vivo', icon: MapPin, page: 'MapaTempoReal' },
  { name: 'Entregadores', icon: Bike, page: 'Entregadores' },
  { name: 'Financeiro', icon: BarChart3, page: 'Financeiro' },
  { name: 'Relatórios', icon: BarChart3, page: 'Relatorios' },
  { name: 'Configurações', icon: Settings, page: 'Configuracoes' },
];

const mobileNavItems = [
  { name: 'Pedidos', icon: Package, page: 'Pedidos' },
  { name: 'Novo', icon: ClipboardList, page: 'NovoPedido' },
  { name: 'Cozinha', icon: ChefHat, page: 'Cozinha' },
  { name: 'Entregadores', icon: Bike, page: 'Entregadores' },
  { name: 'Mais', icon: Menu, page: 'menu' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notificacoes, setNotificacoes] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.pizzaria_id) {
      loadNotificacoes(user.pizzaria_id);
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.log('User not logged in');
    }
  };

  const loadNotificacoes = async (pizzariaId) => {
    try {
      const data = await base44.entities.Notificacao.filter(
        { lida: false, pizzaria_id: pizzariaId },
        '-created_date',
        5
      );
      setNotificacoes(data);
    } catch (e) {
      console.error('Erro ao carregar notificações:', e);
    }
  };

  const marcarComoLida = async (notificacaoId) => {
    try {
      setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
      await base44.entities.Notificacao.update(notificacaoId, { lida: true });
    } catch (e) {
      console.error('Erro ao marcar notificação como lida:', e);
      if (user?.pizzaria_id) loadNotificacoes(user.pizzaria_id);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Páginas que não usam o layout padrão
  if (currentPageName === 'Home' || currentPageName === 'AppEntregador' || currentPageName === 'AdminUsers' || currentPageName === 'CardapioCliente' || currentPageName === 'AcompanharPedido' || currentPageName === 'AcessoCliente' || currentPageName === 'PerfilCliente' || currentPageName === 'AcessoUsuario' || currentPageName === 'PagamentoSucesso' || currentPageName === 'PagamentoFalha' || currentPageName === 'AcessoAdmin') {
    return <>{children}</>;
  }

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'}`}>
      <Toaster 
        position="top-center" 
        richColors 
        theme={theme}
        toastOptions={{
          duration: 3000,
          style: {
            background: isLight ? 'white' : '#1e293b',
            color: isLight ? '#1e293b' : 'white',
            border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
          },
        }}
      />
      <style>{`
        :root {
          --primary: 24 100% 50%;
          --primary-foreground: 0 0% 100%;
        }
        .glass-card {
          background: ${isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.03)'};
          backdrop-filter: blur(20px);
          border: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)'};
        }
        .glass-sidebar {
          background: ${isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.8)'};
          backdrop-filter: blur(20px);
          border-right: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
        }
        .gradient-text {
          background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glow-orange {
          box-shadow: 0 0 30px rgba(249, 115, 22, 0.3);
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 glass-sidebar transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <Link to={createPageUrl('Pedidos')} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg" 
                alt="NinjaGO Delivery"
                className="w-12 h-12 rounded-2xl object-cover"
              />
              <div>
                <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>NinjaGO</h1>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>Delivery</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150
                    ${isActive 
                      ? 'bg-gradient-to-r from-orange-500/20 to-red-500/10 text-orange-500 border border-orange-500/20' 
                      : isLight 
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        : 'text-slate-100 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          {user && (
            <div className={`p-4 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{user.full_name || 'Usuário'}</p>
                  <p className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Bar */}
        <header className={`sticky top-0 z-30 glass-card border-b ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden ${isLight ? 'text-gray-700' : 'text-white'}`}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <h2 className={`text-lg font-semibold hidden sm:block ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {menuItems.find(m => m.page === currentPageName)?.name || currentPageName}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={`relative ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-white'}`}>
                    <Bell className="w-5 h-5" />
                    {notificacoes.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-orange-500 text-white text-xs">
                        {notificacoes.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-700">
                  <div className="p-3 border-b border-slate-700">
                    <p className="font-semibold text-white">Notificações</p>
                  </div>
                  {notificacoes.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notificacoes.map((n) => (
                      <DropdownMenuItem 
                        key={n.id} 
                        className="p-3 cursor-pointer"
                        onClick={() => marcarComoLida(n.id)}
                      >
                        <div>
                          <p className="font-medium text-white">{n.titulo}</p>
                          <p className="text-sm text-slate-400">{n.mensagem}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`gap-2 ${isLight ? 'text-gray-500 hover:text-gray-700' : 'text-slate-400 hover:text-white'}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
        </div>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-card border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
        <div className="flex items-center justify-around px-2 py-3 safe-area-inset-bottom">
          {mobileNavItems.map((item) => {
            const isActive = item.page === 'menu' ? false : currentPageName === item.page;

            if (item.page === 'menu') {
              return (
                <button
                  key={item.page}
                  onClick={() => setMobileMenuOpen(true)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px] ${
                    isLight ? 'text-gray-600' : 'text-slate-400'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px] ${
                  isActive 
                    ? 'bg-orange-500/20 text-orange-500' 
                    : isLight 
                      ? 'text-gray-600' 
                      : 'text-slate-400'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-orange-500' : ''}`} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
        </nav>

        {/* Mobile Menu Overlay (Mais opções) */}
        {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-card rounded-t-3xl border-t ${isLight ? 'border-gray-200' : 'border-white/10'} max-h-[70vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Menu</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className={isLight ? 'text-gray-700' : 'text-white'}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                      currentPageName === item.page
                        ? 'bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20'
                        : isLight
                          ? 'bg-gray-100 hover:bg-gray-200'
                          : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      currentPageName === item.page
                        ? 'bg-gradient-to-br from-orange-500 to-red-600'
                        : isLight
                          ? 'bg-gray-200'
                          : 'bg-white/10'
                    }`}>
                      <item.icon className={`w-6 h-6 ${
                        currentPageName === item.page
                          ? 'text-white'
                          : isLight
                            ? 'text-gray-700'
                            : 'text-slate-300'
                      }`} />
                    </div>
                    <span className={`text-xs font-medium text-center ${
                      currentPageName === item.page
                        ? 'text-orange-500'
                        : isLight
                          ? 'text-gray-700'
                          : 'text-slate-300'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>

              {user && (
                <div className={`mt-6 p-4 rounded-xl ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {user.full_name || 'Usuário'}
                      </p>
                      <p className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-slate-400'}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
        )}
        </div>
        );
        }