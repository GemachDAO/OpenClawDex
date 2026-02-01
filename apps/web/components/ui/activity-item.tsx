/**
 * ActivityItem Component
 * Display a single activity/transaction item
 */

import type { ActivityItemProps } from '@/lib/catalog';

interface ActivityItemComponentProps {
  element: { props: ActivityItemProps };
  onAction?: (action: unknown) => void;
}

const typeConfig = {
  swap: { icon: '↔️', label: 'Swap', color: 'text-blue-400' },
  buy: { icon: '🟢', label: 'Buy', color: 'text-green-400' },
  sell: { icon: '🔴', label: 'Sell', color: 'text-red-400' },
  deposit: { icon: '📥', label: 'Deposit', color: 'text-violet-400' },
  withdraw: { icon: '📤', label: 'Withdraw', color: 'text-orange-400' },
  copy: { icon: '👤', label: 'Copy Trade', color: 'text-cyan-400' },
  liquidation: { icon: '⚠️', label: 'Liquidation', color: 'text-red-500' },
  funding: { icon: '💰', label: 'Funding', color: 'text-yellow-400' },
};

const statusConfig = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Pending' },
  success: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Success' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Failed' },
};

function formatAmount(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return time.toLocaleDateString();
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function ActivityItem({ element, onAction }: ActivityItemComponentProps) {
  const {
    type,
    timestamp,
    status = 'success',
    fromToken,
    toToken,
    token,
    pnl,
    pnlPercent,
    txHash,
    chain,
    copiedFrom,
    onViewTx,
  } = element.props;

  const typeInfo = typeConfig[type];
  const statusInfo = statusConfig[status];

  const handleViewTx = () => {
    if (onAction && onViewTx) {
      onAction(onViewTx);
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-800/50 transition-colors">
      {/* Type Icon */}
      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
        {typeInfo.icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          {copiedFrom && (
            <span className="text-xs text-zinc-500">
              from {copiedFrom.slice(0, 8)}...
            </span>
          )}
          <span className={`px-1.5 py-0.5 rounded text-xs ${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Token Info */}
        <div className="flex items-center gap-1 mt-1 text-sm text-zinc-300">
          {type === 'swap' && fromToken && toToken ? (
            <>
              <span>{formatAmount(fromToken.amount)} {fromToken.symbol}</span>
              <span className="text-zinc-500">→</span>
              <span>{formatAmount(toToken.amount)} {toToken.symbol}</span>
            </>
          ) : (fromToken || toToken || token) && (
            <>
              {fromToken && (
                <span className={type === 'sell' ? 'text-red-400' : ''}>
                  {type === 'sell' ? '-' : ''}{formatAmount(fromToken.amount)} {fromToken.symbol}
                </span>
              )}
              {toToken && (
                <span className={type === 'buy' ? 'text-green-400' : ''}>
                  {type === 'buy' ? '+' : ''}{formatAmount(toToken.amount)} {toToken.symbol}
                </span>
              )}
              {token && (
                <span>
                  {formatAmount(token.amount)} {token.symbol}
                </span>
              )}
            </>
          )}
        </div>

        {/* PnL */}
        {pnl !== undefined && (
          <div className={`text-sm mt-1 ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            {pnlPercent !== undefined && (
              <span className="text-xs ml-1">
                ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-zinc-500">{formatTimeAgo(timestamp)}</span>
        
        {chain && (
          <span className="text-xs text-zinc-600 capitalize">{chain}</span>
        )}
        
        {txHash && (
          <button
            onClick={handleViewTx}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {truncateHash(txHash)}
          </button>
        )}
      </div>
    </div>
  );
}

export default ActivityItem;
