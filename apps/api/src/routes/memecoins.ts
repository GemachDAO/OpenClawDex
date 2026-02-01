/**
 * Meme Coins Routes
 * 
 * REST API endpoints for Pump.fun meme coin trading:
 * - GET /api/memecoins - List trending meme coins
 * - GET /api/memecoins/new - Get new launches
 * - GET /api/memecoins/graduated - Get graduated tokens
 * - GET /api/memecoins/search - Search meme coins
 * - GET /api/memecoins/:address - Get token info
 * - GET /api/memecoins/:address/curve - Get bonding curve info
 * - POST /api/memecoins/buy - Buy meme coin
 * - POST /api/memecoins/sell - Sell meme coin
 */

import { Router, Request, Response } from 'express';
import {
  listMemeCoins,
  getTokenInfo,
  searchMemeCoins,
  buyToken,
  sellToken,
  getBondingCurveInfo,
  getNewLaunches,
  getGraduatedTokens,
  TrendingFilter,
} from '../services/pumpfun.service.js';

const router = Router();

/**
 * GET /api/memecoins
 * List trending meme coins
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      limit = '20',
      offset = '0',
      sortBy = 'volume',
      sortOrder = 'desc',
      minMarketCap,
      maxMarketCap,
      minVolume,
      graduated,
      timeframe = '24h',
    } = req.query;

    const filter: TrendingFilter = {
      sortBy: sortBy as TrendingFilter['sortBy'],
      sortOrder: sortOrder as TrendingFilter['sortOrder'],
      minMarketCap: minMarketCap ? parseFloat(minMarketCap as string) : undefined,
      maxMarketCap: maxMarketCap ? parseFloat(maxMarketCap as string) : undefined,
      minVolume: minVolume ? parseFloat(minVolume as string) : undefined,
      isGraduated: graduated === 'true' ? true : graduated === 'false' ? false : undefined,
      timeframe: timeframe as TrendingFilter['timeframe'],
    };

    const tokens = await listMemeCoins(
      Math.min(parseInt(limit as string, 10), 100),
      parseInt(offset as string, 10),
      filter
    );

    res.json({
      success: true,
      data: tokens,
      count: tokens.length,
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list meme coins',
    });
  }
});

/**
 * GET /api/memecoins/new
 * Get newly launched meme coins
 */
router.get('/new', async (req: Request, res: Response) => {
  try {
    const { limit = '20', minAge, maxAge } = req.query;

    const tokens = await getNewLaunches(
      Math.min(parseInt(limit as string, 10), 100),
      minAge ? parseInt(minAge as string, 10) : undefined,
      maxAge ? parseInt(maxAge as string, 10) : undefined
    );

    res.json({
      success: true,
      data: tokens,
      count: tokens.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get new launches',
    });
  }
});

/**
 * GET /api/memecoins/graduated
 * Get graduated tokens (completed bonding curve)
 */
router.get('/graduated', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;

    const tokens = await getGraduatedTokens(
      Math.min(parseInt(limit as string, 10), 100)
    );

    res.json({
      success: true,
      data: tokens,
      count: tokens.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get graduated tokens',
    });
  }
});

/**
 * GET /api/memecoins/search
 * Search meme coins by name or symbol
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '20' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required',
      });
    }

    if (q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const tokens = await searchMemeCoins(
      q,
      Math.min(parseInt(limit as string, 10), 50)
    );

    res.json({
      success: true,
      data: tokens,
      count: tokens.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search meme coins',
    });
  }
});

/**
 * GET /api/memecoins/:address
 * Get detailed info for a specific meme coin
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Token address is required',
      });
    }

    const tokenInfo = await getTokenInfo(address);

    if (!tokenInfo) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
      });
    }

    res.json({
      success: true,
      data: tokenInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get token info',
    });
  }
});

/**
 * GET /api/memecoins/:address/curve
 * Get bonding curve info for a token
 */
router.get('/:address/curve', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Token address is required',
      });
    }

    const curveInfo = await getBondingCurveInfo(address);

    if (!curveInfo) {
      return res.status(404).json({
        success: false,
        error: 'Token or bonding curve not found',
      });
    }

    res.json({
      success: true,
      data: curveInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bonding curve info',
    });
  }
});

/**
 * POST /api/memecoins/buy
 * Buy a meme coin with SOL
 */
router.post('/buy', async (req: Request, res: Response) => {
  try {
    const {
      tokenAddress,
      amountSol,
      walletAddress,
      slippage = 1.0,
      maxPriorityFee,
    } = req.body;

    // Validate required parameters
    if (!tokenAddress || typeof tokenAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'tokenAddress is required',
      });
    }

    if (!amountSol || typeof amountSol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'amountSol is required',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    // Validate amount
    const amount = parseFloat(amountSol);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountSol must be a positive number',
      });
    }

    const result = await buyToken(
      tokenAddress,
      amountSol,
      walletAddress,
      typeof slippage === 'number' ? slippage : parseFloat(slippage),
      maxPriorityFee
    );

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Buy failed',
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to buy token',
    });
  }
});

/**
 * POST /api/memecoins/sell
 * Sell a meme coin for SOL
 */
router.post('/sell', async (req: Request, res: Response) => {
  try {
    const {
      tokenAddress,
      amountTokens,
      walletAddress,
      slippage = 1.0,
      maxPriorityFee,
    } = req.body;

    // Validate required parameters
    if (!tokenAddress || typeof tokenAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'tokenAddress is required',
      });
    }

    if (!amountTokens || typeof amountTokens !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'amountTokens is required',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    // Validate amount
    const amount = parseFloat(amountTokens);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amountTokens must be a positive number',
      });
    }

    const result = await sellToken(
      tokenAddress,
      amountTokens,
      walletAddress,
      typeof slippage === 'number' ? slippage : parseFloat(slippage),
      maxPriorityFee
    );

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Sell failed',
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sell token',
    });
  }
});

export default router;
