import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';

const placementStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, placement = 'top', delay = 300, children }) {
  const [visible, setVisible] = useState(false);
  let timeout;

  const show = () => {
    timeout = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    clearTimeout(timeout);
    setVisible(false);
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none',
              'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-[var(--shadow-md)]',
              placementStyles[placement]
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
