import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Tooltip } from './Tooltip';
import { cn } from '../lib/cn';

const sizeStyles = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

export const IconButton = forwardRef(
  ({ icon, tooltip, variant = 'default', size = 'md', active, className, ...props }, ref) => {
    const button = (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors duration-200',
          sizeStyles[size],
          variant === 'default' &&
            'bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover-bg)]',
          variant === 'ghost' && 'hover:bg-[var(--glass-bg)]',
          active && 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/30',
          !active && 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          className
        )}
        {...props}
      >
        {icon}
      </motion.button>
    );

    if (tooltip) {
      return <Tooltip content={tooltip}>{button}</Tooltip>;
    }
    return button;
  }
);

IconButton.displayName = 'IconButton';
