import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock auth middleware types
interface AuthRequest extends Request {
  agent?: {
    id: string;
    username: string;
    apiKey: string;
    permissions: string[];
    claimed: boolean;
  };
  walletAddress?: string;
}

// Create auth middleware factory for testing
const createAuthMiddleware = (options: {
  validateApiKey: (key: string) => Promise<any>;
  requireClaimed?: boolean;
  requiredPermissions?: string[];
}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    const apiKey = authHeader.replace('Bearer ', '');

    try {
      const validation = await options.validateApiKey(apiKey);

      if (!validation.valid) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      if (options.requireClaimed && !validation.agent.claimed) {
        return res.status(403).json({ error: 'Agent not claimed' });
      }

      if (options.requiredPermissions) {
        const hasPermissions = options.requiredPermissions.every(
          p => validation.agent.permissions.includes(p)
        );
        if (!hasPermissions) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      req.agent = validation.agent;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authentication service error' });
    }
  };
};

// Create wallet auth middleware factory
const createWalletAuthMiddleware = (options: {
  verifySignature: (message: string, signature: string, address: string) => Promise<boolean>;
}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Wallet address, signature, and message required' });
    }

    try {
      const isValid = await options.verifySignature(message, signature, walletAddress);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      req.walletAddress = walletAddress;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Signature verification failed' });
    }
  };
};

// Rate limiting middleware factory
const createRateLimitMiddleware = (options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || 'unknown';

    const now = Date.now();
    const record = requests.get(key);

    if (!record || now > record.resetTime) {
      requests.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.maxRequests) {
      res.set('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)));
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    record.count++;
    next();
  };
};

describe('Auth Middleware', () => {
  describe('API Key Authentication', () => {
    let app: express.Application;
    let mockValidateApiKey: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      mockValidateApiKey = vi.fn();
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should reject requests without authorization header', async () => {
      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
      });

      app.get('/protected', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Authorization header');
    });

    it('should reject requests with invalid format', async () => {
      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
      });

      app.get('/protected', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Basic invalid');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid authorization format');
    });

    it('should reject invalid API keys', async () => {
      mockValidateApiKey.mockResolvedValueOnce({ valid: false });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
      });

      app.get('/protected', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid_key');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid API key');
    });

    it('should allow valid API keys', async () => {
      mockValidateApiKey.mockResolvedValueOnce({
        valid: true,
        agent: {
          id: 'agent_001',
          username: 'test_agent',
          claimed: true,
          permissions: ['read', 'write'],
        },
      });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
      });

      app.get('/protected', authMiddleware, (req: AuthRequest, res) => {
        res.json({ ok: true, agentId: req.agent?.id });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer moltbook_valid_key');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.agentId).toBe('agent_001');
    });

    it('should reject unclaimed agents when required', async () => {
      mockValidateApiKey.mockResolvedValueOnce({
        valid: true,
        agent: {
          id: 'agent_unclaimed',
          username: 'unclaimed_agent',
          claimed: false,
          permissions: ['read'],
        },
      });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
        requireClaimed: true,
      });

      app.get('/protected', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer moltbook_unclaimed_key');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not claimed');
    });

    it('should allow unclaimed agents when not required', async () => {
      mockValidateApiKey.mockResolvedValueOnce({
        valid: true,
        agent: {
          id: 'agent_unclaimed',
          username: 'unclaimed_agent',
          claimed: false,
          permissions: ['read'],
        },
      });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
        requireClaimed: false,
      });

      app.get('/protected', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer moltbook_unclaimed_key');

      expect(response.status).toBe(200);
    });

    it('should enforce required permissions', async () => {
      mockValidateApiKey.mockResolvedValueOnce({
        valid: true,
        agent: {
          id: 'agent_001',
          username: 'limited_agent',
          claimed: true,
          permissions: ['read'],
        },
      });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
        requiredPermissions: ['read', 'write', 'trade'],
      });

      app.post('/trade', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .post('/trade')
        .set('Authorization', 'Bearer moltbook_limited_key');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should allow agents with required permissions', async () => {
      mockValidateApiKey.mockResolvedValueOnce({
        valid: true,
        agent: {
          id: 'agent_001',
          username: 'full_agent',
          claimed: true,
          permissions: ['read', 'write', 'trade'],
        },
      });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
        requiredPermissions: ['read', 'trade'],
      });

      app.post('/trade', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .post('/trade')
        .set('Authorization', 'Bearer moltbook_full_key');

      expect(response.status).toBe(200);
    });

    it('should handle authentication service errors', async () => {
      mockValidateApiKey.mockRejectedValueOnce(new Error('Service unavailable'));

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
      });

      app.get('/protected', authMiddleware, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer moltbook_valid_key');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Authentication service error');
    });
  });

  describe('Wallet Authentication', () => {
    let app: express.Application;
    let mockVerifySignature: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      mockVerifySignature = vi.fn();
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should reject requests without wallet address', async () => {
      const walletAuth = createWalletAuthMiddleware({
        verifySignature: mockVerifySignature,
      });

      app.post('/sign-action', walletAuth, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .post('/sign-action')
        .send({ signature: '0x123', message: 'test' });

      expect(response.status).toBe(400);
    });

    it('should reject requests without signature', async () => {
      const walletAuth = createWalletAuthMiddleware({
        verifySignature: mockVerifySignature,
      });

      app.post('/sign-action', walletAuth, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .post('/sign-action')
        .send({ walletAddress: '0x123', message: 'test' });

      expect(response.status).toBe(400);
    });

    it('should reject invalid signatures', async () => {
      mockVerifySignature.mockResolvedValueOnce(false);

      const walletAuth = createWalletAuthMiddleware({
        verifySignature: mockVerifySignature,
      });

      app.post('/sign-action', walletAuth, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .post('/sign-action')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          signature: '0x' + 'a'.repeat(130),
          message: 'Sign this message',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid signature');
    });

    it('should allow valid signatures', async () => {
      mockVerifySignature.mockResolvedValueOnce(true);

      const walletAuth = createWalletAuthMiddleware({
        verifySignature: mockVerifySignature,
      });

      app.post('/sign-action', walletAuth, (req: AuthRequest, res) => {
        res.json({ ok: true, wallet: req.walletAddress });
      });

      const response = await request(app)
        .post('/sign-action')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          signature: '0x' + 'a'.repeat(130),
          message: 'Sign this message',
        });

      expect(response.status).toBe(200);
      expect(response.body.wallet).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should handle signature verification errors', async () => {
      mockVerifySignature.mockRejectedValueOnce(new Error('Verification failed'));

      const walletAuth = createWalletAuthMiddleware({
        verifySignature: mockVerifySignature,
      });

      app.post('/sign-action', walletAuth, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .post('/sign-action')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
          signature: '0x' + 'a'.repeat(130),
          message: 'Sign this message',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('Rate Limiting', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
    });

    it('should allow requests within limit', async () => {
      const rateLimiter = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 5,
      });

      app.get('/api', rateLimiter, (req, res) => res.json({ ok: true }));

      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/api');
        expect(response.status).toBe(200);
      }
    });

    it('should block requests over limit', async () => {
      const rateLimiter = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
      });

      app.get('/api', rateLimiter, (req, res) => res.json({ ok: true }));

      await request(app).get('/api');
      await request(app).get('/api');
      
      const response = await request(app).get('/api');
      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Rate limit');
    });

    it('should include Retry-After header', async () => {
      const rateLimiter = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
      });

      app.get('/api', rateLimiter, (req, res) => res.json({ ok: true }));

      await request(app).get('/api');
      
      const response = await request(app).get('/api');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should use custom key generator', async () => {
      const rateLimiter = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (req) => req.headers['x-api-key'] as string || 'anonymous',
      });

      app.get('/api', rateLimiter, (req, res) => res.json({ ok: true }));

      // Different keys should have separate limits
      await request(app).get('/api').set('X-API-Key', 'key1');
      await request(app).get('/api').set('X-API-Key', 'key1');
      const response1 = await request(app).get('/api').set('X-API-Key', 'key1');
      expect(response1.status).toBe(429);

      // Different key should still work
      const response2 = await request(app).get('/api').set('X-API-Key', 'key2');
      expect(response2.status).toBe(200);
    });
  });

  describe('Combined Authentication', () => {
    let app: express.Application;
    let mockValidateApiKey: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      mockValidateApiKey = vi.fn();
    });

    it('should combine API key auth with rate limiting', async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        agent: {
          id: 'agent_001',
          claimed: true,
          permissions: ['read'],
        },
      });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
      });

      const rateLimiter = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (req) => {
          const authHeader = req.headers.authorization;
          return authHeader?.replace('Bearer ', '') || 'anonymous';
        },
      });

      app.get('/api', rateLimiter, authMiddleware, (req, res) => res.json({ ok: true }));

      const validKey = 'moltbook_valid_key';
      
      await request(app).get('/api').set('Authorization', `Bearer ${validKey}`);
      await request(app).get('/api').set('Authorization', `Bearer ${validKey}`);
      
      const response = await request(app).get('/api').set('Authorization', `Bearer ${validKey}`);
      expect(response.status).toBe(429);
    });

    it('should fail auth before rate limit check', async () => {
      mockValidateApiKey.mockResolvedValueOnce({ valid: false });

      const authMiddleware = createAuthMiddleware({
        validateApiKey: mockValidateApiKey,
      });

      const rateLimiter = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 100,
      });

      // Auth first, then rate limit
      app.get('/api', authMiddleware, rateLimiter, (req, res) => res.json({ ok: true }));

      const response = await request(app)
        .get('/api')
        .set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(401);
    });
  });
});
