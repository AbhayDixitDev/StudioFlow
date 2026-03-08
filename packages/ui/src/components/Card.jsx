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
            'bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 backdrop-blur-xl',
          variant === 'glass' &&
            'bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 backdrop-blur-2xl shadow-md dark:shadow-lg',
          variant === 'outlined' &&
            'bg-transparent border border-gray-200 dark:border-gray-700',
          hoverable && 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg',
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
