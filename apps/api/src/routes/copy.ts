/**
 * Copy Trading Routes
 * 
 * REST API endpoints for Hyperliquid copy trading:
 * - GET /api/copy/traders - Get top traders
 * - GET /api/copy/traders/:id - Get trader details
 * - GET /api/copy/traders/:id/positions - Get trader's positions
 * - GET /api/copy/following - Get traders being followed
 * - POST /api/copy/follow - Follow a trader
 * - POST /api/copy/unfollow - Unfollow a trader
 * - PUT /api/copy/settings - Update copy settings
 * - PUT /api/copy/toggle - Pause/resume copy trading
 * - GET /api/copy/history - Get copy trade history
 */

import { Router, Request, Response } from 'express';
import {
  getTopTraders,
  getTraderDetails,
  getTraderPositions,
  getFollowedTraders,
  followTrader,
  unfollowTrader,
  updateCopySettings,
  toggleCopyTrading,
  getCopyTradeHistory,
  CopyTradeSettings,
} from '../services/hyperliquid.service.js';

const router = Router();

/**
 * GET /api/copy/traders
 * Get top traders for copy trading
 */
router.get('/traders', async (req: Request, res: Response) => {
  try {
    const {
      limit = '20',
      sortBy = 'pnl',
      timeframe = '30d',
    } = req.query;

    const validSortBy = ['pnl', 'winRate', 'followers', 'aum'];
    const validTimeframe = ['7d', '30d', '90d', 'all'];

    if (!validSortBy.includes(sortBy as string)) {
      return res.status(400).json({
        success: false,
        error: 'sortBy must be one of: pnl, winRate, followers, aum',
      });
    }

    if (!validTimeframe.includes(timeframe as string)) {
      return res.status(400).json({
        success: false,
        error: 'timeframe must be one of: 7d, 30d, 90d, all',
      });
    }

    const traders = await getTopTraders(
      Math.min(parseInt(limit as string, 10), 100),
      sortBy as 'pnl' | 'winRate' | 'followers' | 'aum',
      timeframe as '7d' | '30d' | '90d' | 'all'
    );

    res.json({
      success: true,
      data: traders,
      count: traders.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get top traders',
    });
  }
});

/**
 * GET /api/copy/traders/:id
 * Get trader details
 */
router.get('/traders/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const trader = await getTraderDetails(id);

    if (!trader) {
      return res.status(404).json({
        success: false,
        error: 'Trader not found',
      });
    }

    res.json({
      success: true,
      data: trader,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get trader details',
    });
  }
});

/**
 * GET /api/copy/traders/:id/positions
 * Get trader's recent positions
 */
router.get('/traders/:id/positions', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { limit = '20' } = req.query;

    const positions = await getTraderPositions(
      id,
      Math.min(parseInt(limit as string, 10), 100)
    );

    res.json({
      success: true,
      data: positions,
      count: positions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get trader positions',
    });
  }
});

/**
 * GET /api/copy/following
 * Get traders being followed
 */
router.get('/following', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const followed = await getFollowedTraders(walletAddress);

    res.json({
      success: true,
      data: followed,
      count: followed.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get followed traders',
    });
  }
});

/**
 * POST /api/copy/follow
 * Follow a trader (start copy trading)
 */
router.post('/follow', async (req: Request, res: Response) => {
  try {
    const {
      traderId,
      walletAddress,
      copyRatio = 1.0,
      maxPositionSize = '1000',
      maxLeverage = 10,
      copyLongs = true,
      copyShorts = true,
      stopLossPercent,
      takeProfitPercent,
      excludedSymbols = [],
    } = req.body;

    if (!traderId || typeof traderId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'traderId is required',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    // Validate copyRatio
    if (copyRatio < 0.1 || copyRatio > 10) {
      return res.status(400).json({
        success: false,
        error: 'copyRatio must be between 0.1 and 10',
      });
    }

    // Validate maxLeverage
    if (maxLeverage < 1 || maxLeverage > 50) {
      return res.status(400).json({
        success: false,
        error: 'maxLeverage must be between 1 and 50',
      });
    }

    const settings: Partial<CopyTradeSettings> = {
      copyRatio,
      maxPositionSize,
      maxLeverage,
      copyLongs,
      copyShorts,
      stopLossPercent,
      takeProfitPercent,
      excludedSymbols,
    };

    const result = await followTrader(traderId, walletAddress, settings);

    if (result.success) {
      res.json({
        success: true,
        data: result.settings,
        message: `Now copying trades from trader ${traderId}`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to follow trader',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to follow trader',
    });
  }
});

/**
 * POST /api/copy/unfollow
 * Unfollow a trader (stop copy trading)
 */
router.post('/unfollow', async (req: Request, res: Response) => {
  try {
    const { traderId, walletAddress, closePositions = false } = req.body;

    if (!traderId || typeof traderId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'traderId is required',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const result = await unfollowTrader(traderId, walletAddress, closePositions);

    if (result.success) {
      res.json({
        success: true,
        message: `Stopped copying trades from trader ${traderId}`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to unfollow trader',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unfollow trader',
    });
  }
});

/**
 * PUT /api/copy/settings
 * Update copy trade settings
 */
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const {
      traderId,
      walletAddress,
      copyRatio,
      maxPositionSize,
      maxLeverage,
      copyLongs,
      copyShorts,
      stopLossPercent,
      takeProfitPercent,
      excludedSymbols,
    } = req.body;

    if (!traderId || typeof traderId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'traderId is required',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const settings: Partial<CopyTradeSettings> = {};
    
    if (copyRatio !== undefined) {
      if (copyRatio < 0.1 || copyRatio > 10) {
        return res.status(400).json({
          success: false,
          error: 'copyRatio must be between 0.1 and 10',
        });
      }
      settings.copyRatio = copyRatio;
    }
    
    if (maxLeverage !== undefined) {
      if (maxLeverage < 1 || maxLeverage > 50) {
        return res.status(400).json({
          success: false,
          error: 'maxLeverage must be between 1 and 50',
        });
      }
      settings.maxLeverage = maxLeverage;
    }

    if (maxPositionSize !== undefined) settings.maxPositionSize = maxPositionSize;
    if (copyLongs !== undefined) settings.copyLongs = copyLongs;
    if (copyShorts !== undefined) settings.copyShorts = copyShorts;
    if (stopLossPercent !== undefined) settings.stopLossPercent = stopLossPercent;
    if (takeProfitPercent !== undefined) settings.takeProfitPercent = takeProfitPercent;
    if (excludedSymbols !== undefined) settings.excludedSymbols = excludedSymbols;

    const result = await updateCopySettings(traderId, walletAddress, settings);

    if (result.success) {
      res.json({
        success: true,
        data: result.settings,
        message: 'Copy settings updated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to update settings',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    });
  }
});

/**
 * PUT /api/copy/toggle
 * Pause/resume copy trading
 */
router.put('/toggle', async (req: Request, res: Response) => {
  try {
    const { traderId, walletAddress, isActive } = req.body;

    if (!traderId || typeof traderId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'traderId is required',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean',
      });
    }

    const result = await toggleCopyTrading(traderId, walletAddress, isActive);

    if (result.success) {
      res.json({
        success: true,
        message: isActive ? 'Copy trading resumed' : 'Copy trading paused',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to toggle copy trading',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle copy trading',
    });
  }
});

/**
 * GET /api/copy/history
 * Get copy trade history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { walletAddress, limit = '50' } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const history = await getCopyTradeHistory(
      walletAddress,
      Math.min(parseInt(limit as string, 10), 200)
    );

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get copy trade history',
    });
  }
});

export default router;
