import React from 'react';
import { motion } from 'framer-motion';
import { Pizza, Utensils, Cookie, IceCream, Beef } from 'lucide-react';

const foodIcons = [Pizza, Utensils, Cookie, IceCream, Beef];

export default function NinjaAnimation({ status }) {
  const isActive = status !== 'entregue' && status !== 'cancelado';

  // Valores fixos para posições aleatórias (evita recalcular a cada render)
  const [randomPositions] = React.useState(() => 
    Array.from({ length: 5 }, () => ({
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      rotate: Math.random() * 360,
    }))
  );

  const [particlePositions] = React.useState(() =>
    Array.from({ length: 5 }, () => ({
      x1: Math.random() * 400,
      y1: Math.random() * 250,
      x2: Math.random() * 400,
      y2: Math.random() * 250,
    }))
  );

  return (
    <div className="relative w-full h-64 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 overflow-hidden">
      {/* Fundo animado */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-full h-full"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Ninja */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={isActive ? {
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.05, 1, 1.05, 1],
          } : {}}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
          className="relative"
        >
          {/* Corpo do Ninja */}
          <div className="relative z-10">
            {/* Cabeça */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-orange-500 mx-auto relative">
              {/* Olhos */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3">
                <motion.div
                  animate={isActive ? { scaleY: [1, 0.1, 1] } : {}}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-3 h-2 bg-white rounded-full"
                />
                <motion.div
                  animate={isActive ? { scaleY: [1, 0.1, 1] } : {}}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-3 h-2 bg-white rounded-full"
                />
              </div>
            </div>

            {/* Espada */}
            <motion.div
              animate={isActive ? {
                rotate: [0, -45, 45, 0],
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -right-8 top-8 w-16 h-1 bg-gradient-to-r from-slate-400 to-slate-300 origin-left"
              style={{ transformOrigin: 'left center' }}
            >
              <div className="absolute -left-2 -top-1 w-3 h-3 bg-orange-500 rounded-full" />
            </motion.div>
          </div>

          {/* Comidas sendo cortadas */}
          {isActive && foodIcons.map((Icon, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0.5, 0],
                scale: [0, 1.2, 1.1, 0.9, 0.5],
                x: [0, randomPositions[index].x],
                y: [0, randomPositions[index].y],
                rotate: [0, randomPositions[index].rotate],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.4,
                ease: 'easeOut',
              }}
              className="absolute top-1/2 left-1/2"
            >
              <Icon className="w-8 h-8 text-orange-400" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Texto de status */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <motion.p
          animate={isActive ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white font-bold text-xl"
        >
          {status === 'novo' && '🥷 Ninja recebendo seu pedido...'}
          {status === 'em_preparo' && '🥷 Ninja preparando sua refeição...'}
          {status === 'pronto' && '🥷 Ninja embalando seu pedido...'}
          {status === 'em_entrega' && '🥷 Ninja a caminho!'}
          {status === 'entregue' && '🎉 Pedido entregue! Bom apetite!'}
          {status === 'cancelado' && '❌ Pedido cancelado'}
        </motion.p>
      </div>

      {/* Partículas de fundo */}
      {isActive && (
        <>
          {particlePositions.map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-orange-500/40 rounded-full"
              animate={{
                x: [pos.x1, pos.x2],
                y: [pos.y1, pos.y2],
                opacity: [0, 0.8, 0],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeInOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}