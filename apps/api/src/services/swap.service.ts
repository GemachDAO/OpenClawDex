/**
 * Swap Service
 * 
 * Executes token swaps using the Gdex SDK.
 * Handles transaction building, signing, and submission.
 */

import { config } from '../config/index.js';
import { getSDK } from '../utils/sdkLoader.js';

/**
 * Swap request parameters
 */
export interface SwapRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  walletAddress: string;
  slippage?: number;
  chainId?: number;
  deadline?: number;
}

/**
 * Swap transaction result
 */
export interface SwapTransaction {
  transactionId: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  walletAddress: string;
  chainId: number;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  timestamp: string;
  error?: string;
}

/**
 * Swap execution result
 */
export interface SwapResult {
  success: boolean;
  transaction: SwapTransaction;
  receipt?: TransactionReceipt;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  txHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: string;
  effectiveGasPrice: string;
  status: 'success' | 'failed';
  logs: any[];
}

/**
 * Execute a token swap
 */
export async function executeSwap(request: SwapRequest): Promise<SwapResult> {
  const {
    fromToken,
    toToken,
    amount,
    walletAddress,
    slippage = 0.5,
    chainId = 1,
    deadline = Math.floor(Date.now() / 1000) + 1200, // 20 minutes default
  } = request;

  const transactionId = generateTransactionId();

  try {
    const sdk = await getSDK();

    // Build the swap transaction
    const swapParams = {
      fromToken,
      toToken,
      amount,
      walletAddress,
      slippage,
      chainId,
      deadline,
    };

    // Get quote first to validate the swap
    const quote = await sdk.trading.getQuote(swapParams);

    if (!quote || quote.error) {
      return {
        success: false,
        transaction: {
          transactionId,
          status: 'failed',
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: '0',
          toAmountMin: '0',
          walletAddress,
          chainId,
          timestamp: new Date().toISOString(),
          error: quote?.error || 'Failed to get quote for swap',
        },
      };
    }

    // Execute the swap
    const swapResult = await sdk.trading.executeSwap({
      ...swapParams,
      quoteId: quote.quoteId,
    });

    if (!swapResult || swapResult.error) {
      return {
        success: false,
        transaction: {
          transactionId,
          status: 'failed',
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: quote.toAmount || '0',
          toAmountMin: quote.toAmountMin || '0',
          walletAddress,
          chainId,
          timestamp: new Date().toISOString(),
          error: swapResult?.error || 'Failed to execute swap',
        },
      };
    }

    // Return successful result
    return {
      success: true,
      transaction: {
        transactionId,
        status: swapResult.status || 'submitted',
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: swapResult.toAmount || quote.toAmount || '0',
        toAmountMin: quote.toAmountMin || '0',
        walletAddress,
        chainId,
        txHash: swapResult.txHash,
        blockNumber: swapResult.blockNumber,
        gasUsed: swapResult.gasUsed,
        effectiveGasPrice: swapResult.effectiveGasPrice,
        timestamp: new Date().toISOString(),
      },
      receipt: swapResult.receipt ? {
        txHash: swapResult.receipt.txHash || swapResult.txHash,
        blockNumber: swapResult.receipt.blockNumber || 0,
        blockHash: swapResult.receipt.blockHash || '',
        gasUsed: swapResult.receipt.gasUsed || '0',
        effectiveGasPrice: swapResult.receipt.effectiveGasPrice || '0',
        status: swapResult.receipt.status === 1 ? 'success' : 'failed',
        logs: swapResult.receipt.logs || [],
      } : undefined,
    };
  } catch (error) {
    return {
      success: false,
      transaction: {
        transactionId,
        status: 'failed',
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: '0',
        toAmountMin: '0',
        walletAddress,
        chainId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error during swap',
      },
    };
  }
}

/**
 * Get swap transaction status
 */
export async function getSwapStatus(txHash: string, chainId: number = 1): Promise<SwapTransaction | null> {
  try {
    const sdk = await getSDK();

    const txStatus = await sdk.trading.getTransactionStatus(txHash, chainId);

    if (!txStatus || txStatus.error) {
      return null;
    }

    return {
      transactionId: txStatus.transactionId || txHash,
      status: txStatus.status || 'pending',
      fromToken: txStatus.fromToken || '',
      toToken: txStatus.toToken || '',
      fromAmount: txStatus.fromAmount || '0',
      toAmount: txStatus.toAmount || '0',
      toAmountMin: txStatus.toAmountMin || '0',
      walletAddress: txStatus.walletAddress || '',
      chainId,
      txHash,
      blockNumber: txStatus.blockNumber,
      gasUsed: txStatus.gasUsed,
      effectiveGasPrice: txStatus.effectiveGasPrice,
      timestamp: txStatus.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to get swap status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get recent swaps for a wallet
 */
export async function getRecentSwaps(
  walletAddress: string,
  chainId: number = 1,
  limit: number = 20
): Promise<SwapTransaction[]> {
  try {
    const sdk = await getSDK();

    const swapsResponse = await sdk.trading.getSwapHistory(walletAddress, chainId, limit);

    if (!swapsResponse || swapsResponse.error) {
      return [];
    }

    const swaps: SwapTransaction[] = [];
    const swapsArray = Array.isArray(swapsResponse) ? swapsResponse : [];

    for (const swap of swapsArray) {
      swaps.push({
        transactionId: swap.transactionId || swap.txHash || '',
        status: swap.status || 'confirmed',
        fromToken: swap.fromToken || '',
        toToken: swap.toToken || '',
        fromAmount: swap.fromAmount || '0',
        toAmount: swap.toAmount || '0',
        toAmountMin: swap.toAmountMin || '0',
        walletAddress,
        chainId,
        txHash: swap.txHash,
        blockNumber: swap.blockNumber,
        gasUsed: swap.gasUsed,
        effectiveGasPrice: swap.effectiveGasPrice,
        timestamp: swap.timestamp || new Date().toISOString(),
      });
    }

    return swaps;
  } catch (error) {
    throw new Error(`Failed to get recent swaps: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Simulate a swap (dry run)
 */
export async function simulateSwap(request: SwapRequest): Promise<SwapResult> {
  const {
    fromToken,
    toToken,
    amount,
    walletAddress,
    slippage = 0.5,
    chainId = 1,
  } = request;

  const transactionId = generateTransactionId();

  try {
    const sdk = await getSDK();

    // Get quote to simulate
    const quote = await sdk.trading.getQuote({
      fromToken,
      toToken,
      amount,
      walletAddress,
      slippage,
      chainId,
    });

    if (!quote || quote.error) {
      return {
        success: false,
        transaction: {
          transactionId,
          status: 'failed',
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: '0',
          toAmountMin: '0',
          walletAddress,
          chainId,
          timestamp: new Date().toISOString(),
          error: quote?.error || 'Failed to simulate swap',
        },
      };
    }

    // Return simulated result without executing
    return {
      success: true,
      transaction: {
        transactionId,
        status: 'pending', // Simulated, not actually executed
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: quote.toAmount || '0',
        toAmountMin: quote.toAmountMin || '0',
        walletAddress,
        chainId,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      transaction: {
        transactionId,
        status: 'failed',
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: '0',
        toAmountMin: '0',
        walletAddress,
        chainId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error during simulation',
      },
    };
  }
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `swap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default {
  executeSwap,
  getSwapStatus,
  getRecentSwaps,
  simulateSwap,
};
