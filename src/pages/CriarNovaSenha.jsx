import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Key, Lock, Eye, EyeOff } from 'lucide-react';

export default function CriarNovaSenha() {
  const navigate = useNavigate();
  const [estabelecimento, setEstabelecimento] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const estabData = localStorage.getItem('estabelecimento_logado');
    if (!estabData) {
      navigate(createPageUrl('AcessoUsuario'));
      return;
    }
    setEstabelecimento(JSON.parse(estabData));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!novaSenha || !confirmarSenha) {
      setError('Preencha todos os campos');
      return;
    }

    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Atualizar senha no banco de dados
      await base44.entities.Pizzaria.update(estabelecimento.id, {
        senha: novaSenha,
        eh_senha_temporaria: false
      });

      // Atualizar localStorage com a nova senha
      const estabelecimentoAtualizado = {
        ...estabelecimento,
        senha: novaSenha,
        eh_senha_temporaria: false
      };
      localStorage.setItem('estabelecimento_logado', JSON.stringify(estabelecimentoAtualizado));

      // Redirecionar para o dashboard
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setError('Erro ao atualizar senha. Tente novamente.');
      setLoading(false);
    }
  };

  if (!estabelecimento) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Criar Nova Senha</h1>
          <p className="text-slate-400 text-sm">
            Defina uma senha segura para acessar seu painel
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-slate-300 mb-2 block">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Confirmar Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                placeholder="Digite a senha novamente"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold"
            >
              {loading ? 'Atualizando...' : 'Criar Nova Senha'}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-300 text-center">
            ✓ A senha deve ter no mínimo 6 caracteres<br />
            ✓ Use letras, números e caracteres especiais para maior segurança
          </p>
        </div>
      </Card>
    </div>
  );
}