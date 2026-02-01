/**
 * Badge Component
 * Status indicator or label
 */

import type { BadgeProps } from '@/lib/catalog';

interface BadgeComponentProps {
  element: { props: BadgeProps };
}

const variantStyles = {
  default: 'bg-zinc-700 text-zinc-200',
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  error: 'bg-red-500/10 text-red-500',
  info: 'bg-blue-500/10 text-blue-500',
  outline: 'bg-transparent border border-zinc-600 text-zinc-300',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const dotColors = {
  default: 'bg-zinc-400',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-zinc-400',
};

export function Badge({ element }: BadgeComponentProps) {
  const {
    label,
    variant = 'default',
    size = 'md',
    dot,
    icon,
  } = element.props;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

export default Badge;
