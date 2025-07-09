import React from 'react';
import { cn } from '../lib/utils';

/**
 * A component for rendering Persian text with proper font and direction
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The Persian text content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Text size ('sm', 'base', 'lg', 'xl', '2xl', etc.)
 * @param {string} props.as - HTML element to render as (default: 'p')
 * @param {Object} props.props - Additional props to pass to the element
 */
const PersianText = ({ 
  children, 
  className = '', 
  size = 'base', 
  as: Element = 'p',
  ...props 
}) => {
  const sizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  return (
    <Element
      className={cn(
        'font-persian text-right',
        sizeClasses[size] || 'text-base',
        className
      )}
      dir="rtl"
      {...props}
    >
      {children}
    </Element>
  );
};

export default PersianText;
