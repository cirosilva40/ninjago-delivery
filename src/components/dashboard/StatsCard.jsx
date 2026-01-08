import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'orange' }) {
  const colorClasses = {
    orange: 'from-orange-500 to-red-600',
    green: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    yellow: 'from-yellow-500 to-orange-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 lg:p-6"
    >
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-20 blur-2xl`} />
      </div>
      
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs lg:text-sm font-medium text-slate-400 truncate">{title}</p>
            <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-white mt-1 lg:mt-2 truncate">{value}</p>
            {subtitle && (
              <p className="text-xs lg:text-sm text-slate-500 mt-1 truncate">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 lg:p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} bg-opacity-20 flex-shrink-0`}>
            <Icon className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center mt-2 lg:mt-4 gap-2">
            <span className={`text-xs lg:text-sm font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-xs text-slate-500">vs ontem</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}