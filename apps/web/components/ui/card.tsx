/**
 * Card Component
 * Container for grouping related content
 */

import type { CardProps } from '@/lib/catalog';
import type { ReactNode } from 'react';

interface CardComponentProps {
  element: { props: CardProps };
  children?: ReactNode;
}

const variantStyles = {
  default: 'bg-zinc-900 border border-zinc-800',
  outlined: 'bg-transparent border border-zinc-700',
  elevated: 'bg-zinc-900 shadow-lg shadow-black/20',
  gradient: 'bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ element, children }: CardComponentProps) {
  const { title, description, variant = 'default', padding = 'md', className = '' } = element.props;

  return (
    <div
      className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default Card;
