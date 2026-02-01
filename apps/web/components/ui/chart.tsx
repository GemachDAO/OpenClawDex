/**
 * Chart Component
 * Line, area, bar, and candlestick charts for time series data
 * 
 * This is a simplified SVG-based chart component.
 * For production, consider using a library like Recharts or Chart.js.
 */

import type { ChartProps } from '@/lib/catalog';

interface ChartComponentProps {
  element: { props: ChartProps };
}

const defaultColors = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

function formatAxisValue(value: number, format?: string): string {
  switch (format) {
    case 'currency':
      return `$${value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)}`;
    case 'percent':
      return `${value.toFixed(0)}%`;
    case 'compact':
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(0);
    default:
      return value.toFixed(0);
  }
}

export function Chart({ element }: ChartComponentProps) {
  const {
    title,
    type,
    data,
    height = 200,
    showGrid = true,
    showLegend = false,
    showTooltip = true,
    colors = defaultColors,
    xAxisLabel,
    yAxisLabel,
    yAxisFormat,
  } = element.props;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-zinc-900/50 rounded-lg" style={{ height }}>
        <span className="text-zinc-500">No data available</span>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = 600;
  const chartHeight = height - padding.top - padding.bottom;
  const innerWidth = chartWidth - padding.left - padding.right;

  // Generate Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => 
    minValue + (range * i) / (yTicks - 1)
  );

  // Generate path for line/area charts
  const generatePath = () => {
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * innerWidth;
      const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
      return { x, y };
    });

    if (type === 'line') {
      return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    }
    if (type === 'area') {
      const linePath = points.map(p => `${p.x},${p.y}`).join(' L ');
      return `M ${padding.left},${padding.top + chartHeight} L ${linePath} L ${padding.left + innerWidth},${padding.top + chartHeight} Z`;
    }
    return '';
  };

  // Render bars
  const renderBars = () => {
    const barWidth = innerWidth / data.length * 0.8;
    const gap = innerWidth / data.length * 0.2;

    return data.map((d, i) => {
      const x = padding.left + (i / data.length) * innerWidth + gap / 2;
      const barHeight = ((d.value - minValue) / range) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      return (
        <rect
          key={i}
          x={x}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={colors[0]}
          opacity={0.8}
          rx={2}
          className="hover:opacity-100 transition-opacity cursor-pointer"
        />
      );
    });
  };

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-zinc-300 mb-3">{title}</h4>
      )}
      
      <svg 
        viewBox={`0 0 ${chartWidth} ${height}`} 
        className="w-full"
        style={{ maxHeight: height }}
      >
        {/* Grid lines */}
        {showGrid && yTickValues.map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - minValue) / range) * chartHeight;
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={padding.left + innerWidth}
              y2={y}
              stroke="#27272a"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Y-axis labels */}
        {yTickValues.map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - minValue) / range) * chartHeight;
          return (
            <text
              key={i}
              x={padding.left - 8}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-500 text-xs"
            >
              {formatAxisValue(tick, yAxisFormat)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (data.length > 10 && i % Math.ceil(data.length / 10) !== 0) return null;
          const x = padding.left + (i / (data.length - 1)) * innerWidth;
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-zinc-500 text-xs"
            >
              {d.label}
            </text>
          );
        })}

        {/* Chart content */}
        {(type === 'line' || type === 'area') && (
          <>
            {type === 'area' && (
              <path
                d={generatePath()}
                fill={colors[0]}
                opacity={0.2}
              />
            )}
            <path
              d={type === 'line' ? generatePath() : generatePath().split(' L ').slice(1, -1).join(' L ').replace(/^/, 'M ')}
              fill="none"
              stroke={colors[0]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {data.map((d, i) => {
              const x = padding.left + (i / (data.length - 1)) * innerWidth;
              const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill={colors[0]}
                  className="hover:r-5 cursor-pointer"
                />
              );
            })}
          </>
        )}

        {type === 'bar' && renderBars()}

        {/* Axis labels */}
        {yAxisLabel && (
          <text
            x={12}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 12, ${height / 2})`}
            className="fill-zinc-400 text-xs"
          >
            {yAxisLabel}
          </text>
        )}
        {xAxisLabel && (
          <text
            x={chartWidth / 2}
            y={height - 2}
            textAnchor="middle"
            className="fill-zinc-400 text-xs"
          >
            {xAxisLabel}
          </text>
        )}
      </svg>

      {showLegend && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: colors[0] }}
            />
            <span className="text-xs text-zinc-400">Value</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chart;
