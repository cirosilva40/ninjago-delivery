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
  const [modo, setModo] = useState('login'); // 'login', 'primeiro-acesso', 'recuperar-senha'
  const [etapa, setEtapa] = useState(1); // 1: email, 2: código, 3: criar senha
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [clienteId, setClienteId] = useState(null);

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

  // Primeiro Acesso - Etapa 1: Enviar código
  const handlePrimeiroAcessoEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const clientes = await base44.entities.Cliente.filter({ email });
      
      if (clientes.length === 0) {
        setError('Email não encontrado. Entre em contato com o restaurante.');
        setLoading(false);
        return;
      }

      const cliente = clientes[0];

      if (cliente.senha) {
        setError('Você já possui senha cadastrada. Use o login normal.');
        setLoading(false);
        return;
      }

      // Gerar código de 6 dígitos
      const codigoVerificacao = Math.floor(100000 + Math.random() * 900000).toString();
      setCodigoGerado(codigoVerificacao);
      setClienteId(cliente.id);

      // Enviar código por email
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Código de Verificação - Primeiro Acesso',
        body: `
          <h2>Bem-vindo!</h2>
          <p>Seu código de verificação para primeiro acesso é:</p>
          <h1 style="color: #f97316; font-size: 32px; letter-spacing: 8px;">${codigoVerificacao}</h1>
          <p>Este código expira em 10 minutos.</p>
        `
      });

      setSuccess('Código enviado para seu email!');
      setEtapa(2);
    } catch (error) {
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Primeiro Acesso - Etapa 2: Verificar código
  const handleVerificarCodigo = (e) => {
    e.preventDefault();
    setError('');

    if (codigo !== codigoGerado) {
      setError('Código incorreto. Verifique seu email.');
      return;
    }

    setSuccess('Código verificado! Agora crie sua senha.');
    setEtapa(3);
  };

  // Primeiro Acesso - Etapa 3: Criar senha
  const handleCriarSenha = async (e) => {
    e.preventDefault();
    setError('');

    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await base44.entities.Cliente.update(clienteId, { senha: novaSenha });
      
      setSuccess('Senha criada com sucesso! Fazendo login...');
      
      setTimeout(async () => {
        const clientes = await base44.entities.Cliente.filter({ id: clienteId });
        const cliente = clientes[0];
        localStorage.setItem('cliente_logado', JSON.stringify(cliente));
        navigate(createPageUrl('PerfilCliente'));
      }, 1500);
    } catch (error) {
      setError('Erro ao criar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Recuperar Senha - Mesmo fluxo do primeiro acesso
  const handleRecuperarSenhaEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const clientes = await base44.entities.Cliente.filter({ email });
      
      if (clientes.length === 0) {
        setError('Email não encontrado.');
        setLoading(false);
        return;
      }

      const cliente = clientes[0];
      setClienteId(cliente.id);

      // Gerar código de 6 dígitos
      const codigoVerificacao = Math.floor(100000 + Math.random() * 900000).toString();
      setCodigoGerado(codigoVerificacao);

      // Enviar código por email
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Código de Recuperação de Senha',
        body: `
          <h2>Recuperação de Senha</h2>
          <p>Seu código de verificação é:</p>
          <h1 style="color: #f97316; font-size: 32px; letter-spacing: 8px;">${codigoVerificacao}</h1>
          <p>Este código expira em 10 minutos.</p>
        `
      });

      setSuccess('Código enviado para seu email!');
      setEtapa(2);
    } catch (error) {
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const voltarParaLogin = () => {
    setModo('login');
    setEtapa(1);
    setError('');
    setSuccess('');
    setEmail('');
    setSenha('');
    setCodigo('');
    setNovaSenha('');
    setConfirmarSenha('');
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
              {modo === 'primeiro-acesso' && 'Primeiro Acesso'}
              {modo === 'recuperar-senha' && 'Recuperar Senha'}
            </h1>
            <p className="text-slate-400">
              {modo === 'login' && 'Faça login para acessar seu perfil'}
              {modo === 'primeiro-acesso' && 'Configure sua senha de acesso'}
              {modo === 'recuperar-senha' && 'Redefina sua senha'}
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

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setModo('primeiro-acesso')}
                  className="w-full text-center text-sm text-orange-400 hover:text-orange-300 underline"
                >
                  Primeiro Acesso? Crie sua senha
                </button>
                <button
                  type="button"
                  onClick={() => setModo('recuperar-senha')}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-300 underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {/* Primeiro Acesso / Recuperar Senha */}
          {(modo === 'primeiro-acesso' || modo === 'recuperar-senha') && (
            <>
              {/* Etapa 1: Email */}
              {etapa === 1 && (
                <form onSubmit={modo === 'primeiro-acesso' ? handlePrimeiroAcessoEmail : handleRecuperarSenhaEmail} className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Email Cadastrado</Label>
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
                    <p className="text-xs text-slate-500 mt-1">
                      Use o email cadastrado pelo restaurante
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
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        Enviar Código
                      </>
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

              {/* Etapa 2: Código */}
              {etapa === 2 && (
                <form onSubmit={handleVerificarCodigo} className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Código de Verificação</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="pl-10 bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Digite o código de 6 dígitos enviado para {email}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 text-lg font-semibold"
                  >
                    Verificar Código
                  </Button>

                  <button
                    type="button"
                    onClick={() => setEtapa(1)}
                    className="w-full text-center text-sm text-slate-400 hover:text-slate-300"
                  >
                    Não recebeu? Enviar novamente
                  </button>
                </form>
              )}

              {/* Etapa 3: Criar Senha */}
              {etapa === 3 && (
                <form onSubmit={handleCriarSenha} className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Mínimo de 6 caracteres
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-400">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="password"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
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
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Criar Senha e Entrar
                      </>
                    )}
                  </Button>
                </form>
              )}
            </>
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