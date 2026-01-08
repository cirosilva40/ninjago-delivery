import React from 'react';
import { motion } from 'framer-motion';

export function LoadingSkeleton({ className = '', variant = 'default' }) {
  const variants = {
    default: 'h-4 bg-gradient-to-r from-slate-800 to-slate-700',
    card: 'h-32 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700',
    avatar: 'w-12 h-12 rounded-full bg-gradient-to-r from-slate-800 to-slate-700',
    text: 'h-3 bg-gradient-to-r from-slate-800 to-slate-700',
  };

  return (
    <motion.div
      className={`${variants[variant]} ${className} overflow-hidden`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <motion.div
        className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <LoadingSkeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="w-3/4" />
          <LoadingSkeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <LoadingSkeleton className="w-full" />
      <LoadingSkeleton className="w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <LoadingSkeleton variant="avatar" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="w-1/3" />
                <LoadingSkeleton variant="text" className="w-1/4" />
              </div>
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="w-20" />
              <LoadingSkeleton variant="text" className="w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <LoadingSkeleton variant="text" className="w-24" />
          <LoadingSkeleton className="w-32 h-8" />
        </div>
        <LoadingSkeleton className="w-12 h-12 rounded-xl" />
      </div>
      <LoadingSkeleton variant="text" className="w-20" />
    </div>
  );
}