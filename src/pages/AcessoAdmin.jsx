import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AcessoAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se já estiver logado como admin, redireciona direto
    base44.auth.me().then(user => {
      if (user?.role === 'admin') {
        navigate(createPageUrl('AdminUsers'));
      }
    }).catch(() => {});
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    base44.auth.redirectToLogin(createPageUrl('AdminUsers'));
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        .glow-red { box-shadow: 0 0 40px rgba(225, 29, 72, 0.35); }
        .btn-red {
          background: linear-gradient(135deg, #E11D48, #BE123C);
          transition: all 0.3s ease;
        }
        .btn-red:hover {
          background: linear-gradient(135deg, #F43F5E, #E11D48);
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(225, 29, 72, 0.4);
        }
      `}</style>

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.1) 0%, transparent 70%)' }} />

      {/* Back to Home */}
      <a
        href={createPageUrl('Home')}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao início
      </a>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg"
              alt="NinjaGo"
              className="w-14 h-14 rounded-2xl object-cover"
            />
            <div className="text-left">
              <span className="text-2xl font-bold text-white tracking-tight" translate="no">
                NinjaGo <span className="text-[#E11D48]">Delivery</span>
              </span>
              <p className="text-xs text-slate-500">Painel Administrativo</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/25 text-[#FB7185] text-xs font-semibold uppercase tracking-widest mb-4">
            <Shield className="w-4 h-4" />
            Acesso Restrito
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Área Administrativa</h1>
          <p className="text-slate-400 text-sm">Faça login com sua conta de administrador</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <p className="text-slate-300 text-sm text-center leading-relaxed">
              Clique no botão abaixo para ser redirecionado à tela de login seguro. Apenas administradores têm acesso ao painel.
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-red w-full py-4 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 glow-red disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar no Painel Admin
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-600">
              🔒 Acesso protegido • Somente administradores autorizados
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}