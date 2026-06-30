import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  fullPage = false,
  label = 'Loading your bespoke experience...',
}) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer luxury gold glow/ring */}
        <div className={`${sizes[size]} rounded-full border-neutral-100 animate-pulse`} />
        {/* Active spinning ring */}
        <div
          className={`absolute inset-0 ${sizes[size]} rounded-full border-t-gold-500 border-r-transparent border-b-transparent border-l-transparent animate-spin`}
        />
      </div>
      {label && (
        <p className="font-display text-sm font-medium tracking-wide text-neutral-500 italic animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-cream">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};
