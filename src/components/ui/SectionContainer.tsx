import React from 'react';
import { motion } from 'motion/react';

interface SectionContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  className?: string;
  rightAction?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  title,
  subtitle,
  description,
  badge,
  className = '',
  rightAction,
  maxWidth = 'xl',
}) => {
  const maxWidths = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[90rem]',
    full: 'max-w-full',
  };

  return (
    <section className={`py-12 md:py-16 px-4 md:px-8 ${className}`}>
      <div className={`mx-auto ${maxWidths[maxWidth]}`}>
        {/* Header Block */}
        {(title || subtitle || description || badge || rightAction) && (
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
            <div className="max-w-2xl">
              {badge && (
                <span className="inline-block px-3 py-1 text-[10px] uppercase tracking-widest font-mono font-medium text-gold-600 bg-gold-50 border border-gold-200/50 rounded-full mb-3">
                  {badge}
                </span>
              )}
              {subtitle && (
                <h4 className="font-display text-xs uppercase tracking-widest font-semibold text-gold-500 mb-1">
                  {subtitle}
                </h4>
              )}
              {title && (
                <h2 className="font-display font-bold text-3xl md:text-4xl text-neutral-950 tracking-tight leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-3 font-sans text-neutral-500 leading-relaxed text-sm md:text-base">
                  {description}
                </p>
              )}
            </div>
            
            {rightAction && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="shrink-0 flex items-center"
              >
                {rightAction}
              </motion.div>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </section>
  );
};
