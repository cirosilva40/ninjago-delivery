import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, ArrowLeft, Lock } from 'lucide-react';

export default function AcessoAdmin() {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (!isAuth) return;
      base44.auth.me().then(user => {
        if (user?.role === 'admin') {
          navigate(createPageUrl('AdminUsers'));
        } else if (user) {
          setError('Acesso negado. Apenas administradores podem acessar este painel.');
        }
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  const handleLogin = () => {
    setRedirecting(true);
    const nextUrl = window.location.origin + createPageUrl('AcessoAdmin');
    base44.auth.redirectToLogin(nextUrl);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .btn-red {
          background: linear-gradient(135deg, #E11D48, #BE123C);
          transition: all 0.3s ease;
        }
        .btn-red:hover {
          background: linear-gradient(135deg, #F43F5E, #E11D48);
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(225, 29, 72, 0.4);
        }
        .bg-grid {
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
      `}</style>

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.1) 0%, transparent 65%)' }} />

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
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/74cee5df9_WhatsAppImage2025-11-26at115948.jpeg"
              alt="NinjaGo"
              className="w-14 h-14 rounded-2xl object-cover"
            />
            <div className="text-left">
              <span className="text-2xl font-bold text-white tracking-tight">
                NinjaGo <span className="text-[#E11D48]">Delivery</span>
              </span>
              <p className="text-xs text-slate-500">Painel Administrativo</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/25 text-[#FB7185] text-xs font-semibold uppercase tracking-widest mb-4">
            <Shield className="w-3.5 h-3.5" />
            Acesso Restrito
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Área Administrativa</h1>
          <p className="text-slate-400 text-sm">Apenas administradores autorizados têm acesso</p>
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
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#E11D48]/10 border border-[#E11D48]/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#E11D48]" />
            </div>
          </div>

          {error ? (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
              {error}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
              Clique no botão abaixo para acessar o sistema com sua conta de administrador.
              Você será redirecionado para a tela de login seguro.
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={redirecting}
            className="btn-red w-full py-4 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {redirecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar como Administrador
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-600">🔒</span>
            <p className="text-xs text-slate-600">
              Acesso protegido • Somente administradores autorizados
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}