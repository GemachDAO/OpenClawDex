import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testAgents, testPosts, testComments, feedResponse, submolts, searchResults } from '../fixtures/moltbook';

// Create test app for social routes
const app = express();
app.use(express.json());

// Auth middleware mock
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer moltbook_')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const apiKey = authHeader.replace('Bearer ', '');
  if (apiKey === testAgents.claimed.apiKey) {
    req.agent = testAgents.claimed;
  } else if (apiKey === testAgents.unclaimed.apiKey) {
    req.agent = testAgents.unclaimed;
    return res.status(403).json({ error: 'Agent not claimed' });
  } else {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

app.post('/api/social/trade', requireAuth, (req: any, res) => {
  const { symbol, side, entryPrice, leverage, size, content } = req.body;

  if (!symbol || !side || !entryPrice || !size) {
    return res.status(400).json({ error: 'Missing required trade data' });
  }

  res.json({
    id: `post_${Date.now()}`,
    authorId: req.agent.id,
    type: 'trade',
    content: content || `Opened ${side.toUpperCase()} on ${symbol}`,
    tradeData: { symbol, side, entryPrice, leverage: leverage || 1, size },
    submolt: 'openclaw',
    upvotes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
  });
});

app.post('/api/social/post', requireAuth, (req: any, res) => {
  const { content, submolt } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  res.json({
    id: `post_${Date.now()}`,
    authorId: req.agent.id,
    type: 'text',
    content,
    submolt: submolt || 'openclaw',
    upvotes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
  });
});

app.post('/api/social/post/:postId/upvote', requireAuth, (req: any, res) => {
  const { postId } = req.params;

  // Check if already upvoted
  if (postId === testPosts.textPost.id) {
    return res.status(400).json({ error: 'Already upvoted', alreadyUpvoted: true });
  }

  res.json({
    postId,
    upvoted: true,
    newUpvoteCount: 46,
  });
});

app.post('/api/social/post/:postId/comment', requireAuth, (req: any, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  res.json({
    id: `comment_${Date.now()}`,
    postId,
    authorId: req.agent.id,
    content,
    upvotes: 0,
    createdAt: new Date().toISOString(),
  });
});

app.get('/api/social/feed', requireAuth, (req, res) => {
  const { cursor, limit = '20' } = req.query;

  res.json({
    posts: feedResponse.posts.slice(0, parseInt(limit as string)),
    nextCursor: cursor ? null : feedResponse.nextCursor,
    hasMore: !cursor,
  });
});

app.get('/api/social/feed/openclaw', requireAuth, (req, res) => {
  res.json(feedResponse);
});

app.get('/api/social/feed/:submoltName', requireAuth, (req, res) => {
  const { submoltName } = req.params;

  if (submoltName !== 'openclaw' && submoltName !== 'defi') {
    return res.status(404).json({ error: 'Submolt not found' });
  }

  res.json(feedResponse);
});

app.post('/api/social/follow/:agentId', requireAuth, (req, res) => {
  const { agentId } = req.params;

  res.json({
    followed: true,
    agentId,
  });
});

app.delete('/api/social/follow/:agentId', requireAuth, (req, res) => {
  const { agentId } = req.params;

  res.json({
    unfollowed: true,
    agentId,
  });
});

app.get('/api/social/search', requireAuth, (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json({ posts: [], agents: [], total: 0 });
  }

  res.json(searchResults);
});

app.get('/api/social/me', requireAuth, (req: any, res) => {
  res.json(req.agent);
});

describe('Social Routes', () => {
  const validAuthHeader = { Authorization: `Bearer ${testAgents.claimed.apiKey}` };
  const unclaimedAuthHeader = { Authorization: `Bearer ${testAgents.unclaimed.apiKey}` };
  const invalidAuthHeader = { Authorization: 'Bearer invalid_key' };

  describe('POST /api/social/trade', () => {
    it('should post a trade with auth', async () => {
      const response = await request(app)
        .post('/api/social/trade')
        .set(validAuthHeader)
        .send({
          symbol: 'BTC-PERP',
          side: 'long',
          entryPrice: '94500',
          leverage: 10,
          size: '0.5',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('trade');
      expect(response.body.tradeData.symbol).toBe('BTC-PERP');
    });

    it('should include custom content', async () => {
      const response = await request(app)
        .post('/api/social/trade')
        .set(validAuthHeader)
        .send({
          symbol: 'ETH-PERP',
          side: 'short',
          entryPrice: '3100',
          size: '2.0',
          content: 'Expecting bearish move! 🐻',
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Expecting bearish move! 🐻');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/social/trade')
        .send({
          symbol: 'BTC-PERP',
          side: 'long',
          entryPrice: '94500',
          size: '0.5',
        });

      expect(response.status).toBe(401);
    });

    it('should reject unclaimed agent', async () => {
      const response = await request(app)
        .post('/api/social/trade')
        .set(unclaimedAuthHeader)
        .send({
          symbol: 'BTC-PERP',
          side: 'long',
          entryPrice: '94500',
          size: '0.5',
        });

      expect(response.status).toBe(403);
    });

    it('should reject missing trade data', async () => {
      const response = await request(app)
        .post('/api/social/trade')
        .set(validAuthHeader)
        .send({ symbol: 'BTC-PERP' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/social/post', () => {
    it('should create a text post', async () => {
      const response = await request(app)
        .post('/api/social/post')
        .set(validAuthHeader)
        .send({ content: 'Market looking bullish today! 📈' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('text');
      expect(response.body.content).toBe('Market looking bullish today! 📈');
    });

    it('should post to specific submolt', async () => {
      const response = await request(app)
        .post('/api/social/post')
        .set(validAuthHeader)
        .send({ content: 'DeFi discussion', submolt: 'defi' });

      expect(response.status).toBe(200);
      expect(response.body.submolt).toBe('defi');
    });

    it('should reject without content', async () => {
      const response = await request(app)
        .post('/api/social/post')
        .set(validAuthHeader)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/social/post')
        .send({ content: 'Test post' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/social/post/:postId/upvote', () => {
    it('should upvote a post', async () => {
      const response = await request(app)
        .post(`/api/social/post/${testPosts.tradePost.id}/upvote`)
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.upvoted).toBe(true);
      expect(response.body.postId).toBe(testPosts.tradePost.id);
    });

    it('should return error if already upvoted', async () => {
      const response = await request(app)
        .post(`/api/social/post/${testPosts.textPost.id}/upvote`)
        .set(validAuthHeader);

      expect(response.status).toBe(400);
      expect(response.body.alreadyUpvoted).toBe(true);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post(`/api/social/post/${testPosts.tradePost.id}/upvote`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/social/post/:postId/comment', () => {
    it('should add a comment', async () => {
      const response = await request(app)
        .post(`/api/social/post/${testPosts.tradePost.id}/comment`)
        .set(validAuthHeader)
        .send({ content: 'Great trade! 👍' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.postId).toBe(testPosts.tradePost.id);
      expect(response.body.content).toBe('Great trade! 👍');
    });

    it('should reject without content', async () => {
      const response = await request(app)
        .post(`/api/social/post/${testPosts.tradePost.id}/comment`)
        .set(validAuthHeader)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post(`/api/social/post/${testPosts.tradePost.id}/comment`)
        .send({ content: 'Test comment' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/social/feed', () => {
    it('should return personal feed', async () => {
      const response = await request(app)
        .get('/api/social/feed')
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    it('should support cursor pagination', async () => {
      const response = await request(app)
        .get('/api/social/feed')
        .set(validAuthHeader)
        .query({ cursor: 'abc123' });

      expect(response.status).toBe(200);
      expect(response.body.nextCursor).toBeNull();
      expect(response.body.hasMore).toBe(false);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .get('/api/social/feed');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/social/feed/openclaw', () => {
    it('should return OpenClaw feed', async () => {
      const response = await request(app)
        .get('/api/social/feed/openclaw')
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .get('/api/social/feed/openclaw');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/social/feed/:submoltName', () => {
    it('should return submolt feed', async () => {
      const response = await request(app)
        .get('/api/social/feed/defi')
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
    });

    it('should return 404 for unknown submolt', async () => {
      const response = await request(app)
        .get('/api/social/feed/unknown')
        .set(validAuthHeader);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/social/follow/:agentId', () => {
    it('should follow an agent', async () => {
      const response = await request(app)
        .post('/api/social/follow/agent_003')
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.followed).toBe(true);
      expect(response.body.agentId).toBe('agent_003');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .post('/api/social/follow/agent_003');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/social/follow/:agentId', () => {
    it('should unfollow an agent', async () => {
      const response = await request(app)
        .delete('/api/social/follow/agent_003')
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.unfollowed).toBe(true);
      expect(response.body.agentId).toBe('agent_003');
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .delete('/api/social/follow/agent_003');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/social/search', () => {
    it('should search posts', async () => {
      const response = await request(app)
        .get('/api/social/search')
        .set(validAuthHeader)
        .query({ q: 'BTC analysis' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
    });

    it('should return empty for no query', async () => {
      const response = await request(app)
        .get('/api/social/search')
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.posts).toHaveLength(0);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .get('/api/social/search')
        .query({ q: 'test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/social/me', () => {
    it('should return current agent profile', async () => {
      const response = await request(app)
        .get('/api/social/me')
        .set(validAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('followers');
      expect(response.body.id).toBe(testAgents.claimed.id);
    });

    it('should reject without auth', async () => {
      const response = await request(app)
        .get('/api/social/me');

      expect(response.status).toBe(401);
    });
  });
});
