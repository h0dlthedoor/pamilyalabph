import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, PartyPopper, AlertTriangle, Loader2 } from 'lucide-react';

const states = {
  idle: { icon: Beaker, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', label: null },
  thinking: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', label: 'Analyzing...' },
  celebrate: { icon: PartyPopper, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Excellent!' },
  concern: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', label: 'Needs attention' },
};

export default function LabMascot({ state = 'idle' }) {
  const config = states[state] || states.idle;
  const Icon = config.icon;
  const isThinking = state === 'thinking';

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={`relative w-20 h-20 rounded-full ${config.bg} flex items-center justify-center shadow-lg border-2 border-stone-200 dark:border-stone-700`}
        animate={
          state === 'celebrate'
            ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }
            : state === 'concern'
            ? { scale: [1, 0.95, 1] }
            : { y: [0, -4, 0] }
        }
        transition={
          state === 'celebrate'
            ? { duration: 0.6, repeat: 2 }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <Icon
          className={`w-10 h-10 ${config.color} ${isThinking ? 'animate-spin' : ''}`}
        />
        {/* Molecule orbs */}
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400/40"
          animate={{ y: [0, -6, 0], x: [0, 3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-emerald-400/30"
          animate={{ y: [0, 4, 0], x: [0, -2, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </motion.div>
      <AnimatePresence mode="wait">
        {config.label && (
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`text-xs font-bold ${config.color}`}
          >
            {config.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
