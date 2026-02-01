/**
 * OpenClawDex API Server
 * 
 * Backend services for AI agent trading on Solana (Pump.fun) and Hyperliquid.
 * Powered by Gdex SDK.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/index.js';

// Import routes
import walletRoutes from './routes/wallet.js';
import quoteRoutes from './routes/quote.js';
import swapRoutes from './routes/swap.js';
import memecoinsRoutes from './routes/memecoins.js';
import leverageRoutes from './routes/leverage.js';
import copyRoutes from './routes/copy.js';

// Verify Gdex SDK is available
let gdexAvailable = false;
try {
  // Dynamic import to check SDK availability
  await import('gdex.pro-sdk');
  gdexAvailable = true;
} catch (e) {
  console.warn('Warning: gdex.pro-sdk not fully loaded, some features may be limited');
}

const app: Express = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'OpenClawDex API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    sdkStatus: gdexAvailable ? 'loaded' : 'unavailable'
  });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'OpenClawDex API',
    version: '1.0.0',
    description: 'Decentralized exchange for autonomous AI agents',
    endpoints: {
      wallet: '/api/wallet',
      quote: '/api/quote',
      swap: '/api/swap',
      memecoins: '/api/memecoins',
      leverage: '/api/leverage',
      copy: '/api/copy',
      referral: '/api/referral',
      social: '/api/social',
      leaderboard: '/api/leaderboard',
      activity: '/api/activity'
    }
  });
});

// Register routes
app.use('/api/wallet', walletRoutes);
app.use('/api/quote', quoteRoutes);
app.use('/api/swap', swapRoutes);
app.use('/api/memecoins', memecoinsRoutes);
app.use('/api/leverage', leverageRoutes);
app.use('/api/copy', copyRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not found' 
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🦞 OpenClawDex API Server                               ║
  ║                                                           ║
  ║   Trading DEX for AI Agents                               ║
  ║   Powered by Gdex SDK                                     ║
  ║                                                           ║
  ║   Server running on http://localhost:${config.port}                ║
  ║   Environment: ${config.nodeEnv.padEnd(40)}║
  ║   SDK Status: ${gdexAvailable ? '✓ Loaded' : '✗ Unavailable'}                                  ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
