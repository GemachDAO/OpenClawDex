/**
 * Swap Routes
 * 
 * REST API endpoints for executing token swaps:
 * - POST /api/swap - Execute a swap
 * - POST /api/swap/simulate - Simulate a swap (dry run)
 * - GET /api/swap/status - Get swap transaction status
 * - GET /api/swap/history - Get recent swaps for a wallet
 */

import { Router, Request, Response } from 'express';
import {
  executeSwap,
  simulateSwap,
  getSwapStatus,
  getRecentSwaps,
  SwapRequest,
} from '../services/swap.service.js';

const router = Router();

/**
 * POST /api/swap
 * Execute a token swap
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      fromToken,
      toToken,
      amount,
      walletAddress,
      slippage = 0.5,
      chainId = 1,
      deadline,
    } = req.body;

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

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    const swapRequest: SwapRequest = {
      fromToken,
      toToken,
      amount,
      walletAddress,
      slippage: typeof slippage === 'number' ? slippage : parseFloat(slippage),
      chainId: typeof chainId === 'number' ? chainId : parseInt(chainId, 10),
      deadline,
    };

    const result = await executeSwap(swapRequest);

    if (result.success) {
      res.json({
        success: true,
        data: {
          transaction: result.transaction,
          receipt: result.receipt,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.transaction.error || 'Swap failed',
        transaction: result.transaction,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute swap',
    });
  }
});

/**
 * POST /api/swap/simulate
 * Simulate a swap without executing (dry run)
 */
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const {
      fromToken,
      toToken,
      amount,
      walletAddress,
      slippage = 0.5,
      chainId = 1,
    } = req.body;

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

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    const swapRequest: SwapRequest = {
      fromToken,
      toToken,
      amount,
      walletAddress,
      slippage: typeof slippage === 'number' ? slippage : parseFloat(slippage),
      chainId: typeof chainId === 'number' ? chainId : parseInt(chainId, 10),
    };

    const result = await simulateSwap(swapRequest);

    res.json({
      success: result.success,
      data: {
        simulated: true,
        transaction: result.transaction,
      },
      message: result.success 
        ? 'Swap simulation successful. Call POST /api/swap to execute.'
        : 'Swap simulation failed.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate swap',
    });
  }
});

/**
 * GET /api/swap/status
 * Get the status of a swap transaction
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { txHash, chainId = '1' } = req.query;

    if (!txHash || typeof txHash !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'txHash is required',
      });
    }

    const status = await getSwapStatus(txHash, parseInt(chainId as string, 10));

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get swap status',
    });
  }
});

/**
 * GET /api/swap/history
 * Get recent swaps for a wallet
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { walletAddress, chainId = '1', limit = '20' } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    const swaps = await getRecentSwaps(
      walletAddress,
      parseInt(chainId as string, 10),
      Math.min(parseInt(limit as string, 10), 100)
    );

    res.json({
      success: true,
      data: swaps,
      count: swaps.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get swap history',
    });
  }
});

export default router;
