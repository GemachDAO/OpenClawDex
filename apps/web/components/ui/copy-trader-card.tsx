/**
 * CopyTraderCard Component
 * Display a trader's profile for copy trading
 */

import type { CopyTraderCardProps } from '@/lib/catalog';

interface CopyTraderCardComponentProps {
  element: { props: CopyTraderCardProps };
  onAction?: (action: unknown) => void;
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  if (Math.abs(value) >= 1000000) {
    return `${prefix}$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${prefix}$${(value / 1000).toFixed(2)}K`;
  }
  return `${prefix}$${value.toFixed(2)}`;
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const riskColors = {
  low: 'bg-green-500/10 text-green-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-red-500/10 text-red-500',
};

export function CopyTraderCard({ element, onAction }: CopyTraderCardComponentProps) {
  const {
    traderId,
    displayName,
    walletAddress,
    avatar,
    verified,
    totalPnl,
    winRate,
    followers,
    performance,
    riskLevel,
    tradingStyle,
    isFollowing,
    onFollow,
    onUnfollow,
    onViewProfile,
  } = element.props;

  const handleFollow = () => {
    if (onAction && onFollow) {
      onAction(onFollow);
    }
  };

  const handleUnfollow = () => {
    if (onAction && onUnfollow) {
      onAction(onUnfollow);
    }
  };

  const handleViewProfile = () => {
    if (onAction && onViewProfile) {
      onAction(onViewProfile);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName || 'Trader'}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                {(displayName || walletAddress)[0].toUpperCase()}
              </div>
            )}
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Name & Address */}
          <div>
            <button
              onClick={handleViewProfile}
              className="text-white font-semibold hover:text-violet-400 transition-colors"
            >
              {displayName || truncateAddress(walletAddress)}
            </button>
            {displayName && (
              <p className="text-xs text-zinc-500">{truncateAddress(walletAddress)}</p>
            )}
            {tradingStyle && (
              <span className="text-xs text-zinc-400">{tradingStyle}</span>
            )}
          </div>
        </div>

        {/* Risk Badge */}
        {riskLevel && (
          <span className={`px-2 py-1 rounded text-xs font-medium ${riskColors[riskLevel]}`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Total PnL</p>
          <p className={`font-semibold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPnl(totalPnl)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Win Rate</p>
          <p className="font-semibold text-white">{winRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Followers</p>
          <p className="font-semibold text-white">{followers.toLocaleString()}</p>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
        <p className="text-xs text-zinc-500 mb-2">Performance</p>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-xs text-zinc-500">7D</p>
            <p className={`text-sm font-medium ${performance.day7 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercent(performance.day7)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500">30D</p>
            <p className={`text-sm font-medium ${performance.day30 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercent(performance.day30)}
            </p>
          </div>
          {performance.day90 !== undefined && (
            <div className="text-center">
              <p className="text-xs text-zinc-500">90D</p>
              <p className={`text-sm font-medium ${performance.day90 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(performance.day90)}
              </p>
            </div>
          )}
          {performance.allTime !== undefined && (
            <div className="text-center">
              <p className="text-xs text-zinc-500">All</p>
              <p className={`text-sm font-medium ${performance.allTime >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(performance.allTime)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {(onFollow || onUnfollow) && (
        <button
          onClick={isFollowing ? handleUnfollow : handleFollow}
          className={`
            w-full py-2 rounded-lg font-medium transition-colors
            ${isFollowing
              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              : 'bg-violet-500 text-white hover:bg-violet-600'
            }
          `}
        >
          {isFollowing ? 'Following' : 'Copy Trader'}
        </button>
      )}
    </div>
  );
}

export default CopyTraderCard;
