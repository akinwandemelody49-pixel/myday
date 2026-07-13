import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost' | 'danger' | 'charcoal' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-display font-semibold rounded-[20px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide';
  
  const variants = {
    primary: 'bg-[#6C4CF1] text-white hover:bg-[#5B3ED6] focus:ring-[#6C4CF1]/50 shadow-xs hover:shadow-md shadow-[#6C4CF1]/10',
    secondary: 'bg-neutral-50 dark:bg-[#12111A] text-neutral-800 dark:text-neutral-200 border border-neutral-200/70 dark:border-white/[0.06] hover:bg-neutral-100 dark:hover:bg-white/[0.04] focus:ring-neutral-200/50 shadow-xs',
    outline: 'bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.04] focus:ring-neutral-300/50',
    gold: 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 focus:ring-gold-500 shadow-sm hover:shadow-md shadow-gold-500/10',
    charcoal: 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] hover:bg-[#2A2A2A] dark:hover:bg-neutral-100 focus:ring-neutral-950/50 shadow-sm',
    purple: 'bg-[#6C4CF1] text-white hover:bg-[#5B3ED6] focus:ring-[#6C4CF1]/50 shadow-xs hover:shadow-md shadow-[#6C4CF1]/10',
    ghost: 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-white/[0.04] focus:ring-neutral-200/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-xs',
  };

  const sizes = {
    sm: 'px-4.5 py-2 text-xs tracking-wide font-semibold',
    md: 'px-6 py-3 text-sm tracking-wide font-semibold',
    lg: 'px-8 py-4 text-base tracking-wide font-semibold',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon ? (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon ? (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      ) : null}
    </motion.button>
  );
};
