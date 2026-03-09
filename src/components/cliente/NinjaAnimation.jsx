import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Cenas de animação que se alternam
const scenes = [
  {
    id: 'frutas',
    emoji: '🍓',
    label: 'Cortando frutas...',
    elements: ['🍓', '🍋', '🍊', '🥝', '🍍'],
  },
  {
    id: 'hamburguer',
    emoji: '🍔',
    label: 'Hamburger na grelha...',
    elements: ['🍔', '🥩', '🧅', '🧀', '🥬'],
  },
  {
    id: 'panela',
    emoji: '🍲',
    label: 'Cozinhando no fogão...',
    elements: ['🍲', '🥕', '🧄', '🫙', '🌶️'],
  },
];

function KnifeScene({ items }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Tábua de corte */}
      <div className="relative w-48 h-28 rounded-xl bg-amber-800/60 border-2 border-amber-600/40 flex items-center justify-center">
        {/* Faca */}
        <motion.div
          className="absolute z-20"
          style={{ top: '-20px', left: '50%', transformOrigin: 'bottom center' }}
          animate={{ rotate: [-30, 30, -30], y: [0, 18, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span style={{ fontSize: 36 }}>🔪</span>
        </motion.div>

        {/* Ingredientes sendo cortados */}
        <div className="flex gap-3 items-center">
          {items.slice(0, 4).map((item, i) => (
            <motion.span
              key={i}
              style={{ fontSize: 26 }}
              animate={{
                scale: [1, 1.2, 0.9, 1],
                y: [0, -4, 2, 0],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            >
              {item}
            </motion.span>
          ))}
        </div>

        {/* Partículas de corte */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-orange-400"
            style={{ left: `${20 + i * 22}%`, top: '30%' }}
            animate={{
              y: [0, -20, 10],
              x: [0, (i % 2 === 0 ? 10 : -10)],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, repeatDelay: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

function GrillScene() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Grelha */}
      <div className="relative w-52 h-32 rounded-xl bg-slate-800/70 border-2 border-slate-600/50 flex items-center justify-center overflow-hidden">
        {/* Grades da grelha */}
        <div className="absolute inset-0 flex flex-col justify-evenly px-3 opacity-40">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-0.5 bg-slate-400 rounded" />
          ))}
        </div>
        <div className="absolute inset-0 flex justify-evenly items-stretch py-3 opacity-40">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="w-0.5 bg-slate-400 rounded" />
          ))}
        </div>

        {/* Chamas */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 text-2xl"
            style={{ left: `${20 + i * 25}%` }}
            animate={{ y: [0, -8, 0], scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
          >
            🔥
          </motion.span>
        ))}

        {/* Hamburguer */}
        <motion.div
          className="z-10 relative"
          animate={{ scale: [1, 1.05, 1], y: [0, -2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span style={{ fontSize: 48 }}>🍔</span>
        </motion.div>

        {/* Fumaça */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute text-xl"
            style={{ left: `${30 + i * 20}%`, bottom: '60%' }}
            animate={{ y: [0, -30], opacity: [0.6, 0], scale: [0.8, 1.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
          >
            💨
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PotScene() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative flex flex-col items-center">
        {/* Tampa pulando */}
        <motion.span
          style={{ fontSize: 32, marginBottom: -8 }}
          animate={{ y: [0, -12, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        >
          🫕
        </motion.span>

        {/* Panela */}
        <motion.span
          style={{ fontSize: 60 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          🍲
        </motion.span>

        {/* Chamas embaixo */}
        <div className="flex gap-2 mt-1">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              style={{ fontSize: 20 }}
              animate={{ y: [0, -6, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
            >
              🔥
            </motion.span>
          ))}
        </div>

        {/* Vapor / bolhinhas subindo */}
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{ top: '10%', left: `${30 + i * 12}%` }}
            animate={{ y: [0, -35], opacity: [0.6, 0], scale: [0.5, 1.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.25, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
}

const sceneComponents = [KnifeScene, GrillScene, PotScene];
const sceneLabels = [
  '🍓 Preparando os ingredientes...',
  '🍔 Hamburger sendo grelhado...',
  '🍲 Panela borbulhando no fogo...',
];

export default function NinjaAnimation({ status }) {
  const isActive = status !== 'entregue' && status !== 'cancelado';
  const [sceneIndex, setSceneIndex] = useState(0);

  // Alternar cenas a cada 3 segundos
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setSceneIndex(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isActive]);

  const CurrentScene = sceneComponents[sceneIndex];

  return (
    <div className="relative w-full h-64 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-orange-500/30 overflow-hidden">
      {/* Fundo animado */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(249,115,22,0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 80% 30%, rgba(239,68,68,0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 50% 80%, rgba(249,115,22,0.08) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Cena animada */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneIndex}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          {isActive ? (
            <CurrentScene items={scenes[sceneIndex]?.elements || []} />
          ) : (
            <div className="text-center">
              {status === 'entregue' && <span style={{ fontSize: 72 }}>🎉</span>}
              {status === 'cancelado' && <span style={{ fontSize: 72 }}>❌</span>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Indicadores de cena (pontinhos) */}
      {isActive && (
        <div className="absolute top-3 right-4 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === sceneIndex ? 'bg-orange-400 scale-125' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      )}

      {/* Texto de status */}
      <div className="absolute bottom-5 left-0 right-0 text-center px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={isActive ? sceneIndex : status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-white font-bold text-lg"
          >
            {status === 'novo' && sceneLabels[sceneIndex]}
            {status === 'em_preparo' && sceneLabels[sceneIndex]}
            {status === 'pronto' && '📦 Ninja embalando seu pedido...'}
            {status === 'em_entrega' && '🥷 Ninja a caminho!'}
            {status === 'entregue' && '🎉 Pedido entregue! Bom apetite!'}
            {status === 'cancelado' && '❌ Pedido cancelado'}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}