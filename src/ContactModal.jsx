import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlaskConical } from 'lucide-react';
import { playChime } from './sounds';

export default function ContactModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleViber = () => {
    playChime();
    window.location.href = 'viber://chat?number=%2B639156373238&text=Hi%20Kris!%20I\'d%20like%20to%20book%20a%20free%20consultation.';
    setTimeout(() => window.open('https://viber.click/639156373238', '_blank'), 1500);
  };

  const handleFacebook = () => {
    playChime();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10"
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 24 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-6 py-5 relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-400 text-[10px] font-mono uppercase tracking-widest leading-tight">
                    PamilyaLab · Free Consultation
                  </p>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    Get in Touch with Kris
                  </h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-stone-600 text-sm text-center leading-relaxed">
                Chat with{' '}
                <strong className="text-stone-900">Kris Jenelyn De Las Peñas</strong>{' '}
                — Microbiologist &amp; Pru Life UK Financial Advisor — for a free consultation.
              </p>

              {/* Viber */}
              <button
                onClick={handleViber}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-xl font-bold text-white transition-colors duration-200 hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7C4DFF 0%, #5C35CC 100%)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.033 2 11c0 2.687 1.102 5.11 2.895 6.88L4 21l3.286-.82C8.536 20.71 10.23 21 12 21c5.52 0 10-4.033 10-9S17.52 2 12 2zm4.855 12.87c-.2.556-.986 1.013-1.613 1.148-.43.09-.99.162-2.877-.618-2.415-1.003-3.972-3.463-4.092-3.622-.115-.16-.97-1.29-.97-2.458 0-1.169.612-1.743.829-1.982.217-.238.473-.298.63-.298l.453.008c.145.006.34-.055.532.405l.68 1.653c.064.154.107.332.014.484-.094.154-.14.248-.28.38l-.42.42c-.14.14-.287.29-.123.57.164.28.728 1.2 1.564 1.942.875.775 1.613 1.016 1.846 1.127.232.11.368.092.503-.055l.62-.693c.134-.15.268-.12.45-.046l1.6.752c.182.085.304.127.35.2.043.07.043.407-.155.962z" />
                </svg>
                Chat on Viber
              </button>

              {/* Facebook Messenger */}
              <a
                href="https://m.me/kris.pasiona"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleFacebook}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-xl font-bold text-white transition-colors duration-200 hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0d5cb8 100%)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Message on Facebook
              </a>

              <p className="text-xs text-stone-400 text-center">
                Available Mon–Sat · Response within 24 hours
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
