/**
 * Leverage Routes
 * 
 * REST API endpoints for Hyperliquid leverage trading:
 * - GET /api/leverage/markets - List available markets
 * - GET /api/leverage/markets/:symbol - Get market info
 * - GET /api/leverage/account - Get account info
 * - GET /api/leverage/positions - Get positions
 * - GET /api/leverage/positions/:id - Get specific position
 * - POST /api/leverage/positions/open - Open a position
 * - POST /api/leverage/positions/close - Close a position
 * - GET /api/leverage/orders - Get open orders
 * - DELETE /api/leverage/orders/:id - Cancel an order
 * - PUT /api/leverage/positions/:id/leverage - Modify leverage
 * - PUT /api/leverage/positions/:id/sltp - Set SL/TP
 */

import { Router, Request, Response } from 'express';
import {
  getMarkets,
  getMarketInfo,
  getAccountInfo,
  getPositions,
  getPosition,
  openPosition,
  closePosition,
  getOpenOrders,
  cancelOrder,
  modifyLeverage,
  setStopLossTakeProfit,
  OpenPositionRequest,
} from '../services/hyperliquid.service.js';

const router = Router();

/**
 * GET /api/leverage/markets
 * List all available markets for leverage trading
 */
router.get('/markets', async (_req: Request, res: Response) => {
  try {
    const markets = await getMarkets();

    res.json({
      success: true,
      data: markets,
      count: markets.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get markets',
    });
  }
});

/**
 * GET /api/leverage/markets/:symbol
 * Get market info for a specific symbol
 */
router.get('/markets/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;

    const market = await getMarketInfo(symbol);

    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
      });
    }

    res.json({
      success: true,
      data: market,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get market info',
    });
  }
});

/**
 * GET /api/leverage/account
 * Get account info (balance, margin, PnL)
 */
router.get('/account', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const account = await getAccountInfo(walletAddress);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get account info',
    });
  }
});

/**
 * GET /api/leverage/positions
 * Get all positions for a wallet
 */
router.get('/positions', async (req: Request, res: Response) => {
  try {
    const { walletAddress, includeHistory = 'false' } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const positions = await getPositions(walletAddress, includeHistory === 'true');

    res.json({
      success: true,
      data: positions,
      count: positions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get positions',
    });
  }
});

/**
 * GET /api/leverage/positions/:id
 * Get a specific position
 */
router.get('/positions/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const position = await getPosition(id, walletAddress);

    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Position not found',
      });
    }

    res.json({
      success: true,
      data: position,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get position',
    });
  }
});

/**
 * POST /api/leverage/positions/open
 * Open a new leveraged position
 */
router.post('/positions/open', async (req: Request, res: Response) => {
  try {
    const {
      symbol,
      side,
      size,
      leverage,
      walletAddress,
      orderType = 'market',
      limitPrice,
      stopLoss,
      takeProfit,
      reduceOnly = false,
    } = req.body;

    // Validate required fields
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'symbol is required',
      });
    }

    if (!side || !['long', 'short'].includes(side)) {
      return res.status(400).json({
        success: false,
        error: 'side must be "long" or "short"',
      });
    }

    if (!size || typeof size !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'size is required',
      });
    }

    if (!leverage || typeof leverage !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'leverage is required and must be a number',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const request: OpenPositionRequest = {
      symbol,
      side,
      size,
      leverage,
      walletAddress,
      orderType,
      limitPrice,
      stopLoss,
      takeProfit,
      reduceOnly,
    };

    const result = await openPosition(request);

    if (result.success) {
      res.json({
        success: true,
        data: {
          position: result.position,
          order: result.order,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to open position',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open position',
    });
  }
});

/**
 * POST /api/leverage/positions/close
 * Close a position
 */
router.post('/positions/close', async (req: Request, res: Response) => {
  try {
    const { positionId, walletAddress, closePercent = 100 } = req.body;

    if (!positionId || typeof positionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'positionId is required',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const result = await closePosition(positionId, walletAddress, closePercent);

    if (result.success) {
      res.json({
        success: true,
        data: {
          position: result.position,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to close position',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close position',
    });
  }
});

/**
 * GET /api/leverage/orders
 * Get open orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const orders = await getOpenOrders(walletAddress);

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get orders',
    });
  }
});

/**
 * DELETE /api/leverage/orders/:id
 * Cancel an order
 */
router.delete('/orders/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const result = await cancelOrder(id, walletAddress);

    if (result.success) {
      res.json({
        success: true,
        message: 'Order cancelled successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to cancel order',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    });
  }
});

/**
 * PUT /api/leverage/positions/:id/leverage
 * Modify position leverage
 */
router.put('/positions/:id/leverage', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { walletAddress, newLeverage } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    if (!newLeverage || typeof newLeverage !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'newLeverage is required and must be a number',
      });
    }

    const result = await modifyLeverage(id, walletAddress, newLeverage);

    if (result.success) {
      res.json({
        success: true,
        message: 'Leverage modified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to modify leverage',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to modify leverage',
    });
  }
});

/**
 * PUT /api/leverage/positions/:id/sltp
 * Set stop loss and take profit
 */
router.put('/positions/:id/sltp', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { walletAddress, stopLoss, takeProfit } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    if (!stopLoss && !takeProfit) {
      return res.status(400).json({
        success: false,
        error: 'Either stopLoss or takeProfit must be provided',
      });
    }

    const result = await setStopLossTakeProfit(id, walletAddress, stopLoss, takeProfit);

    if (result.success) {
      res.json({
        success: true,
        message: 'Stop loss / take profit set successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to set stop loss / take profit',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set stop loss / take profit',
    });
  }
});

export default router;
