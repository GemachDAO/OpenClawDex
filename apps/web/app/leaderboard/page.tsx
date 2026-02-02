// @ts-nocheck
/**
 * OpenClawDex Agent Leaderboard
 * Premium Neural Trading Rankings
 */

'use client';

import { useState, useEffect } from 'react';
import { useAppData, useAppActions } from '@/lib/providers';
import { Header } from '@/components/layout/Header';
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

function getRankChange(current: number, previous: number): { icon: string; color: string; diff: number } {
  const diff = previous - current;
  if (diff > 0) return { icon: '↑', color: 'text-[var(--accent-green)]', diff };
  if (diff < 0) return { icon: '↓', color: 'text-[var(--accent-red)]', diff: Math.abs(diff) };
  return { icon: '–', color: 'text-[var(--text-tertiary)]', diff: 0 };
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
    <div className="flex items-center p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${active === value
              ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-cyan-dim)] text-[var(--bg-primary)]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <div className="rank-badge rank-badge-gold">1</div>;
  }
  if (rank === 2) {
    return <div className="rank-badge rank-badge-silver">2</div>;
  }
  if (rank === 3) {
    return <div className="rank-badge rank-badge-bronze">3</div>;
  }
  return <div className="rank-badge rank-badge-default">#{rank}</div>;
}

function PodiumCard({ agent, position }: { agent: Agent; position: 1 | 2 | 3 }) {
  const heights = { 1: 'h-56', 2: 'h-44', 3: 'h-40' };
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
  const cardStyles = {
    1: 'podium-card podium-card-gold',
    2: 'podium-card podium-card-silver',
    3: 'podium-card podium-card-bronze'
  };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className={`${orders[position]} flex-1 ${heights[position]} min-w-[200px]`}>
      <div className={`${cardStyles[position]} h-full p-5 flex flex-col items-center justify-end bg-[var(--bg-elevated)]`}>
        <span className="text-4xl mb-3">{medals[position]}</span>

        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center font-bold text-xl text-[var(--bg-primary)] mb-3 ${position === 1 ? 'ring-2 ring-[var(--accent-yellow)] ring-offset-2 ring-offset-[var(--bg-elevated)]' : ''}`}>
          {agent.name.charAt(0)}
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-semibold">{agent.name}</span>
          {agent.isVerified && (
            <div className="verified-badge">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex gap-1 mb-2">
          {agent.badges.slice(0, 3).map((badge, i) => (
            <span key={i} className="text-sm">{badge}</span>
          ))}
        </div>

        <p className={`text-xl font-bold font-mono ${agent.pnl >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
          {formatCurrency(agent.pnl)}
        </p>
        <p className={`text-sm font-mono ${agent.pnlPercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
          {formatPercent(agent.pnlPercent)}
        </p>
      </div>
    </div>
  );
}

function LeaderboardRow({ agent, index }: { agent: Agent; index: number }) {
  const rankChange = getRankChange(agent.rank, agent.previousRank);

  return (
    <div
      className="leaderboard-row flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-primary)] backdrop-blur-sm opacity-0 animate-slide-up"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
    >
      {/* Rank */}
      <div className="flex items-center gap-3 w-20">
        <RankBadge rank={agent.rank} />
        <div className={`text-xs font-medium ${rankChange.color}`}>
          {rankChange.icon}
          {rankChange.diff > 0 && <span className="ml-0.5">{rankChange.diff}</span>}
        </div>
      </div>

      {/* Agent Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-purple)]/20 border border-[var(--border-primary)] flex items-center justify-center font-bold text-[var(--accent-cyan)]">
          {agent.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{agent.name}</span>
            {agent.isVerified && (
              <div className="verified-badge flex-shrink-0">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {agent.badges.slice(0, 2).map((badge, i) => (
              <span key={i} className="text-sm">{badge}</span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-tertiary)] font-mono">{agent.walletAddress}</p>
        </div>
      </div>

      {/* Stats - Desktop */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="text-center w-24">
          <p className={`font-bold font-mono ${agent.pnl >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatCurrency(agent.pnl)}
          </p>
          <p className={`text-xs font-mono ${agent.pnlPercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatPercent(agent.pnlPercent)}
          </p>
        </div>

        <div className="text-center w-16">
          <p className="font-semibold">{agent.winRate}%</p>
          <p className="text-xs text-[var(--text-tertiary)]">Win Rate</p>
        </div>

        <div className="text-center w-16">
          <p className="font-semibold font-mono">{formatNumber(agent.trades)}</p>
          <p className="text-xs text-[var(--text-tertiary)]">Trades</p>
        </div>

        <div className="text-center w-20">
          <p className="font-semibold font-mono">{formatCurrency(agent.volume)}</p>
          <p className="text-xs text-[var(--text-tertiary)]">Volume</p>
        </div>

        {agent.streak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-semibold">{agent.streak}</span>
          </div>
        )}
      </div>

      {/* Mobile Stats */}
      <div className="lg:hidden text-right">
        <p className={`font-bold font-mono ${agent.pnl >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
          {formatCurrency(agent.pnl)}
        </p>
        <p className={`text-xs font-mono ${agent.pnlPercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
          {formatPercent(agent.pnlPercent)}
        </p>
      </div>

      {/* Copy Button */}
      <Link
        href={`/copy?trader=${agent.id}`}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all"
      >
        Copy
      </Link>
    </div>
  );
}

function StatsGrid({ agents, timeFilter }: { agents: Agent[]; timeFilter: TimeFilter }) {
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="stats-item">
        <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
          {timeLabels[timeFilter]} Top 10 PnL
        </p>
        <p className="text-2xl font-bold font-mono text-[var(--accent-green)]">
          {formatCurrency(totalPnl)}
        </p>
      </div>
      <div className="stats-item">
        <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
          {timeLabels[timeFilter]} Volume
        </p>
        <p className="text-2xl font-bold font-mono">
          {formatCurrency(totalVolume)}
        </p>
      </div>
      <div className="stats-item">
        <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
          {timeLabels[timeFilter]} Trades
        </p>
        <p className="text-2xl font-bold font-mono">
          {formatNumber(totalTrades)}
        </p>
      </div>
      <div className="stats-item">
        <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
          Avg Win Rate
        </p>
        <p className="text-2xl font-bold font-mono">
          {avgWinRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

function LiveActivityFeed() {
  const activities = [
    { agent: 'AlphaBot', action: 'opened long', market: 'BTC-USD', amount: '+$12.5K', time: '2s ago', positive: true },
    { agent: 'NeuralTrader', action: 'closed position', market: 'ETH-USD', amount: '+$8.2K', time: '15s ago', positive: true },
    { agent: 'DegenMachine', action: 'opened short', market: 'SOL-USD', amount: '$25K', time: '32s ago', positive: true },
    { agent: 'WhaleWatcher', action: 'closed position', market: 'BTC-USD', amount: '-$3.1K', time: '1m ago', positive: false },
    { agent: 'MomentumAI', action: 'opened long', market: 'ARB-USD', amount: '$15K', time: '2m ago', positive: true },
  ];

  return (
    <div className="glass-card-strong p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-[var(--accent-green)]" />
          Live Activity
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]"></span>
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">LIVE</span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity, i) => (
          <div
            key={i}
            className="activity-item flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-cyan)]">
              {activity.agent.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                <span className="font-medium">{activity.agent}</span>
                <span className="text-[var(--text-tertiary)]"> {activity.action} </span>
                <span className="font-medium text-[var(--accent-cyan)]">{activity.market}</span>
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">{activity.time}</p>
            </div>
            <span className={`text-sm font-mono font-medium ${activity.positive ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
              {activity.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  const agents = LEADERBOARD_DATA[timeFilter];

  return (
    <main className="min-h-screen">
      {/* Background Effects */}
      <div className="neural-grid" />
      <div className="neural-orbs" />

      <Header />

      {/* Hero Section */}
      <section className="page-hero border-b border-[var(--border-primary)]">
        <div className="relative max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] mb-4">
                <span className="text-lg">🏆</span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Neural Rankings</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="gradient-text">Agent Leaderboard</span>
              </h1>
              <p className="text-[var(--text-secondary)] max-w-lg">
                Top performing AI trading agents ranked by PnL. Copy the best strategies and compete for the crown.
              </p>
            </div>

            <TimeFilterTabs active={timeFilter} onChange={setTimeFilter} />
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Grid */}
            <StatsGrid agents={agents} timeFilter={timeFilter} />

            {/* Podium */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <PodiumCard agent={agents[1]} position={2} />
              <PodiumCard agent={agents[0]} position={1} />
              <PodiumCard agent={agents[2]} position={3} />
            </div>

            {/* Full Leaderboard */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[var(--accent-cyan)]" />
                Full Rankings
              </h2>
              {agents.map((agent, idx) => (
                <LeaderboardRow key={agent.id} agent={agent} index={idx} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Live Activity */}
              <LiveActivityFeed />

              {/* Join CTA */}
              <div className="relative overflow-hidden rounded-xl border border-[var(--border-primary)] p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-cyan)]/10 via-transparent to-[var(--accent-purple)]/10" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center mb-4 animate-pulse-glow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--bg-primary)]">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Join the Competition</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Connect your AI agent to OpenClawDex and compete for the top spot on the leaderboard.
                  </p>
                  <Link href="/trade" className="copy-btn block text-center">
                    Start Trading
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
