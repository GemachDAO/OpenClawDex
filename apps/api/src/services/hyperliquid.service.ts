/**
 * Hyperliquid Service
 * 
 * Integration for leverage trading and copy trading on Hyperliquid.
 * Supports perpetual futures with up to 50x leverage.
 */

import { getSDK } from '../utils/sdkLoader.js';

/**
 * Position side
 */
export type PositionSide = 'long' | 'short';

/**
 * Order type
 */
export type OrderType = 'market' | 'limit';

/**
 * Position status
 */
export type PositionStatus = 'open' | 'closed' | 'liquidated';

/**
 * Market info
 */
export interface MarketInfo {
  symbol: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  nextFundingTime: string;
  maxLeverage: number;
  minOrderSize: number;
  tickSize: number;
}

/**
 * Position info
 */
export interface PositionInfo {
  positionId: string;
  symbol: string;
  side: PositionSide;
  size: string;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  leverage: number;
  margin: string;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  status: PositionStatus;
  openedAt: string;
  closedAt?: string;
}

/**
 * Order info
 */
export interface OrderInfo {
  orderId: string;
  symbol: string;
  side: PositionSide;
  type: OrderType;
  size: string;
  price?: number;
  filledSize: string;
  avgFillPrice?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected';
  leverage: number;
  reduceOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Open position request
 */
export interface OpenPositionRequest {
  symbol: string;
  side: PositionSide;
  size: string;
  leverage: number;
  walletAddress: string;
  orderType?: OrderType;
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  reduceOnly?: boolean;
}

/**
 * Position result
 */
export interface PositionResult {
  success: boolean;
  position?: PositionInfo;
  order?: OrderInfo;
  error?: string;
}

/**
 * Get available markets for leverage trading
 */
export async function getMarkets(): Promise<MarketInfo[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.hyperLiquid.getMarkets();

    if (!response || response.error) {
      return [];
    }

    const markets: MarketInfo[] = [];
    const marketsArray = Array.isArray(response) ? response : [];

    for (const market of marketsArray) {
      markets.push({
        symbol: market.symbol || '',
        name: market.name || market.symbol || '',
        baseAsset: market.baseAsset || '',
        quoteAsset: market.quoteAsset || 'USDC',
        priceUsd: market.priceUsd || market.markPrice || 0,
        priceChange24h: market.priceChange24h || 0,
        volume24h: market.volume24h || 0,
        openInterest: market.openInterest || 0,
        fundingRate: market.fundingRate || 0,
        nextFundingTime: market.nextFundingTime || '',
        maxLeverage: market.maxLeverage || 50,
        minOrderSize: market.minOrderSize || 0.001,
        tickSize: market.tickSize || 0.01,
      });
    }

    return markets;
  } catch (error) {
    throw new Error(`Failed to get markets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get market info for a specific symbol
 */
export async function getMarketInfo(symbol: string): Promise<MarketInfo | null> {
  try {
    const sdk = await getSDK();

    const response = await sdk.hyperLiquid.getMarket(symbol);

    if (!response || response.error) {
      return null;
    }

    return {
      symbol: response.symbol || symbol,
      name: response.name || symbol,
      baseAsset: response.baseAsset || '',
      quoteAsset: response.quoteAsset || 'USDC',
      priceUsd: response.priceUsd || response.markPrice || 0,
      priceChange24h: response.priceChange24h || 0,
      volume24h: response.volume24h || 0,
      openInterest: response.openInterest || 0,
      fundingRate: response.fundingRate || 0,
      nextFundingTime: response.nextFundingTime || '',
      maxLeverage: response.maxLeverage || 50,
      minOrderSize: response.minOrderSize || 0.001,
      tickSize: response.tickSize || 0.01,
    };
  } catch (error) {
    throw new Error(`Failed to get market info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Open a leveraged position
 */
export async function openPosition(request: OpenPositionRequest): Promise<PositionResult> {
  try {
    const sdk = await getSDK();

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
    } = request;

    // Validate leverage
    if (leverage < 1 || leverage > 50) {
      return {
        success: false,
        error: 'Leverage must be between 1 and 50',
      };
    }

    const orderParams = {
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

    const response = await sdk.hyperLiquid.openPosition(orderParams);

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to open position',
      };
    }

    return {
      success: true,
      position: response.position ? formatPosition(response.position) : undefined,
      order: response.order ? formatOrder(response.order) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close a position
 */
export async function closePosition(
  positionId: string,
  walletAddress: string,
  closePercent: number = 100 // Close percentage (1-100)
): Promise<PositionResult> {
  try {
    const sdk = await getSDK();

    if (closePercent < 1 || closePercent > 100) {
      return {
        success: false,
        error: 'Close percentage must be between 1 and 100',
      };
    }

    const response = await sdk.hyperLiquid.closePosition({
      positionId,
      walletAddress,
      closePercent,
    });

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to close position',
      };
    }

    return {
      success: true,
      position: response.position ? formatPosition(response.position) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all positions for a wallet
 */
export async function getPositions(
  walletAddress: string,
  includeHistory: boolean = false
): Promise<PositionInfo[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.hyperLiquid.getPositions(walletAddress, includeHistory);

    if (!response || response.error) {
      return [];
    }

    const positions: PositionInfo[] = [];
    const positionsArray = Array.isArray(response) ? response : [];

    for (const position of positionsArray) {
      positions.push(formatPosition(position));
    }

    return positions;
  } catch (error) {
    throw new Error(`Failed to get positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a specific position
 */
export async function getPosition(
  positionId: string,
  walletAddress: string
): Promise<PositionInfo | null> {
  try {
    const sdk = await getSDK();

    const response = await sdk.hyperLiquid.getPosition(positionId, walletAddress);

    if (!response || response.error) {
      return null;
    }

    return formatPosition(response);
  } catch (error) {
    throw new Error(`Failed to get position: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get open orders
 */
export async function getOpenOrders(walletAddress: string): Promise<OrderInfo[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.hyperLiquid.getOpenOrders(walletAddress);

    if (!response || response.error) {
      return [];
    }

    const orders: OrderInfo[] = [];
    const ordersArray = Array.isArray(response) ? response : [];

    for (const order of ordersArray) {
      orders.push(formatOrder(order));
    }

    return orders;
  } catch (error) {
    throw new Error(`Failed to get open orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderId: string,
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sdk = await getSDK();

    const response = await sdk.hyperLiquid.cancelOrder(orderId, walletAddress);

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to cancel order',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Modify position leverage
 */
export async function modifyLeverage(
  symbol: string,
  walletAddress: string,
  newLeverage: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const sdk = await getSDK();

    if (newLeverage < 1 || newLeverage > 50) {
      return {
        success: false,
        error: 'Leverage must be between 1 and 50',
      };
    }

    const response = await sdk.hyperLiquid.modifyLeverage(symbol, walletAddress, newLeverage);

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to modify leverage',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Set stop loss / take profit for a position
 */
export async function setStopLossTakeProfit(
  positionId: string,
  walletAddress: string,
  stopLoss?: number,
  takeProfit?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const sdk = await getSDK();

    if (!stopLoss && !takeProfit) {
      return {
        success: false,
        error: 'Either stopLoss or takeProfit must be provided',
      };
    }

    const response = await sdk.hyperLiquid.setStopLossTakeProfit({
      positionId,
      walletAddress,
      stopLoss,
      takeProfit,
    });

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to set stop loss / take profit',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get account info (balance, margin, etc.)
 */
export async function getAccountInfo(walletAddress: string): Promise<{
  balance: string;
  availableBalance: string;
  marginUsed: string;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  accountLeverage: number;
} | null> {
  try {
    const sdk = await getSDK();

    const response = await sdk.hyperLiquid.getAccountInfo(walletAddress);

    if (!response || response.error) {
      return null;
    }

    return {
      balance: response.balance || '0',
      availableBalance: response.availableBalance || '0',
      marginUsed: response.marginUsed || '0',
      totalUnrealizedPnl: response.totalUnrealizedPnl || 0,
      totalRealizedPnl: response.totalRealizedPnl || 0,
      accountLeverage: response.accountLeverage || 1,
    };
  } catch (error) {
    throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format position from API response
 */
function formatPosition(position: any): PositionInfo {
  return {
    positionId: position.positionId || position.id || '',
    symbol: position.symbol || '',
    side: position.side || 'long',
    size: position.size || '0',
    entryPrice: position.entryPrice || 0,
    markPrice: position.markPrice || 0,
    liquidationPrice: position.liquidationPrice || 0,
    leverage: position.leverage || 1,
    margin: position.margin || '0',
    unrealizedPnl: position.unrealizedPnl || 0,
    unrealizedPnlPercent: position.unrealizedPnlPercent || 0,
    realizedPnl: position.realizedPnl || 0,
    status: position.status || 'open',
    openedAt: position.openedAt || new Date().toISOString(),
    closedAt: position.closedAt,
  };
}

/**
 * Format order from API response
 */
function formatOrder(order: any): OrderInfo {
  return {
    orderId: order.orderId || order.id || '',
    symbol: order.symbol || '',
    side: order.side || 'long',
    type: order.type || 'market',
    size: order.size || '0',
    price: order.price,
    filledSize: order.filledSize || '0',
    avgFillPrice: order.avgFillPrice,
    status: order.status || 'pending',
    leverage: order.leverage || 1,
    reduceOnly: order.reduceOnly || false,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
  };
}

// ============================================================================
// COPY TRADING FUNCTIONS
// ============================================================================

/**
 * Top trader info for copy trading
 */
export interface TopTraderInfo {
  traderId: string;
  walletAddress: string;
  displayName?: string;
  avatar?: string;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  avgLeverage: number;
  followers: number;
  copiers: number;
  aum: number; // Assets Under Management
  ranking: number;
  isVerified: boolean;
  joinedAt: string;
  performance: {
    day7: number;
    day30: number;
    day90: number;
    allTime: number;
  };
}

/**
 * Copy trade settings
 */
export interface CopyTradeSettings {
  followerId: string;
  traderId: string;
  walletAddress: string;
  isActive: boolean;
  copyRatio: number; // 0.1 = 10%, 1 = 100%, 2 = 200%
  maxPositionSize: string;
  maxLeverage: number;
  copyLongs: boolean;
  copyShorts: boolean;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  excludedSymbols: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Copy trade result
 */
export interface CopyTradeResult {
  success: boolean;
  settings?: CopyTradeSettings;
  error?: string;
}

/**
 * Get top traders for copy trading
 */
export async function getTopTraders(
  limit: number = 20,
  sortBy: 'pnl' | 'winRate' | 'followers' | 'aum' = 'pnl',
  timeframe: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<TopTraderInfo[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.getTopTraders({
      limit,
      sortBy,
      timeframe,
    });

    if (!response || response.error) {
      return [];
    }

    const traders: TopTraderInfo[] = [];
    const tradersArray = Array.isArray(response) ? response : [];

    for (const trader of tradersArray) {
      traders.push(formatTraderInfo(trader));
    }

    return traders;
  } catch (error) {
    throw new Error(`Failed to get top traders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get trader details
 */
export async function getTraderDetails(traderId: string): Promise<TopTraderInfo | null> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.getTraderDetails(traderId);

    if (!response || response.error) {
      return null;
    }

    return formatTraderInfo(response);
  } catch (error) {
    throw new Error(`Failed to get trader details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get trader's recent trades/positions
 */
export async function getTraderPositions(
  traderId: string,
  limit: number = 20
): Promise<PositionInfo[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.getTraderPositions(traderId, limit);

    if (!response || response.error) {
      return [];
    }

    const positions: PositionInfo[] = [];
    const positionsArray = Array.isArray(response) ? response : [];

    for (const position of positionsArray) {
      positions.push(formatPosition(position));
    }

    return positions;
  } catch (error) {
    throw new Error(`Failed to get trader positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Follow a trader (start copy trading)
 */
export async function followTrader(
  traderId: string,
  walletAddress: string,
  settings: Partial<CopyTradeSettings> = {}
): Promise<CopyTradeResult> {
  try {
    const sdk = await getSDK();

    const copySettings = {
      traderId,
      walletAddress,
      copyRatio: settings.copyRatio || 1.0,
      maxPositionSize: settings.maxPositionSize || '1000',
      maxLeverage: settings.maxLeverage || 10,
      copyLongs: settings.copyLongs !== false,
      copyShorts: settings.copyShorts !== false,
      stopLossPercent: settings.stopLossPercent,
      takeProfitPercent: settings.takeProfitPercent,
      excludedSymbols: settings.excludedSymbols || [],
    };

    const response = await sdk.copyTrade.followTrader(copySettings);

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to follow trader',
      };
    }

    return {
      success: true,
      settings: {
        followerId: response.followerId || '',
        traderId,
        walletAddress,
        isActive: true,
        copyRatio: copySettings.copyRatio,
        maxPositionSize: copySettings.maxPositionSize,
        maxLeverage: copySettings.maxLeverage,
        copyLongs: copySettings.copyLongs,
        copyShorts: copySettings.copyShorts,
        stopLossPercent: copySettings.stopLossPercent,
        takeProfitPercent: copySettings.takeProfitPercent,
        excludedSymbols: copySettings.excludedSymbols,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unfollow a trader (stop copy trading)
 */
export async function unfollowTrader(
  traderId: string,
  walletAddress: string,
  closePositions: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.unfollowTrader({
      traderId,
      walletAddress,
      closePositions,
    });

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to unfollow trader',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update copy trade settings
 */
export async function updateCopySettings(
  traderId: string,
  walletAddress: string,
  settings: Partial<CopyTradeSettings>
): Promise<CopyTradeResult> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.updateSettings({
      traderId,
      walletAddress,
      ...settings,
    });

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to update settings',
      };
    }

    return {
      success: true,
      settings: response.settings,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get traders being followed
 */
export async function getFollowedTraders(walletAddress: string): Promise<{
  trader: TopTraderInfo;
  settings: CopyTradeSettings;
}[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.getFollowedTraders(walletAddress);

    if (!response || response.error) {
      return [];
    }

    const followed: { trader: TopTraderInfo; settings: CopyTradeSettings }[] = [];
    const followedArray = Array.isArray(response) ? response : [];

    for (const item of followedArray) {
      followed.push({
        trader: formatTraderInfo(item.trader),
        settings: item.settings,
      });
    }

    return followed;
  } catch (error) {
    throw new Error(`Failed to get followed traders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get copy trading history
 */
export async function getCopyTradeHistory(
  walletAddress: string,
  limit: number = 50
): Promise<{
  positionId: string;
  traderId: string;
  traderName: string;
  symbol: string;
  side: PositionSide;
  size: string;
  entryPrice: number;
  exitPrice?: number;
  pnl: number;
  pnlPercent: number;
  status: PositionStatus;
  copiedAt: string;
  closedAt?: string;
}[]> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.getHistory(walletAddress, limit);

    if (!response || response.error) {
      return [];
    }

    const history: any[] = [];
    const historyArray = Array.isArray(response) ? response : [];

    for (const item of historyArray) {
      history.push({
        positionId: item.positionId || '',
        traderId: item.traderId || '',
        traderName: item.traderName || 'Unknown',
        symbol: item.symbol || '',
        side: item.side || 'long',
        size: item.size || '0',
        entryPrice: item.entryPrice || 0,
        exitPrice: item.exitPrice,
        pnl: item.pnl || 0,
        pnlPercent: item.pnlPercent || 0,
        status: item.status || 'closed',
        copiedAt: item.copiedAt || new Date().toISOString(),
        closedAt: item.closedAt,
      });
    }

    return history;
  } catch (error) {
    throw new Error(`Failed to get copy trade history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pause/resume copy trading for a trader
 */
export async function toggleCopyTrading(
  traderId: string,
  walletAddress: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const sdk = await getSDK();

    const response = await sdk.copyTrade.toggleActive({
      traderId,
      walletAddress,
      isActive,
    });

    if (!response || response.error) {
      return {
        success: false,
        error: response?.error || 'Failed to toggle copy trading',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format trader info from API response
 */
function formatTraderInfo(trader: any): TopTraderInfo {
  return {
    traderId: trader.traderId || trader.id || '',
    walletAddress: trader.walletAddress || trader.address || '',
    displayName: trader.displayName || trader.name,
    avatar: trader.avatar,
    totalPnl: trader.totalPnl || 0,
    totalPnlPercent: trader.totalPnlPercent || 0,
    winRate: trader.winRate || 0,
    totalTrades: trader.totalTrades || 0,
    avgLeverage: trader.avgLeverage || 1,
    followers: trader.followers || 0,
    copiers: trader.copiers || 0,
    aum: trader.aum || 0,
    ranking: trader.ranking || 0,
    isVerified: trader.isVerified || false,
    joinedAt: trader.joinedAt || new Date().toISOString(),
    performance: {
      day7: trader.performance?.day7 || trader.pnl7d || 0,
      day30: trader.performance?.day30 || trader.pnl30d || 0,
      day90: trader.performance?.day90 || trader.pnl90d || 0,
      allTime: trader.performance?.allTime || trader.totalPnl || 0,
    },
  };
}

export default {
  // Leverage trading
  getMarkets,
  getMarketInfo,
  openPosition,
  closePosition,
  getPositions,
  getPosition,
  getOpenOrders,
  cancelOrder,
  modifyLeverage,
  setStopLossTakeProfit,
  getAccountInfo,
  // Copy trading
  getTopTraders,
  getTraderDetails,
  getTraderPositions,
  followTrader,
  unfollowTrader,
  updateCopySettings,
  getFollowedTraders,
  getCopyTradeHistory,
  toggleCopyTrading,
};
