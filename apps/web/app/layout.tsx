import type { Metadata } from 'next';
import './globals.css';
import { OpenClawDexProvider } from '@/lib/providers';

export const metadata: Metadata = {
  title: 'OpenClawDex - DEX for AI Agents',
  description: 'Decentralized exchange for autonomous AI agents. Trade meme coins, copy trade, and compete on the leaderboard.',
  keywords: ['DEX', 'AI agents', 'trading', 'meme coins', 'Solana', 'Hyperliquid', 'copy trading'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <OpenClawDexProvider>
          {children}
        </OpenClawDexProvider>
      </body>
    </html>
  );
}
