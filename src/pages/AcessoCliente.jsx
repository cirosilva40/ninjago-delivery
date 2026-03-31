import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Login Normal
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Filtrar pelo pizzaria_id atual para impedir login cruzado entre estabelecimentos
      const pizzariaId = localStorage.getItem('pizzaria_id_atual');
      const filtro = pizzariaId ? { email, pizzaria_id: pizzariaId } : { email };
      const clientes = await base44.entities.Cliente.filter(filtro);

      if (clientes.length === 0) {
        setError('Email não encontrado neste estabelecimento. Verifique se você já foi cadastrado aqui.');
        setLoading(false);
        return;
      }

      const cliente = clientes[0];

      if (!cliente.senha) {
        setError('Você ainda não possui uma senha. Entre em contato com o estabelecimento.');
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
      const pizzariaIdAtual = localStorage.getItem('pizzaria_id_atual');
      navigate(createPageUrl('PerfilCliente') + (pizzariaIdAtual ? `?pizzariaId=${pizzariaIdAtual}` : ''));
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
              Área do Cliente
            </h1>
            <p className="text-slate-400">
              Faça login para acessar seu perfil
            </p>
          </div>

          {/* Mensagens de erro */}
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
          </AnimatePresence>

          {/* Login */}
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
          </form>

          {/* Link para voltar ao cardápio */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => {
              const pid = localStorage.getItem('pizzaria_id_atual');
              navigate(createPageUrl('CardapioCliente') + (pid ? `?pizzariaId=${pid}` : ''));
            }}
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