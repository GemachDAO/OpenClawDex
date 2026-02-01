import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testPositions, markets, accountInfo, orders, tradeResponses } from '../fixtures/positions';
import { testWallets } from '../fixtures/wallets';

// Create test app for leverage routes
const app = express();
app.use(express.json());

app.get('/api/leverage/markets', (req, res) => {
  res.json({
    markets: Object.values(markets),
    total: Object.keys(markets).length,
  });
});

app.get('/api/leverage/markets/:symbol', (req, res) => {
  const { symbol } = req.params;
  const symbolUpper = symbol.toUpperCase();

  const market = Object.values(markets).find(m => m.symbol === symbolUpper);

  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  res.json(market);
});

app.get('/api/leverage/account/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  res.json({ ...accountInfo, address: walletAddress });
});

app.get('/api/leverage/positions/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  res.json({
    positions: Object.values(testPositions),
    address: walletAddress,
  });
});

app.get('/api/leverage/positions/:walletAddress/:symbol', (req, res) => {
  const { walletAddress, symbol } = req.params;
  const symbolUpper = symbol.toUpperCase();

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const position = Object.values(testPositions).find(p => p.symbol === symbolUpper);

  if (!position) {
    return res.status(404).json({ error: 'Position not found' });
  }

  res.json(position);
});

app.post('/api/leverage/positions/open', (req, res) => {
  const { symbol, side, size, leverage, type, price, stopLoss, takeProfit, walletAddress } = req.body;

  if (!symbol || !side || !size || !leverage || !walletAddress) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (!['long', 'short'].includes(side.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid side. Must be long or short' });
  }

  if (leverage > 100) {
    return res.status(400).json({ error: 'Maximum leverage is 100x' });
  }

  if (leverage < 1) {
    return res.status(400).json({ error: 'Minimum leverage is 1x' });
  }

  res.json({
    ...tradeResponses.openLong,
    symbol,
    side,
    size,
    leverage,
  });
});

app.post('/api/leverage/positions/close', (req, res) => {
  const { symbol, size, walletAddress } = req.body;

  if (!symbol || !walletAddress) {
    return res.status(400).json({ error: 'Symbol and walletAddress are required' });
  }

  res.json(tradeResponses.closePosition);
});

app.get('/api/leverage/orders/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  res.json({
    orders: Object.values(orders),
    address: walletAddress,
  });
});

app.delete('/api/leverage/orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  res.json({
    cancelled: true,
    orderId,
  });
});

app.put('/api/leverage/positions/:walletAddress/:symbol/leverage', (req, res) => {
  const { walletAddress, symbol } = req.params;
  const { leverage } = req.body;

  if (!leverage) {
    return res.status(400).json({ error: 'Leverage is required' });
  }

  if (leverage > 100) {
    return res.status(400).json({ error: 'Maximum leverage is 100x' });
  }

  res.json({
    symbol: symbol.toUpperCase(),
    newLeverage: leverage,
    updated: true,
  });
});

app.put('/api/leverage/positions/:walletAddress/:symbol/sl-tp', (req, res) => {
  const { walletAddress, symbol } = req.params;
  const { stopLoss, takeProfit } = req.body;

  if (!stopLoss && !takeProfit) {
    return res.status(400).json({ error: 'At least one of stopLoss or takeProfit is required' });
  }

  res.json({
    symbol: symbol.toUpperCase(),
    stopLoss: stopLoss || null,
    takeProfit: takeProfit || null,
    updated: true,
  });
});

describe('Leverage Routes', () => {
  describe('GET /api/leverage/markets', () => {
    it('should return list of markets', async () => {
      const response = await request(app).get('/api/leverage/markets');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('markets');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.markets)).toBe(true);
    });

    it('should include market properties', async () => {
      const response = await request(app).get('/api/leverage/markets');

      expect(response.status).toBe(200);
      const market = response.body.markets[0];
      expect(market).toHaveProperty('symbol');
      expect(market).toHaveProperty('baseCurrency');
      expect(market).toHaveProperty('markPrice');
      expect(market).toHaveProperty('fundingRate');
      expect(market).toHaveProperty('maxLeverage');
    });
  });

  describe('GET /api/leverage/markets/:symbol', () => {
    it('should return market info', async () => {
      const response = await request(app).get('/api/leverage/markets/BTC-PERP');

      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('BTC-PERP');
      expect(response.body).toHaveProperty('markPrice');
      expect(response.body).toHaveProperty('fundingRate');
    });

    it('should be case insensitive', async () => {
      const response = await request(app).get('/api/leverage/markets/btc-perp');

      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('BTC-PERP');
    });

    it('should return 404 for unknown market', async () => {
      const response = await request(app).get('/api/leverage/markets/UNKNOWN-PERP');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/leverage/account/:walletAddress', () => {
    it('should return account info', async () => {
      const response = await request(app)
        .get(`/api/leverage/account/${testWallets.ethereum.address}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('availableBalance');
      expect(response.body).toHaveProperty('marginUsed');
      expect(response.body).toHaveProperty('unrealizedPnl');
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .get('/api/leverage/account/invalid-address');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/leverage/positions/:walletAddress', () => {
    it('should return all positions', async () => {
      const response = await request(app)
        .get(`/api/leverage/positions/${testWallets.ethereum.address}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('positions');
      expect(Array.isArray(response.body.positions)).toBe(true);
    });

    it('should include position properties', async () => {
      const response = await request(app)
        .get(`/api/leverage/positions/${testWallets.ethereum.address}`);

      expect(response.status).toBe(200);
      const position = response.body.positions[0];
      expect(position).toHaveProperty('symbol');
      expect(position).toHaveProperty('side');
      expect(position).toHaveProperty('size');
      expect(position).toHaveProperty('entryPrice');
      expect(position).toHaveProperty('leverage');
      expect(position).toHaveProperty('unrealizedPnl');
    });
  });

  describe('GET /api/leverage/positions/:walletAddress/:symbol', () => {
    it('should return specific position', async () => {
      const response = await request(app)
        .get(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP`);

      expect(response.status).toBe(200);
      expect(response.body.symbol).toBe('BTC-PERP');
    });

    it('should return 404 for non-existent position', async () => {
      const response = await request(app)
        .get(`/api/leverage/positions/${testWallets.ethereum.address}/UNKNOWN-PERP`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/leverage/positions/open', () => {
    it('should open a long position', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/open')
        .send({
          symbol: 'BTC-PERP',
          side: 'long',
          size: '0.1',
          leverage: 10,
          walletAddress: testWallets.ethereum.address,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('position');
      expect(response.body.side).toBe('long');
    });

    it('should open a short position', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/open')
        .send({
          symbol: 'ETH-PERP',
          side: 'short',
          size: '1.0',
          leverage: 5,
          walletAddress: testWallets.ethereum.address,
        });

      expect(response.status).toBe(200);
      expect(response.body.side).toBe('short');
    });

    it('should reject invalid leverage (too high)', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/open')
        .send({
          symbol: 'BTC-PERP',
          side: 'long',
          size: '0.1',
          leverage: 150, // Too high
          walletAddress: testWallets.ethereum.address,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('100');
    });

    it('should reject invalid leverage (too low)', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/open')
        .send({
          symbol: 'BTC-PERP',
          side: 'long',
          size: '0.1',
          leverage: 0, // Too low
          walletAddress: testWallets.ethereum.address,
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid side', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/open')
        .send({
          symbol: 'BTC-PERP',
          side: 'invalid',
          size: '0.1',
          leverage: 10,
          walletAddress: testWallets.ethereum.address,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('side');
    });

    it('should reject missing parameters', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/open')
        .send({ symbol: 'BTC-PERP' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/leverage/positions/close', () => {
    it('should close a position', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/close')
        .send({
          symbol: 'BTC-PERP',
          walletAddress: testWallets.ethereum.address,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('realizedPnl');
      expect(response.body.status).toBe('filled');
    });

    it('should allow partial close', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/close')
        .send({
          symbol: 'BTC-PERP',
          size: '0.2',
          walletAddress: testWallets.ethereum.address,
        });

      expect(response.status).toBe(200);
    });

    it('should reject missing symbol', async () => {
      const response = await request(app)
        .post('/api/leverage/positions/close')
        .send({ walletAddress: testWallets.ethereum.address });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/leverage/orders/:walletAddress', () => {
    it('should return open orders', async () => {
      const response = await request(app)
        .get(`/api/leverage/orders/${testWallets.ethereum.address}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should include order properties', async () => {
      const response = await request(app)
        .get(`/api/leverage/orders/${testWallets.ethereum.address}`);

      expect(response.status).toBe(200);
      if (response.body.orders.length > 0) {
        const order = response.body.orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('symbol');
        expect(order).toHaveProperty('side');
        expect(order).toHaveProperty('type');
        expect(order).toHaveProperty('status');
      }
    });
  });

  describe('DELETE /api/leverage/orders/:orderId', () => {
    it('should cancel an order', async () => {
      const response = await request(app)
        .delete('/api/leverage/orders/order_001');

      expect(response.status).toBe(200);
      expect(response.body.cancelled).toBe(true);
      expect(response.body.orderId).toBe('order_001');
    });
  });

  describe('PUT /api/leverage/positions/:walletAddress/:symbol/leverage', () => {
    it('should modify position leverage', async () => {
      const response = await request(app)
        .put(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP/leverage`)
        .send({ leverage: 5 });

      expect(response.status).toBe(200);
      expect(response.body.newLeverage).toBe(5);
      expect(response.body.updated).toBe(true);
    });

    it('should reject leverage above max', async () => {
      const response = await request(app)
        .put(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP/leverage`)
        .send({ leverage: 150 });

      expect(response.status).toBe(400);
    });

    it('should require leverage parameter', async () => {
      const response = await request(app)
        .put(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP/leverage`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/leverage/positions/:walletAddress/:symbol/sl-tp', () => {
    it('should set stop loss', async () => {
      const response = await request(app)
        .put(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP/sl-tp`)
        .send({ stopLoss: '88000' });

      expect(response.status).toBe(200);
      expect(response.body.stopLoss).toBe('88000');
      expect(response.body.updated).toBe(true);
    });

    it('should set take profit', async () => {
      const response = await request(app)
        .put(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP/sl-tp`)
        .send({ takeProfit: '100000' });

      expect(response.status).toBe(200);
      expect(response.body.takeProfit).toBe('100000');
    });

    it('should set both SL and TP', async () => {
      const response = await request(app)
        .put(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP/sl-tp`)
        .send({ stopLoss: '88000', takeProfit: '100000' });

      expect(response.status).toBe(200);
      expect(response.body.stopLoss).toBe('88000');
      expect(response.body.takeProfit).toBe('100000');
    });

    it('should require at least one parameter', async () => {
      const response = await request(app)
        .put(`/api/leverage/positions/${testWallets.ethereum.address}/BTC-PERP/sl-tp`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
