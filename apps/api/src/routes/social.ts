/**
 * Social Routes
 * 
 * API endpoints for Moltbook social integration.
 * Handles posting trades, fetching feeds, and social interactions.
 */

import { Router, Response } from 'express';
import { 
  postTrade, 
  createPost, 
  getFeed, 
  getSubmoltFeed, 
  upvotePost,
  commentOnPost,
  followAgent,
  unfollowAgent,
  search,
  getAgentProfile,
  TradeResult,
  OPENCLAW_SUBMOLT
} from '../services/moltbook.service.js';
import { 
  requireAuth, 
  optionalAuth, 
  rateLimit,
  AuthenticatedRequest 
} from '../middleware/auth.js';

const router = Router();

// ============================================================================
// Trade Posting
// ============================================================================

/**
 * POST /api/social/trade
 * Post a trade result to Moltbook m/openclaw
 */
router.post('/trade', requireAuth, rateLimit({ maxRequests: 30, windowMs: 60000 }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, tokenIn, tokenOut, amountIn, amountOut, pnl, pnlPercent, leverage, position, chain, txHash } = req.body;

    // Validate required fields
    if (!type || !tokenIn || !chain) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['type', 'tokenIn', 'chain'],
      });
      return;
    }

    // Validate trade type
    const validTypes = ['swap', 'leverage_open', 'leverage_close', 'meme_buy', 'meme_sell'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid trade type',
        validTypes,
      });
      return;
    }

    const trade: TradeResult = {
      type,
      tokenIn,
      tokenOut,
      amountIn: Number(amountIn),
      amountOut: amountOut ? Number(amountOut) : undefined,
      pnl: pnl ? Number(pnl) : undefined,
      pnlPercent: pnlPercent ? Number(pnlPercent) : undefined,
      leverage: leverage ? Number(leverage) : undefined,
      position,
      chain,
      txHash,
    };

    const result = await postTrade(req.apiKey!, trade, req.agent!.name);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: 'Failed to post trade',
        message: result.error,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Trade posted to m/openclaw',
      post: result.post,
    });
  } catch (error) {
    console.error('Error posting trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Posts
// ============================================================================

/**
 * POST /api/social/post
 * Create a custom post on Moltbook
 */
router.post('/post', requireAuth, rateLimit({ maxRequests: 10, windowMs: 60000 }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submolt = OPENCLAW_SUBMOLT, title, content, url } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        error: 'Title is required',
      });
      return;
    }

    if (!content && !url) {
      res.status(400).json({
        success: false,
        error: 'Either content or url is required',
      });
      return;
    }

    const result = await createPost(req.apiKey!, { submolt, title, content, url });

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: 'Failed to create post',
        message: result.error,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Post created',
      post: result.post,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/social/posts/:postId/upvote
 * Upvote a post
 */
router.post('/posts/:postId/upvote', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const success = await upvotePost(req.apiKey!, postId);

    if (!success) {
      res.status(500).json({
        success: false,
        error: 'Failed to upvote post',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Post upvoted',
    });
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/social/posts/:postId/comment
 * Add a comment to a post
 */
router.post('/posts/:postId/comment', requireAuth, rateLimit({ maxRequests: 20, windowMs: 60000 }), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Content is required',
      });
      return;
    }

    const success = await commentOnPost(req.apiKey!, postId, content, parentId);

    if (!success) {
      res.status(500).json({
        success: false,
        error: 'Failed to add comment',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Comment added',
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Feeds
// ============================================================================

/**
 * GET /api/social/feed
 * Get personalized feed (requires auth)
 */
router.get('/feed', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sort = (req.query.sort as 'hot' | 'new' | 'top') || 'hot';
    const limit = Math.min(Number(req.query.limit) || 25, 100);

    const posts = await getFeed(req.apiKey!, sort, limit);

    res.json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/social/feed/openclaw
 * Get m/openclaw feed
 */
router.get('/feed/openclaw', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sort = (req.query.sort as 'hot' | 'new' | 'top') || 'new';
    const limit = Math.min(Number(req.query.limit) || 25, 100);

    const posts = await getSubmoltFeed(req.apiKey!, OPENCLAW_SUBMOLT, sort, limit);

    res.json({
      success: true,
      submolt: OPENCLAW_SUBMOLT,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching openclaw feed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/social/feed/:submolt
 * Get feed for a specific submolt
 */
router.get('/feed/:submolt', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submolt } = req.params;
    const sort = (req.query.sort as 'hot' | 'new' | 'top') || 'hot';
    const limit = Math.min(Number(req.query.limit) || 25, 100);

    const posts = await getSubmoltFeed(req.apiKey!, submolt, sort, limit);

    res.json({
      success: true,
      submolt,
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching submolt feed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Following
// ============================================================================

/**
 * POST /api/social/follow/:agentName
 * Follow another agent
 */
router.post('/follow/:agentName', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentName } = req.params;

    const success = await followAgent(req.apiKey!, agentName);

    if (!success) {
      res.status(500).json({
        success: false,
        error: 'Failed to follow agent',
      });
      return;
    }

    res.json({
      success: true,
      message: `Now following ${agentName}`,
    });
  } catch (error) {
    console.error('Error following agent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/social/follow/:agentName
 * Unfollow an agent
 */
router.delete('/follow/:agentName', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentName } = req.params;

    const success = await unfollowAgent(req.apiKey!, agentName);

    if (!success) {
      res.status(500).json({
        success: false,
        error: 'Failed to unfollow agent',
      });
      return;
    }

    res.json({
      success: true,
      message: `Unfollowed ${agentName}`,
    });
  } catch (error) {
    console.error('Error unfollowing agent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Search
// ============================================================================

/**
 * GET /api/social/search
 * Semantic search on Moltbook
 */
router.get('/search', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const results = await search(req.apiKey!, query, limit);

    res.json({
      success: true,
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// Profile
// ============================================================================

/**
 * GET /api/social/me
 * Get authenticated agent's Moltbook profile
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await getAgentProfile(req.apiKey!);

    if (!profile) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
      });
      return;
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
