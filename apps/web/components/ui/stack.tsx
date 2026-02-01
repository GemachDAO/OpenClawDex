/**
 * Stack Component
 * Flexible stack layout for vertical or horizontal arrangement
 */

import type { StackProps } from '@/lib/catalog';
import type { ReactNode } from 'react';

interface StackComponentProps {
  element: { props: StackProps };
  children?: ReactNode;
}

const gapStyles = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignStyles = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyStyles = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export function Stack({ element, children }: StackComponentProps) {
  const {
    direction = 'vertical',
    gap = 'md',
    align = 'stretch',
    justify = 'start',
    wrap = false,
  } = element.props;

  const flexDirection = direction === 'horizontal' ? 'flex-row' : 'flex-col';

  return (
    <div
      className={`
        flex
        ${flexDirection}
        ${gapStyles[gap]}
        ${alignStyles[align]}
        ${justifyStyles[justify]}
        ${wrap ? 'flex-wrap' : ''}
      `}
    >
      {children}
    </div>
  );
}

export default Stack;
