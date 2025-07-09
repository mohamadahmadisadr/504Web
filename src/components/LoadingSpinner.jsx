import React from 'react';
import { cn } from '../lib/utils';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('spinner', sizeClasses[size], className)} />
  );
};

export default LoadingSpinner;
