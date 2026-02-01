/**
 * Alert Component
 * Display an alert or notification message
 */

import type { AlertProps } from '@/lib/catalog';
import { useState } from 'react';

interface AlertComponentProps {
  element: { props: AlertProps };
  onAction?: (action: unknown) => void;
}

const variantStyles = {
  info: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: 'text-blue-500',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    bg: 'bg-green-500/10 border-green-500/20',
    icon: 'text-green-500',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    icon: 'text-yellow-500',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/20',
    icon: 'text-red-500',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export function Alert({ element, onAction }: AlertComponentProps) {
  const {
    title,
    message,
    variant = 'info',
    dismissible,
    onDismiss,
    action,
  } = element.props;

  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const styles = variantStyles[variant];

  const handleDismiss = () => {
    setDismissed(true);
    if (onAction && onDismiss) {
      onAction(onDismiss);
    }
  };

  const handleAction = () => {
    if (onAction && action?.action) {
      onAction(action.action);
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles.bg}`}>
      {/* Icon */}
      <svg
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={styles.iconPath}
        />
      </svg>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-medium text-white mb-1">{title}</h4>
        )}
        <p className="text-sm text-zinc-300">{message}</p>
        
        {action && (
          <button
            onClick={handleAction}
            className="mt-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Alert;
