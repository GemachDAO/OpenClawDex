/**
 * Quote Routes
 * 
 * REST API endpoints for fetching token prices and swap quotes:
 * - GET /api/quote - Get swap quote
 * - GET /api/quote/price - Get single token price
 * - GET /api/quote/prices - Get multiple token prices
 * - GET /api/quote/search - Search tokens
 * - GET /api/quote/trending - Get trending tokens
 */

import { Router, Request, Response } from 'express';
import {
  getQuote,
  getTokenPrice,
  getTokenPrices,
  searchTokens,
  getTrendingTokens,
} from '../services/quote.service.js';

const router = Router();

/**
 * GET /api/quote
 * Get a swap quote for trading tokens
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, chainId = '1', slippage = '0.5' } = req.query;

    // Validate required parameters
    if (!fromToken || typeof fromToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'fromToken address is required',
      });
    }

    if (!toToken || typeof toToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'toToken address is required',
      });
    }

    if (!amount || typeof amount !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'amount is required',
      });
    }

    const quote = await getQuote(
      fromToken,
      toToken,
      amount,
      parseInt(chainId as string, 10),
      parseFloat(slippage as string)
    );

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quote',
    });
  }
});

/**
 * GET /api/quote/price
 * Get price for a single token
 */
router.get('/price', async (req: Request, res: Response) => {
  try {
    const { token, chainId = '1' } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'token address is required',
      });
    }

    const price = await getTokenPrice(token, parseInt(chainId as string, 10));

    res.json({
      success: true,
      data: price,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get token price',
    });
  }
});

/**
 * GET /api/quote/prices
 * Get prices for multiple tokens
 */
router.get('/prices', async (req: Request, res: Response) => {
  try {
    const { tokens, chainId = '1' } = req.query;

    if (!tokens || typeof tokens !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'tokens (comma-separated addresses) is required',
      });
    }

    const tokenAddresses = tokens.split(',').map(t => t.trim()).filter(Boolean);

    if (tokenAddresses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one token address is required',
      });
    }

    if (tokenAddresses.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 tokens per request',
      });
    }

    const prices = await getTokenPrices(tokenAddresses, parseInt(chainId as string, 10));

    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get token prices',
    });
  }
});

/**
 * GET /api/quote/search
 * Search for tokens by name or symbol
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, chainId = '1', limit = '20' } = req.query;

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

    const tokens = await searchTokens(
      q,
      parseInt(chainId as string, 10),
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
      error: error instanceof Error ? error.message : 'Failed to search tokens',
    });
  }
});

/**
 * GET /api/quote/trending
 * Get trending tokens
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const { chainId = '1', limit = '10' } = req.query;

    const tokens = await getTrendingTokens(
      parseInt(chainId as string, 10),
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
      error: error instanceof Error ? error.message : 'Failed to get trending tokens',
    });
  }
});

export default router;
