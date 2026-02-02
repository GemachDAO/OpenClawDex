// @ts-nocheck
/**
 * OpenClawDex Trading Interface
 * Premium Neural Trading Terminal
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppData, useAppActions } from '@/lib/providers';
import { Header } from '@/components/layout/Header';

// ============================================================================
// Types
// ============================================================================

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl?: string;
  price?: number;
  priceChange24h?: number;
}

interface MemeToken extends Token {
  marketCap?: number;
  volume24h?: number;
  holders?: number;
  launchDate?: string;
  isRugPull?: boolean;
}

interface Market {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  maxLeverage: number;
}

// ============================================================================
// Constants
// ============================================================================

const POPULAR_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, price: 3250 },
  { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6, price: 1 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8, price: 67500 },
  { symbol: 'SOL', name: 'Solana', address: 'So11111111111111111111111111111111111111112', decimals: 9, price: 178 },
  { symbol: 'ARB', name: 'Arbitrum', address: '0x912ce59144191c1204e64559fe8253a0e49e6548', decimals: 18, price: 1.85 },
];

const TRENDING_MEMES: MemeToken[] = [
  { symbol: 'BONK', name: 'Bonk', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, price: 0.000032, priceChange24h: 15.5, marketCap: 2100000000, volume24h: 180000000, holders: 890000 },
  { symbol: 'WIF', name: 'dogwifhat', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, price: 2.45, priceChange24h: -8.2, marketCap: 2400000000, volume24h: 320000000, holders: 210000 },
  { symbol: 'POPCAT', name: 'Popcat', address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', decimals: 9, price: 1.12, priceChange24h: 42.1, marketCap: 1100000000, volume24h: 95000000, holders: 145000 },
  { symbol: 'MEW', name: 'cat in a dogs world', address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', decimals: 5, price: 0.0089, priceChange24h: 5.3, marketCap: 840000000, volume24h: 42000000, holders: 178000 },
  { symbol: 'PNUT', name: 'Peanut the Squirrel', address: '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump', decimals: 6, price: 0.68, priceChange24h: -12.4, marketCap: 680000000, volume24h: 58000000, holders: 92000 },
];

const PERP_MARKETS: Market[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', price: 67500, priceChange24h: 2.3, volume24h: 4500000000, openInterest: 890000000, fundingRate: 0.0012, maxLeverage: 50 },
  { symbol: 'ETH-USD', name: 'Ethereum', price: 3250, priceChange24h: 1.8, volume24h: 2100000000, openInterest: 450000000, fundingRate: 0.0008, maxLeverage: 50 },
  { symbol: 'SOL-USD', name: 'Solana', price: 178, priceChange24h: 4.5, volume24h: 890000000, openInterest: 120000000, fundingRate: 0.0015, maxLeverage: 20 },
  { symbol: 'ARB-USD', name: 'Arbitrum', price: 1.85, priceChange24h: -1.2, volume24h: 145000000, openInterest: 28000000, fundingRate: -0.0003, maxLeverage: 20 },
  { symbol: 'DOGE-USD', name: 'Dogecoin', price: 0.38, priceChange24h: 8.7, volume24h: 520000000, openInterest: 95000000, fundingRate: 0.0025, maxLeverage: 20 },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number, decimals = 2): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(decimals)}`;
}

function formatNumber(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ============================================================================
// Components
// ============================================================================

function TabButton({
  active,
  onClick,
  children,
  icon
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-5 py-3 font-medium text-sm transition-all relative
        ${active
          ? 'text-[var(--accent-cyan)]'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
        }
      `}
    >
      <span className={active ? 'text-[var(--accent-cyan)]' : ''}>{icon}</span>
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)]" />
      )}
    </button>
  );
}

function TokenSelector({
  selected,
  tokens,
  onSelect,
  label
}: {
  selected: Token | null;
  tokens: Token[];
  onSelect: (token: Token) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2 block">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-between hover:border-[var(--border-accent)] transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-purple)]/20 border border-[var(--border-primary)] flex items-center justify-center text-xs font-bold text-[var(--accent-cyan)]">
              {selected.symbol.charAt(0)}
            </div>
            <div className="text-left">
              <span className="font-semibold">{selected.symbol}</span>
              <span className="text-xs text-[var(--text-tertiary)] ml-2">{selected.name}</span>
            </div>
          </div>
        ) : (
          <span className="text-[var(--text-tertiary)]">Select token</span>
        )}
        <svg className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-elevated)] shadow-2xl z-50 max-h-60 overflow-y-auto animate-slide-down">
          {tokens.map((token) => (
            <button
              key={token.address}
              onClick={() => { onSelect(token); setIsOpen(false); }}
              className="w-full p-3 rounded-lg flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-purple)]/20 border border-[var(--border-primary)] flex items-center justify-center text-sm font-bold text-[var(--accent-cyan)]">
                {token.symbol.charAt(0)}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{token.name}</p>
              </div>
              {token.price && (
                <p className="text-sm font-mono text-[var(--text-secondary)]">${token.price.toLocaleString()}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Swap Tab
// ============================================================================

function SwapTab() {
  const { execute } = useAppActions();
  const data = useAppData();
  const wallet = data.wallet || { connected: false };

  const [fromToken, setFromToken] = useState<Token | null>(POPULAR_TOKENS[0]);
  const [toToken, setToToken] = useState<Token | null>(POPULAR_TOKENS[1]);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');

  const estimatedOutput = amount && fromToken && toToken
    ? (parseFloat(amount) * (fromToken.price || 0) / (toToken.price || 1) * 0.997).toFixed(6)
    : '0';

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount) return;

    await execute({
      type: 'executeSwap',
      fromToken: fromToken.symbol,
      toToken: toToken.symbol,
      amount: parseFloat(amount),
      slippage: parseFloat(slippage),
    });
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="glass-card-strong p-6 opacity-0 animate-scale-in" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[var(--accent-cyan)]" />
            Swap Tokens
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Slippage</span>
            <select
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="text-sm"
            >
              <option value="0.1">0.1%</option>
              <option value="0.5">0.5%</option>
              <option value="1">1%</option>
              <option value="3">3%</option>
            </select>
          </div>
        </div>

        {/* From Token */}
        <div className="mb-2">
          <TokenSelector
            selected={fromToken}
            tokens={POPULAR_TOKENS}
            onSelect={setFromToken}
            label="From"
          />
          <div className="relative mt-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-4 text-2xl font-mono bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
            />
            {fromToken?.price && amount && (
              <p className="absolute right-4 bottom-4 text-sm text-[var(--text-tertiary)]">
                ~${(parseFloat(amount || '0') * fromToken.price).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleFlipTokens}
            className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:border-[var(--accent-cyan)] hover:bg-[var(--bg-tertiary)] transition-all group"
          >
            <svg className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-cyan)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div className="mb-6">
          <TokenSelector
            selected={toToken}
            tokens={POPULAR_TOKENS}
            onSelect={setToToken}
            label="To"
          />
          <div className="w-full mt-3 p-4 text-2xl font-mono bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-tertiary)]">
            {estimatedOutput}
          </div>
        </div>

        {/* Swap Info */}
        {amount && fromToken && toToken && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Rate</span>
              <span className="font-mono">1 {fromToken.symbol} = {((fromToken.price || 0) / (toToken.price || 1)).toFixed(6)} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Price Impact</span>
              <span className="text-[var(--accent-green)]">&lt; 0.01%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Min. Received</span>
              <span className="font-mono">{(parseFloat(estimatedOutput) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken.symbol}</span>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleSwap}
          disabled={!wallet.connected || !amount || !fromToken || !toToken}
          className="w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-primary"
        >
          {!wallet.connected ? 'Connect Wallet' : !amount ? 'Enter Amount' : 'Swap'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Meme Coins Tab
// ============================================================================

function MemeCoinsTab() {
  const { execute } = useAppActions();
  const data = useAppData();

  const wallet = data.wallet || { connected: false };
  const [selectedMeme, setSelectedMeme] = useState<MemeToken | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMemes = TRENDING_MEMES.filter(
    (m) => m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBuy = async () => {
    if (!selectedMeme || !buyAmount) return;
    await execute({
      type: 'buyToken',
      tokenAddress: selectedMeme.address,
      amount: parseFloat(buyAmount),
      chain: 'solana',
    });
    setBuyAmount('');
  };

  const handleSell = async () => {
    if (!selectedMeme || !buyAmount) return;
    await execute({
      type: 'sellToken',
      tokenAddress: selectedMeme.address,
      amount: parseFloat(buyAmount),
      chain: 'solana',
    });
    setBuyAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Token List */}
      <div className="lg:col-span-2">
        <div className="glass-card-strong p-6 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[var(--accent-magenta)]" />
              Trending Meme Coins
            </h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-cyan)] w-48"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">24h</th>
                  <th className="text-right hide-mobile">Market Cap</th>
                  <th className="text-right hide-mobile">Volume</th>
                  <th className="text-right hide-mobile">Holders</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemes.map((meme, idx) => (
                  <tr
                    key={meme.address}
                    onClick={() => setSelectedMeme(meme)}
                    className={`cursor-pointer transition-all ${
                      selectedMeme?.address === meme.address
                        ? 'bg-[var(--accent-cyan)]/5 border-l-2 border-l-[var(--accent-cyan)]'
                        : ''
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-magenta)]/20 to-[var(--accent-orange)]/20 border border-[var(--border-primary)] flex items-center justify-center font-bold text-sm text-[var(--accent-magenta)]">
                          {meme.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{meme.symbol}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{meme.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-mono text-sm">
                      ${meme.price && meme.price < 0.01 ? meme.price.toFixed(8) : meme.price?.toFixed(4)}
                    </td>
                    <td className={`text-right font-mono text-sm ${(meme.priceChange24h || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                      {formatPercent(meme.priceChange24h || 0)}
                    </td>
                    <td className="text-right font-mono text-sm hide-mobile">{formatCurrency(meme.marketCap || 0)}</td>
                    <td className="text-right font-mono text-sm hide-mobile">{formatCurrency(meme.volume24h || 0)}</td>
                    <td className="text-right font-mono text-sm hide-mobile">{formatNumber(meme.holders || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade Panel */}
      <div>
        <div className="glass-card-strong p-6 sticky top-24 opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          {selectedMeme ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent-magenta)]/20 to-[var(--accent-orange)]/20 border border-[var(--border-primary)] flex items-center justify-center font-bold text-lg text-[var(--accent-magenta)]">
                  {selectedMeme.symbol.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedMeme.symbol}</h3>
                  <p className="text-sm text-[var(--text-tertiary)]">{selectedMeme.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Price</p>
                  <p className="font-semibold font-mono">${selectedMeme.price?.toFixed(8)}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">24h Change</p>
                  <p className={`font-semibold font-mono ${(selectedMeme.priceChange24h || 0) >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                    {formatPercent(selectedMeme.priceChange24h || 0)}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2 block">Amount (SOL)</label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-4 text-xl font-mono bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-cyan)]"
                />
                {buyAmount && selectedMeme.price && (
                  <p className="text-sm text-[var(--text-tertiary)] mt-2">
                    ~ {(parseFloat(buyAmount) * 178 / selectedMeme.price).toLocaleString()} {selectedMeme.symbol}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {['0.1', '0.5', '1', '5'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBuyAmount(val)}
                    className={`py-2.5 text-sm rounded-lg transition-all ${
                      buyAmount === val
                        ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30'
                        : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-accent)]'
                    }`}
                  >
                    {val} SOL
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handleBuy}
                  disabled={!wallet.connected || !buyAmount}
                  className="py-3.5 rounded-xl font-semibold bg-[var(--accent-green)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Buy
                </button>
                <button
                  onClick={handleSell}
                  disabled={!wallet.connected || !buyAmount}
                  className="py-3.5 rounded-xl font-semibold bg-[var(--accent-red)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Sell
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Contract Address</p>
                <p className="font-mono text-xs break-all text-[var(--text-secondary)]">{selectedMeme.address}</p>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-tertiary)]">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p className="font-medium mb-1">Select a Token</p>
              <p className="text-sm">Choose from the list to trade</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Leverage Tab
// ============================================================================

function LeverageTab() {
  const { execute } = useAppActions();
  const data = useAppData();

  const wallet = data.wallet || { connected: false };
  const [selectedMarket, setSelectedMarket] = useState<Market>(PERP_MARKETS[0]);
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(10);
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const positionSize = amount ? parseFloat(amount) * leverage : 0;
  const liquidationPrice = selectedMarket && amount
    ? side === 'long'
      ? selectedMarket.price * (1 - 1 / leverage * 0.9)
      : selectedMarket.price * (1 + 1 / leverage * 0.9)
    : 0;

  const handleOpenPosition = async () => {
    if (!amount) return;

    await execute({
      type: 'openPosition',
      market: selectedMarket.symbol,
      side,
      size: parseFloat(amount),
      leverage,
      orderType,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
    });

    setAmount('');
    setTakeProfit('');
    setStopLoss('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Markets List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card-strong p-6 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[var(--accent-orange)]" />
            Perpetual Markets
          </h2>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">24h</th>
                  <th className="text-right hide-mobile">Volume</th>
                  <th className="text-right hide-mobile">Open Interest</th>
                  <th className="text-right hide-mobile">Funding</th>
                  <th className="text-right">Max Lev</th>
                </tr>
              </thead>
              <tbody>
                {PERP_MARKETS.map((market, idx) => (
                  <tr
                    key={market.symbol}
                    onClick={() => setSelectedMarket(market)}
                    className={`cursor-pointer ${
                      selectedMarket?.symbol === market.symbol
                        ? 'bg-[var(--accent-cyan)]/5 border-l-2 border-l-[var(--accent-cyan)]'
                        : ''
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-blue)]/20 to-[var(--accent-cyan)]/20 border border-[var(--border-primary)] flex items-center justify-center font-bold text-sm text-[var(--accent-cyan)]">
                          {market.symbol.split('-')[0].charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{market.symbol}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{market.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-mono">{formatCurrency(market.price)}</td>
                    <td className={`text-right font-mono ${market.priceChange24h >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                      {formatPercent(market.priceChange24h)}
                    </td>
                    <td className="text-right font-mono hide-mobile">{formatCurrency(market.volume24h)}</td>
                    <td className="text-right font-mono hide-mobile">{formatCurrency(market.openInterest)}</td>
                    <td className={`text-right font-mono hide-mobile ${market.fundingRate >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                      {(market.fundingRate * 100).toFixed(4)}%
                    </td>
                    <td className="text-right font-semibold">{market.maxLeverage}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="glass-card-strong p-6 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{selectedMarket.symbol}</h3>
            <div className="flex gap-1">
              {['1H', '4H', '1D', '1W'].map((tf) => (
                <button key={tf} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-accent)] transition-colors">
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <div className="text-center text-[var(--text-tertiary)]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
                <path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 6-6"/>
              </svg>
              <p className="text-sm">TradingView Chart</p>
              <p className="text-xs">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Panel */}
      <div>
        <div className="glass-card-strong p-6 sticky top-24 opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">{selectedMarket.symbol}</h3>
            <span className="font-mono text-lg">{formatCurrency(selectedMarket.price)}</span>
          </div>

          {/* Side Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              onClick={() => setSide('long')}
              className={`py-3 rounded-xl font-semibold transition-all ${
                side === 'long'
                  ? 'bg-[var(--accent-green)] text-[var(--bg-primary)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent-green)]'
              }`}
            >
              Long
            </button>
            <button
              onClick={() => setSide('short')}
              className={`py-3 rounded-xl font-semibold transition-all ${
                side === 'short'
                  ? 'bg-[var(--accent-red)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent-red)]'
              }`}
            >
              Short
            </button>
          </div>

          {/* Order Type */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setOrderType('market')}
              className={`flex-1 py-2.5 text-sm rounded-lg transition-all ${
                orderType === 'market'
                  ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`flex-1 py-2.5 text-sm rounded-lg transition-all ${
                orderType === 'limit'
                  ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
              }`}
            >
              Limit
            </button>
          </div>

          {/* Limit Price */}
          {orderType === 'limit' && (
            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2 block">Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={selectedMarket.price.toString()}
                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-cyan)] font-mono"
              />
            </div>
          )}

          {/* Amount */}
          <div className="mb-4">
            <label className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-2 block">Size (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:outline-none focus:border-[var(--accent-cyan)] font-mono"
            />
          </div>

          {/* Leverage Slider */}
          <div className="mb-5">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-[var(--text-tertiary)]">Leverage</span>
              <span className="font-semibold text-[var(--accent-cyan)]">{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max={selectedMarket.maxLeverage}
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
              <span>1x</span>
              <span>{selectedMarket.maxLeverage}x</span>
            </div>
          </div>

          {/* Quick Leverage */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[5, 10, 25, 50].filter(l => l <= selectedMarket.maxLeverage).map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`py-2 text-sm rounded-lg transition-all ${
                  leverage === lev
                    ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-accent)]'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>

          {/* TP/SL */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Take Profit</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="TP Price"
                className="w-full p-2.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:border-[var(--accent-green)] font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="SL Price"
                className="w-full p-2.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:border-[var(--accent-red)] font-mono"
              />
            </div>
          </div>

          {/* Position Info */}
          {amount && (
            <div className="mb-5 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Position Size</span>
                <span className="font-mono">{formatCurrency(positionSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Margin Required</span>
                <span className="font-mono">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Liq. Price</span>
                <span className="text-[var(--accent-red)] font-mono">{formatCurrency(liquidationPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Fees (0.05%)</span>
                <span className="font-mono">{formatCurrency(positionSize * 0.0005)}</span>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleOpenPosition}
            disabled={!wallet.connected || !amount}
            className={`w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              side === 'long'
                ? 'bg-[var(--accent-green)] text-[var(--bg-primary)] hover:opacity-90'
                : 'bg-[var(--accent-red)] text-white hover:opacity-90'
            }`}
          >
            {!wallet.connected
              ? 'Connect Wallet'
              : !amount
                ? 'Enter Amount'
                : `${side === 'long' ? 'Long' : 'Short'} ${selectedMarket.symbol}`
            }
          </button>

          <p className="text-xs text-center text-[var(--text-tertiary)] mt-4">
            Trading on Hyperliquid • No gas fees
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Trading Page
// ============================================================================

export default function TradePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'swap';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  return (
    <main className="min-h-screen">
      {/* Background Effects */}
      <div className="neural-grid" />
      <div className="neural-orbs" />

      <Header />

      {/* Tab Navigation */}
      <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
        <div className="max-w-[1400px] mx-auto px-6 flex">
          <TabButton
            active={activeTab === 'swap'}
            onClick={() => setActiveTab('swap')}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>}
          >
            Swap
          </TabButton>
          <TabButton
            active={activeTab === 'meme'}
            onClick={() => setActiveTab('meme')}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
          >
            Meme Coins
          </TabButton>
          <TabButton
            active={activeTab === 'leverage'}
            onClick={() => setActiveTab('leverage')}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 12l4-4 4 4 5-5"/></svg>}
          >
            Leverage
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {activeTab === 'swap' && <SwapTab />}
        {activeTab === 'meme' && <MemeCoinsTab />}
        {activeTab === 'leverage' && <LeverageTab />}
      </div>
    </main>
  );
}
