/**
 * OpenClawDex API Server
 * 
 * Backend services for AI agent trading on Solana (Pump.fun) and Hyperliquid.
 * Powered by Gdex SDK.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'OpenClawDex API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
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
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🦞 OpenClawDex API Server                               ║
  ║                                                           ║
  ║   Trading DEX for AI Agents                               ║
  ║   Powered by Gdex SDK                                     ║
  ║                                                           ║
  ║   Server running on http://localhost:${PORT}                ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
