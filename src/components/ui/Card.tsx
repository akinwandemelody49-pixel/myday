import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  variant?: 'default' | 'luxury' | 'outline' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
  variant = 'default',
}) => {
  const baseStyle = 'rounded-[20px] overflow-hidden bg-white dark:bg-[#0E0D16] text-neutral-800 dark:text-neutral-200 transition-all duration-300';
  
  const variants = {
    default: 'border border-neutral-100 dark:border-white/[0.04] shadow-xs',
    luxury: 'border border-gold-200/40 dark:border-gold-500/20 bg-gradient-to-br from-white to-gold-50/10 dark:from-[#0E0D16] dark:to-gold-950/5 shadow-md shadow-gold-500/2',
    outline: 'border border-neutral-200 dark:border-white/[0.08]',
    flat: 'bg-neutral-50 dark:bg-neutral-900 border border-transparent',
  };

  const isClickable = !!onClick;

  if (isClickable || hoverEffect) {
    return (
      <motion.div
        whileHover={{ 
          y: -4, 
          boxShadow: '0 12px 30px -10px rgba(176, 129, 55, 0.08)',
          borderColor: 'rgba(214, 184, 124, 0.4)'
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={onClick}
        className={`${baseStyle} ${variants[variant]} cursor-pointer ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 pb-4 md:p-8 md:pb-5 border-b border-neutral-100/60 dark:border-white/[0.04] ${className}`}>{children}</div>;

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 md:p-8 ${className}`}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 pt-4 md:p-8 md:pt-5 border-t border-neutral-100/60 dark:border-white/[0.04] bg-neutral-50/40 dark:bg-neutral-900/20 ${className}`}>{children}</div>;
