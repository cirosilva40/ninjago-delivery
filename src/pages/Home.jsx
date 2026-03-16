import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Zap, Package, MapPin, BarChart3,
  CreditCard, Users, Star, Shield, ChevronRight, Menu, X,
  Smartphone, Globe, Gift, TrendingUp, Clock, MessageCircle
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } }
};

// Mapa de subdomínios para pizzariaId
const SUBDOMAIN_MAP = {
  'acaidathai.ninjagodelivery.com.br': '699a0a8b6d78ff46b56f1cd9',
  // Adicione mais subdomínios aqui conforme necessário
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Verificar se o hostname atual é um subdomínio mapeado
    const hostname = window.location.hostname;
    const pizzariaId = SUBDOMAIN_MAP[hostname];
    if (pizzariaId) {
      setRedirecting(true);
      // Redirecionar internamente sem mudar a URL na barra de endereço
      window.history.replaceState({}, '', window.location.href);
      window.location.replace(`/CardapioCliente?pizzariaId=${pizzariaId}`);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #94A3B8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .gradient-text-red {
          background: linear-gradient(135deg, #E11D48 0%, #FB7185 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glow-red {
          box-shadow: 0 0 40px rgba(225, 29, 72, 0.35);
        }
        .glow-red-sm {
          box-shadow: 0 0 20px rgba(225, 29, 72, 0.25);
        }
        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
        }
        .card-glass:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(225,29,72,0.3);
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
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
        .hero-glow {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
      `}</style>

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0F172A]/95 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/0f905828c_IMG_0111.png"
              alt="NinjaGo"
              className="h-12 w-auto object-contain"
            />
            <span className="text-xl font-bold text-white tracking-tight" translate="no">
              NinjaGo <span className="text-[#E11D48]">Delivery</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <a
              href={createPageUrl('AcessoUsuario')}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors font-medium"
            >
              Área do Restaurante
            </a>
            <a
              href={createPageUrl('AppEntregador')}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors font-medium"
            >
              Área do Entregador
            </a>
            <a href="https://wa.me/5511977468757" target="_blank" rel="noopener noreferrer" className="btn-red px-5 py-2.5 rounded-xl text-sm font-semibold text-white glow-red-sm ml-2">
              Teste Grátis
            </a>
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0F172A] border-t border-white/5 px-6 pb-6 space-y-3"
            >
              <a href={createPageUrl('AcessoUsuario')} className="block py-3 text-slate-300 hover:text-white text-sm font-medium border-b border-white/5">
                Área do Restaurante
              </a>
              <a href={createPageUrl('AppEntregador')} className="block py-3 text-slate-300 hover:text-white text-sm font-medium border-b border-white/5">
                Área do Entregador
              </a>
              <a href="https://wa.me/5511977468757" target="_blank" rel="noopener noreferrer" className="btn-red w-full py-3 rounded-xl text-sm font-semibold text-white mt-3 block text-center">
                Teste Grátis
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen flex items-center justify-center bg-grid overflow-hidden pt-20">
        {/* Glows */}
        <div className="hero-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(30,58,138,0.25) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/40 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
              Sistema completo para delivery
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-6"
          >
            <span className="gradient-text">A solução inteligente</span>
            <br />
            <span className="text-white">para o seu delivery</span>
            <br />
            <span className="gradient-text-red">crescer</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Controle pedidos, entregadores e pagamentos em um único sistema profissional.
            <br className="hidden sm:block" />
            <strong className="text-white"> Seu delivery no ritmo ninja.</strong>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a href="https://wa.me/5511977468757" target="_blank" rel="noopener noreferrer" className="btn-red px-8 py-4 rounded-xl text-base font-bold text-white flex items-center gap-2 glow-red w-full sm:w-auto justify-center">
              Quero Testar Gratuitamente
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="https://wa.me/5511977468757" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-xl text-base font-semibold text-white border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-slate-400" />
              Fale com um Especialista
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-20"
          >
            {[
              { value: '100%', label: 'do valor do pedido' },
              { value: '24h', label: 'suporte técnico' },
              { value: '0%', label: 'comissão iFood' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent z-10 pointer-events-none" style={{ top: '60%' }} />
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }}>
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#1E293B]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-md bg-white/5 flex items-center px-3">
                  <span className="text-xs text-slate-500">app.ninjago.delivery</span>
                </div>
              </div>
              {/* Mock content */}
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: 'Pedidos Hoje', value: '48', color: '#E11D48', icon: '📦' },
                  { label: 'Em Entrega', value: '12', color: '#3B82F6', icon: '🛵' },
                  { label: 'Receita Hoje', value: 'R$ 2.840', color: '#10B981', icon: '💰' },
                  { label: 'Avaliação', value: '4.9 ★', color: '#F59E0B', icon: '⭐' },
                ].map((card, i) => (
                  <div key={i} className="card-glass rounded-xl p-4">
                    <div className="text-xl mb-2">{card.icon}</div>
                    <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                    <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                <div className="card-glass rounded-xl p-4 h-32 flex flex-col justify-between">
                  <p className="text-xs text-slate-500 font-medium">Pedidos Recentes</p>
                  <div className="space-y-2">
                    {['João S. — Margherita', 'Maria L. — Combo 2', 'Carlos R. — X-Burguer'].map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">{p}</span>
                        <span className="text-xs text-emerald-400 font-semibold">● Novo</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-glass rounded-xl p-4 h-32 flex flex-col justify-between">
                  <p className="text-xs text-slate-500 font-medium">Mapa de Rotas</p>
                  <div className="flex-1 relative mt-2 rounded-lg overflow-hidden" style={{ background: 'rgba(30, 41, 59, 0.8)' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-[#E11D48]" />
                    </div>
                    <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <div className="absolute bottom-3 right-6 w-2 h-2 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ DIFERENCIAIS ═══════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-[#E11D48] text-xs font-bold uppercase tracking-widest">Por que escolher</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-4">
              Feito para quem leva<br />o delivery a sério
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Tecnologia de ponta condensada em uma plataforma simples, poderosa e completa.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🥷',
                title: 'Controle Total da Operação',
                desc: 'Gerencie pedidos, cardápio, entregadores e clientes em um único painel intuitivo. Visão completa do seu negócio em tempo real.',
              },
              {
                emoji: '📦',
                title: 'Gestão Inteligente de Pedidos',
                desc: 'Receba pedidos direto do seu cardápio digital. Notificações instantâneas, histórico completo e acompanhamento por status.',
              },
              {
                emoji: '🚀',
                title: 'Roteirização para Entregadores',
                desc: 'Otimize rotas automaticamente. Seu entregador recebe o trajeto ideal, economizando tempo e combustível.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="card-glass rounded-2xl p-8 group cursor-default transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#E11D48]/10 border border-[#E11D48]/20 flex items-center justify-center text-2xl mb-6 group-hover:border-[#E11D48]/50 transition-colors">
                  {item.emoji}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SISTEMA COMPLETO ═══════════════ */}
      <section className="py-28" style={{ background: 'linear-gradient(180deg, #0F172A 0%, #0D1526 50%, #0F172A 100%)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-[#E11D48] text-xs font-bold uppercase tracking-widest">Tudo em um</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-4">
              Sistema completo.<br />Zero complicação.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BarChart3, title: 'Painel Administrativo', desc: 'Visão geral de toda sua operação com métricas em tempo real.' },
              { icon: Globe, title: 'Cardápio com Domínio Próprio', desc: 'Sua loja online personalizada com a sua marca e cores.' },
              { icon: Gift, title: 'Programa de Fidelidade', desc: 'Pontuação automática para fidelizar e reter seus clientes.' },
              { icon: CreditCard, title: 'Integração Mercado Pago', desc: 'Aceite PIX, cartão de crédito e débito direto no site.' },
              { icon: Users, title: 'Gestão de Entregadores', desc: 'Controle de rotas, status e pagamentos dos motoboys.' },
              { icon: TrendingUp, title: 'Relatórios Financeiros', desc: 'Análises detalhadas de vendas, custos e lucratividade.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}
                className="card-glass rounded-2xl p-6 flex items-start gap-4 group cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E11D48]/10 border border-[#E11D48]/20 flex items-center justify-center shrink-0 group-hover:border-[#E11D48]/50 transition-colors">
                  <item.icon className="w-5 h-5 text-[#E11D48]" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ INDEPENDÊNCIA ═══════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 65%)' }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-[#E11D48] text-xs font-bold uppercase tracking-widest">Sua independência</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-6 leading-tight">
                Pare de depender de aplicativos externos
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                iFood, Uber Eats e outros cobram até <strong className="text-white">30% de comissão</strong> por pedido.
                Com o NinjaGo, você tem sua própria operação e fica com <strong className="text-white">100% do lucro</strong>.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  'Receba 100% do valor do pedido',
                  'Tenha seus próprios clientes e dados',
                  'Crie sua marca sem depender de terceiros',
                  'Zero comissão por pedido realizado',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#E11D48] shrink-0" />
                    <span className="text-white font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <a href="https://wa.me/5511977468757" target="_blank" rel="noopener noreferrer" className="btn-red px-8 py-4 rounded-xl text-base font-bold text-white flex items-center gap-2 glow-red w-fit">
                Começar agora
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { label: 'Comissão iFood', value: '27%', color: 'text-red-400', sub: 'por pedido realizado', bad: true },
                { label: 'Comissão NinjaGo', value: '0%', color: 'text-emerald-400', sub: 'zero comissão forever', bad: false },
                { label: 'Seus dados', value: '❌', color: 'text-red-400', sub: 'são do marketplace', bad: true },
                { label: 'Seus dados', value: '✅', color: 'text-emerald-400', sub: 'são sempre seus', bad: false },
              ].map((card, i) => (
                <div key={i} className={`card-glass rounded-2xl p-6 ${card.bad ? 'border-red-500/10' : 'border-emerald-500/10'}`}>
                  <p className="text-xs text-slate-500 mb-2 font-medium">{card.label}</p>
                  <p className={`text-4xl font-black ${card.color} mb-1`}>{card.value}</p>
                  <p className="text-xs text-slate-400">{card.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ COMO FUNCIONA ═══════════════ */}
      <section className="py-28" style={{ background: 'linear-gradient(180deg, #0F172A 0%, #080E1A 100%)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-[#E11D48] text-xs font-bold uppercase tracking-widest">Simples assim</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-4">
              Como funciona
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">Você começa a receber pedidos em menos de 24 horas.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#E11D48]/30 to-transparent" />
            {[
              { num: '01', title: 'Criamos seu ambiente exclusivo', desc: 'Nossa equipe configura sua conta, domínio e identidade visual em até 24h.' },
              { num: '02', title: 'Você configura cardápio e pagamento', desc: 'Adicione seus produtos, preços, fotos e configure os métodos de pagamento.' },
              { num: '03', title: 'Começa a receber pedidos', desc: 'Compartilhe o link do cardápio e pronto. Pedidos chegando direto no painel.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="text-center relative z-10"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#E11D48]/20 to-[#E11D48]/5 border border-[#E11D48]/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl font-black text-[#E11D48]">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.12) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          <div className="card-glass rounded-3xl p-12 sm:p-16 border border-white/8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/25 text-[#FB7185] text-xs font-bold uppercase tracking-widest mb-6">
              Comece hoje mesmo
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Transforme seu delivery em uma
              <span className="gradient-text-red"> operação profissional.</span>
            </h2>
            <p className="text-slate-400 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Seu delivery no ritmo ninja. 🥷<br />
              Sem comissão. Sem dependência. Sem limites.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://wa.me/5511977468757" target="_blank" rel="noopener noreferrer" className="btn-red px-10 py-5 rounded-xl text-lg font-bold text-white flex items-center gap-2 glow-red w-full sm:w-auto justify-center">
                Solicitar Teste Gratuito
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="https://wa.me/5511977468757" target="_blank" rel="noopener noreferrer" className="px-10 py-5 rounded-xl text-base font-semibold text-slate-300 border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-white/5 bg-[#080E1A]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925e1fdd6376091844799ad/0f905828c_IMG_0111.png"
                  alt="NinjaGo"
                  className="h-12 w-auto object-contain"
                />
                <span className="text-xl font-bold text-white tracking-tight" translate="no">
                  NinjaGo <span className="text-[#E11D48]">Delivery</span>
                </span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                A plataforma completa de gestão e automação para delivery independente. Seu delivery no ritmo ninja.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Sistema</p>
              <div className="space-y-3">
                {[
                  { label: 'Área do Restaurante', href: createPageUrl('AcessoUsuario') },
                  { label: 'Área do Entregador', href: createPageUrl('AppEntregador') },
                  { label: 'Cardápio Digital', href: '#' },
                  { label: 'Painel Admin', href: createPageUrl('AcessoAdmin') },
                ].map((item, i) => (
                  <a key={i} href={item.href} className="block text-slate-500 hover:text-white text-sm transition-colors">{item.label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal & Contato</p>
              <div className="space-y-3">
                {['Termos de Uso', 'Política de Privacidade', 'Contato', 'WhatsApp', 'Instagram'].map((item, i) => (
                  <a key={i} href="#" className="block text-slate-500 hover:text-white text-sm transition-colors">{item}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2025 NinjaGo Delivery. Todos os direitos reservados.</p>
            <p className="text-slate-600 text-sm">Feito com 🥷 para delivery que cresce de verdade.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}