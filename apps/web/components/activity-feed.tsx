// @ts-nocheck
/**
 * OpenClawDex Activity Feed Component
 * 
 * Real-time trading activity feed showing recent trades across the platform.
 * Features:
 * - Live updates simulation
 * - Trade type indicators (swap, leverage, copy)
 * - PnL display with colors
 * - Timestamps
 */

'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

interface Activity {
  id: string;
  type: 'swap' | 'leverage_open' | 'leverage_close' | 'copy_start' | 'copy_stop' | 'meme_buy' | 'meme_sell';
  agentName: string;
  agentAddress: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: number;
  amountOut?: number;
  pnl?: number;
  leverage?: number;
  position?: 'long' | 'short';
  copiedTrader?: string;
  timestamp: Date;
}

// ============================================================================
// Mock Data
// ============================================================================

const ACTIVITY_TEMPLATES: Omit<Activity, 'id' | 'timestamp'>[] = [
  { type: 'swap', agentName: 'AlphaBot', agentAddress: '0x1234...5678', tokenIn: 'ETH', tokenOut: 'USDC', amountIn: 2.5, amountOut: 6250 },
  { type: 'swap', agentName: 'NeuralTrader', agentAddress: '0xabcd...ef01', tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 50, amountOut: 8500 },
  { type: 'leverage_open', agentName: 'DegenMachine', agentAddress: '0x5678...9abc', tokenIn: 'ETH', leverage: 10, position: 'long', amountIn: 5000 },
  { type: 'leverage_close', agentName: 'WhaleWatcher', agentAddress: '0xdef0...1234', tokenIn: 'BTC', pnl: 12500, position: 'long' },
  { type: 'leverage_close', agentName: 'MomentumAI', agentAddress: '0x9012...3456', tokenIn: 'SOL', pnl: -3200, position: 'short' },
  { type: 'copy_start', agentName: 'NewAgent_42', agentAddress: '0x3456...7890', copiedTrader: 'AlphaBot' },
  { type: 'meme_buy', agentName: 'DegenMachine', agentAddress: '0x5678...9abc', tokenIn: 'SOL', tokenOut: 'BONK', amountIn: 10, amountOut: 25000000 },
  { type: 'meme_sell', agentName: 'ScalpKing', agentAddress: '0x3456...7890', tokenIn: 'PEPE', tokenOut: 'ETH', amountIn: 100000000, amountOut: 0.5, pnl: 850 },
  { type: 'swap', agentName: 'TrendHunter', agentAddress: '0x7890...abcd', tokenIn: 'USDC', tokenOut: 'ETH', amountIn: 10000, amountOut: 4.1 },
  { type: 'leverage_open', agentName: 'VolatilityPro', agentAddress: '0x2345...6789', tokenIn: 'BTC', leverage: 20, position: 'short', amountIn: 15000 },
  { type: 'copy_stop', agentName: 'Agent_789', agentAddress: '0x8901...2345', copiedTrader: 'DegenMachine', pnl: 5200 },
  { type: 'meme_buy', agentName: 'NeuralTrader', agentAddress: '0xabcd...ef01', tokenIn: 'ETH', tokenOut: 'SHIB', amountIn: 0.5, amountOut: 50000000 },
  { type: 'leverage_close', agentName: 'ArbitrageBot', agentAddress: '0xcdef...5678', tokenIn: 'ETH', pnl: 2100, position: 'long' },
  { type: 'swap', agentName: 'SteadyGains', agentAddress: '0x6789...0123', tokenIn: 'BNB', tokenOut: 'USDT', amountIn: 15, amountOut: 9000 },
  { type: 'meme_sell', agentName: 'DegenMachine', agentAddress: '0x5678...9abc', tokenIn: 'BONK', tokenOut: 'SOL', amountIn: 50000000, amountOut: 25, pnl: 3500 },
];

// ============================================================================
// Helper Functions
// ============================================================================

function generateActivity(): Activity {
  const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
  return {
    ...template,
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };
}

function generateInitialActivities(): Activity[] {
  const activities: Activity[] = [];
  for (let i = 0; i < 10; i++) {
    const template = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length];
    activities.push({
      ...template,
      id: `activity-init-${i}`,
      timestamp: new Date(Date.now() - (i * 30000)), // 30 seconds apart
    });
  }
  return activities;
}

function formatAmount(amount: number, token: string): string {
  if (token === 'USDC' || token === 'USDT') return `$${amount.toLocaleString()}`;
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M ${token}`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K ${token}`;
  return `${amount.toFixed(amount < 1 ? 4 : 2)} ${token}`;
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  if (Math.abs(pnl) >= 1e6) return `${sign}$${(pnl / 1e6).toFixed(2)}M`;
  if (Math.abs(pnl) >= 1e3) return `${sign}$${(pnl / 1e3).toFixed(1)}K`;
  return `${sign}$${pnl.toFixed(0)}`;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getActivityIcon(type: Activity['type']): string {
  switch (type) {
    case 'swap': return '🔄';
    case 'leverage_open': return '📈';
    case 'leverage_close': return '📊';
    case 'copy_start': return '👥';
    case 'copy_stop': return '🚪';
    case 'meme_buy': return '🚀';
    case 'meme_sell': return '💰';
    default: return '📝';
  }
}

function getActivityColor(type: Activity['type']): string {
  switch (type) {
    case 'swap': return 'text-blue-400';
    case 'leverage_open': return 'text-violet-400';
    case 'leverage_close': return 'text-amber-400';
    case 'copy_start': return 'text-green-400';
    case 'copy_stop': return 'text-gray-400';
    case 'meme_buy': return 'text-pink-400';
    case 'meme_sell': return 'text-orange-400';
    default: return 'text-[var(--muted)]';
  }
}

function formatActivityMessage(activity: Activity): JSX.Element {
  const color = getActivityColor(activity.type);
  
  switch (activity.type) {
    case 'swap':
      return (
        <span>
          <span className={color}>Swapped</span>{' '}
          <span className="font-medium">{formatAmount(activity.amountIn!, activity.tokenIn!)}</span>
          {' → '}
          <span className="font-medium">{formatAmount(activity.amountOut!, activity.tokenOut!)}</span>
        </span>
      );
    
    case 'leverage_open':
      return (
        <span>
          <span className={color}>Opened</span>{' '}
          <span className={activity.position === 'long' ? 'text-green-400' : 'text-red-400'}>
            {activity.leverage}x {activity.position?.toUpperCase()}
          </span>
          {' on '}
          <span className="font-medium">{activity.tokenIn}</span>
          {' ($'}{activity.amountIn?.toLocaleString()}{')'}
        </span>
      );
    
    case 'leverage_close':
      return (
        <span>
          <span className={color}>Closed</span>{' '}
          <span className={activity.position === 'long' ? 'text-green-400' : 'text-red-400'}>
            {activity.position?.toUpperCase()}
          </span>
          {' '}
          <span className="font-medium">{activity.tokenIn}</span>
          {' '}
          <span className={activity.pnl! >= 0 ? 'text-green-400' : 'text-red-400'}>
            {formatPnl(activity.pnl!)}
          </span>
        </span>
      );
    
    case 'copy_start':
      return (
        <span>
          <span className={color}>Started copying</span>{' '}
          <span className="font-medium text-violet-400">{activity.copiedTrader}</span>
        </span>
      );
    
    case 'copy_stop':
      return (
        <span>
          <span className={color}>Stopped copying</span>{' '}
          <span className="font-medium">{activity.copiedTrader}</span>
          {activity.pnl !== undefined && (
            <>
              {' • '}
              <span className={activity.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatPnl(activity.pnl)}
              </span>
            </>
          )}
        </span>
      );
    
    case 'meme_buy':
      return (
        <span>
          <span className={color}>Aped into</span>{' '}
          <span className="font-medium text-pink-400">{activity.tokenOut}</span>
          {' with '}
          <span className="font-medium">{formatAmount(activity.amountIn!, activity.tokenIn!)}</span>
        </span>
      );
    
    case 'meme_sell':
      return (
        <span>
          <span className={color}>Sold</span>{' '}
          <span className="font-medium text-pink-400">{activity.tokenIn}</span>
          {activity.pnl !== undefined && (
            <>
              {' • '}
              <span className={activity.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatPnl(activity.pnl)}
              </span>
            </>
          )}
        </span>
      );
    
    default:
      return <span>Unknown activity</span>;
  }
}

// ============================================================================
// Components
// ============================================================================

function ActivityItem({ activity, isNew }: { activity: Activity; isNew?: boolean }) {
  return (
    <div className={`
      p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]
      transition-all duration-300
      ${isNew ? 'animate-pulse border-violet-500/50' : ''}
    `}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-lg">{getActivityIcon(activity.type)}</span>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{activity.agentName}</span>
            <span className="text-xs text-[var(--muted)] font-mono">{activity.agentAddress}</span>
          </div>
          <p className="text-sm text-[var(--foreground)]/80">
            {formatActivityMessage(activity)}
          </p>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-[var(--muted)] whitespace-nowrap">
          {formatTimeAgo(activity.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface ActivityFeedProps {
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ActivityFeed({ 
  maxItems = 15, 
  autoRefresh = true, 
  refreshInterval = 5000 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());

  // Initialize activities
  useEffect(() => {
    setActivities(generateInitialActivities());
  }, []);

  // Auto refresh with new activities
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const newActivity = generateActivity();
      
      setActivities(prev => {
        const updated = [newActivity, ...prev.slice(0, maxItems - 1)];
        return updated;
      });

      // Mark as new for animation
      setNewActivityIds(prev => new Set([...prev, newActivity.id]));
      
      // Remove new flag after animation
      setTimeout(() => {
        setNewActivityIds(prev => {
          const next = new Set(prev);
          next.delete(newActivity.id);
          return next;
        });
      }, 2000);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, maxItems]);

  return (
    <div className="space-y-2">
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs text-[var(--muted)]">Live feed</span>
      </div>

      {/* Activity List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
        {activities.map((activity) => (
          <ActivityItem 
            key={activity.id} 
            activity={activity} 
            isNew={newActivityIds.has(activity.id)}
          />
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8 text-[var(--muted)]">
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}

// Export types for reuse
export type { Activity, ActivityFeedProps };
