import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = <Calendar className="w-10 h-10 text-gold-400" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-neutral-200/80 rounded-3xl max-w-lg mx-auto">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-50/50 mb-5 border border-gold-100/30">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg text-neutral-900 tracking-tight mb-2">
        {title}
      </h3>
      <p className="font-sans text-sm text-neutral-500 leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="gold" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
