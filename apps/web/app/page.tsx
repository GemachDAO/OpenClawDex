/**
 * OpenClawDex Dashboard
 * 
 * Main landing page showing portfolio overview, trading activity, and leaderboard.
 * Uses @json-render/react with DataProvider for reactive data binding.
 */

'use client';

import { useAppData, useAppActions } from '@/lib/providers';
import type { TradeHistory, Position, FollowedTrader } from '@/lib/providers';
import Link from 'next/link';

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ============================================================================
// Components
// ============================================================================

function MetricCard({ 
  title, 
  value, 
  change, 
  icon 
}: { 
  title: string; 
  value: string; 
  change?: number; 
  icon?: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-violet-500/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)] mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(change)}
            </p>
          )}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}

function PositionRow({ position }: { position: Position }) {
  const pnlColor = position.pnl >= 0 ? 'text-green-400' : 'text-red-400';
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
          {position.symbol.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{position.symbol}</p>
          <p className="text-sm text-[var(--muted)]">{position.amount.toFixed(4)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{formatCurrency(position.value)}</p>
        <p className={`text-sm ${pnlColor}`}>
          {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)} ({formatPercent(position.pnlPercent)})
        </p>
      </div>
    </div>
  );
}

function ActivityRow({ trade }: { trade: TradeHistory }) {
  const getTradeIcon = (type: string) => {
    switch (type) {
      case 'swap': return '🔄';
      case 'buy': return '📈';
      case 'sell': return '📉';
      case 'deposit': return '💰';
      case 'withdraw': return '💸';
      case 'copy': return '👥';
      case 'liquidation': return '⚠️';
      case 'funding': return '💵';
      default: return '📊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <span className="text-xl">{getTradeIcon(trade.type)}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium capitalize">{trade.type}</p>
          <span className={`text-xs ${getStatusColor(trade.status)}`}>
            {trade.status === 'success' ? '✓' : trade.status === 'failed' ? '✗' : '•'}
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {trade.fromToken && trade.toToken 
            ? `${trade.fromToken.amount} ${trade.fromToken.symbol} → ${trade.toToken.amount} ${trade.toToken.symbol}`
            : trade.fromToken 
              ? `${trade.fromToken.amount} ${trade.fromToken.symbol}`
              : trade.toToken
                ? `${trade.toToken.amount} ${trade.toToken.symbol}`
                : 'Transaction'
          }
        </p>
      </div>
      <div className="text-right text-sm">
        <p className="text-[var(--muted)]">{formatTimeAgo(trade.timestamp)}</p>
        {trade.pnl !== undefined && (
          <p className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
            {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
          </p>
        )}
      </div>
    </div>
  );
}

function TraderRow({ trader }: { trader: FollowedTrader }) {
  const pnlColor = trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400';
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <span className="text-white font-bold">
            {trader.displayName?.charAt(0) || trader.traderId.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium">{trader.displayName || shortenAddress(trader.walletAddress)}</p>
          <p className="text-sm text-[var(--muted)]">{trader.copyRatio}% copy ratio</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${pnlColor}`}>
          {trader.totalPnl >= 0 ? '+' : ''}{formatCurrency(trader.totalPnl)}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {formatCurrency(trader.totalCopied)} copied
        </p>
      </div>
    </div>
  );
}

function ConnectWalletCTA({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="inline-block p-4 rounded-full bg-violet-500/20 mb-4">
        <svg className="w-12 h-12 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-[var(--muted)] mb-4">Connect to view your portfolio and start trading</p>
      <button 
        onClick={onConnect}
        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg font-medium transition-all"
      >
        Connect Wallet
      </button>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/trade" className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-violet-500/50 transition-colors group">
        <span className="text-2xl mb-2 block">💱</span>
        <p className="font-medium group-hover:text-violet-400 transition-colors">Swap</p>
        <p className="text-sm text-[var(--muted)]">Trade tokens</p>
      </Link>
      <Link href="/trade?tab=meme" className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-fuchsia-500/50 transition-colors group">
        <span className="text-2xl mb-2 block">🚀</span>
        <p className="font-medium group-hover:text-fuchsia-400 transition-colors">Meme Coins</p>
        <p className="text-sm text-[var(--muted)]">High volatility</p>
      </Link>
      <Link href="/trade?tab=leverage" className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-orange-500/50 transition-colors group">
        <span className="text-2xl mb-2 block">⚡</span>
        <p className="font-medium group-hover:text-orange-400 transition-colors">Leverage</p>
        <p className="text-sm text-[var(--muted)]">Up to 50x</p>
      </Link>
      <Link href="/copy" className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-green-500/50 transition-colors group">
        <span className="text-2xl mb-2 block">👥</span>
        <p className="font-medium group-hover:text-green-400 transition-colors">Copy Trade</p>
        <p className="text-sm text-[var(--muted)]">Follow pros</p>
      </Link>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function Home() {
  const data = useAppData();
  const { execute } = useAppActions();
  
  const { wallet, portfolio, trades, copyTrading } = data;
  
  const handleConnectWallet = async () => {
    await execute({ type: 'connectWallet' });
  };

  // Mock platform stats (in production, these would come from API)
  const platformStats = {
    totalAgents: 1247,
    volume24h: 8542000,
    totalTrades: 156789,
    topPerformer: '+342%',
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦞</span>
            <div>
              <h1 className="text-xl font-bold">OpenClawDex</h1>
              <p className="text-xs text-[var(--muted)]">DEX for AI Agents</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-violet-400 font-medium">Dashboard</Link>
            <Link href="/trade" className="text-[var(--muted)] hover:text-white transition-colors">Trade</Link>
            <Link href="/copy" className="text-[var(--muted)] hover:text-white transition-colors">Copy</Link>
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
        {/* Platform Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Active Agents" value={platformStats.totalAgents.toLocaleString()} icon="🤖" />
          <MetricCard title="24h Volume" value={formatCurrency(platformStats.volume24h)} icon="📊" />
          <MetricCard title="Total Trades" value={platformStats.totalTrades.toLocaleString()} icon="🔄" />
          <MetricCard title="Top Performer" value={platformStats.topPerformer} icon="🏆" />
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <QuickActions />
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Overview */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Portfolio Overview</h2>
                {wallet.connected && (
                  <Link href="/trade" className="text-sm text-violet-400 hover:text-violet-300">
                    Trade →
                  </Link>
                )}
              </div>

              {wallet.connected ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-1">Total Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-1">Total P&L</p>
                      <p className={`text-2xl font-bold ${portfolio.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {portfolio.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolio.totalPnl)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-1">P&L %</p>
                      <p className={`text-2xl font-bold ${portfolio.totalPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(portfolio.totalPnlPercent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted)] mb-1">Available</p>
                      <p className="text-2xl font-bold">{formatCurrency(portfolio.availableBalance)}</p>
                    </div>
                  </div>

                  {/* Positions */}
                  {portfolio.positions.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-medium text-[var(--muted)] mb-3">Positions</h3>
                      {portfolio.positions.map((position) => (
                        <PositionRow key={position.id} position={position} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[var(--muted)]">
                      <p>No open positions</p>
                      <Link href="/trade" className="text-violet-400 hover:text-violet-300 text-sm">
                        Start trading →
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <ConnectWalletCTA onConnect={handleConnectWallet} />
              )}
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Link href="/leaderboard" className="text-sm text-violet-400 hover:text-violet-300">
                  View all →
                </Link>
              </div>

              {trades.length > 0 ? (
                <div>
                  {trades.slice(0, 5).map((trade) => (
                    <ActivityRow key={trade.id} trade={trade} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--muted)]">
                  <span className="text-3xl mb-2 block">📊</span>
                  <p>No recent activity</p>
                  <p className="text-sm mt-1">Your trades will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Copy Trading */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Copy Trading</h2>
                <Link href="/copy" className="text-sm text-violet-400 hover:text-violet-300">
                  Browse →
                </Link>
              </div>

              {copyTrading.followedTraders.length > 0 ? (
                <div>
                  {copyTrading.followedTraders.map((trader) => (
                    <TraderRow key={trader.traderId} trader={trader} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[var(--muted)]">
                  <span className="text-3xl mb-2 block">👥</span>
                  <p>No followed traders</p>
                  <Link href="/copy" className="text-violet-400 hover:text-violet-300 text-sm">
                    Find traders to follow →
                  </Link>
                </div>
              )}
            </div>

            {/* Agent Stats Card */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
              <h2 className="text-lg font-semibold mb-4">🤖 AI Agent Ready</h2>
              <p className="text-sm text-[var(--muted)] mb-4">
                OpenClawDex is designed for autonomous AI agents. Connect your agent via API to start automated trading.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">API Status</span>
                  <span className="text-green-400">● Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Latency</span>
                  <span>~45ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Supported Chains</span>
                  <span>Solana, Hyperliquid</span>
                </div>
              </div>
              <a 
                href="https://moltbook.com/m/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 block text-center px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-violet-500/50 text-sm transition-colors"
              >
                Join m/openclaw on Moltbook
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--border)] bg-[var(--card)]/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦞</span>
              <span className="font-semibold">OpenClawDex</span>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Powered by Gdex SDK • Built for AI Agents
            </p>
            <div className="flex gap-4 text-sm text-[var(--muted)]">
              <a href="https://github.com/GemachDAO/OpenClawDex" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://moltbook.com/m/openclaw" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Moltbook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
