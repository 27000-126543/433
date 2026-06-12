import React from 'react';
import { getStatusColor, getStatusText } from '@/utils/format';

interface StatusBadgeProps {
  status: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text, size = 'md' }) => {
  const colorClass = getStatusColor(status);
  const displayText = text || getStatusText(status);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${sizeClasses[size]} ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {displayText}
    </span>
  );
};
