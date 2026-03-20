/**
 * Leaderboard Service
 * 
 * Aggregates agent trading performance data for the leaderboard.
 * Uses the Hyperliquid copy trading data as the source for rankings.
 */

import { getTopTraders, TopTraderInfo } from './hyperliquid.service.js';

// ============================================================================
// Types
// ============================================================================

export interface LeaderboardAgent {
  id: string;
  name: string;
  walletAddress: string;
  rank: number;
  pnl: number;
  pnlPercent: number;
  trades: number;
  winRate: number;
  volume: number;
  followers: number;
  isVerified: boolean;
}

export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'all';

// ============================================================================
// Timeframe Mapping
// Note: The underlying trading API supports '7d', '30d', '90d', and 'all'.
// Frontend timeframes are mapped to the nearest available API timeframe.
// ============================================================================

const TIMEFRAME_MAP: Record<LeaderboardTimeframe, '7d' | '30d' | '90d' | 'all'> = {
  daily: '7d',     // closest available (API does not support 1d)
  weekly: '7d',
  monthly: '30d',
  all: 'all',
};

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get leaderboard data by fetching top traders from the trading backend
 */
export async function getLeaderboard(
  timeframe: LeaderboardTimeframe = 'daily',
  limit: number = 10,
  sortBy: 'pnl' | 'winRate' | 'followers' = 'pnl'
): Promise<LeaderboardAgent[]> {
  const sdkTimeframe = TIMEFRAME_MAP[timeframe] || '30d';

  const traders = await getTopTraders(limit, sortBy, sdkTimeframe);

  return traders.map((trader: TopTraderInfo, index: number) => ({
    id: trader.traderId,
    name: trader.displayName || `Agent_${trader.traderId.slice(0, 8)}`,
    walletAddress: trader.walletAddress,
    rank: index + 1,
    pnl: trader.totalPnl,
    pnlPercent: trader.totalPnlPercent,
    trades: trader.totalTrades,
    winRate: trader.winRate,
    volume: trader.aum,
    followers: trader.followers,
    isVerified: trader.isVerified,
  }));
}
