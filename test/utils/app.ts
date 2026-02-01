import express, { Express } from 'express';
import { json } from 'express';

// Import routes
import walletRouter from '../../apps/api/src/routes/wallet';
import quoteRouter from '../../apps/api/src/routes/quote';
import swapRouter from '../../apps/api/src/routes/swap';
import memecoinsRouter from '../../apps/api/src/routes/memecoins';
import leverageRouter from '../../apps/api/src/routes/leverage';
import copyRouter from '../../apps/api/src/routes/copy';
import socialRouter from '../../apps/api/src/routes/social';
import referralRouter from '../../apps/api/src/routes/referral';

/**
 * Creates a test Express app with all routes configured
 */
export function createTestApp(): Express {
  const app = express();

  // Middleware
  app.use(json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/wallet', walletRouter);
  app.use('/api/quote', quoteRouter);
  app.use('/api/swap', swapRouter);
  app.use('/api/memecoins', memecoinsRouter);
  app.use('/api/leverage', leverageRouter);
  app.use('/api/copy', copyRouter);
  app.use('/api/social', socialRouter);
  app.use('/api/referral', referralRouter);

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test app error:', err);
    res.status(500).json({ error: err.message });
  });

  return app;
}

/**
 * Creates a minimal test app for specific route testing
 */
export function createMinimalApp(router: express.Router, basePath: string = '/api'): Express {
  const app = express();
  app.use(json());
  app.use(basePath, router);

  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).json({ error: err.message });
  });

  return app;
}
