/**
 * Authentication Middleware
 * 
 * Validates agent authentication via Moltbook API keys.
 * Supports both required and optional authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { validateAgent, getAgentProfile, MoltbookAgentProfile } from '../services/moltbook.service.js';
import logger from '../utils/logger.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended request with authenticated agent info
 */
export interface AuthenticatedRequest extends Request {
  agent?: MoltbookAgentProfile;
  apiKey?: string;
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Extract API key from request
 * Supports: Authorization header (Bearer token), X-API-Key header, query param
 */
function extractApiKey(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  // Check query parameter (less secure, but useful for testing)
  const queryKey = req.query.api_key;
  if (typeof queryKey === 'string') {
    return queryKey;
  }

  return null;
}

/**
 * Required authentication middleware
 * Returns 401 if no valid API key is provided
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide a Moltbook API key via Authorization header (Bearer token) or X-API-Key header',
    });
    return;
  }

  // Validate with Moltbook
  const validation = await validateAgent(apiKey);

  if (!validation.valid) {
    res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: validation.error || 'The provided Moltbook API key is invalid',
    });
    return;
  }

  // Check if agent is claimed
  if (validation.agent?.status === 'pending_claim') {
    res.status(403).json({
      success: false,
      error: 'Agent not claimed',
      message: 'Your agent must be claimed by a human before using this API. Visit your claim URL to complete registration.',
    });
    return;
  }

  // Attach agent info to request
  req.agent = validation.agent;
  req.apiKey = apiKey;

  next();
}

/**
 * Optional authentication middleware
 * Continues even without auth, but attaches agent info if available
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (apiKey) {
    const validation = await validateAgent(apiKey);
    if (validation.valid && validation.agent?.status === 'claimed') {
      req.agent = validation.agent;
      req.apiKey = apiKey;
    }
  }

  next();
}

/**
 * Require claimed agent (stronger check)
 * Returns 403 if agent exists but is not claimed
 */
export async function requireClaimedAgent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide a Moltbook API key',
    });
    return;
  }

  // Get full profile to verify claimed status
  const profile = await getAgentProfile(apiKey);

  if (!profile) {
    res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided Moltbook API key is invalid',
    });
    return;
  }

  if (profile.status !== 'claimed') {
    res.status(403).json({
      success: false,
      error: 'Agent not claimed',
      message: 'Your agent must be claimed by a human before accessing this resource',
      hint: 'Complete the claim process on Moltbook first',
    });
    return;
  }

  req.agent = profile;
  req.apiKey = apiKey;

  next();
}

/**
 * Rate limiting middleware (basic implementation)
 * Limits requests per agent per time window
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(options: {
  windowMs?: number;
  maxRequests?: number;
} = {}) {
  const { windowMs = 60000, maxRequests = 100 } = options;

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const key = req.apiKey || req.ip || 'anonymous';
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitMap.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetAt);

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please wait ${Math.ceil((record.resetAt - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

// ============================================================================
// Helper Middleware
// ============================================================================

/**
 * Log authenticated requests
 */
export function logAuthenticatedRequest(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (req.agent) {
    logger.debug(`${req.method} ${req.path} - Agent: ${req.agent.name}`);
  }
  next();
}

/**
 * Ensure HTTPS in production (Moltbook requires HTTPS for API key security)
 */
export function requireHttps(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    res.status(403).json({
      success: false,
      error: 'HTTPS required',
      message: 'This endpoint requires HTTPS in production',
    });
    return;
  }
  next();
}

// ============================================================================
// Export
// ============================================================================

export const authMiddleware = {
  requireAuth,
  optionalAuth,
  requireClaimedAgent,
  rateLimit,
  logAuthenticatedRequest,
  requireHttps,
  extractApiKey,
};

export default authMiddleware;
