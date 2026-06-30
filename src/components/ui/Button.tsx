import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'ghost' | 'danger';
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
  const baseStyle = 'inline-flex items-center justify-center font-display font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-luxury-charcoal text-white hover:bg-neutral-800 focus:ring-neutral-900 shadow-sm',
    secondary: 'bg-white text-luxury-charcoal border border-neutral-200 hover:bg-neutral-50 focus:ring-neutral-200 shadow-xs',
    outline: 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 focus:ring-neutral-200',
    gold: 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 focus:ring-gold-500 shadow-md hover:shadow-lg shadow-gold-500/10',
    ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-xs',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs tracking-wider uppercase',
    md: 'px-6 py-3 text-sm tracking-wide',
    lg: 'px-8 py-4 text-base tracking-wide',
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
