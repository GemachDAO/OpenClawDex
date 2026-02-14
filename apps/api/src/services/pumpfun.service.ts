/**
 * Pump.fun Service
 * 
 * Integration for trading meme coins on Solana via Pump.fun.
 * Supports listing, buying, and selling meme coins.
 */

import { config } from '../config/index.js';
import { getSDK } from '../utils/sdkLoader.js';

/**
 * Meme coin information
 */
export interface MemeCoinInfo {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  imageUri?: string;
  creator: string;
  createdAt: string;
  marketCap: number;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  totalSupply: string;
  circulatingSupply: string;
  bondingCurveProgress: number;
  isGraduated: boolean;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

/**
 * Meme coin trade result
 */
export interface MemeCoinTradeResult {
  success: boolean;
  transactionId: string;
  txHash?: string;
  action: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  amountIn: string;
  amountOut: string;
  pricePerToken: number;
  totalValueUsd: number;
  fee: string;
  timestamp: string;
  error?: string;
}

/**
 * Trending filter options
 */
export interface TrendingFilter {
  sortBy?: 'marketCap' | 'volume' | 'priceChange' | 'holders' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  isGraduated?: boolean;
  timeframe?: '1h' | '6h' | '24h' | '7d';
}

/**
 * List trending meme coins on Pump.fun
 */
export async function listMemeCoins(
  limit: number = 20,
  offset: number = 0,
  filter?: TrendingFilter
): Promise<MemeCoinInfo[]> {
  try {
    const sdk = await getSDK();

    // Get trending tokens from Solana/Pump.fun via SDK
    const params = {
      chainId: 'solana-mainnet',
      limit,
      offset,
      sortBy: filter?.sortBy || 'volume',
      sortOrder: filter?.sortOrder || 'desc',
      minMarketCap: filter?.minMarketCap,
      maxMarketCap: filter?.maxMarketCap,
      minVolume: filter?.minVolume,
      graduated: filter?.isGraduated,
      timeframe: filter?.timeframe || '24h',
    };

    const response = await sdk.tokens.getTrendingTokens(limit);

    if (!response || response.error) {
      return [];
    }

    const tokens: MemeCoinInfo[] = [];
    const tokensArray = Array.isArray(response) ? response : [];

    for (const token of tokensArray) {
      tokens.push(formatMemeCoinInfo(token));
    }

    return tokens;
  } catch (error) {
    throw new Error(`Failed to list meme coins: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get detailed info for a specific meme coin
 */
export async function getTokenInfo(tokenAddress: string): Promise<MemeCoinInfo | null> {
  try {
    const sdk = await getSDK();

    const response = await sdk.tokens.getToken(tokenAddress);

    if (!response || response.error) {
      return null;
    }

    return formatMemeCoinInfo(response);
  } catch (error) {
    throw new Error(`Failed to get token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search meme coins by name or symbol
 */
export async function searchMemeCoins(
  query: string,
  limit: number = 20
): Promise<MemeCoinInfo[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.tokens.searchTokens(query, limit);

    if (!response || response.error) {
      return [];
    }

    const tokens: MemeCoinInfo[] = [];
    const tokensArray = Array.isArray(response) ? response : [];

    for (const token of tokensArray) {
      tokens.push(formatMemeCoinInfo(token));
    }

    return tokens;
  } catch (error) {
    throw new Error(`Failed to search meme coins: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Buy a meme coin with SOL
 */
export async function buyToken(
  tokenAddress: string,
  amountSol: string,
  walletAddress: string,
  slippage: number = 1.0, // Higher default slippage for meme coins
  maxPriorityFee?: string
): Promise<MemeCoinTradeResult> {
  const transactionId = generateTransactionId('buy');

  try {
    const sdk = await getSDK();

    // Get token info first
    const tokenInfo = await sdk.tokens.getToken(tokenAddress);
    const tokenSymbol = tokenInfo?.symbol || 'UNKNOWN';

    // Execute buy via SDK
    const buyParams = {
      chainId: 'solana-mainnet',
      tokenAddress,
      amount: amountSol,
      walletAddress,
      slippage,
      side: 'buy',
      maxPriorityFee,
    };

    const result = await sdk.trading.executeSwap(buyParams);

    if (!result || result.error) {
      return {
        success: false,
        transactionId,
        action: 'buy',
        tokenAddress,
        tokenSymbol,
        amountIn: amountSol,
        amountOut: '0',
        pricePerToken: 0,
        totalValueUsd: 0,
        fee: '0',
        timestamp: new Date().toISOString(),
        error: result?.error || 'Failed to execute buy',
      };
    }

    return {
      success: true,
      transactionId,
      txHash: result.txHash,
      action: 'buy',
      tokenAddress,
      tokenSymbol,
      amountIn: amountSol,
      amountOut: result.toAmount || '0',
      pricePerToken: result.price || 0,
      totalValueUsd: result.valueUsd || parseFloat(amountSol) * (result.solPrice || 0),
      fee: result.fee || '0',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      transactionId,
      action: 'buy',
      tokenAddress,
      tokenSymbol: 'UNKNOWN',
      amountIn: amountSol,
      amountOut: '0',
      pricePerToken: 0,
      totalValueUsd: 0,
      fee: '0',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sell a meme coin for SOL
 */
export async function sellToken(
  tokenAddress: string,
  amountTokens: string,
  walletAddress: string,
  slippage: number = 1.0,
  maxPriorityFee?: string
): Promise<MemeCoinTradeResult> {
  const transactionId = generateTransactionId('sell');

  try {
    const sdk = await getSDK();

    // Get token info first
    const tokenInfo = await sdk.tokens.getToken(tokenAddress);
    const tokenSymbol = tokenInfo?.symbol || 'UNKNOWN';

    // Execute sell via SDK
    const sellParams = {
      chainId: 'solana-mainnet',
      tokenAddress,
      amount: amountTokens,
      walletAddress,
      slippage,
      side: 'sell',
      maxPriorityFee,
    };

    const result = await sdk.trading.executeSwap(sellParams);

    if (!result || result.error) {
      return {
        success: false,
        transactionId,
        action: 'sell',
        tokenAddress,
        tokenSymbol,
        amountIn: amountTokens,
        amountOut: '0',
        pricePerToken: 0,
        totalValueUsd: 0,
        fee: '0',
        timestamp: new Date().toISOString(),
        error: result?.error || 'Failed to execute sell',
      };
    }

    return {
      success: true,
      transactionId,
      txHash: result.txHash,
      action: 'sell',
      tokenAddress,
      tokenSymbol,
      amountIn: amountTokens,
      amountOut: result.toAmount || '0',
      pricePerToken: result.price || 0,
      totalValueUsd: result.valueUsd || 0,
      fee: result.fee || '0',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      transactionId,
      action: 'sell',
      tokenAddress,
      tokenSymbol: 'UNKNOWN',
      amountIn: amountTokens,
      amountOut: '0',
      pricePerToken: 0,
      totalValueUsd: 0,
      fee: '0',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get bonding curve info for a token
 */
export async function getBondingCurveInfo(tokenAddress: string): Promise<{
  progress: number;
  currentPrice: number;
  targetMarketCap: number;
  currentMarketCap: number;
  isGraduated: boolean;
} | null> {
  try {
    const sdk = await getSDK();

    const response = await sdk.tokens.getToken(tokenAddress);

    if (!response || response.error) {
      return null;
    }

    return {
      progress: response.bondingCurveProgress || 0,
      currentPrice: response.priceUsd || 0,
      targetMarketCap: response.targetMarketCap || 69000, // Pump.fun graduation target
      currentMarketCap: response.marketCap || 0,
      isGraduated: response.isGraduated || false,
    };
  } catch (error) {
    throw new Error(`Failed to get bonding curve info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get new launches (recently created tokens)
 */
export async function getNewLaunches(
  limit: number = 20,
  minAge?: number, // minimum age in minutes
  maxAge?: number // maximum age in minutes
): Promise<MemeCoinInfo[]> {
  try {
    const sdk = await getSDK();

    const params = {
      chainId: 'solana-mainnet',
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      minAge,
      maxAge,
    };

    const response = await sdk.tokens.getNewestTokens(1, 1, "", limit);

    if (!response || response.error) {
      return [];
    }

    const tokens: MemeCoinInfo[] = [];
    const tokensArray = Array.isArray(response) ? response : [];

    for (const token of tokensArray) {
      tokens.push(formatMemeCoinInfo(token));
    }

    return tokens;
  } catch (error) {
    throw new Error(`Failed to get new launches: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get graduated tokens (tokens that completed bonding curve)
 */
export async function getGraduatedTokens(limit: number = 20): Promise<MemeCoinInfo[]> {
  try {
    const sdk = await getSDK();

    const params = {
      chainId: 'solana-mainnet',
      limit,
      graduated: true,
      sortBy: 'marketCap',
      sortOrder: 'desc',
    };

    const response = await sdk.tokens.getTrendingTokens(params.limit);

    if (!response || response.error) {
      return [];
    }

    const tokens: MemeCoinInfo[] = [];
    const tokensArray = Array.isArray(response) ? response : [];

    for (const token of tokensArray) {
      if (token.isGraduated) {
        tokens.push(formatMemeCoinInfo(token));
      }
    }

    return tokens;
  } catch (error) {
    throw new Error(`Failed to get graduated tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format raw token data to MemeCoinInfo
 */
function formatMemeCoinInfo(token: any): MemeCoinInfo {
  return {
    address: token.address || '',
    name: token.name || 'Unknown',
    symbol: token.symbol || 'UNKNOWN',
    description: token.description,
    imageUri: token.imageUri || token.logoUri,
    creator: token.creator || '',
    createdAt: token.createdAt || new Date().toISOString(),
    marketCap: token.marketCap || 0,
    priceUsd: token.priceUsd || 0,
    priceChange24h: token.priceChange24h || 0,
    volume24h: token.volume24h || 0,
    holders: token.holders || 0,
    totalSupply: token.totalSupply || '0',
    circulatingSupply: token.circulatingSupply || token.totalSupply || '0',
    bondingCurveProgress: token.bondingCurveProgress || 0,
    isGraduated: token.isGraduated || false,
    socialLinks: {
      twitter: token.twitter || token.socialLinks?.twitter,
      telegram: token.telegram || token.socialLinks?.telegram,
      website: token.website || token.socialLinks?.website,
    },
  };
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId(action: string): string {
  return `pumpfun_${action}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default {
  listMemeCoins,
  getTokenInfo,
  searchMemeCoins,
  buyToken,
  sellToken,
  getBondingCurveInfo,
  getNewLaunches,
  getGraduatedTokens,
};
