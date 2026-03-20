import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testTraders, topTradersResponse } from '../fixtures/traders';

// Create test app for leaderboard routes
const app = express();
app.use(express.json());

// Leaderboard data derived from traders
const leaderboardAgents = topTradersResponse.traders.map((trader, index) => ({
  id: trader.id,
  name: trader.username,
  walletAddress: trader.address,
  rank: index + 1,
  pnl: parseFloat(trader.stats.totalPnl),
  pnlPercent: trader.stats.totalPnlPercent,
  trades: trader.stats.totalTrades,
  winRate: trader.stats.winRate,
  volume: parseFloat(trader.stats.aum),
  followers: trader.stats.followers,
  isVerified: trader.isVerified,
}));

app.get('/api/leaderboard', (req, res) => {
  const { timeframe = 'daily', limit = '10', sortBy = 'pnl' } = req.query;

  const validTimeframes = ['daily', 'weekly', 'monthly', 'all'];
  const validSortBy = ['pnl', 'winRate', 'followers'];

  if (!validTimeframes.includes(timeframe as string)) {
    return res.status(400).json({
      success: false,
      error: `timeframe must be one of: ${validTimeframes.join(', ')}`,
    });
  }

  if (!validSortBy.includes(sortBy as string)) {
    return res.status(400).json({
      success: false,
      error: `sortBy must be one of: ${validSortBy.join(', ')}`,
    });
  }

  const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 50);

  let agents = [...leaderboardAgents];

  if (sortBy === 'winRate') {
    agents.sort((a, b) => b.winRate - a.winRate);
  } else if (sortBy === 'followers') {
    agents.sort((a, b) => b.followers - a.followers);
  } else {
    agents.sort((a, b) => b.pnl - a.pnl);
  }

  agents = agents.slice(0, parsedLimit).map((a, i) => ({ ...a, rank: i + 1 }));

  res.json({
    success: true,
    data: agents,
    count: agents.length,
    timeframe,
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('Leaderboard Routes', () => {
  describe('GET /api/leaderboard', () => {
    it('should return leaderboard data', async () => {
      const res = await request(app).get('/api/leaderboard');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
    });

    it('should return agents with correct fields', async () => {
      const res = await request(app).get('/api/leaderboard');
      const agent = res.body.data[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('walletAddress');
      expect(agent).toHaveProperty('rank');
      expect(agent).toHaveProperty('pnl');
      expect(agent).toHaveProperty('pnlPercent');
      expect(agent).toHaveProperty('trades');
      expect(agent).toHaveProperty('winRate');
      expect(agent).toHaveProperty('volume');
      expect(agent).toHaveProperty('followers');
      expect(agent).toHaveProperty('isVerified');
    });

    it('should return agents sorted by PnL by default', async () => {
      const res = await request(app).get('/api/leaderboard');
      const agents = res.body.data;
      for (let i = 0; i < agents.length - 1; i++) {
        expect(agents[i].pnl).toBeGreaterThanOrEqual(agents[i + 1].pnl);
      }
    });

    it('should sort by winRate when specified', async () => {
      const res = await request(app).get('/api/leaderboard?sortBy=winRate');
      const agents = res.body.data;
      for (let i = 0; i < agents.length - 1; i++) {
        expect(agents[i].winRate).toBeGreaterThanOrEqual(agents[i + 1].winRate);
      }
    });

    it('should sort by followers when specified', async () => {
      const res = await request(app).get('/api/leaderboard?sortBy=followers');
      const agents = res.body.data;
      for (let i = 0; i < agents.length - 1; i++) {
        expect(agents[i].followers).toBeGreaterThanOrEqual(agents[i + 1].followers);
      }
    });

    it('should accept timeframe parameter', async () => {
      const res = await request(app).get('/api/leaderboard?timeframe=weekly');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.timeframe).toBe('weekly');
    });

    it('should accept all valid timeframes', async () => {
      for (const timeframe of ['daily', 'weekly', 'monthly', 'all']) {
        const res = await request(app).get(`/api/leaderboard?timeframe=${timeframe}`);
        expect(res.status).toBe(200);
        expect(res.body.timeframe).toBe(timeframe);
      }
    });

    it('should reject invalid timeframe', async () => {
      const res = await request(app).get('/api/leaderboard?timeframe=invalid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('timeframe');
    });

    it('should reject invalid sortBy', async () => {
      const res = await request(app).get('/api/leaderboard?sortBy=invalid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('sortBy');
    });

    it('should limit results', async () => {
      const res = await request(app).get('/api/leaderboard?limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should assign sequential ranks', async () => {
      const res = await request(app).get('/api/leaderboard');
      const agents = res.body.data;
      agents.forEach((agent: any, i: number) => {
        expect(agent.rank).toBe(i + 1);
      });
    });

    it('should include count in response', async () => {
      const res = await request(app).get('/api/leaderboard');
      expect(res.body.count).toBe(res.body.data.length);
    });
  });
});
