import { gdexHandlers } from './gdex';
import { moltbookHandlers } from './moltbook';
import { hyperliquidHandlers } from './hyperliquid';
import { solanaHandlers } from './solana';

// Combine all mock handlers
export const handlers = [
  ...gdexHandlers,
  ...moltbookHandlers,
  ...hyperliquidHandlers,
  ...solanaHandlers,
];
