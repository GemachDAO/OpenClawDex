import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { OpenClawDexProvider } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <OpenClawDexProvider>
          {children}
        </OpenClawDexProvider>
      </body>
    </html>
  );
}
