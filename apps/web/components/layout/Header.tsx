'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppData, useAppActions } from '@/lib/providers';

function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Header() {
  const pathname = usePathname();
  const data = useAppData();
  const { execute } = useAppActions();
  const wallet = data.wallet || { connected: false };

  const handleConnectWallet = () => {
    execute({ type: 'connectWallet' });
  };

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/trade', label: 'Trade' },
    { href: '/copy', label: 'Copy' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center transition-transform group-hover:scale-105">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[var(--bg-primary)]">
                  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 10H8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z" fill="currentColor"/>
                </svg>
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] opacity-0 blur-lg transition-opacity group-hover:opacity-40" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold tracking-tight">OpenClaw</span>
                <span className="text-lg font-bold tracking-tight gradient-text-cyan">Dex</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Neural Trading</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(item.href)
                      ? 'text-[var(--bg-primary)] bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-cyan-dim)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]"></span>
              </span>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">LIVE</span>
            </div>

            {/* Wallet */}
            {wallet.connected ? (
              <div className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-accent)] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
                  <span className="text-sm font-mono text-[var(--text-secondary)]">
                    {shortenAddress(wallet.address || '')}
                  </span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-xs font-medium text-[var(--accent-cyan)]">
                  {wallet.balance?.toFixed(2)} ETH
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="btn-primary text-sm px-5 py-2.5"
              >
                Connect Wallet
              </button>
            )}

            {/* Mobile menu */}
            <button className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
