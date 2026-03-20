/**
 * Leaderboard Routes
 * 
 * REST API endpoints for agent trading leaderboard:
 * - GET /api/leaderboard - Get agent leaderboard rankings
 */

import { Router, Request, Response } from 'express';
import { getLeaderboard, LeaderboardTimeframe } from '../services/leaderboard.service.js';

const router = Router();

/**
 * GET /api/leaderboard
 * Get agent trading leaderboard
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      timeframe = 'daily',
      limit = '10',
      sortBy = 'pnl',
    } = req.query;

    const validTimeframes = ['daily', 'weekly', 'monthly', 'all'];
    const validSortBy = ['pnl', 'winRate', 'followers'];

    if (!validTimeframes.includes(timeframe as string)) {
      res.status(400).json({
        success: false,
        error: `timeframe must be one of: ${validTimeframes.join(', ')}`,
      });
      return;
    }

    if (!validSortBy.includes(sortBy as string)) {
      res.status(400).json({
        success: false,
        error: `sortBy must be one of: ${validSortBy.join(', ')}`,
      });
      return;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 50);

    const leaderboard = await getLeaderboard(
      timeframe as LeaderboardTimeframe,
      parsedLimit,
      sortBy as 'pnl' | 'winRate' | 'followers'
    );

    res.json({
      success: true,
      data: leaderboard,
      count: leaderboard.length,
      timeframe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leaderboard',
    });
  }
});

export default router;
