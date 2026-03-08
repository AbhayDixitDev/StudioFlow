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
            'bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-white/10',
          variant === 'ghost' && 'hover:bg-gray-100 dark:hover:bg-white/5',
          active && 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
          !active && 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
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
