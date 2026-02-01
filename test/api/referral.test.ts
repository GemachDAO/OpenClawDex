import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testReferrals, referralStats, referredAgents, referralTiers, referralLeaderboard, shareMessages } from '../fixtures/referrals';
import { testAgents } from '../fixtures/moltbook';

// Create test app for referral routes
const app = express();
app.use(express.json());

// Auth middleware mock
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer moltbook_')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.agent = testAgents.claimed;
  next();
};

const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer moltbook_')) {
    req.agent = testAgents.claimed;
  }
  next();
};

app.post('/api/referral/link', requireAuth, (req: any, res) => {
  const { customCode } = req.body;

  const code = customCode || `REF${Date.now().toString(36).toUpperCase()}`;

  res.json({
    code,
    agentId: req.agent.id,
    url: `https://openclawdex.com/ref/${code}`,
    discountPercent: 10,
    rewardPercent: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
});

app.get('/api/referral/link/:code', optionalAuth, (req, res) => {
  const { code } = req.params;

  if (code === testReferrals.link.code) {
    return res.json(testReferrals.link);
  }

  if (code === testReferrals.expiredLink.code) {
    return res.json(testReferrals.expiredLink);
  }

  res.status(404).json({ error: 'Referral link not found' });
});

app.delete('/api/referral/link/:code', requireAuth, (req: any, res) => {
  const { code } = req.params;

  res.json({
    code,
    deactivated: true,
  });
});

app.get('/api/referral/validate/:code', optionalAuth, (req, res) => {
  const { code } = req.params;

  if (code === testReferrals.link.code) {
    return res.json({
      code,
      isValid: true,
      discountPercent: testReferrals.link.discountPercent,
    });
  }

  if (code === testReferrals.expiredLink.code) {
    return res.json({
      code,
      isValid: false,
      reason: 'Referral code has expired',
    });
  }

  res.json({
    code,
    isValid: false,
    reason: 'Invalid referral code',
  });
});

app.post('/api/referral/track', requireAuth, (req: any, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  res.json({
    tracked: true,
    code,
    referrerId: testReferrals.link.agentId,
    discountApplied: testReferrals.link.discountPercent,
  });
});

app.get('/api/referral/stats/:agentId', requireAuth, (req, res) => {
  const { agentId } = req.params;

  res.json({ ...referralStats, agentId });
});

app.get('/api/referral/referred/:agentId', requireAuth, (req, res) => {
  const { agentId } = req.params;
  const { limit = '20', page = '1' } = req.query;

  res.json({
    referred: referredAgents.slice(0, parseInt(limit as string)),
    total: referredAgents.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    agentId,
  });
});

app.post('/api/referral/share', requireAuth, (req: any, res) => {
  const { code, platform } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  res.json({
    shared: true,
    code,
    platform: platform || 'moltbook',
    postId: `share_${Date.now()}`,
  });
});

app.post('/api/referral/share/generate', requireAuth, (req: any, res) => {
  const { code, platforms } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  const requestedPlatforms = platforms || ['twitter', 'moltbook', 'generic'];
  const messages: Record<string, string> = {};

  requestedPlatforms.forEach((platform: string) => {
    if (shareMessages[platform as keyof typeof shareMessages]) {
      messages[platform] = shareMessages[platform as keyof typeof shareMessages].replace('ALPHA2026', code);
    }
  });

  res.json({
    code,
    messages,
  });
});

app.get('/api/referral/tiers', optionalAuth, (req, res) => {
  res.json({ tiers: referralTiers });
});

app.get('/api/referral/tiers/:tierId', optionalAuth, (req, res) => {
  const { tierId } = req.params;

  const tier = referralTiers.find(t => t.id === tierId);

  if (!tier) {
    return res.status(404).json({ error: 'Tier not found' });
  }

  res.json(tier);
});

app.get('/api/referral/leaderboard', optionalAuth, (req, res) => {
  const { limit = '10', period = 'all' } = req.query;

  res.json({
    leaderboard: referralLeaderboard.slice(0, parseInt(limit as string)),
    total: referralLeaderboard.length,
    period,
  });
});

describe('Referral Routes', () => {
  const validAuthHeader = { Authorization: `Bearer ${testAgents.claimed.apiKey}` };

  describe('POST /api/referral/link', () => {
    it('should generate referral link with auth', async () => {
      const response = await request(app)
        .post('/api/referral/link')
        .set(validAuthHeader)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('discountPercent');
      expect(response.body).toHaveProperty('rewardPercent');
      expect(response.body.isActive).toBe(true);
    });

    it('should generate with custom code', async () => {
      const response = await request(app)
        .post('/api/referral/link')
        .set(validAuthHeader)
        .send({ customCode: 'MYCUSTOMCODE' });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('MYCUSTOMCODE');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/referral/link')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/referral/link/:code', () => {
    it('should return referral link info', async () => {
      const response = await request(app)
        .get(`/api/referral/link/${testReferrals.link.code}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(testReferrals.link.code);
      expect(response.body).toHaveProperty('discountPercent');
      expect(response.body).toHaveProperty('uses');
    });

    it('should return expired link info', async () => {
      const response = await request(app)
        .get(`/api/referral/link/${testReferrals.expiredLink.code}`);

      expect(response.status).toBe(200);
      expect(response.body.isActive).toBe(false);
    });

    it('should return 404 for unknown code', async () => {
      const response = await request(app)
        .get('/api/referral/link/UNKNOWNCODE');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/referral/link/:code', () => {
    it('should deactivate referral link', async () => {
      const response = await request(app)
        .delete(`/api/referral/link/${testReferrals.link.code}`)
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.deactivated).toBe(true);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .delete(`/api/referral/link/${testReferrals.link.code}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/referral/validate/:code', () => {
    it('should validate active referral code', async () => {
      const response = await request(app)
        .get(`/api/referral/validate/${testReferrals.link.code}`);

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(true);
      expect(response.body).toHaveProperty('discountPercent');
    });

    it('should reject expired code', async () => {
      const response = await request(app)
        .get(`/api/referral/validate/${testReferrals.expiredLink.code}`);

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(false);
      expect(response.body.reason).toContain('expired');
    });

    it('should reject invalid code', async () => {
      const response = await request(app)
        .get('/api/referral/validate/INVALIDCODE');

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(false);
    });
  });

  describe('POST /api/referral/track', () => {
    it('should track referral', async () => {
      const response = await request(app)
        .post('/api/referral/track')
        .set(validAuthHeader)
        .send({ code: testReferrals.link.code });

      expect(response.status).toBe(200);
      expect(response.body.tracked).toBe(true);
      expect(response.body).toHaveProperty('referrerId');
      expect(response.body).toHaveProperty('discountApplied');
    });

    it('should reject missing code', async () => {
      const response = await request(app)
        .post('/api/referral/track')
        .set(validAuthHeader)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/referral/track')
        .send({ code: testReferrals.link.code });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/referral/stats/:agentId', () => {
    it('should return referral stats', async () => {
      const response = await request(app)
        .get(`/api/referral/stats/${testAgents.claimed.id}`)
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalReferrals');
      expect(response.body).toHaveProperty('totalEarnings');
      expect(response.body).toHaveProperty('currentTier');
      expect(response.body).toHaveProperty('monthlyStats');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .get(`/api/referral/stats/${testAgents.claimed.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/referral/referred/:agentId', () => {
    it('should return referred agents', async () => {
      const response = await request(app)
        .get(`/api/referral/referred/${testAgents.claimed.id}`)
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('referred');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.referred)).toBe(true);
    });

    it('should include referred agent details', async () => {
      const response = await request(app)
        .get(`/api/referral/referred/${testAgents.claimed.id}`)
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      if (response.body.referred.length > 0) {
        const agent = response.body.referred[0];
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('username');
        expect(agent).toHaveProperty('totalVolume');
        expect(agent).toHaveProperty('yourEarnings');
      }
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get(`/api/referral/referred/${testAgents.claimed.id}`)
        .set(validAuthHeader)
        .query({ limit: '5', page: '1' });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(5);
    });
  });

  describe('POST /api/referral/share', () => {
    it('should share referral to Moltbook', async () => {
      const response = await request(app)
        .post('/api/referral/share')
        .set(validAuthHeader)
        .send({ code: testReferrals.link.code });

      expect(response.status).toBe(200);
      expect(response.body.shared).toBe(true);
      expect(response.body).toHaveProperty('postId');
    });

    it('should share to specific platform', async () => {
      const response = await request(app)
        .post('/api/referral/share')
        .set(validAuthHeader)
        .send({ code: testReferrals.link.code, platform: 'twitter' });

      expect(response.status).toBe(200);
      expect(response.body.platform).toBe('twitter');
    });

    it('should reject missing code', async () => {
      const response = await request(app)
        .post('/api/referral/share')
        .set(validAuthHeader)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/referral/share/generate', () => {
    it('should generate share messages', async () => {
      const response = await request(app)
        .post('/api/referral/share/generate')
        .set(validAuthHeader)
        .send({ code: testReferrals.link.code });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(response.body.messages).toHaveProperty('twitter');
      expect(response.body.messages).toHaveProperty('moltbook');
    });

    it('should generate for specific platforms', async () => {
      const response = await request(app)
        .post('/api/referral/share/generate')
        .set(validAuthHeader)
        .send({ code: testReferrals.link.code, platforms: ['twitter'] });

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveProperty('twitter');
    });

    it('should reject missing code', async () => {
      const response = await request(app)
        .post('/api/referral/share/generate')
        .set(validAuthHeader)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/referral/tiers', () => {
    it('should return all tiers', async () => {
      const response = await request(app)
        .get('/api/referral/tiers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tiers');
      expect(Array.isArray(response.body.tiers)).toBe(true);
      expect(response.body.tiers.length).toBeGreaterThan(0);
    });

    it('should include tier properties', async () => {
      const response = await request(app)
        .get('/api/referral/tiers');

      expect(response.status).toBe(200);
      const tier = response.body.tiers[0];
      expect(tier).toHaveProperty('id');
      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('minReferrals');
      expect(tier).toHaveProperty('rewardPercent');
      expect(tier).toHaveProperty('benefits');
    });
  });

  describe('GET /api/referral/tiers/:tierId', () => {
    it('should return specific tier', async () => {
      const response = await request(app)
        .get('/api/referral/tiers/gold');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('gold');
      expect(response.body.name).toBe('Gold');
    });

    it('should return 404 for unknown tier', async () => {
      const response = await request(app)
        .get('/api/referral/tiers/unknown');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/referral/leaderboard', () => {
    it('should return referral leaderboard', async () => {
      const response = await request(app)
        .get('/api/referral/leaderboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('leaderboard');
      expect(Array.isArray(response.body.leaderboard)).toBe(true);
    });

    it('should include leaderboard entry properties', async () => {
      const response = await request(app)
        .get('/api/referral/leaderboard');

      expect(response.status).toBe(200);
      if (response.body.leaderboard.length > 0) {
        const entry = response.body.leaderboard[0];
        expect(entry).toHaveProperty('rank');
        expect(entry).toHaveProperty('agentId');
        expect(entry).toHaveProperty('username');
        expect(entry).toHaveProperty('totalReferrals');
        expect(entry).toHaveProperty('totalEarnings');
      }
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/referral/leaderboard')
        .query({ limit: '5' });

      expect(response.status).toBe(200);
      expect(response.body.leaderboard.length).toBeLessThanOrEqual(5);
    });
  });
});
