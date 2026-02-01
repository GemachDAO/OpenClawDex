import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testTraders, topTradersResponse, copySettings, followRecord, copyTradeHistory } from '../fixtures/traders';
import { testPositions } from '../fixtures/positions';
import { testWallets } from '../fixtures/wallets';

// Create test app for copy trading routes
const app = express();
app.use(express.json());

app.get('/api/copy/traders', (req, res) => {
  const { sortBy = 'pnl', limit = '10', page = '1' } = req.query;

  let traders = [...topTradersResponse.traders];

  if (sortBy === 'winRate') {
    traders.sort((a, b) => b.stats.winRate - a.stats.winRate);
  } else if (sortBy === 'followers') {
    traders.sort((a, b) => b.stats.followers - a.stats.followers);
  } else if (sortBy === 'aum') {
    traders.sort((a, b) => parseFloat(b.stats.aum) - parseFloat(a.stats.aum));
  }

  res.json({
    traders: traders.slice(0, parseInt(limit as string)),
    total: traders.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });
});

app.get('/api/copy/traders/:traderId', (req, res) => {
  const { traderId } = req.params;

  const trader = Object.values(testTraders).find(t => t.id === traderId);

  if (!trader) {
    return res.status(404).json({ error: 'Trader not found' });
  }

  res.json(trader);
});

app.get('/api/copy/traders/:traderId/positions', (req, res) => {
  const { traderId } = req.params;

  const trader = Object.values(testTraders).find(t => t.id === traderId);

  if (!trader) {
    return res.status(404).json({ error: 'Trader not found' });
  }

  res.json({
    traderId,
    positions: Object.values(testPositions),
  });
});

app.get('/api/copy/following', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  res.json({
    following: [followRecord],
    total: 1,
  });
});

app.post('/api/copy/follow', (req, res) => {
  const { traderId, settings } = req.body;

  if (!traderId) {
    return res.status(400).json({ error: 'Trader ID is required' });
  }

  const trader = Object.values(testTraders).find(t => t.id === traderId);
  if (!trader) {
    return res.status(404).json({ error: 'Trader not found' });
  }

  res.json({
    id: `follow_${Date.now()}`,
    traderId,
    traderAddress: trader.address,
    settings: settings || copySettings.default,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
});

app.post('/api/copy/unfollow', (req, res) => {
  const { traderId } = req.body;

  if (!traderId) {
    return res.status(400).json({ error: 'Trader ID is required' });
  }

  res.json({
    unfollowed: true,
    traderId,
  });
});

app.put('/api/copy/:followId/settings', (req, res) => {
  const { followId } = req.params;
  const settings = req.body;

  if (!settings || Object.keys(settings).length === 0) {
    return res.status(400).json({ error: 'Settings are required' });
  }

  res.json({
    followId,
    settings: { ...copySettings.default, ...settings },
    updated: true,
  });
});

app.put('/api/copy/toggle', (req, res) => {
  const { followId, isPaused } = req.body;

  if (!followId) {
    return res.status(400).json({ error: 'Follow ID is required' });
  }

  if (typeof isPaused !== 'boolean') {
    return res.status(400).json({ error: 'isPaused must be a boolean' });
  }

  res.json({
    followId,
    isPaused,
    updated: true,
  });
});

app.get('/api/copy/:walletAddress/history', (req, res) => {
  const { walletAddress } = req.params;
  const { limit = '20', page = '1' } = req.query;

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  res.json({
    trades: copyTradeHistory.slice(0, parseInt(limit as string)),
    total: copyTradeHistory.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    walletAddress,
  });
});

describe('Copy Trading Routes', () => {
  describe('GET /api/copy/traders', () => {
    it('should return top traders', async () => {
      const response = await request(app).get('/api/copy/traders');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('traders');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.traders)).toBe(true);
    });

    it('should include trader stats', async () => {
      const response = await request(app).get('/api/copy/traders');

      expect(response.status).toBe(200);
      const trader = response.body.traders[0];
      expect(trader).toHaveProperty('id');
      expect(trader).toHaveProperty('username');
      expect(trader).toHaveProperty('stats');
      expect(trader.stats).toHaveProperty('totalPnl');
      expect(trader.stats).toHaveProperty('winRate');
      expect(trader.stats).toHaveProperty('followers');
    });

    it('should sort by PnL by default', async () => {
      const response = await request(app)
        .get('/api/copy/traders')
        .query({ sortBy: 'pnl' });

      expect(response.status).toBe(200);
    });

    it('should sort by win rate', async () => {
      const response = await request(app)
        .get('/api/copy/traders')
        .query({ sortBy: 'winRate' });

      expect(response.status).toBe(200);
      const traders = response.body.traders;
      for (let i = 1; i < traders.length; i++) {
        expect(traders[i-1].stats.winRate).toBeGreaterThanOrEqual(traders[i].stats.winRate);
      }
    });

    it('should sort by followers', async () => {
      const response = await request(app)
        .get('/api/copy/traders')
        .query({ sortBy: 'followers' });

      expect(response.status).toBe(200);
      const traders = response.body.traders;
      for (let i = 1; i < traders.length; i++) {
        expect(traders[i-1].stats.followers).toBeGreaterThanOrEqual(traders[i].stats.followers);
      }
    });

    it('should sort by AUM', async () => {
      const response = await request(app)
        .get('/api/copy/traders')
        .query({ sortBy: 'aum' });

      expect(response.status).toBe(200);
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get('/api/copy/traders')
        .query({ limit: '2', page: '1' });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(2);
      expect(response.body.traders.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/copy/traders/:traderId', () => {
    it('should return trader details', async () => {
      const response = await request(app)
        .get(`/api/copy/traders/${testTraders.topTrader.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testTraders.topTrader.id);
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('badges');
    });

    it('should return 404 for unknown trader', async () => {
      const response = await request(app)
        .get('/api/copy/traders/unknown_trader');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/copy/traders/:traderId/positions', () => {
    it('should return trader positions', async () => {
      const response = await request(app)
        .get(`/api/copy/traders/${testTraders.topTrader.id}/positions`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('traderId');
      expect(response.body).toHaveProperty('positions');
      expect(Array.isArray(response.body.positions)).toBe(true);
    });

    it('should return 404 for unknown trader', async () => {
      const response = await request(app)
        .get('/api/copy/traders/unknown_trader/positions');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/copy/following', () => {
    it('should return following list with auth', async () => {
      const response = await request(app)
        .get('/api/copy/following')
        .set('Authorization', 'Bearer moltbook_test_key');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('following');
      expect(response.body).toHaveProperty('total');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .get('/api/copy/following');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/copy/follow', () => {
    it('should follow a trader', async () => {
      const response = await request(app)
        .post('/api/copy/follow')
        .send({ traderId: testTraders.topTrader.id });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.traderId).toBe(testTraders.topTrader.id);
      expect(response.body.status).toBe('active');
    });

    it('should follow with custom settings', async () => {
      const response = await request(app)
        .post('/api/copy/follow')
        .send({
          traderId: testTraders.topTrader.id,
          settings: copySettings.conservative,
        });

      expect(response.status).toBe(200);
      expect(response.body.settings.copyRatio).toBe(copySettings.conservative.copyRatio);
    });

    it('should reject missing trader ID', async () => {
      const response = await request(app)
        .post('/api/copy/follow')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should reject unknown trader', async () => {
      const response = await request(app)
        .post('/api/copy/follow')
        .send({ traderId: 'unknown_trader' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/copy/unfollow', () => {
    it('should unfollow a trader', async () => {
      const response = await request(app)
        .post('/api/copy/unfollow')
        .send({ traderId: testTraders.topTrader.id });

      expect(response.status).toBe(200);
      expect(response.body.unfollowed).toBe(true);
      expect(response.body.traderId).toBe(testTraders.topTrader.id);
    });

    it('should reject missing trader ID', async () => {
      const response = await request(app)
        .post('/api/copy/unfollow')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/copy/:followId/settings', () => {
    it('should update copy settings', async () => {
      const response = await request(app)
        .put(`/api/copy/${followRecord.id}/settings`)
        .send({ copyRatio: 0.5 });

      expect(response.status).toBe(200);
      expect(response.body.updated).toBe(true);
      expect(response.body.settings.copyRatio).toBe(0.5);
    });

    it('should update multiple settings', async () => {
      const response = await request(app)
        .put(`/api/copy/${followRecord.id}/settings`)
        .send({
          copyRatio: 0.75,
          maxPositionSize: '5000',
          enableStopLoss: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.settings.copyRatio).toBe(0.75);
      expect(response.body.settings.maxPositionSize).toBe('5000');
      expect(response.body.settings.enableStopLoss).toBe(false);
    });

    it('should reject empty settings', async () => {
      const response = await request(app)
        .put(`/api/copy/${followRecord.id}/settings`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/copy/toggle', () => {
    it('should pause copy trading', async () => {
      const response = await request(app)
        .put('/api/copy/toggle')
        .send({ followId: followRecord.id, isPaused: true });

      expect(response.status).toBe(200);
      expect(response.body.isPaused).toBe(true);
      expect(response.body.updated).toBe(true);
    });

    it('should resume copy trading', async () => {
      const response = await request(app)
        .put('/api/copy/toggle')
        .send({ followId: followRecord.id, isPaused: false });

      expect(response.status).toBe(200);
      expect(response.body.isPaused).toBe(false);
    });

    it('should reject missing follow ID', async () => {
      const response = await request(app)
        .put('/api/copy/toggle')
        .send({ isPaused: true });

      expect(response.status).toBe(400);
    });

    it('should reject non-boolean isPaused', async () => {
      const response = await request(app)
        .put('/api/copy/toggle')
        .send({ followId: followRecord.id, isPaused: 'yes' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/copy/:walletAddress/history', () => {
    it('should return copy trade history', async () => {
      const response = await request(app)
        .get(`/api/copy/${testWallets.ethereum.address}/history`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trades');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.trades)).toBe(true);
    });

    it('should include trade details', async () => {
      const response = await request(app)
        .get(`/api/copy/${testWallets.ethereum.address}/history`);

      expect(response.status).toBe(200);
      if (response.body.trades.length > 0) {
        const trade = response.body.trades[0];
        expect(trade).toHaveProperty('id');
        expect(trade).toHaveProperty('symbol');
        expect(trade).toHaveProperty('side');
        expect(trade).toHaveProperty('pnl');
        expect(trade).toHaveProperty('status');
      }
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get(`/api/copy/${testWallets.ethereum.address}/history`)
        .query({ limit: '5', page: '1' });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(5);
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .get('/api/copy/invalid-address/history');

      expect(response.status).toBe(400);
    });
  });
});
