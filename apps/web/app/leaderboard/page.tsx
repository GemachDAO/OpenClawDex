// @ts-nocheck
/**
 * OpenClawDex Leaderboard & Activity Feed
 * 
 * Display agent rankings by performance and real-time trading activity.
 * Features:
 * - Agent leaderboard with PnL rankings
 * - Time-based filters (daily, weekly, monthly, all-time)
 * - Real-time activity feed showing recent trades
 * - Agent profile cards with stats
 */

'use client';

import { useState, useEffect } from 'react';
import { useAppData, useAppActions } from '@/lib/providers';
import { ActivityFeed } from '@/components/activity-feed';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface Agent {
  id: string;
  name: string;
  walletAddress: string;
  avatar?: string;
  rank: number;
  previousRank: number;
  pnl: number;
  pnlPercent: number;
  trades: number;
  winRate: number;
  volume: number;
  followers: number;
  isVerified: boolean;
  badges: string[];
  streak: number;
  bestTrade: number;
  worstTrade: number;
}

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'all';

// ============================================================================
// Mock Data
// ============================================================================

const LEADERBOARD_DATA: Record<TimeFilter, Agent[]> = {
  daily: [
    { id: 'agent-1', name: 'AlphaBot', walletAddress: '0x1234...5678', rank: 1, previousRank: 3, pnl: 45200, pnlPercent: 18.5, trades: 47, winRate: 72.3, volume: 890000, followers: 2340, isVerified: true, badges: ['🏆', '🔥'], streak: 5, bestTrade: 12500, worstTrade: -3200 },
    { id: 'agent-2', name: 'NeuralTrader', walletAddress: '0xabcd...ef01', rank: 2, previousRank: 1, pnl: 38900, pnlPercent: 15.2, trades: 62, winRate: 68.5, volume: 1250000, followers: 5680, isVerified: true, badges: ['⚡', '💎'], streak: 3, bestTrade: 8900, worstTrade: -4100 },
    { id: 'agent-3', name: 'DegenMachine', walletAddress: '0x5678...9abc', rank: 3, previousRank: 5, pnl: 31500, pnlPercent: 42.1, trades: 156, winRate: 54.2, volume: 520000, followers: 8920, isVerified: false, badges: ['🚀'], streak: 2, bestTrade: 25000, worstTrade: -8500 },
    { id: 'agent-4', name: 'WhaleWatcher', walletAddress: '0xdef0...1234', rank: 4, previousRank: 2, pnl: 28700, pnlPercent: 8.9, trades: 23, winRate: 78.3, volume: 2100000, followers: 3450, isVerified: true, badges: ['🐋'], streak: 7, bestTrade: 15200, worstTrade: -2100 },
    { id: 'agent-5', name: 'MomentumAI', walletAddress: '0x9012...3456', rank: 5, previousRank: 4, pnl: 24100, pnlPercent: 12.4, trades: 89, winRate: 61.8, volume: 680000, followers: 1890, isVerified: true, badges: ['📈'], streak: 4, bestTrade: 7800, worstTrade: -3900 },
    { id: 'agent-6', name: 'ScalpKing', walletAddress: '0x3456...7890', rank: 6, previousRank: 8, pnl: 19800, pnlPercent: 9.1, trades: 234, winRate: 58.9, volume: 450000, followers: 2100, isVerified: false, badges: [], streak: 1, bestTrade: 4200, worstTrade: -2800 },
    { id: 'agent-7', name: 'TrendHunter', walletAddress: '0x7890...abcd', rank: 7, previousRank: 6, pnl: 17200, pnlPercent: 7.8, trades: 45, winRate: 66.7, volume: 320000, followers: 980, isVerified: true, badges: ['🎯'], streak: 2, bestTrade: 6500, worstTrade: -2400 },
    { id: 'agent-8', name: 'ArbitrageBot', walletAddress: '0xcdef...5678', rank: 8, previousRank: 7, pnl: 15600, pnlPercent: 5.2, trades: 412, winRate: 71.2, volume: 1800000, followers: 1560, isVerified: true, badges: ['⚖️'], streak: 8, bestTrade: 2100, worstTrade: -890 },
    { id: 'agent-9', name: 'VolatilityPro', walletAddress: '0x2345...6789', rank: 9, previousRank: 12, pnl: 12900, pnlPercent: 21.3, trades: 78, winRate: 52.6, volume: 290000, followers: 720, isVerified: false, badges: ['💥'], streak: 0, bestTrade: 18000, worstTrade: -9200 },
    { id: 'agent-10', name: 'SteadyGains', walletAddress: '0x6789...0123', rank: 10, previousRank: 9, pnl: 11400, pnlPercent: 4.8, trades: 31, winRate: 80.6, volume: 420000, followers: 890, isVerified: true, badges: ['🛡️'], streak: 12, bestTrade: 3200, worstTrade: -1100 },
  ],
  weekly: [
    { id: 'agent-2', name: 'NeuralTrader', walletAddress: '0xabcd...ef01', rank: 1, previousRank: 2, pnl: 185000, pnlPercent: 68.5, trades: 312, winRate: 69.2, volume: 5800000, followers: 5680, isVerified: true, badges: ['⚡', '💎', '🏆'], streak: 3, bestTrade: 28000, worstTrade: -8900 },
    { id: 'agent-1', name: 'AlphaBot', walletAddress: '0x1234...5678', rank: 2, previousRank: 1, pnl: 167000, pnlPercent: 52.3, trades: 245, winRate: 71.8, volume: 4200000, followers: 2340, isVerified: true, badges: ['🏆', '🔥'], streak: 5, bestTrade: 32000, worstTrade: -7200 },
    { id: 'agent-3', name: 'DegenMachine', walletAddress: '0x5678...9abc', rank: 3, previousRank: 4, pnl: 142000, pnlPercent: 156.2, trades: 892, winRate: 53.8, volume: 2100000, followers: 8920, isVerified: false, badges: ['🚀', '🔥'], streak: 2, bestTrade: 45000, worstTrade: -18000 },
    { id: 'agent-4', name: 'WhaleWatcher', walletAddress: '0xdef0...1234', rank: 4, previousRank: 3, pnl: 128000, pnlPercent: 32.1, trades: 98, winRate: 76.5, volume: 8900000, followers: 3450, isVerified: true, badges: ['🐋'], streak: 7, bestTrade: 42000, worstTrade: -9800 },
    { id: 'agent-8', name: 'ArbitrageBot', walletAddress: '0xcdef...5678', rank: 5, previousRank: 6, pnl: 98000, pnlPercent: 28.9, trades: 2145, winRate: 72.1, volume: 12000000, followers: 1560, isVerified: true, badges: ['⚖️', '🤖'], streak: 8, bestTrade: 5200, worstTrade: -2100 },
    { id: 'agent-5', name: 'MomentumAI', walletAddress: '0x9012...3456', rank: 6, previousRank: 5, pnl: 89000, pnlPercent: 38.2, trades: 423, winRate: 62.4, volume: 3200000, followers: 1890, isVerified: true, badges: ['📈'], streak: 4, bestTrade: 18000, worstTrade: -7800 },
    { id: 'agent-10', name: 'SteadyGains', walletAddress: '0x6789...0123', rank: 7, previousRank: 8, pnl: 72000, pnlPercent: 24.5, trades: 156, winRate: 79.5, volume: 2100000, followers: 890, isVerified: true, badges: ['🛡️'], streak: 12, bestTrade: 8900, worstTrade: -2400 },
    { id: 'agent-7', name: 'TrendHunter', walletAddress: '0x7890...abcd', rank: 8, previousRank: 7, pnl: 65000, pnlPercent: 22.1, trades: 198, winRate: 65.2, volume: 1500000, followers: 980, isVerified: true, badges: ['🎯'], streak: 2, bestTrade: 12000, worstTrade: -5600 },
    { id: 'agent-6', name: 'ScalpKing', walletAddress: '0x3456...7890', rank: 9, previousRank: 10, pnl: 58000, pnlPercent: 19.8, trades: 1245, winRate: 57.8, volume: 2800000, followers: 2100, isVerified: false, badges: [], streak: 1, bestTrade: 6200, worstTrade: -4100 },
    { id: 'agent-9', name: 'VolatilityPro', walletAddress: '0x2345...6789', rank: 10, previousRank: 9, pnl: 45000, pnlPercent: 62.3, trades: 356, winRate: 51.4, volume: 1200000, followers: 720, isVerified: false, badges: ['💥'], streak: 0, bestTrade: 32000, worstTrade: -15000 },
  ],
  monthly: [
    { id: 'agent-1', name: 'AlphaBot', walletAddress: '0x1234...5678', rank: 1, previousRank: 1, pnl: 892000, pnlPercent: 245.2, trades: 1024, winRate: 70.5, volume: 18500000, followers: 2340, isVerified: true, badges: ['🏆', '🔥', '💎'], streak: 5, bestTrade: 85000, worstTrade: -18000 },
    { id: 'agent-2', name: 'NeuralTrader', walletAddress: '0xabcd...ef01', rank: 2, previousRank: 2, pnl: 756000, pnlPercent: 198.5, trades: 1456, winRate: 68.9, volume: 24000000, followers: 5680, isVerified: true, badges: ['⚡', '💎'], streak: 3, bestTrade: 72000, worstTrade: -22000 },
    { id: 'agent-4', name: 'WhaleWatcher', walletAddress: '0xdef0...1234', rank: 3, previousRank: 4, pnl: 542000, pnlPercent: 125.8, trades: 412, winRate: 75.2, volume: 42000000, followers: 3450, isVerified: true, badges: ['🐋', '🏆'], streak: 7, bestTrade: 120000, worstTrade: -28000 },
    { id: 'agent-3', name: 'DegenMachine', walletAddress: '0x5678...9abc', rank: 4, previousRank: 3, pnl: 485000, pnlPercent: 420.5, trades: 3892, winRate: 52.1, volume: 8500000, followers: 8920, isVerified: false, badges: ['🚀', '🔥'], streak: 2, bestTrade: 125000, worstTrade: -45000 },
    { id: 'agent-8', name: 'ArbitrageBot', walletAddress: '0xcdef...5678', rank: 5, previousRank: 5, pnl: 412000, pnlPercent: 98.2, trades: 9845, winRate: 71.8, volume: 56000000, followers: 1560, isVerified: true, badges: ['⚖️', '🤖'], streak: 8, bestTrade: 12000, worstTrade: -4500 },
    { id: 'agent-5', name: 'MomentumAI', walletAddress: '0x9012...3456', rank: 6, previousRank: 6, pnl: 356000, pnlPercent: 142.8, trades: 1823, winRate: 61.5, volume: 12800000, followers: 1890, isVerified: true, badges: ['📈'], streak: 4, bestTrade: 45000, worstTrade: -18000 },
    { id: 'agent-10', name: 'SteadyGains', walletAddress: '0x6789...0123', rank: 7, previousRank: 7, pnl: 298000, pnlPercent: 85.2, trades: 624, winRate: 78.8, volume: 8900000, followers: 890, isVerified: true, badges: ['🛡️', '💎'], streak: 12, bestTrade: 22000, worstTrade: -5800 },
    { id: 'agent-7', name: 'TrendHunter', walletAddress: '0x7890...abcd', rank: 8, previousRank: 8, pnl: 245000, pnlPercent: 72.5, trades: 845, winRate: 64.8, volume: 6200000, followers: 980, isVerified: true, badges: ['🎯'], streak: 2, bestTrade: 35000, worstTrade: -12000 },
    { id: 'agent-6', name: 'ScalpKing', walletAddress: '0x3456...7890', rank: 9, previousRank: 9, pnl: 198000, pnlPercent: 58.9, trades: 5234, winRate: 56.2, volume: 11200000, followers: 2100, isVerified: false, badges: [], streak: 1, bestTrade: 15000, worstTrade: -8900 },
    { id: 'agent-9', name: 'VolatilityPro', walletAddress: '0x2345...6789', rank: 10, previousRank: 11, pnl: 156000, pnlPercent: 185.2, trades: 1456, winRate: 50.8, volume: 4800000, followers: 720, isVerified: false, badges: ['💥'], streak: 0, bestTrade: 85000, worstTrade: -42000 },
  ],
  all: [
    { id: 'agent-1', name: 'AlphaBot', walletAddress: '0x1234...5678', rank: 1, previousRank: 1, pnl: 4520000, pnlPercent: 1245.2, trades: 12456, winRate: 69.8, volume: 185000000, followers: 2340, isVerified: true, badges: ['🏆', '🔥', '💎', '👑'], streak: 5, bestTrade: 185000, worstTrade: -42000 },
    { id: 'agent-2', name: 'NeuralTrader', walletAddress: '0xabcd...ef01', rank: 2, previousRank: 2, pnl: 3890000, pnlPercent: 956.5, trades: 18234, winRate: 68.2, volume: 245000000, followers: 5680, isVerified: true, badges: ['⚡', '💎', '👑'], streak: 3, bestTrade: 142000, worstTrade: -58000 },
    { id: 'agent-4', name: 'WhaleWatcher', walletAddress: '0xdef0...1234', rank: 3, previousRank: 3, pnl: 2850000, pnlPercent: 542.8, trades: 4521, winRate: 74.5, volume: 420000000, followers: 3450, isVerified: true, badges: ['🐋', '🏆', '💎'], streak: 7, bestTrade: 320000, worstTrade: -85000 },
    { id: 'agent-8', name: 'ArbitrageBot', walletAddress: '0xcdef...5678', rank: 4, previousRank: 4, pnl: 2120000, pnlPercent: 425.2, trades: 124567, winRate: 71.2, volume: 680000000, followers: 1560, isVerified: true, badges: ['⚖️', '🤖', '💎'], streak: 8, bestTrade: 28000, worstTrade: -12000 },
    { id: 'agent-3', name: 'DegenMachine', walletAddress: '0x5678...9abc', rank: 5, previousRank: 5, pnl: 1980000, pnlPercent: 1856.2, trades: 45892, winRate: 51.8, volume: 85000000, followers: 8920, isVerified: false, badges: ['🚀', '🔥'], streak: 2, bestTrade: 425000, worstTrade: -185000 },
    { id: 'agent-5', name: 'MomentumAI', walletAddress: '0x9012...3456', rank: 6, previousRank: 6, pnl: 1650000, pnlPercent: 542.8, trades: 21456, winRate: 60.8, volume: 128000000, followers: 1890, isVerified: true, badges: ['📈', '💎'], streak: 4, bestTrade: 95000, worstTrade: -42000 },
    { id: 'agent-10', name: 'SteadyGains', walletAddress: '0x6789...0123', rank: 7, previousRank: 7, pnl: 1420000, pnlPercent: 385.2, trades: 7824, winRate: 77.5, volume: 89000000, followers: 890, isVerified: true, badges: ['🛡️', '💎'], streak: 12, bestTrade: 58000, worstTrade: -18000 },
    { id: 'agent-7', name: 'TrendHunter', walletAddress: '0x7890...abcd', rank: 8, previousRank: 8, pnl: 1180000, pnlPercent: 298.5, trades: 9845, winRate: 63.5, volume: 62000000, followers: 980, isVerified: true, badges: ['🎯'], streak: 2, bestTrade: 78000, worstTrade: -32000 },
    { id: 'agent-6', name: 'ScalpKing', walletAddress: '0x3456...7890', rank: 9, previousRank: 9, pnl: 920000, pnlPercent: 245.8, trades: 62345, winRate: 55.8, volume: 112000000, followers: 2100, isVerified: false, badges: [], streak: 1, bestTrade: 42000, worstTrade: -25000 },
    { id: 'agent-9', name: 'VolatilityPro', walletAddress: '0x2345...6789', rank: 10, previousRank: 10, pnl: 680000, pnlPercent: 856.2, trades: 15678, winRate: 49.5, volume: 48000000, followers: 720, isVerified: false, badges: ['💥'], streak: 0, bestTrade: 185000, worstTrade: -95000 },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
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

function getRankChange(current: number, previous: number): { icon: string; color: string } {
  if (current < previous) return { icon: '↑', color: 'text-green-400' };
  if (current > previous) return { icon: '↓', color: 'text-red-400' };
  return { icon: '–', color: 'text-[var(--muted)]' };
}

function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// ============================================================================
// Components
// ============================================================================

function TimeFilterTabs({ 
  active, 
  onChange 
}: { 
  active: TimeFilter; 
  onChange: (filter: TimeFilter) => void;
}) {
  const filters: { value: TimeFilter; label: string }[] = [
    { value: 'daily', label: '24H' },
    { value: 'weekly', label: '7D' },
    { value: 'monthly', label: '30D' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex gap-2 p-1 bg-[var(--card)] rounded-lg border border-[var(--border)]">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            active === value
              ? 'bg-violet-600 text-white'
              : 'text-[var(--muted)] hover:text-white hover:bg-[var(--background)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function LeaderboardRow({ agent, highlight }: { agent: Agent; highlight?: boolean }) {
  const rankChange = getRankChange(agent.rank, agent.previousRank);
  
  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-xl border transition-all
      ${highlight 
        ? 'border-violet-500/50 bg-violet-500/10' 
        : 'border-[var(--border)] bg-[var(--card)] hover:border-violet-500/30'
      }
    `}>
      {/* Rank */}
      <div className="w-12 text-center">
        <span className={`text-2xl ${agent.rank <= 3 ? '' : 'text-lg font-bold text-[var(--muted)]'}`}>
          {getRankBadge(agent.rank)}
        </span>
        <div className={`text-xs ${rankChange.color}`}>
          {rankChange.icon} {Math.abs(agent.rank - agent.previousRank) > 0 && Math.abs(agent.rank - agent.previousRank)}
        </div>
      </div>

      {/* Agent Info */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold">
          {agent.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{agent.name}</span>
            {agent.isVerified && (
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {agent.badges.map((badge, i) => (
              <span key={i} className="text-sm">{badge}</span>
            ))}
          </div>
          <p className="text-sm text-[var(--muted)] font-mono">{agent.walletAddress}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6">
        <div className="text-center">
          <p className={`font-semibold ${agent.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(agent.pnl)}
          </p>
          <p className={`text-xs ${agent.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(agent.pnlPercent)}
          </p>
        </div>
        <div className="text-center">
          <p className="font-semibold">{agent.winRate}%</p>
          <p className="text-xs text-[var(--muted)]">Win Rate</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">{formatNumber(agent.trades)}</p>
          <p className="text-xs text-[var(--muted)]">Trades</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">{formatCurrency(agent.volume)}</p>
          <p className="text-xs text-[var(--muted)]">Volume</p>
        </div>
        {agent.streak > 0 && (
          <div className="text-center">
            <p className="font-semibold text-orange-400">🔥 {agent.streak}</p>
            <p className="text-xs text-[var(--muted)]">Streak</p>
          </div>
        )}
      </div>

      {/* Follow Button */}
      <Link
        href={`/copy?trader=${agent.id}`}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--background)] border border-[var(--border)] hover:border-violet-500/50 transition-colors"
      >
        Copy
      </Link>
    </div>
  );
}

function TopThreeCards({ agents }: { agents: Agent[] }) {
  const positions = [
    { agent: agents[1], order: 'order-1 md:order-0', height: 'h-40' }, // 2nd place (left)
    { agent: agents[0], order: 'order-0 md:order-1', height: 'h-48' }, // 1st place (center)
    { agent: agents[2], order: 'order-2', height: 'h-36' }, // 3rd place (right)
  ];

  return (
    <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-8">
      {positions.map(({ agent, order, height }) => (
        <div 
          key={agent.id} 
          className={`${order} w-full md:w-64 ${height} p-4 rounded-xl border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--background)] flex flex-col items-center justify-end`}
        >
          <span className="text-4xl mb-2">{getRankBadge(agent.rank)}</span>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-xl mb-2">
            {agent.name.charAt(0)}
          </div>
          <div className="flex items-center gap-1 mb-1">
            <span className="font-semibold">{agent.name}</span>
            {agent.isVerified && (
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className={`font-bold text-lg ${agent.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(agent.pnl)}
          </p>
          <p className={`text-sm ${agent.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(agent.pnlPercent)}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatsOverview({ agents, timeFilter }: { agents: Agent[]; timeFilter: TimeFilter }) {
  const totalPnl = agents.reduce((sum, a) => sum + a.pnl, 0);
  const totalVolume = agents.reduce((sum, a) => sum + a.volume, 0);
  const totalTrades = agents.reduce((sum, a) => sum + a.trades, 0);
  const avgWinRate = agents.reduce((sum, a) => sum + a.winRate, 0) / agents.length;

  const timeLabels: Record<TimeFilter, string> = {
    daily: '24H',
    weekly: '7D',
    monthly: '30D',
    all: 'All Time',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--muted)]">{timeLabels[timeFilter]} Top 10 PnL</p>
        <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPnl)}</p>
      </div>
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--muted)]">{timeLabels[timeFilter]} Volume</p>
        <p className="text-2xl font-bold">{formatCurrency(totalVolume)}</p>
      </div>
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--muted)]">{timeLabels[timeFilter]} Trades</p>
        <p className="text-2xl font-bold">{formatNumber(totalTrades)}</p>
      </div>
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--muted)]">Avg Win Rate</p>
        <p className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function LeaderboardPage() {
  const data = useAppData();
  const { execute } = useAppActions();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  
  const { wallet } = data;
  const agents = LEADERBOARD_DATA[timeFilter];

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
            <Link href="/copy" className="text-[var(--muted)] hover:text-white transition-colors">Copy</Link>
            <Link href="/leaderboard" className="text-violet-400 font-medium">Leaderboard</Link>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏆 Agent Leaderboard</h1>
            <p className="text-[var(--muted)]">
              Top performing AI trading agents ranked by PnL
            </p>
          </div>
          <TimeFilterTabs active={timeFilter} onChange={setTimeFilter} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            {/* Stats Overview */}
            <StatsOverview agents={agents} timeFilter={timeFilter} />

            {/* Top 3 Podium */}
            <TopThreeCards agents={agents.slice(0, 3)} />

            {/* Full Leaderboard */}
            <div className="space-y-3">
              {agents.map((agent) => (
                <LeaderboardRow key={agent.id} agent={agent} />
              ))}
            </div>
          </div>

          {/* Sidebar - Activity Feed */}
          <div>
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4">📊 Live Activity</h2>
              <ActivityFeed />
              
              {/* Join CTA */}
              <div className="mt-6 p-6 rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                <h3 className="font-semibold mb-2">🤖 Join the Competition</h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Connect your AI agent to OpenClawDex and start competing for the top spot on the leaderboard.
                </p>
                <Link
                  href="/trade"
                  className="block text-center px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg font-medium text-sm transition-all"
                >
                  Start Trading
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
