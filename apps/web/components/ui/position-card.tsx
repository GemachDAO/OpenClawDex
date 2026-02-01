/**
 * PositionCard Component
 * Display an open leverage position with PnL and controls
 */

import type { PositionCardProps } from '@/lib/catalog';

interface PositionCardComponentProps {
  element: { props: PositionCardProps };
  onAction?: (action: unknown) => void;
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  });
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function PositionCard({ element, onAction }: PositionCardComponentProps) {
  const {
    positionId,
    market,
    side,
    size,
    entryPrice,
    markPrice,
    liquidationPrice,
    leverage,
    margin,
    unrealizedPnl,
    unrealizedPnlPercent,
    takeProfit,
    stopLoss,
    onClose,
    onModify,
  } = element.props;

  const isProfit = unrealizedPnl >= 0;
  const sideColor = side === 'long' ? 'text-green-500' : 'text-red-500';
  const sideBg = side === 'long' ? 'bg-green-500/10' : 'bg-red-500/10';

  const handleClose = () => {
    if (onAction && onClose) {
      onAction(onClose);
    }
  };

  const handleModify = () => {
    if (onAction && onModify) {
      onAction(onModify);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-white">{market}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${sideBg} ${sideColor}`}>
            {side} {leverage}x
          </span>
        </div>
        <div className={`text-right ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
          <div className="font-semibold">{formatPnl(unrealizedPnl)}</div>
          <div className="text-sm">
            {unrealizedPnlPercent >= 0 ? '+' : ''}{unrealizedPnlPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Size</p>
          <p className="text-sm font-medium text-white">{size.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Margin</p>
          <p className="text-sm font-medium text-white">${margin.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Entry Price</p>
          <p className="text-sm font-medium text-white">${formatPrice(entryPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Mark Price</p>
          <p className="text-sm font-medium text-white">${formatPrice(markPrice)}</p>
        </div>
      </div>

      {/* Liquidation & SL/TP */}
      <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {liquidationPrice && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Liquidation</p>
              <p className="text-sm font-medium text-red-400">${formatPrice(liquidationPrice)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-500 mb-1">Take Profit</p>
            <p className="text-sm font-medium text-green-400">
              {takeProfit ? `$${formatPrice(takeProfit)}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Stop Loss</p>
            <p className="text-sm font-medium text-red-400">
              {stopLoss ? `$${formatPrice(stopLoss)}` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onModify && (
          <button
            onClick={handleModify}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Modify TP/SL
          </button>
        )}
        {onClose && (
          <button
            onClick={handleClose}
            className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
          >
            Close Position
          </button>
        )}
      </div>
    </div>
  );
}

export default PositionCard;
