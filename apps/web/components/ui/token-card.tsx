/**
 * TokenCard Component
 * Display a token or meme coin with price info and trading actions
 */

import type { TokenCardProps } from '@/lib/catalog';

interface TokenCardComponentProps {
  element: { props: TokenCardProps };
  onAction?: (action: unknown) => void;
}

function formatPrice(price: number): string {
  if (price < 0.0001) {
    return price.toExponential(2);
  }
  if (price < 1) {
    return price.toFixed(6);
  }
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatMarketCap(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function TokenCard({ element, onAction }: TokenCardComponentProps) {
  const {
    name,
    symbol,
    address,
    icon,
    price,
    priceChange24h,
    marketCap,
    volume24h,
    holders,
    bondingProgress,
    isGraduated,
    onBuy,
    onSell,
    onViewChart,
  } = element.props;

  const isPriceUp = priceChange24h !== undefined && priceChange24h >= 0;

  const handleBuy = () => {
    if (onAction && onBuy) {
      onAction(onBuy);
    }
  };

  const handleSell = () => {
    if (onAction && onSell) {
      onAction(onSell);
    }
  };

  const handleViewChart = () => {
    if (onAction && onViewChart) {
      onAction(onViewChart);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <img src={icon} alt={symbol} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
              {symbol[0]}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            <p className="text-sm text-zinc-500">{symbol}</p>
          </div>
        </div>
        
        {/* Graduation Badge */}
        {isGraduated !== undefined && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            isGraduated 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-yellow-500/10 text-yellow-500'
          }`}>
            {isGraduated ? '🎓 Graduated' : '🔥 Bonding'}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">${formatPrice(price)}</span>
          {priceChange24h !== undefined && (
            <span className={`text-sm font-medium ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
              {isPriceUp ? '+' : ''}{priceChange24h.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {marketCap !== undefined && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">Market Cap</p>
            <p className="text-sm font-medium text-white">{formatMarketCap(marketCap)}</p>
          </div>
        )}
        {volume24h !== undefined && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">24h Volume</p>
            <p className="text-sm font-medium text-white">{formatMarketCap(volume24h)}</p>
          </div>
        )}
        {holders !== undefined && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">Holders</p>
            <p className="text-sm font-medium text-white">{holders.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Bonding Curve Progress */}
      {bondingProgress !== undefined && !isGraduated && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500">Bonding Progress</span>
            <span className="text-xs text-zinc-400">{bondingProgress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, bondingProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onViewChart && (
          <button
            onClick={handleViewChart}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            📈 Chart
          </button>
        )}
        {onBuy && (
          <button
            onClick={handleBuy}
            className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-sm font-medium transition-colors"
          >
            Buy
          </button>
        )}
        {onSell && (
          <button
            onClick={handleSell}
            className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
          >
            Sell
          </button>
        )}
      </div>
    </div>
  );
}

export default TokenCard;
