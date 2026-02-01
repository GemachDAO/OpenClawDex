import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testTokens, trendingTokens, tokenSearchResults } from '../fixtures/tokens';
import { testSwaps } from '../fixtures/swaps';

// Create test app for quote routes
const app = express();
app.use(express.json());

app.get('/api/quote', (req, res) => {
  const { fromToken, toToken, amount, chainId, slippage } = req.query;

  if (!fromToken || !toToken || !amount || !chainId) {
    return res.status(400).json({ error: 'Missing required parameters: fromToken, toToken, amount, chainId' });
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  res.json(testSwaps.ethToUsdc.quote);
});

app.get('/api/quote/price/:chainId/:tokenAddress', (req, res) => {
  const { chainId, tokenAddress } = req.params;

  if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid token address format' });
  }

  // Check if token exists
  const token = Object.values(testTokens.ethereum).find(
    t => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );

  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }

  res.json({
    address: tokenAddress,
    chainId: parseInt(chainId),
    priceUsd: token.priceUsd,
    priceChange24h: 2.5,
  });
});

app.get('/api/quote/prices/:chainId', (req, res) => {
  const { chainId } = req.params;
  const addresses = req.query.addresses;

  if (!addresses) {
    return res.status(400).json({ error: 'Addresses are required' });
  }

  const addressList = Array.isArray(addresses) ? addresses : [addresses];

  if (addressList.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 addresses allowed' });
  }

  const prices = addressList.map((address: string) => ({
    address,
    chainId: parseInt(chainId),
    priceUsd: '1.00',
    priceChange24h: Math.random() * 10 - 5,
  }));

  res.json({ prices, chainId: parseInt(chainId) });
});

app.get('/api/quote/search/:chainId', (req, res) => {
  const { chainId } = req.params;
  const { query } = req.query;

  if (!query || (query as string).length < 2) {
    return res.json({ results: [], total: 0, chainId: parseInt(chainId) });
  }

  const results = tokenSearchResults.results.filter(
    t => t.symbol.toLowerCase().includes((query as string).toLowerCase()) ||
         t.name.toLowerCase().includes((query as string).toLowerCase())
  );

  res.json({ results, total: results.length, chainId: parseInt(chainId) });
});

app.get('/api/quote/trending', (req, res) => {
  const { limit = '10', page = '1', chainId } = req.query;

  res.json({
    tokens: trendingTokens.slice(0, parseInt(limit as string)),
    total: trendingTokens.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    chainId: chainId ? parseInt(chainId as string) : null,
  });
});

describe('Quote Routes', () => {
  describe('GET /api/quote', () => {
    it('should return quote for valid token pair', async () => {
      const response = await request(app)
        .get('/api/quote')
        .query({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '1.0',
          chainId: '1',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fromToken');
      expect(response.body).toHaveProperty('toToken');
      expect(response.body).toHaveProperty('fromAmount');
      expect(response.body).toHaveProperty('toAmount');
      expect(response.body).toHaveProperty('priceImpact');
      expect(response.body).toHaveProperty('route');
      expect(response.body).toHaveProperty('estimatedGas');
    });

    it('should include slippage in quote', async () => {
      const response = await request(app)
        .get('/api/quote')
        .query({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '1.0',
          chainId: '1',
          slippage: '0.5',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('slippage');
    });

    it('should reject missing required parameters', async () => {
      const response = await request(app)
        .get('/api/quote')
        .query({ fromToken: testTokens.ethereum.native.address });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should reject invalid amount', async () => {
      const response = await request(app)
        .get('/api/quote')
        .query({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '-1',
          chainId: '1',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject zero amount', async () => {
      const response = await request(app)
        .get('/api/quote')
        .query({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '0',
          chainId: '1',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/quote/price/:chainId/:tokenAddress', () => {
    it('should return token price', async () => {
      const response = await request(app)
        .get(`/api/quote/price/1/${testTokens.ethereum.usdc.address}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('priceUsd');
      expect(response.body).toHaveProperty('priceChange24h');
    });

    it('should return 404 for unknown token', async () => {
      const response = await request(app)
        .get('/api/quote/price/1/0x0000000000000000000000000000000000000000');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should reject invalid token address format', async () => {
      const response = await request(app)
        .get('/api/quote/price/1/invalid-address');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('GET /api/quote/prices/:chainId', () => {
    it('should return batch prices', async () => {
      const response = await request(app)
        .get('/api/quote/prices/1')
        .query({
          addresses: [testTokens.ethereum.usdc.address, testTokens.ethereum.usdt.address],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prices');
      expect(Array.isArray(response.body.prices)).toBe(true);
    });

    it('should reject more than 50 addresses', async () => {
      const addresses = Array(51).fill(testTokens.ethereum.usdc.address);
      
      const response = await request(app)
        .get('/api/quote/prices/1')
        .query({ addresses });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('50');
    });

    it('should require addresses parameter', async () => {
      const response = await request(app)
        .get('/api/quote/prices/1');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/quote/search/:chainId', () => {
    it('should return search results', async () => {
      const response = await request(app)
        .get('/api/quote/search/1')
        .query({ query: 'usd' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return empty for short query', async () => {
      const response = await request(app)
        .get('/api/quote/search/1')
        .query({ query: 'a' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(0);
    });

    it('should return empty for no results', async () => {
      const response = await request(app)
        .get('/api/quote/search/1')
        .query({ query: 'zzzznonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(0);
    });

    it('should handle missing query', async () => {
      const response = await request(app)
        .get('/api/quote/search/1');

      expect(response.status).toBe(200);
      expect(response.body.results).toHaveLength(0);
    });
  });

  describe('GET /api/quote/trending', () => {
    it('should return trending tokens', async () => {
      const response = await request(app)
        .get('/api/quote/trending');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.tokens)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/quote/trending')
        .query({ limit: '2' });

      expect(response.status).toBe(200);
      expect(response.body.tokens.length).toBeLessThanOrEqual(2);
      expect(response.body.limit).toBe(2);
    });

    it('should respect page parameter', async () => {
      const response = await request(app)
        .get('/api/quote/trending')
        .query({ page: '2', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
    });

    it('should filter by chainId', async () => {
      const response = await request(app)
        .get('/api/quote/trending')
        .query({ chainId: '1' });

      expect(response.status).toBe(200);
      expect(response.body.chainId).toBe(1);
    });
  });
});
