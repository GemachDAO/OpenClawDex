// @ts-nocheck
/**
 * OpenClawDex Copy Trading Interface
 * 
 * Browse and follow top traders to automatically copy their trades.
 * Features:
 * - Top traders leaderboard with performance stats
 * - Trader profile cards with PnL, win rate, followers
 * - Follow/unfollow with customizable copy settings
 * - Active copy positions tracker
 */

'use client';

import { useState } from 'react';
import { useAppData, useAppActions } from '@/lib/providers';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface Trader {
  id: string;
  displayName: string;
  walletAddress: string;
  avatar?: string;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  followers: number;
  copiers: number;
  avgTradeSize: number;
  maxDrawdown: number;
  sharpeRatio: number;
  tradingStyle: 'scalper' | 'swing' | 'position' | 'mixed';
  preferredMarkets: string[];
  isVerified: boolean;
  joinedAt: string;
  last7dPnl: number;
  last30dPnl: number;
}

interface CopySettings {
  copyRatio: number;
  maxPositionSize: number;
  maxLeverage: number;
  copyLongs: boolean;
  copyShorts: boolean;
  stopOnDrawdown: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const TOP_TRADERS: Trader[] = [
  {
    id: 'trader-1',
    displayName: 'CryptoWhale',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    totalPnl: 2450000,
    totalPnlPercent: 342,
    winRate: 68.5,
    totalTrades: 1847,
    followers: 12500,
    copiers: 892,
    avgTradeSize: 25000,
    maxDrawdown: 12.3,
    sharpeRatio: 2.4,
    tradingStyle: 'swing',
    preferredMarkets: ['BTC-USD', 'ETH-USD'],
    isVerified: true,
    joinedAt: '2024-03-15',
    last7dPnl: 85000,
    last30dPnl: 320000,
  },
  {
    id: 'trader-2',
    displayName: 'DeFiKing',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    totalPnl: 1820000,
    totalPnlPercent: 256,
    winRate: 72.1,
    totalTrades: 2341,
    followers: 8900,
    copiers: 654,
    avgTradeSize: 15000,
    maxDrawdown: 8.7,
    sharpeRatio: 2.8,
    tradingStyle: 'scalper',
    preferredMarkets: ['SOL-USD', 'ARB-USD', 'ETH-USD'],
    isVerified: true,
    joinedAt: '2024-01-20',
    last7dPnl: 42000,
    last30dPnl: 185000,
  },
  {
    id: 'trader-3',
    displayName: 'MemeHunter',
    walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
    totalPnl: 980000,
    totalPnlPercent: 189,
    winRate: 58.3,
    totalTrades: 4521,
    followers: 15200,
    copiers: 1243,
    avgTradeSize: 5000,
    maxDrawdown: 25.6,
    sharpeRatio: 1.6,
    tradingStyle: 'scalper',
    preferredMarkets: ['DOGE-USD', 'BONK', 'WIF'],
    isVerified: false,
    joinedAt: '2024-06-10',
    last7dPnl: 125000,
    last30dPnl: 280000,
  },
  {
    id: 'trader-4',
    displayName: 'SteadyEddie',
    walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    totalPnl: 540000,
    totalPnlPercent: 95,
    winRate: 78.9,
    totalTrades: 892,
    followers: 3400,
    copiers: 421,
    avgTradeSize: 50000,
    maxDrawdown: 5.2,
    sharpeRatio: 3.1,
    tradingStyle: 'position',
    preferredMarkets: ['BTC-USD', 'ETH-USD'],
    isVerified: true,
    joinedAt: '2023-11-05',
    last7dPnl: 18000,
    last30dPnl: 72000,
  },
  {
    id: 'trader-5',
    displayName: 'AlgoBot_X',
    walletAddress: '0x5678901234abcdef5678901234abcdef56789012',
    totalPnl: 1250000,
    totalPnlPercent: 178,
    winRate: 65.2,
    totalTrades: 8943,
    followers: 6700,
    copiers: 523,
    avgTradeSize: 8000,
    maxDrawdown: 15.8,
    sharpeRatio: 2.1,
    tradingStyle: 'mixed',
    preferredMarkets: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD'],
    isVerified: true,
    joinedAt: '2024-02-28',
    last7dPnl: 65000,
    last30dPnl: 210000,
  },
  {
    id: 'trader-6',
    displayName: 'LeverageKing',
    walletAddress: '0x0123456789abcdef0123456789abcdef01234567',
    totalPnl: 890000,
    totalPnlPercent: 425,
    winRate: 52.1,
    totalTrades: 3241,
    followers: 9800,
    copiers: 312,
    avgTradeSize: 12000,
    maxDrawdown: 38.5,
    sharpeRatio: 1.3,
    tradingStyle: 'scalper',
    preferredMarkets: ['BTC-USD', 'ETH-USD'],
    isVerified: false,
    joinedAt: '2024-05-15',
    last7dPnl: -15000,
    last30dPnl: 145000,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatNumber(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getTradingStyleColor(style: string): string {
  switch (style) {
    case 'scalper': return 'text-orange-400 bg-orange-400/10';
    case 'swing': return 'text-blue-400 bg-blue-400/10';
    case 'position': return 'text-green-400 bg-green-400/10';
    default: return 'text-purple-400 bg-purple-400/10';
  }
}

function getRiskLevel(maxDrawdown: number): { label: string; color: string } {
  if (maxDrawdown < 10) return { label: 'Low Risk', color: 'text-green-400' };
  if (maxDrawdown < 20) return { label: 'Medium Risk', color: 'text-yellow-400' };
  if (maxDrawdown < 35) return { label: 'High Risk', color: 'text-orange-400' };
  return { label: 'Very High Risk', color: 'text-red-400' };
}

// ============================================================================
// Components
// ============================================================================

function TraderCard({ 
  trader, 
  onFollow, 
  isFollowing 
}: { 
  trader: Trader; 
  onFollow: (trader: Trader) => void;
  isFollowing: boolean;
}) {
  const risk = getRiskLevel(trader.maxDrawdown);
  
  return (
    <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-violet-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-lg">
            {trader.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{trader.displayName}</h3>
              {trader.isVerified && (
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-[var(--muted)] font-mono">{shortenAddress(trader.walletAddress)}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getTradingStyleColor(trader.tradingStyle)}`}>
          {trader.tradingStyle}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-[var(--muted)]">Total PnL</p>
          <p className={`font-semibold ${trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(trader.totalPnl)}
          </p>
          <p className={`text-xs ${trader.totalPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(trader.totalPnlPercent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Win Rate</p>
          <p className="font-semibold">{trader.winRate}%</p>
          <p className="text-xs text-[var(--muted)]">{trader.totalTrades} trades</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Sharpe</p>
          <p className="font-semibold">{trader.sharpeRatio}</p>
          <p className={`text-xs ${risk.color}`}>{risk.label}</p>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="flex gap-4 mb-4 p-3 rounded-lg bg-[var(--background)]">
        <div className="flex-1">
          <p className="text-xs text-[var(--muted)]">7D PnL</p>
          <p className={`font-medium ${trader.last7dPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(trader.last7dPnl)}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-[var(--muted)]">30D PnL</p>
          <p className={`font-medium ${trader.last30dPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(trader.last30dPnl)}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-[var(--muted)]">Max DD</p>
          <p className="font-medium text-red-400">-{trader.maxDrawdown}%</p>
        </div>
      </div>

      {/* Markets & Followers */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 flex-wrap">
          {trader.preferredMarkets.slice(0, 3).map((market) => (
            <span key={market} className="px-2 py-0.5 rounded text-xs bg-[var(--background)]">
              {market}
            </span>
          ))}
          {trader.preferredMarkets.length > 3 && (
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--background)] text-[var(--muted)]">
              +{trader.preferredMarkets.length - 3}
            </span>
          )}
        </div>
        <div className="text-right text-sm">
          <span className="text-[var(--muted)]">{formatNumber(trader.copiers)} copiers</span>
        </div>
      </div>

      {/* Follow Button */}
      <button
        onClick={() => onFollow(trader)}
        className={`w-full py-3 rounded-lg font-medium transition-all ${
          isFollowing
            ? 'bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30'
            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500'
        }`}
      >
        {isFollowing ? 'Unfollow' : 'Copy Trader'}
      </button>
    </div>
  );
}

function CopySettingsModal({
  trader,
  isOpen,
  onClose,
  onConfirm,
}: {
  trader: Trader | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: CopySettings) => void;
}) {
  const [settings, setSettings] = useState<CopySettings>({
    copyRatio: 10,
    maxPositionSize: 1000,
    maxLeverage: 10,
    copyLongs: true,
    copyShorts: true,
    stopOnDrawdown: 20,
  });

  if (!isOpen || !trader) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Copy Settings</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-[var(--background)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold">
            {trader.displayName.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{trader.displayName}</p>
            <p className="text-sm text-[var(--muted)]">{formatPercent(trader.totalPnlPercent)} all-time</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Copy Ratio */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--muted)]">Copy Ratio</span>
              <span className="font-medium">{settings.copyRatio}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={settings.copyRatio}
              onChange={(e) => setSettings({ ...settings, copyRatio: parseInt(e.target.value) })}
              className="w-full accent-violet-500"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Copy {settings.copyRatio}% of each trade size
            </p>
          </div>

          {/* Max Position Size */}
          <div>
            <label className="text-sm text-[var(--muted)] mb-1 block">Max Position Size (USD)</label>
            <input
              type="number"
              value={settings.maxPositionSize}
              onChange={(e) => setSettings({ ...settings, maxPositionSize: parseInt(e.target.value) })}
              className="w-full p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Max Leverage */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--muted)]">Max Leverage</span>
              <span className="font-medium">{settings.maxLeverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={settings.maxLeverage}
              onChange={(e) => setSettings({ ...settings, maxLeverage: parseInt(e.target.value) })}
              className="w-full accent-violet-500"
            />
          </div>

          {/* Trade Types */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.copyLongs}
                onChange={(e) => setSettings({ ...settings, copyLongs: e.target.checked })}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-sm">Copy Longs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.copyShorts}
                onChange={(e) => setSettings({ ...settings, copyShorts: e.target.checked })}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-sm">Copy Shorts</span>
            </label>
          </div>

          {/* Stop Loss */}
          <div>
            <label className="text-sm text-[var(--muted)] mb-1 block">Stop copying on drawdown (%)</label>
            <input
              type="number"
              value={settings.stopOnDrawdown}
              onChange={(e) => setSettings({ ...settings, stopOnDrawdown: parseInt(e.target.value) })}
              className="w-full p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-medium border border-[var(--border)] hover:bg-[var(--background)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(settings)}
            className="flex-1 py-3 rounded-lg font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all"
          >
            Start Copying
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowedTraderRow({ 
  trader, 
  copyRatio,
  totalCopied,
  pnl,
  onUnfollow,
}: { 
  trader: Trader;
  copyRatio: number;
  totalCopied: number;
  pnl: number;
  onUnfollow: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold">
          {trader.displayName.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{trader.displayName}</p>
          <p className="text-sm text-[var(--muted)]">{copyRatio}% copy ratio</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
        </p>
        <p className="text-sm text-[var(--muted)]">{formatCurrency(totalCopied)} copied</p>
      </div>
      <button
        onClick={onUnfollow}
        className="ml-4 px-3 py-1 text-sm rounded border border-red-600/50 text-red-400 hover:bg-red-600/20 transition-colors"
      >
        Stop
      </button>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function CopyTradingPage() {
  const data = useAppData();
  const { execute } = useAppActions();
  
  const [sortBy, setSortBy] = useState<'pnl' | 'winRate' | 'copiers' | 'sharpe'>('pnl');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const { wallet, copyTrading } = data;

  // Get list of followed trader IDs
  const followedIds = copyTrading.followedTraders.map(t => t.traderId);

  // Sort and filter traders
  const sortedTraders = [...TOP_TRADERS]
    .filter(t => filterStyle === 'all' || t.tradingStyle === filterStyle)
    .filter(t => 
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl': return b.totalPnl - a.totalPnl;
        case 'winRate': return b.winRate - a.winRate;
        case 'copiers': return b.copiers - a.copiers;
        case 'sharpe': return b.sharpeRatio - a.sharpeRatio;
        default: return 0;
      }
    });

  const handleFollowClick = (trader: Trader) => {
    if (followedIds.includes(trader.id)) {
      // Unfollow
      execute({
        type: 'unfollowTrader',
        traderId: trader.id,
      });
    } else {
      // Open settings modal
      setSelectedTrader(trader);
      setShowModal(true);
    }
  };

  const handleConfirmFollow = (settings: CopySettings) => {
    if (!selectedTrader) return;
    
    execute({
      type: 'followTrader',
      traderId: selectedTrader.id,
      walletAddress: selectedTrader.walletAddress,
      displayName: selectedTrader.displayName,
      ...settings,
    });
    
    setShowModal(false);
    setSelectedTrader(null);
  };

  const handleConnectWallet = () => {
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
            <Link href="/trade" className="text-[var(--muted)] hover:text-white transition-colors">Trade</Link>
            <Link href="/copy" className="text-violet-400 font-medium">Copy</Link>
            <Link href="/leaderboard" className="text-[var(--muted)] hover:text-white transition-colors">Leaderboard</Link>
          </nav>

          {wallet.connected ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-mono">{shortenAddress(wallet.address || '')}</span>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">👥 Copy Trading</h1>
          <p className="text-[var(--muted)]">
            Follow top traders and automatically copy their trades on Hyperliquid
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search traders..."
                  className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
              >
                <option value="pnl">Sort by PnL</option>
                <option value="winRate">Sort by Win Rate</option>
                <option value="copiers">Sort by Copiers</option>
                <option value="sharpe">Sort by Sharpe Ratio</option>
              </select>

              <select
                value={filterStyle}
                onChange={(e) => setFilterStyle(e.target.value)}
                className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Styles</option>
                <option value="scalper">Scalper</option>
                <option value="swing">Swing</option>
                <option value="position">Position</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Trader Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedTraders.map((trader) => (
                <TraderCard
                  key={trader.id}
                  trader={trader}
                  onFollow={handleFollowClick}
                  isFollowing={followedIds.includes(trader.id)}
                />
              ))}
            </div>

            {sortedTraders.length === 0 && (
              <div className="text-center py-12 text-[var(--muted)]">
                <p className="text-4xl mb-2">🔍</p>
                <p>No traders found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Copy Trading Stats */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <h2 className="text-lg font-semibold mb-4">Your Copy Trading</h2>
              
              {wallet.connected ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-[var(--background)]">
                      <p className="text-xs text-[var(--muted)]">Following</p>
                      <p className="text-xl font-bold">{copyTrading.followedTraders.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--background)]">
                      <p className="text-xs text-[var(--muted)]">Total PnL</p>
                      <p className={`text-xl font-bold ${
                        copyTrading.followedTraders.reduce((sum, t) => sum + t.totalPnl, 0) >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {formatCurrency(copyTrading.followedTraders.reduce((sum, t) => sum + t.totalPnl, 0))}
                      </p>
                    </div>
                  </div>

                  {copyTrading.followedTraders.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-medium text-[var(--muted)] mb-2">Active Copies</h3>
                      {copyTrading.followedTraders.map((followed) => {
                        const traderData = TOP_TRADERS.find(t => t.id === followed.traderId);
                        if (!traderData) return null;
                        return (
                          <FollowedTraderRow
                            key={followed.traderId}
                            trader={traderData}
                            copyRatio={followed.copyRatio}
                            totalCopied={followed.totalCopied}
                            pnl={followed.totalPnl}
                            onUnfollow={() => execute({ type: 'unfollowTrader', traderId: followed.traderId })}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted)]">
                      <p>No active copies</p>
                      <p className="text-sm mt-1">Start following traders to copy their trades</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[var(--muted)] mb-4">Connect wallet to start copy trading</p>
                  <button
                    onClick={handleConnectWallet}
                    className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg font-medium text-sm transition-all"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
              <h2 className="text-lg font-semibold mb-4">How Copy Trading Works</h2>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <p className="text-[var(--muted)]">Browse top traders and review their performance stats</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <p className="text-[var(--muted)]">Set your copy ratio, max position size, and risk limits</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <p className="text-[var(--muted)]">Trades are automatically copied to your account on Hyperliquid</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <p className="text-[var(--muted)]">Monitor performance and adjust settings anytime</p>
                </div>
              </div>
            </div>

            {/* Risk Warning */}
            <div className="p-4 rounded-lg border border-yellow-600/50 bg-yellow-600/10">
              <div className="flex gap-2">
                <span className="text-yellow-400">⚠️</span>
                <div className="text-sm">
                  <p className="font-medium text-yellow-400 mb-1">Risk Warning</p>
                  <p className="text-[var(--muted)]">
                    Past performance does not guarantee future results. 
                    Copy trading involves risk of loss. Only trade with funds you can afford to lose.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Settings Modal */}
      <CopySettingsModal
        trader={selectedTrader}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedTrader(null); }}
        onConfirm={handleConfirmFollow}
      />
    </main>
  );
}
