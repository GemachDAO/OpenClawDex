// @ts-nocheck
/**
 * OpenClawDex Copy Trading Interface
 * Premium Neural Strategy Replication
 */

'use client';

import { useState } from 'react';
import { useAppData, useAppActions } from '@/lib/providers';
import { Header } from '@/components/layout/Header';
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

function getStyleTag(style: string): string {
  return `style-tag style-tag-${style}`;
}

function getRiskLevel(maxDrawdown: number): { label: string; class: string } {
  if (maxDrawdown < 10) return { label: 'Low Risk', class: 'risk-low' };
  if (maxDrawdown < 20) return { label: 'Medium Risk', class: 'risk-medium' };
  if (maxDrawdown < 35) return { label: 'High Risk', class: 'risk-high' };
  return { label: 'Very High', class: 'risk-extreme' };
}

// ============================================================================
// Components
// ============================================================================

function TraderCard({
  trader,
  onFollow,
  isFollowing,
  index
}: {
  trader: Trader;
  onFollow: (trader: Trader) => void;
  isFollowing: boolean;
  index: number;
}) {
  const risk = getRiskLevel(trader.maxDrawdown);

  return (
    <div
      className="glow-card p-6 opacity-0 animate-slide-up holo-shimmer"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center font-bold text-xl text-[var(--bg-primary)]">
            {trader.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{trader.displayName}</h3>
              {trader.isVerified && (
                <div className="verified-badge">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-sm text-[var(--text-tertiary)] font-mono">{shortenAddress(trader.walletAddress)}</p>
          </div>
        </div>
        <span className={getStyleTag(trader.tradingStyle)}>
          {trader.tradingStyle}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Total PnL</p>
          <p className={`font-bold font-mono ${trader.totalPnl >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatCurrency(trader.totalPnl)}
          </p>
          <p className={`text-xs font-mono ${trader.totalPnlPercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatPercent(trader.totalPnlPercent)}
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Win Rate</p>
          <p className="font-bold font-mono">{trader.winRate}%</p>
          <p className="text-xs text-[var(--text-tertiary)]">{formatNumber(trader.totalTrades)} trades</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Sharpe</p>
          <p className="font-bold font-mono">{trader.sharpeRatio}</p>
          <span className={`risk-indicator ${risk.class}`}>{risk.label}</span>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="flex gap-3 mb-5 p-3 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]">
        <div className="flex-1 text-center">
          <p className="text-xs text-[var(--text-tertiary)]">7D PnL</p>
          <p className={`font-semibold font-mono ${trader.last7dPnl >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatCurrency(trader.last7dPnl)}
          </p>
        </div>
        <div className="w-px bg-[var(--border-primary)]" />
        <div className="flex-1 text-center">
          <p className="text-xs text-[var(--text-tertiary)]">30D PnL</p>
          <p className={`font-semibold font-mono ${trader.last30dPnl >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatCurrency(trader.last30dPnl)}
          </p>
        </div>
        <div className="w-px bg-[var(--border-primary)]" />
        <div className="flex-1 text-center">
          <p className="text-xs text-[var(--text-tertiary)]">Max DD</p>
          <p className="font-semibold font-mono text-[var(--accent-red)]">-{trader.maxDrawdown}%</p>
        </div>
      </div>

      {/* Markets & Copiers */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {trader.preferredMarkets.slice(0, 3).map((market) => (
            <span key={market} className="px-2 py-1 rounded-md text-xs font-medium bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
              {market}
            </span>
          ))}
          {trader.preferredMarkets.length > 3 && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
              +{trader.preferredMarkets.length - 3}
            </span>
          )}
        </div>
        <div className="text-right text-sm text-[var(--text-tertiary)]">
          <span className="font-medium text-[var(--text-primary)]">{formatNumber(trader.copiers)}</span> copiers
        </div>
      </div>

      {/* Follow Button */}
      <button
        onClick={() => onFollow(trader)}
        className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
          isFollowing
            ? 'bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/30 hover:bg-[var(--accent-red)]/20'
            : 'copy-btn'
        }`}
      >
        {isFollowing ? 'Stop Copying' : 'Copy Trader'}
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Copy Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center font-bold text-lg text-[var(--bg-primary)]">
            {trader.displayName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{trader.displayName}</p>
            <p className="text-sm text-[var(--accent-green)] font-mono">{formatPercent(trader.totalPnlPercent)} all-time</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Copy Ratio */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Copy Ratio</span>
              <span className="font-semibold text-[var(--accent-cyan)]">{settings.copyRatio}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={settings.copyRatio}
              onChange={(e) => setSettings({ ...settings, copyRatio: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Copy {settings.copyRatio}% of each trade size
            </p>
          </div>

          {/* Max Position Size */}
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-2 block">Max Position Size (USD)</label>
            <input
              type="number"
              value={settings.maxPositionSize}
              onChange={(e) => setSettings({ ...settings, maxPositionSize: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>

          {/* Max Leverage */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Max Leverage</span>
              <span className="font-semibold text-[var(--accent-cyan)]">{settings.maxLeverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={settings.maxLeverage}
              onChange={(e) => setSettings({ ...settings, maxLeverage: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Trade Types */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.copyLongs}
                onChange={(e) => setSettings({ ...settings, copyLongs: e.target.checked })}
              />
              <span className="text-sm">Copy Longs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.copyShorts}
                onChange={(e) => setSettings({ ...settings, copyShorts: e.target.checked })}
              />
              <span className="text-sm">Copy Shorts</span>
            </label>
          </div>

          {/* Stop Loss */}
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-2 block">Stop copying on drawdown (%)</label>
            <input
              type="number"
              value={settings.stopOnDrawdown}
              onChange={(e) => setSettings({ ...settings, stopOnDrawdown: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(settings)}
            className="flex-1 copy-btn"
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
    <div className="flex items-center justify-between py-4 border-b border-[var(--border-primary)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-purple)]/20 border border-[var(--border-primary)] flex items-center justify-center font-bold text-[var(--accent-cyan)]">
          {trader.displayName.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{trader.displayName}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{copyRatio}% copy ratio</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold font-mono ${pnl >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">{formatCurrency(totalCopied)} copied</p>
      </div>
      <button
        onClick={onUnfollow}
        className="ml-4 px-3 py-1.5 text-sm rounded-lg border border-[var(--accent-red)]/30 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-colors"
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

  const { wallet = { connected: false }, copyTrading = { followedTraders: [] } } = data;

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
      execute({
        type: 'unfollowTrader',
        traderId: trader.id,
      });
    } else {
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

  return (
    <main className="min-h-screen">
      {/* Background Effects */}
      <div className="neural-grid" />
      <div className="neural-orbs" />

      <Header />

      {/* Hero Section */}
      <section className="page-hero border-b border-[var(--border-primary)]">
        <div className="relative max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent-cyan)]">
                  <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="11" r="2"/><path d="M19 8v6m-3-3h6"/>
                </svg>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Strategy Replication</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="gradient-text">Copy Trading</span>
              </h1>
              <p className="text-[var(--text-secondary)] max-w-lg">
                Follow top AI trading agents and automatically replicate their strategies on Hyperliquid.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search traders..."
                  className="pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent-cyan)] w-48 transition-colors"
                />
                <svg className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="pnl">Sort by PnL</option>
                <option value="winRate">Sort by Win Rate</option>
                <option value="copiers">Sort by Copiers</option>
                <option value="sharpe">Sort by Sharpe</option>
              </select>

              <select
                value={filterStyle}
                onChange={(e) => setFilterStyle(e.target.value)}
              >
                <option value="all">All Styles</option>
                <option value="scalper">Scalper</option>
                <option value="swing">Swing</option>
                <option value="position">Position</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Trader Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedTraders.map((trader, idx) => (
                <TraderCard
                  key={trader.id}
                  trader={trader}
                  onFollow={handleFollowClick}
                  isFollowing={followedIds.includes(trader.id)}
                  index={idx}
                />
              ))}
            </div>

            {sortedTraders.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-tertiary)]">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <p className="text-[var(--text-tertiary)]">No traders found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Your Copy Trading Stats */}
              <div className="glass-card-strong p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
                  <span className="w-1 h-5 rounded-full bg-[var(--accent-purple)]" />
                  Your Copy Trading
                </h2>

                {wallet.connected ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Following</p>
                        <p className="text-2xl font-bold font-mono">{copyTrading.followedTraders.length}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Total PnL</p>
                        <p className={`text-2xl font-bold font-mono ${
                          copyTrading.followedTraders.reduce((sum, t) => sum + t.totalPnl, 0) >= 0
                            ? 'text-[var(--accent-green)]'
                            : 'text-[var(--accent-red)]'
                        }`}>
                          {formatCurrency(copyTrading.followedTraders.reduce((sum, t) => sum + t.totalPnl, 0))}
                        </p>
                      </div>
                    </div>

                    {copyTrading.followedTraders.length > 0 ? (
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Active Copies</h3>
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
                      <div className="text-center py-6 text-[var(--text-tertiary)]">
                        <p className="mb-1">No active copies</p>
                        <p className="text-sm">Start following traders to copy their trades</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mx-auto mb-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-tertiary)]">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </div>
                    <p className="text-[var(--text-secondary)] mb-4">Connect wallet to start copy trading</p>
                    <button
                      onClick={() => execute({ type: 'connectWallet' })}
                      className="btn-primary w-full"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>

              {/* How It Works */}
              <div className="relative overflow-hidden rounded-xl border border-[var(--border-primary)] p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-cyan)]/5 via-transparent to-[var(--accent-purple)]/5" />
                <div className="relative">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-[var(--accent-cyan)]" />
                    How It Works
                  </h2>
                  <div className="space-y-4 text-sm">
                    {[
                      { step: 1, text: 'Browse top traders and review their performance stats' },
                      { step: 2, text: 'Set your copy ratio, max position size, and risk limits' },
                      { step: 3, text: 'Trades are automatically copied to your account' },
                      { step: 4, text: 'Monitor performance and adjust settings anytime' },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex gap-3">
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-xs font-bold text-[var(--bg-primary)] flex-shrink-0">
                          {step}
                        </span>
                        <p className="text-[var(--text-secondary)] pt-1">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              <div className="p-4 rounded-xl border border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/5">
                <div className="flex gap-3">
                  <span className="text-[var(--accent-orange)] text-xl">⚠️</span>
                  <div className="text-sm">
                    <p className="font-semibold text-[var(--accent-orange)] mb-1">Risk Warning</p>
                    <p className="text-[var(--text-secondary)]">
                      Past performance does not guarantee future results. Copy trading involves risk of loss.
                    </p>
                  </div>
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
