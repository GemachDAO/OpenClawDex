/**
 * Referral Routes
 * 
 * API endpoints for referral link management, tracking, and sharing.
 */

import { Router, Response } from 'express';
import {
  generateReferralLink,
  trackReferral,
  getReferralStats,
  getReferralLink,
  getAgentReferrals,
  validateReferralCode,
  deactivateReferralLink,
  shareToMoltbook,
  shareToOtherPlatforms,
  getReferralLeaderboard,
  getAllTiers,
  getTierInfo,
  ReferralTier,
} from '../services/referral.service.js';
import {
  requireAuth,
  rateLimit,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Link Management
// ============================================================================

/**
 * POST /api/referral/link
 * Generate a new referral link
 */
router.post('/link', requireAuth, rateLimit({ maxRequests: 10, windowMs: 60000 }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customCode, expiresIn, maxUses } = req.body;

    const link = generateReferralLink(
      req.agent!.name, // Using agent name as ID for now
      req.agent!.name,
      {
        customCode,
        expiresIn: expiresIn ? Number(expiresIn) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
      }
    );

    res.json({
      success: true,
      message: 'Referral link created',
      link: {
        code: link.code,
        url: link.url,
        shortUrl: link.shortUrl,
        expiresAt: link.expiresAt,
        maxUses: link.maxUses,
        currentUses: link.currentUses,
      },
    });
  } catch (error) {
    logger.error('Error generating referral link', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/referral/link/:code
 * Get referral link info
 */
router.get('/link/:code', async (req, res: Response) => {
  try {
    const { code } = req.params;
    const link = getReferralLink(code);

    if (!link) {
      res.status(404).json({
        success: false,
        error: 'Referral link not found',
      });
      return;
    }

    res.json({
      success: true,
      link: {
        code: link.code,
        agentName: link.agentName,
        url: link.url,
        shortUrl: link.shortUrl,
        isActive: link.isActive,
        expiresAt: link.expiresAt,
        currentUses: link.currentUses,
        maxUses: link.maxUses,
      },
    });
  } catch (error) {
    logger.error('Error fetching referral link', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/referral/link/:code
 * Deactivate a referral link
 */
router.delete('/link/:code', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    
    const success = deactivateReferralLink(code, req.agent!.name);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Referral link not found or not owned by you',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Referral link deactivated',
    });
  } catch (error) {
    logger.error('Error deactivating referral link', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/referral/validate/:code
 * Validate a referral code
 */
router.get('/validate/:code', async (req, res: Response) => {
  try {
    const { code } = req.params;
    const result = validateReferralCode(code);

    res.json({
      success: true,
      valid: result.valid,
      error: result.error,
      referrer: result.link?.agentName,
    });
  } catch (error) {
    logger.error('Error validating referral code', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Tracking
// ============================================================================

/**
 * POST /api/referral/track
 * Track a referral (when new agent signs up with code)
 */
router.post('/track', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      res.status(400).json({
        success: false,
        error: 'Referral code is required',
      });
      return;
    }

    const result = trackReferral(
      referralCode,
      req.agent!.name, // Using agent name as ID
      req.agent!.name
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Referral tracked successfully',
      referralId: result.record?.id,
    });
  } catch (error) {
    logger.error('Error tracking referral', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Stats
// ============================================================================

/**
 * GET /api/referral/stats
 * Get referral stats for authenticated agent
 */
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = getReferralStats(req.agent!.name);

    if (!stats) {
      // Return empty stats for new agents
      res.json({
        success: true,
        stats: {
          totalReferrals: 0,
          activeReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          tier: 'bronze',
          links: [],
        },
      });
      return;
    }

    res.json({
      success: true,
      stats: {
        totalReferrals: stats.totalReferrals,
        activeReferrals: stats.activeReferrals,
        totalEarnings: stats.totalEarnings,
        pendingEarnings: stats.pendingEarnings,
        tier: stats.tier,
        links: stats.referralLinks.map((link) => ({
          code: link.code,
          shortUrl: link.shortUrl,
          currentUses: link.currentUses,
          maxUses: link.maxUses,
          isActive: link.isActive,
          createdAt: link.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error('Error fetching referral stats', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/referral/referrals
 * Get list of agents referred by authenticated agent
 */
router.get('/referrals', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const referrals = getAgentReferrals(req.agent!.name);

    res.json({
      success: true,
      referrals: referrals.map((r) => ({
        id: r.id,
        agentName: r.referredAgentName,
        status: r.status,
        tradingVolume: r.tradingVolume,
        earnings: r.earnings,
        createdAt: r.createdAt,
        activatedAt: r.activatedAt,
      })),
      count: referrals.length,
    });
  } catch (error) {
    logger.error('Error fetching referrals', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Sharing
// ============================================================================

/**
 * POST /api/referral/share/moltbook
 * Share referral link to Moltbook
 */
router.post('/share/moltbook', requireAuth, rateLimit({ maxRequests: 5, windowMs: 3600000 }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Referral code is required',
      });
      return;
    }

    const link = getReferralLink(code);
    if (!link || link.agentId !== req.agent!.name) {
      res.status(404).json({
        success: false,
        error: 'Referral link not found or not owned by you',
      });
      return;
    }

    const result = await shareToMoltbook(req.apiKey!, req.agent!.name, link);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: 'Failed to share to Moltbook',
        message: result.error,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Referral shared to Moltbook m/openclaw',
    });
  } catch (error) {
    logger.error('Error sharing to Moltbook', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/referral/share/generate
 * Generate share messages for other platforms
 */
router.post('/share/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, platforms } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Referral code is required',
      });
      return;
    }

    const link = getReferralLink(code);
    if (!link || link.agentId !== req.agent!.name) {
      res.status(404).json({
        success: false,
        error: 'Referral link not found or not owned by you',
      });
      return;
    }

    const requestedPlatforms = platforms || ['twitter', 'discord', 'telegram'];
    const messages = await shareToOtherPlatforms(
      req.agent!.name,
      link,
      requestedPlatforms
    );

    res.json({
      success: true,
      referralUrl: link.shortUrl,
      messages,
    });
  } catch (error) {
    logger.error('Error generating share messages', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Tiers & Leaderboard
// ============================================================================

/**
 * GET /api/referral/tiers
 * Get all referral tier information
 */
router.get('/tiers', async (_req, res: Response) => {
  try {
    const tiers = getAllTiers();

    res.json({
      success: true,
      tiers,
    });
  } catch (error) {
    logger.error('Error fetching tiers', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/referral/tiers/:tier
 * Get specific tier information
 */
router.get('/tiers/:tier', async (req, res: Response) => {
  try {
    const { tier } = req.params;
    const validTiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    if (!validTiers.includes(tier)) {
      res.status(400).json({
        success: false,
        error: 'Invalid tier',
        validTiers,
      });
      return;
    }

    const tierInfo = getTierInfo(tier as ReferralTier);

    res.json({
      success: true,
      tier: tierInfo,
    });
  } catch (error) {
    logger.error('Error fetching tier info', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/referral/leaderboard
 * Get referral leaderboard
 */
router.get('/leaderboard', async (req, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const leaderboard = getReferralLeaderboard(limit);

    res.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    logger.error('Error fetching leaderboard', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
