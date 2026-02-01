// @ts-nocheck
/**
 * OpenClawDex Trading Interface
 * 
 * Unified trading page with tabs for:
 * - Swap: Token-to-token swaps
 * - Meme Coins: Buy/sell meme tokens on Solana
 * - Leverage: Perpetual trading on Hyperliquid
 * 
 * Note: Type errors will resolve when @json-render/react is installed
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppData, useAppActions } from '@/lib/providers';
import Link from 'next/link';

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

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3 font-medium transition-all
        ${active 
          ? 'text-white border-b-2 border-violet-500 bg-violet-500/10' 
          : 'text-[var(--muted)] hover:text-white hover:bg-[var(--card)]'
        }
      `}
    >
      <span>{icon}</span>
      {children}
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
      <label className="text-sm text-[var(--muted)] mb-1 block">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-between hover:border-violet-500/50 transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
              {selected.symbol.charAt(0)}
            </div>
            <span className="font-medium">{selected.symbol}</span>
          </div>
        ) : (
          <span className="text-[var(--muted)]">Select token</span>
        )}
        <svg className="w-5 h-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-xl z-50 max-h-60 overflow-y-auto">
          {tokens.map((token) => (
            <button
              key={token.address}
              onClick={() => { onSelect(token); setIsOpen(false); }}
              className="w-full p-2 rounded flex items-center gap-2 hover:bg-[var(--card)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold">
                {token.symbol.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-[var(--muted)]">{token.name}</p>
              </div>
              {token.price && (
                <p className="ml-auto text-sm">${token.price.toLocaleString()}</p>
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
  
  const [fromToken, setFromToken] = useState<Token | null>(POPULAR_TOKENS[0]);
  const [toToken, setToToken] = useState<Token | null>(POPULAR_TOKENS[1]);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  
  const estimatedOutput = amount && fromToken && toToken 
    ? (parseFloat(amount) * (fromToken.price || 0) / (toToken.price || 1) * 0.997).toFixed(6)
    : '0';

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount) return;
    
    // @ts-expect-error - Action type will be resolved when @json-render/react is installed
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
    <div className="max-w-md mx-auto">
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Swap Tokens</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Slippage:</span>
            <select 
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1"
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
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full mt-2 p-4 text-2xl bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
          />
          {fromToken?.price && amount && (
            <p className="text-sm text-[var(--muted)] mt-1">
              ≈ ${(parseFloat(amount || '0') * fromToken.price).toLocaleString()}
            </p>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button 
            onClick={handleFlipTokens}
            className="p-2 rounded-full bg-[var(--background)] border border-[var(--border)] hover:border-violet-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="w-full mt-2 p-4 text-2xl bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--muted)]">
            {estimatedOutput}
          </div>
          {toToken?.price && estimatedOutput !== '0' && (
            <p className="text-sm text-[var(--muted)] mt-1">
              ≈ ${(parseFloat(estimatedOutput) * toToken.price).toLocaleString()}
            </p>
          )}
        </div>

        {/* Swap Info */}
        {amount && fromToken && toToken && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--background)] text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Rate</span>
              <span>1 {fromToken.symbol} = {((fromToken.price || 0) / (toToken.price || 1)).toFixed(6)} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Price Impact</span>
              <span className="text-green-400">&lt; 0.01%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Min. Received</span>
              <span>{(parseFloat(estimatedOutput) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken.symbol}</span>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleSwap}
          disabled={!data.wallet.connected || !amount || !fromToken || !toToken}
          className="w-full py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
        >
          {!data.wallet.connected ? 'Connect Wallet' : !amount ? 'Enter Amount' : 'Swap'}
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
  
  const [selectedMeme, setSelectedMeme] = useState<MemeToken | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMemes = TRENDING_MEMES.filter(
    (m) => m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBuy = async () => {
    if (!selectedMeme || !buyAmount) return;
    // @ts-expect-error - Action type will be resolved when @json-render/react is installed
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
    // @ts-expect-error - Action type will be resolved when @json-render/react is installed
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
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">🚀 Trending Meme Coins</h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-violet-500"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="pb-3 font-medium">Token</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">24h</th>
                  <th className="pb-3 font-medium text-right">Market Cap</th>
                  <th className="pb-3 font-medium text-right">Volume</th>
                  <th className="pb-3 font-medium text-right">Holders</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemes.map((meme) => (
                  <tr 
                    key={meme.address}
                    onClick={() => setSelectedMeme(meme)}
                    className={`
                      border-b border-[var(--border)] cursor-pointer transition-colors
                      ${selectedMeme?.address === meme.address ? 'bg-violet-500/10' : 'hover:bg-[var(--background)]'}
                    `}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center font-bold">
                          {meme.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{meme.symbol}</p>
                          <p className="text-sm text-[var(--muted)]">{meme.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right font-mono">
                      ${meme.price && meme.price < 0.01 ? meme.price.toFixed(8) : meme.price?.toFixed(4)}
                    </td>
                    <td className={`py-4 text-right ${(meme.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(meme.priceChange24h || 0)}
                    </td>
                    <td className="py-4 text-right">{formatCurrency(meme.marketCap || 0)}</td>
                    <td className="py-4 text-right">{formatCurrency(meme.volume24h || 0)}</td>
                    <td className="py-4 text-right">{formatNumber(meme.holders || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade Panel */}
      <div>
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] sticky top-24">
          {selectedMeme ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                  {selectedMeme.symbol.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedMeme.symbol}</h3>
                  <p className="text-sm text-[var(--muted)]">{selectedMeme.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-[var(--background)]">
                  <p className="text-xs text-[var(--muted)]">Price</p>
                  <p className="font-semibold">${selectedMeme.price?.toFixed(8)}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--background)]">
                  <p className="text-xs text-[var(--muted)]">24h Change</p>
                  <p className={`font-semibold ${(selectedMeme.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(selectedMeme.priceChange24h || 0)}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm text-[var(--muted)] mb-1 block">Amount (SOL)</label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-3 text-lg bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
                />
                {buyAmount && selectedMeme.price && (
                  <p className="text-sm text-[var(--muted)] mt-1">
                    ≈ {(parseFloat(buyAmount) * 178 / selectedMeme.price).toLocaleString()} {selectedMeme.symbol}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mb-4">
                {['0.1', '0.5', '1', '5'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBuyAmount(val)}
                    className="flex-1 py-2 text-sm rounded bg-[var(--background)] hover:bg-violet-500/20 transition-colors"
                  >
                    {val} SOL
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBuy}
                  disabled={!data.wallet.connected || !buyAmount}
                  className="py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Buy
                </button>
                <button
                  onClick={handleSell}
                  disabled={!data.wallet.connected || !buyAmount}
                  className="py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sell
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted)] mb-2">Contract Address</p>
                <p className="font-mono text-xs break-all">{selectedMeme.address}</p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-[var(--muted)]">
              <span className="text-4xl mb-3 block">🎯</span>
              <p>Select a token to trade</p>
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
    
    // @ts-expect-error - Action type will be resolved when @json-render/react is installed
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
      <div className="lg:col-span-2">
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <h2 className="text-lg font-semibold mb-4">⚡ Perpetual Markets</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="pb-3 font-medium">Market</th>
                  <th className="pb-3 font-medium text-right">Price</th>
                  <th className="pb-3 font-medium text-right">24h</th>
                  <th className="pb-3 font-medium text-right">Volume</th>
                  <th className="pb-3 font-medium text-right">Open Interest</th>
                  <th className="pb-3 font-medium text-right">Funding</th>
                  <th className="pb-3 font-medium text-right">Max Lev</th>
                </tr>
              </thead>
              <tbody>
                {PERP_MARKETS.map((market) => (
                  <tr 
                    key={market.symbol}
                    onClick={() => setSelectedMarket(market)}
                    className={`
                      border-b border-[var(--border)] cursor-pointer transition-colors
                      ${selectedMarket?.symbol === market.symbol ? 'bg-violet-500/10' : 'hover:bg-[var(--background)]'}
                    `}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-sm">
                          {market.symbol.split('-')[0].charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{market.symbol}</p>
                          <p className="text-xs text-[var(--muted)]">{market.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right font-mono">{formatCurrency(market.price)}</td>
                    <td className={`py-4 text-right ${market.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(market.priceChange24h)}
                    </td>
                    <td className="py-4 text-right">{formatCurrency(market.volume24h)}</td>
                    <td className="py-4 text-right">{formatCurrency(market.openInterest)}</td>
                    <td className={`py-4 text-right ${market.fundingRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(market.fundingRate * 100).toFixed(4)}%
                    </td>
                    <td className="py-4 text-right">{market.maxLeverage}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simple Chart Placeholder */}
        <div className="mt-6 p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{selectedMarket.symbol} Chart</h3>
            <div className="flex gap-2">
              {['1H', '4H', '1D', '1W'].map((tf) => (
                <button key={tf} className="px-3 py-1 text-sm rounded bg-[var(--background)] hover:bg-violet-500/20">
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center text-[var(--muted)] border border-[var(--border)] rounded-lg">
            <div className="text-center">
              <p className="text-4xl mb-2">📈</p>
              <p>TradingView Chart</p>
              <p className="text-sm">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Panel */}
      <div>
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">{selectedMarket.symbol}</h3>
            <span className="font-mono text-lg">{formatCurrency(selectedMarket.price)}</span>
          </div>

          {/* Side Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setSide('long')}
              className={`py-3 rounded-lg font-semibold transition-colors ${
                side === 'long' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-[var(--background)] text-[var(--muted)] hover:text-white'
              }`}
            >
              Long
            </button>
            <button
              onClick={() => setSide('short')}
              className={`py-3 rounded-lg font-semibold transition-colors ${
                side === 'short' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-[var(--background)] text-[var(--muted)] hover:text-white'
              }`}
            >
              Short
            </button>
          </div>

          {/* Order Type */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setOrderType('market')}
              className={`flex-1 py-2 text-sm rounded transition-colors ${
                orderType === 'market' ? 'bg-violet-600' : 'bg-[var(--background)]'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`flex-1 py-2 text-sm rounded transition-colors ${
                orderType === 'limit' ? 'bg-violet-600' : 'bg-[var(--background)]'
              }`}
            >
              Limit
            </button>
          </div>

          {/* Limit Price */}
          {orderType === 'limit' && (
            <div className="mb-4">
              <label className="text-sm text-[var(--muted)] mb-1 block">Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={selectedMarket.price.toString()}
                className="w-full p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          {/* Amount */}
          <div className="mb-4">
            <label className="text-sm text-[var(--muted)] mb-1 block">Size (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Leverage Slider */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--muted)]">Leverage</span>
              <span className="font-semibold">{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max={selectedMarket.maxLeverage}
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>1x</span>
              <span>{selectedMarket.maxLeverage}x</span>
            </div>
          </div>

          {/* Quick Leverage Buttons */}
          <div className="flex gap-2 mb-4">
            {[5, 10, 25, 50].filter(l => l <= selectedMarket.maxLeverage).map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`flex-1 py-2 text-sm rounded transition-colors ${
                  leverage === lev ? 'bg-violet-600' : 'bg-[var(--background)] hover:bg-violet-500/20'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>

          {/* TP/SL */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Take Profit</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="TP Price"
                className="w-full p-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Stop Loss</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="SL Price"
                className="w-full p-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Position Info */}
          {amount && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--background)] text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Position Size</span>
                <span>{formatCurrency(positionSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Margin Required</span>
                <span>{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Liq. Price</span>
                <span className="text-red-400">{formatCurrency(liquidationPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Fees (0.05%)</span>
                <span>{formatCurrency(positionSize * 0.0005)}</span>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleOpenPosition}
            disabled={!data.wallet.connected || !amount}
            className={`w-full py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              side === 'long' 
                ? 'bg-green-600 hover:bg-green-500' 
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {!data.wallet.connected 
              ? 'Connect Wallet' 
              : !amount 
                ? 'Enter Amount' 
                : `${side === 'long' ? 'Long' : 'Short'} ${selectedMarket.symbol}`
            }
          </button>

          <p className="text-xs text-center text-[var(--muted)] mt-3">
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
  const data = useAppData();
  const { execute } = useAppActions();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleConnectWallet = () => {
    // @ts-expect-error - Action type will be resolved when @json-render/react is installed
    execute({ type: 'connectWallet' });
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🦞</span>
              <span className="font-bold">OpenClawDex</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-[var(--muted)] hover:text-white transition-colors">Dashboard</Link>
            <Link href="/trade" className="text-violet-400 font-medium">Trade</Link>
            <Link href="/copy" className="text-[var(--muted)] hover:text-white transition-colors">Copy</Link>
            <Link href="/leaderboard" className="text-[var(--muted)] hover:text-white transition-colors">Leaderboard</Link>
          </nav>

          {data.wallet.connected ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-mono">{shortenAddress(data.wallet.address || '')}</span>
            </div>
          ) : (
            <button 
              onClick={handleConnectWallet}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg font-medium text-sm transition-all"
            >
              Connect
            </button>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 flex">
          <TabButton active={activeTab === 'swap'} onClick={() => setActiveTab('swap')} icon="💱">
            Swap
          </TabButton>
          <TabButton active={activeTab === 'meme'} onClick={() => setActiveTab('meme')} icon="🚀">
            Meme Coins
          </TabButton>
          <TabButton active={activeTab === 'leverage'} onClick={() => setActiveTab('leverage')} icon="⚡">
            Leverage
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'swap' && <SwapTab />}
        {activeTab === 'meme' && <MemeCoinsTab />}
        {activeTab === 'leverage' && <LeverageTab />}
      </div>
    </main>
  );
}
