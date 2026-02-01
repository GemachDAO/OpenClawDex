/**
 * Grid Component
 * Responsive grid layout for arranging components
 */

import type { GridProps } from '@/lib/catalog';
import type { ReactNode } from 'react';

interface GridComponentProps {
  element: { props: GridProps };
  children?: ReactNode;
}

const gapStyles = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export function Grid({ element, children }: GridComponentProps) {
  const { columns, gap = 'md' } = element.props;

  // Generate grid column classes based on columns prop
  let gridCols = 'grid-cols-1';
  
  if (typeof columns === 'number') {
    gridCols = `grid-cols-${columns}`;
  } else if (columns && typeof columns === 'object') {
    const classes = [];
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    gridCols = classes.join(' ') || 'grid-cols-1';
  }

  // For dynamic column values, we need to use inline styles
  // since Tailwind can't generate arbitrary grid-cols-X classes
  const style: React.CSSProperties = {};
  if (typeof columns === 'number' && columns > 12) {
    style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  }

  return (
    <div 
      className={`grid ${gapStyles[gap]} ${gridCols}`}
      style={style}
    >
      {children}
    </div>
  );
}

export default Grid;
