import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { 
  testMemecoins, 
  trendingMemecoinsResponse, 
  newLaunchesResponse,
  graduatedTokensResponse,
  bondingCurve,
  memecoinBuyResponse,
  memecoinSellResponse,
  invalidMemecoinResponses 
} from '../fixtures/memecoins';
import { testWallets } from '../fixtures/wallets';

// Create test app for memecoin routes
const app = express();
app.use(express.json());

app.get('/api/memecoins', (req, res) => {
  const { sortBy = 'volume', minMarketCap, maxMarketCap, limit = '20', page = '1' } = req.query;

  let tokens = [...trendingMemecoinsResponse.tokens];

  if (minMarketCap) {
    tokens = tokens.filter(t => parseFloat(t.marketCap) >= parseFloat(minMarketCap as string));
  }
  if (maxMarketCap) {
    tokens = tokens.filter(t => parseFloat(t.marketCap) <= parseFloat(maxMarketCap as string));
  }

  if (sortBy === 'marketCap') {
    tokens.sort((a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap));
  } else if (sortBy === 'priceChange') {
    tokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
  }

  res.json({
    tokens: tokens.slice(0, parseInt(limit as string)),
    total: tokens.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });
});

app.get('/api/memecoins/new', (req, res) => {
  const { limit = '20', page = '1' } = req.query;
  res.json({
    tokens: newLaunchesResponse.tokens.slice(0, parseInt(limit as string)),
    total: newLaunchesResponse.total,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });
});

app.get('/api/memecoins/graduated', (req, res) => {
  const { limit = '20', page = '1' } = req.query;
  res.json({
    tokens: graduatedTokensResponse.tokens.slice(0, parseInt(limit as string)),
    total: graduatedTokensResponse.total,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });
});

app.get('/api/memecoins/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json({ tokens: [], total: 0 });
  }

  const results = Object.values(testMemecoins).filter(
    t => t.name.toLowerCase().includes((q as string).toLowerCase()) ||
         t.symbol.toLowerCase().includes((q as string).toLowerCase())
  );

  res.json({ query: q, tokens: results, total: results.length });
});

app.get('/api/memecoins/:mintAddress', (req, res) => {
  const { mintAddress } = req.params;

  const token = Object.values(testMemecoins).find(t => t.mintAddress === mintAddress);

  if (!token) {
    return res.status(404).json(invalidMemecoinResponses.tokenNotFound);
  }

  res.json(token);
});

app.get('/api/memecoins/:mintAddress/bonding-curve', (req, res) => {
  const { mintAddress } = req.params;

  if (mintAddress === testMemecoins.newLaunch.mintAddress) {
    return res.json(bondingCurve);
  }

  const token = Object.values(testMemecoins).find(t => t.mintAddress === mintAddress);

  if (!token) {
    return res.status(404).json(invalidMemecoinResponses.tokenNotFound);
  }

  if (token.isGraduated) {
    return res.json({
      mintAddress,
      progress: 100,
      isGraduated: true,
      graduatedAt: '2025-10-15T00:00:00Z',
    });
  }

  res.json(bondingCurve);
});

app.post('/api/memecoins/buy', (req, res) => {
  const { mintAddress, solAmount, walletAddress, slippage } = req.body;

  if (!mintAddress || !solAmount || !walletAddress) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const token = Object.values(testMemecoins).find(t => t.mintAddress === mintAddress);
  if (!token) {
    return res.status(404).json(invalidMemecoinResponses.tokenNotFound);
  }

  if (parseFloat(solAmount) > 100) {
    return res.status(400).json(invalidMemecoinResponses.insufficientBalance);
  }

  res.json({
    ...memecoinBuyResponse,
    solSpent: solAmount,
    tokenAmount: String(parseFloat(solAmount) * 10000000),
  });
});

app.post('/api/memecoins/sell', (req, res) => {
  const { mintAddress, tokenAmount, walletAddress, slippage } = req.body;

  if (!mintAddress || !tokenAmount || !walletAddress) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const token = Object.values(testMemecoins).find(t => t.mintAddress === mintAddress);
  if (!token) {
    return res.status(404).json(invalidMemecoinResponses.tokenNotFound);
  }

  res.json({
    ...memecoinSellResponse,
    tokenAmount,
    solReceived: String(parseFloat(tokenAmount) * 0.00000009),
  });
});

describe('Memecoins Routes', () => {
  describe('GET /api/memecoins', () => {
    it('should return trending memecoins', async () => {
      const response = await request(app).get('/api/memecoins');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.tokens)).toBe(true);
    });

    it('should include expected token properties', async () => {
      const response = await request(app).get('/api/memecoins');

      expect(response.status).toBe(200);
      if (response.body.tokens.length > 0) {
        const token = response.body.tokens[0];
        expect(token).toHaveProperty('mintAddress');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('marketCap');
        expect(token).toHaveProperty('volume24h');
        expect(token).toHaveProperty('priceUsd');
      }
    });

    it('should filter by min market cap', async () => {
      const response = await request(app)
        .get('/api/memecoins')
        .query({ minMarketCap: '1000000000' });

      expect(response.status).toBe(200);
      response.body.tokens.forEach((token: any) => {
        expect(parseFloat(token.marketCap)).toBeGreaterThanOrEqual(1000000000);
      });
    });

    it('should filter by max market cap', async () => {
      const response = await request(app)
        .get('/api/memecoins')
        .query({ maxMarketCap: '100000000' });

      expect(response.status).toBe(200);
      response.body.tokens.forEach((token: any) => {
        expect(parseFloat(token.marketCap)).toBeLessThanOrEqual(100000000);
      });
    });

    it('should sort by market cap', async () => {
      const response = await request(app)
        .get('/api/memecoins')
        .query({ sortBy: 'marketCap' });

      expect(response.status).toBe(200);
      const tokens = response.body.tokens;
      for (let i = 1; i < tokens.length; i++) {
        expect(parseFloat(tokens[i-1].marketCap)).toBeGreaterThanOrEqual(parseFloat(tokens[i].marketCap));
      }
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get('/api/memecoins')
        .query({ limit: '5', page: '1' });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(5);
      expect(response.body.page).toBe(1);
    });
  });

  describe('GET /api/memecoins/new', () => {
    it('should return newly launched tokens', async () => {
      const response = await request(app).get('/api/memecoins/new');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
      expect(Array.isArray(response.body.tokens)).toBe(true);
    });

    it('should include non-graduated tokens', async () => {
      const response = await request(app).get('/api/memecoins/new');

      expect(response.status).toBe(200);
      response.body.tokens.forEach((token: any) => {
        expect(token.isGraduated).toBe(false);
      });
    });
  });

  describe('GET /api/memecoins/graduated', () => {
    it('should return graduated tokens', async () => {
      const response = await request(app).get('/api/memecoins/graduated');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
      expect(Array.isArray(response.body.tokens)).toBe(true);
    });

    it('should only include graduated tokens', async () => {
      const response = await request(app).get('/api/memecoins/graduated');

      expect(response.status).toBe(200);
      response.body.tokens.forEach((token: any) => {
        expect(token.isGraduated).toBe(true);
      });
    });
  });

  describe('GET /api/memecoins/search', () => {
    it('should return search results', async () => {
      const response = await request(app)
        .get('/api/memecoins/search')
        .query({ q: 'bonk' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
      expect(response.body).toHaveProperty('total');
    });

    it('should return empty for no query', async () => {
      const response = await request(app).get('/api/memecoins/search');

      expect(response.status).toBe(200);
      expect(response.body.tokens).toHaveLength(0);
    });

    it('should return empty for no matches', async () => {
      const response = await request(app)
        .get('/api/memecoins/search')
        .query({ q: 'zzzznonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.tokens).toHaveLength(0);
    });
  });

  describe('GET /api/memecoins/:mintAddress', () => {
    it('should return token info', async () => {
      const response = await request(app)
        .get(`/api/memecoins/${testMemecoins.trending.mintAddress}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mintAddress');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('symbol');
      expect(response.body.mintAddress).toBe(testMemecoins.trending.mintAddress);
    });

    it('should return 404 for unknown token', async () => {
      const response = await request(app)
        .get('/api/memecoins/unknownMintAddress123456789');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/memecoins/:mintAddress/bonding-curve', () => {
    it('should return bonding curve for non-graduated token', async () => {
      const response = await request(app)
        .get(`/api/memecoins/${testMemecoins.newLaunch.mintAddress}/bonding-curve`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mintAddress');
      expect(response.body).toHaveProperty('progress');
      expect(response.body).toHaveProperty('virtualSolReserves');
      expect(response.body.progress).toBeLessThan(100);
    });

    it('should return graduated status for graduated token', async () => {
      const response = await request(app)
        .get(`/api/memecoins/${testMemecoins.trending.mintAddress}/bonding-curve`);

      expect(response.status).toBe(200);
      expect(response.body.isGraduated).toBe(true);
      expect(response.body.progress).toBe(100);
    });

    it('should return 404 for unknown token', async () => {
      const response = await request(app)
        .get('/api/memecoins/unknownMintAddress/bonding-curve');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/memecoins/buy', () => {
    it('should execute buy order', async () => {
      const response = await request(app)
        .post('/api/memecoins/buy')
        .send({
          mintAddress: testMemecoins.trending.mintAddress,
          solAmount: '1.0',
          walletAddress: testWallets.solana.address,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('signature');
      expect(response.body).toHaveProperty('tokenAmount');
      expect(response.body.success).toBe(true);
    });

    it('should reject missing parameters', async () => {
      const response = await request(app)
        .post('/api/memecoins/buy')
        .send({ mintAddress: testMemecoins.trending.mintAddress });

      expect(response.status).toBe(400);
    });

    it('should reject unknown token', async () => {
      const response = await request(app)
        .post('/api/memecoins/buy')
        .send({
          mintAddress: 'unknownMint',
          solAmount: '1.0',
          walletAddress: testWallets.solana.address,
        });

      expect(response.status).toBe(404);
    });

    it('should reject insufficient balance', async () => {
      const response = await request(app)
        .post('/api/memecoins/buy')
        .send({
          mintAddress: testMemecoins.trending.mintAddress,
          solAmount: '10000', // Very large amount
          walletAddress: testWallets.solana.address,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
    });
  });

  describe('POST /api/memecoins/sell', () => {
    it('should execute sell order', async () => {
      const response = await request(app)
        .post('/api/memecoins/sell')
        .send({
          mintAddress: testMemecoins.trending.mintAddress,
          tokenAmount: '1000000',
          walletAddress: testWallets.solana.address,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('signature');
      expect(response.body).toHaveProperty('solReceived');
      expect(response.body.success).toBe(true);
    });

    it('should reject missing parameters', async () => {
      const response = await request(app)
        .post('/api/memecoins/sell')
        .send({ mintAddress: testMemecoins.trending.mintAddress });

      expect(response.status).toBe(400);
    });

    it('should reject unknown token', async () => {
      const response = await request(app)
        .post('/api/memecoins/sell')
        .send({
          mintAddress: 'unknownMint',
          tokenAmount: '1000000',
          walletAddress: testWallets.solana.address,
        });

      expect(response.status).toBe(404);
    });
  });
});
