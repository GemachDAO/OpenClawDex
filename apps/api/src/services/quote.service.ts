/**
 * Quote Service
 * 
 * Fetches token prices and swap quotes using the Gdex SDK.
 * Supports multiple chains including Solana (Pump.fun) and EVM chains.
 */

import { config } from '../config/index.js';
import logger from '../utils/logger.js';

// Dynamic import for CommonJS gdex.pro-sdk
let GDEXSDK: any = null;
let sdkInstance: any = null;

async function loadSDK() {
  if (!GDEXSDK) {
    const module = await import('gdex.pro-sdk');
    GDEXSDK = module.GDEXSDK;
  }
  return GDEXSDK;
}

/**
 * Get or create SDK instance
 */
async function getSDK(): Promise<any> {
  if (!sdkInstance) {
    const SDK = await loadSDK();
    sdkInstance = new SDK('https://trade-api.gemach.io/v1', {
      apiKey: config.gdex.apiKey || undefined,
      timeout: 10000,
    });
  }
  return sdkInstance;
}

/**
 * Token info
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoUri?: string;
  priceUsd?: number;
}

/**
 * Quote result from SDK
 */
export interface QuoteResult {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  exchangeRate: number;
  priceImpact: number;
  estimatedGas: string;
  route: RouteStep[];
  fees: QuoteFees;
  expiresAt: number;
  quoteId: string;
}

/**
 * Route step in a swap
 */
export interface RouteStep {
  protocol: string;
  poolAddress: string;
  fromToken: string;
  toToken: string;
  portion: number;
}

/**
 * Fee breakdown
 */
export interface QuoteFees {
  networkFee: string;
  platformFee: string;
  totalFeeUsd: number;
}

/**
 * Token price result
 */
export interface TokenPrice {
  address: string;
  symbol: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

/**
 * Get a swap quote
 */
export async function getQuote(
  fromToken: string,
  toToken: string,
  amount: string,
  chainId: number = 1,
  slippage: number = 0.5
): Promise<QuoteResult> {
  try {
    const sdk = await getSDK();
    
    // Get quote from SDK trading API
    const quoteResponse = await sdk.trading.getQuote({
      fromToken,
      toToken,
      amount,
      chainId,
      slippage,
    });

    if (!quoteResponse || quoteResponse.error) {
      throw new Error(quoteResponse?.error || 'Failed to get quote');
    }

    // Parse and format the quote response
    const quote: QuoteResult = {
      fromToken: {
        address: quoteResponse.fromToken?.address || fromToken,
        symbol: quoteResponse.fromToken?.symbol || 'UNKNOWN',
        name: quoteResponse.fromToken?.name || 'Unknown Token',
        decimals: quoteResponse.fromToken?.decimals || 18,
        chainId,
        logoUri: quoteResponse.fromToken?.logoUri,
        priceUsd: quoteResponse.fromToken?.priceUsd,
      },
      toToken: {
        address: quoteResponse.toToken?.address || toToken,
        symbol: quoteResponse.toToken?.symbol || 'UNKNOWN',
        name: quoteResponse.toToken?.name || 'Unknown Token',
        decimals: quoteResponse.toToken?.decimals || 18,
        chainId,
        logoUri: quoteResponse.toToken?.logoUri,
        priceUsd: quoteResponse.toToken?.priceUsd,
      },
      fromAmount: quoteResponse.fromAmount || amount,
      toAmount: quoteResponse.toAmount || '0',
      toAmountMin: quoteResponse.toAmountMin || '0',
      exchangeRate: quoteResponse.exchangeRate || 0,
      priceImpact: quoteResponse.priceImpact || 0,
      estimatedGas: quoteResponse.estimatedGas || '0',
      route: parseRoute(quoteResponse.route),
      fees: {
        networkFee: quoteResponse.fees?.networkFee || '0',
        platformFee: quoteResponse.fees?.platformFee || '0',
        totalFeeUsd: quoteResponse.fees?.totalFeeUsd || 0,
      },
      expiresAt: quoteResponse.expiresAt || Date.now() + 30000,
      quoteId: quoteResponse.quoteId || generateQuoteId(),
    };

    return quote;
  } catch (error) {
    throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get token price
 */
export async function getTokenPrice(
  tokenAddress: string,
  chainId: number = 1
): Promise<TokenPrice> {
  try {
    const sdk = await getSDK();
    
    // Get token info from SDK
    const tokenInfo = await sdk.tokens.getToken(tokenAddress);

    if (!tokenInfo || tokenInfo.error) {
      throw new Error(tokenInfo?.error || 'Token not found');
    }

    return {
      address: tokenInfo.address || tokenAddress,
      symbol: tokenInfo.symbol || 'UNKNOWN',
      priceUsd: tokenInfo.priceUsd || 0,
      priceChange24h: tokenInfo.priceChange24h || 0,
      volume24h: tokenInfo.volume24h || 0,
      marketCap: tokenInfo.marketCap || 0,
      lastUpdated: tokenInfo.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to get token price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get multiple token prices
 */
export async function getTokenPrices(
  tokenAddresses: string[],
  chainId: number = 1
): Promise<TokenPrice[]> {
  try {
    const sdk = await getSDK();
    const prices: TokenPrice[] = [];
    
    // Iterate through addresses since SDK getToken handles one at a time
    for (const tokenAddress of tokenAddresses) {
      try {
        const token = await sdk.tokens.getToken(tokenAddress);
        
        if (token && !token.error) {
          prices.push({
            address: token.address || tokenAddress,
            symbol: token.symbol || "UNKNOWN",
            priceUsd: token.priceUsd || 0,
            priceChange24h: token.priceChange24h || 0,
            volume24h: token.volume24h || 0,
            marketCap: token.marketCap || 0,
            lastUpdated: token.lastUpdated || new Date().toISOString(),
          });
        }
      } catch (err) {
        logger.warn(`Failed to get token ${tokenAddress}`, err);
      }
    }

    return prices;
  } catch (error) {
    throw new Error(`Failed to get token prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search for tokens by name or symbol
 */
export async function searchTokens(
  query: string,
  chainId: number = 1,
  limit: number = 20
): Promise<TokenInfo[]> {
  try {
    const sdk = await getSDK();
    
    // Search tokens via SDK
    const searchResults = await sdk.tokens.searchTokens(query, limit);

    if (!searchResults || searchResults.error) {
      return [];
    }

    const tokens: TokenInfo[] = [];
    const resultsArray = Array.isArray(searchResults) ? searchResults : [];
    
    for (const token of resultsArray) {
      tokens.push({
        address: token.address || '',
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || 'Unknown Token',
        decimals: token.decimals || 18,
        chainId,
        logoUri: token.logoUri,
        priceUsd: token.priceUsd,
      });
    }

    return tokens;
  } catch (error) {
    throw new Error(`Failed to search tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get trending tokens
 */
export async function getTrendingTokens(
  chainId: number = 1,
  limit: number = 10
): Promise<TokenInfo[]> {
  try {
    const sdk = await getSDK();
    
    // Get trending tokens via SDK
    const trendingResults = await sdk.tokens.getTrendingTokens(limit);

    if (!trendingResults || trendingResults.error) {
      return [];
    }

    const tokens: TokenInfo[] = [];
    const resultsArray = Array.isArray(trendingResults) ? trendingResults : [];
    
    for (const token of resultsArray) {
      tokens.push({
        address: token.address || '',
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || 'Unknown Token',
        decimals: token.decimals || 18,
        chainId,
        logoUri: token.logoUri,
        priceUsd: token.priceUsd,
      });
    }

    return tokens;
  } catch (error) {
    throw new Error(`Failed to get trending tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse route from SDK response
 */
function parseRoute(route: any): RouteStep[] {
  if (!route || !Array.isArray(route)) {
    return [];
  }

  return route.map((step: any) => ({
    protocol: step.protocol || 'unknown',
    poolAddress: step.poolAddress || '',
    fromToken: step.fromToken || '',
    toToken: step.toToken || '',
    portion: step.portion || 1,
  }));
}

/**
 * Generate unique quote ID
 */
function generateQuoteId(): string {
  return `quote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default {
  getQuote,
  getTokenPrice,
  getTokenPrices,
  searchTokens,
  getTrendingTokens,
};
