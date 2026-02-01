import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AcessoCliente() {
  const navigate = useNavigate();
  const [modo, setModo] = useState('login'); // 'login', 'primeiro-acesso'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Login Normal
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const clientes = await base44.entities.Cliente.filter({ email });
      
      if (clientes.length === 0) {
        setError('Email não encontrado. Verifique se você já foi cadastrado.');
        setLoading(false);
        return;
      }

      const cliente = clientes[0];

      if (!cliente.senha) {
        setError('Você ainda não criou sua senha. Use a opção "Primeiro Acesso".');
        setLoading(false);
        return;
      }

      if (cliente.senha !== senha) {
        setError('Senha incorreta.');
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      localStorage.setItem('cliente_logado', JSON.stringify(cliente));
      navigate(createPageUrl('PerfilCliente'));
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Primeiro Acesso - Login com senha temporária
  const handlePrimeiroAcessoEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const clientes = await base44.entities.Cliente.filter({ email });
      
      if (clientes.length === 0) {
        setError('Email não encontrado. Verifique se você já foi cadastrado.');
        setLoading(false);
        return;
      }

      const cliente = clientes[0];

      if (!cliente.senha) {
        setError('Sua conta ainda não tem senha. Entre em contato com o administrador.');
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      localStorage.setItem('cliente_logado', JSON.stringify(cliente));
      navigate(createPageUrl('PerfilCliente'));
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const voltarParaLogin = () => {
    setModo('login');
    setError('');
    setSuccess('');
    setEmail('');
    setSenha('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/5 border-white/10 p-8">
          {/* Logo e Título */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {modo === 'login' && 'Área do Cliente'}
              {modo === 'primeiro-acesso' && 'Login - Primeira Vez'}
            </h1>
            <p className="text-slate-400">
              {modo === 'login' && 'Faça login para acessar seu perfil'}
              {modo === 'primeiro-acesso' && 'Use sua senha temporária enviada pelo restaurante'}
            </p>
          </div>

          {/* Mensagens de erro/sucesso */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/50 flex items-start gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-300">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Normal */}
          {modo === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-slate-400">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <button
                type="button"
                onClick={() => setModo('primeiro-acesso')}
                className="w-full text-center text-sm text-orange-400 hover:text-orange-300 underline"
              >
                Primeira vez? Clique aqui
              </button>
            </form>
          )}

          {/* Primeiro Acesso */}
          {modo === 'primeiro-acesso' && (
            <form onSubmit={handlePrimeiroAcessoEmail} className="space-y-4">
              <div>
                <Label className="text-slate-400">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Senha Temporária</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  A senha foi enviada pelo restaurante
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <button
                type="button"
                onClick={voltarParaLogin}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-300 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para login
              </button>
            </form>
          )}

          {/* Link para voltar ao cardápio */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => navigate(createPageUrl('CardapioCliente'))}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              Voltar para o cardápio
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}