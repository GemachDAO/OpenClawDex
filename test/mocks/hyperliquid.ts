import { http, HttpResponse } from 'msw';
import { 
  testPositions, 
  markets, 
  accountInfo, 
  orders,
  tradeResponses 
} from '../fixtures/positions';
import { 
  testTraders, 
  topTradersResponse, 
  copySettings, 
  followRecord,
  copyTradeHistory 
} from '../fixtures/traders';

const HYPERLIQUID_API_BASE = 'https://api.hyperliquid.test';

export const hyperliquidHandlers = [
  // Get all markets
  http.get(`${HYPERLIQUID_API_BASE}/info/markets`, () => {
    return HttpResponse.json({
      markets: Object.values(markets),
      total: Object.keys(markets).length,
    });
  }),

  // Get specific market
  http.get(`${HYPERLIQUID_API_BASE}/info/markets/:symbol`, ({ params }) => {
    const { symbol } = params;
    const symbolStr = (symbol as string).toUpperCase();

    if (symbolStr === 'BTC-PERP') {
      return HttpResponse.json(markets.btc);
    }
    if (symbolStr === 'ETH-PERP') {
      return HttpResponse.json(markets.eth);
    }
    if (symbolStr === 'SOL-PERP') {
      return HttpResponse.json(markets.sol);
    }

    return HttpResponse.json(
      { error: 'Market not found' },
      { status: 404 }
    );
  }),

  // Get account info
  http.get(`${HYPERLIQUID_API_BASE}/info/account/:walletAddress`, ({ params }) => {
    const { walletAddress } = params;

    return HttpResponse.json({
      ...accountInfo,
      address: walletAddress,
    });
  }),

  // Get all positions
  http.get(`${HYPERLIQUID_API_BASE}/info/positions/:walletAddress`, ({ params }) => {
    const { walletAddress } = params;

    return HttpResponse.json({
      positions: Object.values(testPositions),
      address: walletAddress,
    });
  }),

  // Get specific position
  http.get(`${HYPERLIQUID_API_BASE}/info/positions/:walletAddress/:symbol`, ({ params }) => {
    const { walletAddress, symbol } = params;
    const symbolStr = (symbol as string).toUpperCase();

    if (symbolStr === 'BTC-PERP') {
      return HttpResponse.json(testPositions.longBtc);
    }
    if (symbolStr === 'ETH-PERP') {
      return HttpResponse.json(testPositions.shortEth);
    }
    if (symbolStr === 'SOL-PERP') {
      return HttpResponse.json(testPositions.longSol);
    }

    return HttpResponse.json(
      { error: 'Position not found' },
      { status: 404 }
    );
  }),

  // Open position
  http.post(`${HYPERLIQUID_API_BASE}/exchange/order`, async ({ request }) => {
    const body = await request.json() as {
      symbol: string;
      side: string;
      size: string;
      leverage: number;
      type: string;
      price?: string;
      stopLoss?: string;
      takeProfit?: string;
    };

    if (!body.symbol || !body.side || !body.size || !body.leverage) {
      return HttpResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (body.leverage > 100) {
      return HttpResponse.json(
        { error: 'Maximum leverage is 100x' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      ...tradeResponses.openLong,
      symbol: body.symbol,
      side: body.side,
      size: body.size,
      leverage: body.leverage,
    });
  }),

  // Close position
  http.post(`${HYPERLIQUID_API_BASE}/exchange/close`, async ({ request }) => {
    const body = await request.json() as {
      symbol: string;
      size?: string;
    };

    if (!body.symbol) {
      return HttpResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json(tradeResponses.closePosition);
  }),

  // Get orders
  http.get(`${HYPERLIQUID_API_BASE}/info/orders/:walletAddress`, ({ params }) => {
    const { walletAddress } = params;

    return HttpResponse.json({
      orders: Object.values(orders),
      address: walletAddress,
    });
  }),

  // Cancel order
  http.delete(`${HYPERLIQUID_API_BASE}/exchange/orders/:orderId`, ({ params }) => {
    const { orderId } = params;

    return HttpResponse.json({
      cancelled: true,
      orderId,
    });
  }),

  // Modify leverage
  http.put(`${HYPERLIQUID_API_BASE}/exchange/leverage`, async ({ request }) => {
    const body = await request.json() as {
      symbol: string;
      leverage: number;
    };

    if (body.leverage > 100) {
      return HttpResponse.json(
        { error: 'Maximum leverage is 100x' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      symbol: body.symbol,
      newLeverage: body.leverage,
      updated: true,
    });
  }),

  // Set stop-loss/take-profit
  http.put(`${HYPERLIQUID_API_BASE}/exchange/sl-tp`, async ({ request }) => {
    const body = await request.json() as {
      symbol: string;
      stopLoss?: string;
      takeProfit?: string;
    };

    return HttpResponse.json({
      symbol: body.symbol,
      stopLoss: body.stopLoss || null,
      takeProfit: body.takeProfit || null,
      updated: true,
    });
  }),

  // Copy trading endpoints
  // Get top traders
  http.get(`${HYPERLIQUID_API_BASE}/copy/traders`, ({ request }) => {
    const url = new URL(request.url);
    const sortBy = url.searchParams.get('sortBy') || 'pnl';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');

    let traders = [...topTradersResponse.traders];

    // Sort based on sortBy parameter
    if (sortBy === 'winRate') {
      traders.sort((a, b) => b.stats.winRate - a.stats.winRate);
    } else if (sortBy === 'followers') {
      traders.sort((a, b) => b.stats.followers - a.stats.followers);
    } else if (sortBy === 'aum') {
      traders.sort((a, b) => parseFloat(b.stats.aum) - parseFloat(a.stats.aum));
    }

    return HttpResponse.json({
      traders: traders.slice(0, limit),
      total: traders.length,
      page,
      limit,
    });
  }),

  // Get trader details
  http.get(`${HYPERLIQUID_API_BASE}/copy/traders/:traderId`, ({ params }) => {
    const { traderId } = params;

    const trader = Object.values(testTraders).find(t => t.id === traderId);

    if (trader) {
      return HttpResponse.json(trader);
    }

    return HttpResponse.json(
      { error: 'Trader not found' },
      { status: 404 }
    );
  }),

  // Get trader positions
  http.get(`${HYPERLIQUID_API_BASE}/copy/traders/:traderId/positions`, ({ params }) => {
    const { traderId } = params;

    return HttpResponse.json({
      traderId,
      positions: Object.values(testPositions),
    });
  }),

  // Get following list
  http.get(`${HYPERLIQUID_API_BASE}/copy/following`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      following: [followRecord],
      total: 1,
    });
  }),

  // Follow trader
  http.post(`${HYPERLIQUID_API_BASE}/copy/follow`, async ({ request }) => {
    const body = await request.json() as {
      traderId: string;
      settings?: typeof copySettings.default;
    };

    if (!body.traderId) {
      return HttpResponse.json(
        { error: 'Trader ID is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      id: `follow_${Date.now()}`,
      traderId: body.traderId,
      settings: body.settings || copySettings.default,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }),

  // Unfollow trader
  http.post(`${HYPERLIQUID_API_BASE}/copy/unfollow`, async ({ request }) => {
    const body = await request.json() as { traderId: string };

    if (!body.traderId) {
      return HttpResponse.json(
        { error: 'Trader ID is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      unfollowed: true,
      traderId: body.traderId,
    });
  }),

  // Update copy settings
  http.put(`${HYPERLIQUID_API_BASE}/copy/:followId/settings`, async ({ params, request }) => {
    const { followId } = params;
    const body = await request.json() as typeof copySettings.default;

    return HttpResponse.json({
      followId,
      settings: body,
      updated: true,
    });
  }),

  // Toggle copy trading (pause/resume)
  http.put(`${HYPERLIQUID_API_BASE}/copy/toggle`, async ({ request }) => {
    const body = await request.json() as {
      followId: string;
      isPaused: boolean;
    };

    return HttpResponse.json({
      followId: body.followId,
      isPaused: body.isPaused,
      updated: true,
    });
  }),

  // Get copy trade history
  http.get(`${HYPERLIQUID_API_BASE}/copy/:walletAddress/history`, ({ params, request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      trades: copyTradeHistory.slice(0, limit),
      total: copyTradeHistory.length,
      page,
      limit,
    });
  }),
];
