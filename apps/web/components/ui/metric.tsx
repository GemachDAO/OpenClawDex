/**
 * Metric Component
 * Display a single metric with value, change indicator, and optional sparkline
 */

import type { MetricProps } from '@/lib/catalog';

interface MetricComponentProps {
  element: { props: MetricProps };
}

const sizeStyles = {
  sm: { value: 'text-xl', label: 'text-xs' },
  md: { value: 'text-2xl', label: 'text-sm' },
  lg: { value: 'text-3xl', label: 'text-sm' },
  xl: { value: 'text-4xl', label: 'text-base' },
};

function formatValue(
  value: string | number,
  format?: string,
  currency?: string,
  decimals?: number
): string {
  if (typeof value === 'string') return value;

  const num = value;
  const dec = decimals ?? 2;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      }).format(num);
    case 'percent':
      return `${num >= 0 ? '+' : ''}${num.toFixed(dec)}%`;
    case 'compact':
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: dec,
      }).format(num);
    default:
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      }).format(num);
  }
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="ml-2">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Metric({ element }: MetricComponentProps) {
  const {
    label,
    value,
    format,
    currency,
    decimals,
    change,
    changePercent,
    changeDirection,
    size = 'md',
    icon,
    trend,
  } = element.props;

  const styles = sizeStyles[size];
  const isPositive = changeDirection === 'up' || (change !== undefined && change > 0);
  const isNegative = changeDirection === 'down' || (change !== undefined && change < 0);

  return (
    <div className="flex flex-col">
      <span className={`${styles.label} text-zinc-400 font-medium mb-1`}>
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </span>
      
      <div className="flex items-end">
        <span className={`${styles.value} font-bold text-white`}>
          {formatValue(value, format, currency, decimals)}
        </span>
        
        {trend && <Sparkline data={trend} positive={!isNegative} />}
      </div>

      {(change !== undefined || changePercent !== undefined) && (
        <div className="flex items-center mt-1 text-sm">
          {changePercent !== undefined && (
            <span
              className={`font-medium ${
                isPositive
                  ? 'text-green-500'
                  : isNegative
                  ? 'text-red-500'
                  : 'text-zinc-400'
              }`}
            >
              {changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          )}
          {change !== undefined && (
            <span className="text-zinc-500 ml-2">
              ({change >= 0 ? '+' : ''}
              {formatValue(change, format, currency, decimals)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Metric;
