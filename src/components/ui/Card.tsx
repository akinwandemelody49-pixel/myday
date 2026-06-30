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
  const baseStyle = 'rounded-2xl overflow-hidden bg-white text-neutral-800 transition-all duration-300';
  
  const variants = {
    default: 'border border-neutral-100 shadow-xs',
    luxury: 'border border-gold-100/40 bg-gradient-to-br from-white to-gold-50/10 shadow-md shadow-gold-500/2',
    outline: 'border border-neutral-200',
    flat: 'bg-neutral-50 border border-transparent',
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
}) => <div className={`p-6 pb-4 border-b border-neutral-100/60 ${className}`}>{children}</div>;

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 ${className}`}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-6 pt-4 border-t border-neutral-100/60 bg-neutral-50/40 ${className}`}>{children}</div>;
