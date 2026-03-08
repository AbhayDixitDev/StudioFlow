import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export const Card = forwardRef(
  ({ variant = 'default', hoverable = false, padding = 'md', children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { y: -2, transition: { duration: 0.2 } } : undefined}
        className={cn(
          'rounded-xl transition-all duration-200',
          variant === 'default' &&
            'bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl',
          variant === 'glass' &&
            'bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-2xl shadow-[var(--shadow-md)]',
          variant === 'outlined' &&
            'bg-transparent border border-[var(--border-default)]',
          hoverable && 'cursor-pointer hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
