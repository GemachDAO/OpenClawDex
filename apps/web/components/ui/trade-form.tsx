/**
 * TradeForm Component
 * Form for executing swaps, buys, and sells
 */

import type { TradeFormProps } from '@/lib/catalog';
import { useState } from 'react';

interface TradeFormComponentProps {
  element: { props: TradeFormProps };
  onAction?: (action: unknown) => void;
}

export function TradeForm({ element, onAction }: TradeFormComponentProps) {
  const {
    type,
    fromToken,
    toToken,
    defaultAmount,
    slippage = 0.5,
    showSlippageControl = true,
    showPriceImpact = true,
    submitLabel,
    onSubmit,
    disabled = false,
    chain,
  } = element.props;

  const [amount, setAmount] = useState(defaultAmount?.toString() || '');
  const [currentSlippage, setCurrentSlippage] = useState(slippage);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAction || !amount) return;

    setIsLoading(true);
    try {
      await onAction({
        ...onSubmit,
        params: {
          ...onSubmit.params,
          amount: parseFloat(amount),
          slippage: currentSlippage,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (fromToken?.balance) {
      setAmount(fromToken.balance.toString());
    }
  };

  const getSubmitLabel = () => {
    if (submitLabel) return submitLabel;
    switch (type) {
      case 'swap':
        return 'Swap';
      case 'buy':
        return 'Buy';
      case 'sell':
        return 'Sell';
      case 'limit':
        return 'Place Order';
      default:
        return 'Submit';
    }
  };

  // Calculate estimated output (simplified)
  const estimatedOutput = fromToken?.price && toToken?.price && amount
    ? (parseFloat(amount) * fromToken.price) / toToken.price
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* From Token Input */}
      <div className="bg-zinc-800/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">
            {type === 'sell' ? 'Sell' : 'From'}
          </span>
          {fromToken?.balance !== undefined && (
            <span className="text-sm text-zinc-500">
              Balance: {fromToken.balance.toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl text-white outline-none placeholder:text-zinc-600"
            disabled={disabled}
            min="0"
            step="any"
          />
          
          <div className="flex items-center gap-2">
            {fromToken?.balance && (
              <button
                type="button"
                onClick={handleMaxClick}
                className="px-2 py-1 text-xs font-medium text-violet-400 bg-violet-500/10 rounded hover:bg-violet-500/20"
              >
                MAX
              </button>
            )}
            <div className="flex items-center gap-2 bg-zinc-700/50 rounded-lg px-3 py-2">
              {fromToken?.icon && (
                <img src={fromToken.icon} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="font-medium text-white">
                {fromToken?.symbol || 'Select'}
              </span>
            </div>
          </div>
        </div>

        {fromToken?.price && amount && (
          <div className="mt-2 text-sm text-zinc-500">
            ≈ ${(parseFloat(amount) * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Swap Arrow (for swap type) */}
      {type === 'swap' && (
        <div className="flex justify-center -my-2 relative z-10">
          <button
            type="button"
            className="w-10 h-10 bg-zinc-800 border-4 border-zinc-900 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            ↓
          </button>
        </div>
      )}

      {/* To Token Input (for swap type) */}
      {type === 'swap' && toToken && (
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">To</span>
            {toToken.balance !== undefined && (
              <span className="text-sm text-zinc-500">
                Balance: {toToken.balance.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={estimatedOutput?.toFixed(6) || '0.00'}
              readOnly
              className="flex-1 bg-transparent text-2xl text-white outline-none"
              disabled
            />
            
            <div className="flex items-center gap-2 bg-zinc-700/50 rounded-lg px-3 py-2">
              {toToken.icon && (
                <img src={toToken.icon} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="font-medium text-white">
                {toToken.symbol}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Price Impact & Slippage */}
      <div className="space-y-2">
        {showPriceImpact && estimatedOutput && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Price Impact</span>
            <span className="text-green-500">{'< 0.01%'}</span>
          </div>
        )}
        
        {showSlippageControl && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Slippage Tolerance</span>
            <div className="flex items-center gap-2">
              {[0.1, 0.5, 1.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCurrentSlippage(val)}
                  className={`px-2 py-1 rounded text-xs ${
                    currentSlippage === val
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  {val}%
                </button>
              ))}
              <input
                type="number"
                value={currentSlippage}
                onChange={(e) => setCurrentSlippage(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-zinc-700 rounded text-xs text-right outline-none focus:ring-1 focus:ring-violet-500"
                step="0.1"
                min="0"
                max="50"
              />
            </div>
          </div>
        )}

        {chain && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Network</span>
            <span className="text-zinc-200 capitalize">{chain}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={disabled || isLoading || !amount}
        className={`
          w-full py-4 rounded-xl font-semibold text-lg transition-all
          ${disabled || isLoading || !amount
            ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            : type === 'sell'
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-violet-500 hover:bg-violet-600 text-white'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          getSubmitLabel()
        )}
      </button>
    </form>
  );
}

export default TradeForm;
