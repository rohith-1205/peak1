import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_ENV } from '../config/env';
import { X } from 'lucide-react';

export default function EnvBadge() {
  const [isVisible, setIsVisible] = useState(true);

  if (APP_ENV === 'production' || !isVisible) {
    return null;
  }

  const isDev = APP_ENV === 'development';
  const badgeText = isDev ? 'DEV' : 'STAGING';
  
  // Tailwind gradient classes based on environment
  const gradientClass = isDev 
    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
    : 'bg-gradient-to-r from-orange-500 to-amber-500';
    
  const glowShadow = isDev
    ? '0 4px 15px rgba(168, 85, 247, 0.4)'
    : '0 4px 15px rgba(249, 115, 22, 0.4)';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 z-[9999]"
        >
          <motion.div 
            animate={{ boxShadow: [glowShadow, '0 2px 5px rgba(0,0,0,0.2)', glowShadow] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-bold text-xs tracking-wider ${gradientClass}`}
            style={{ pointerEvents: 'auto' }}
          >
            <span>{badgeText}</span>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-0.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              aria-label="Hide badge"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
