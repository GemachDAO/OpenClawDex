import { http, HttpResponse } from 'msw';
import { 
  testMemecoins, 
  trendingMemecoinsResponse, 
  newLaunchesResponse,
  graduatedTokensResponse,
  bondingCurve,
  memecoinBuyResponse,
  memecoinSellResponse,
  memecoinSearchResults,
  invalidMemecoinResponses 
} from '../fixtures/memecoins';

const PUMPFUN_API_BASE = 'https://api.pump.fun';

export const solanaHandlers = [
  // Get trending memecoins
  http.get(`${PUMPFUN_API_BASE}/coins`, ({ request }) => {
    const url = new URL(request.url);
    const sortBy = url.searchParams.get('sortBy') || 'volume';
    const minMarketCap = url.searchParams.get('minMarketCap');
    const maxMarketCap = url.searchParams.get('maxMarketCap');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');

    let tokens = [...trendingMemecoinsResponse.tokens];

    // Filter by market cap
    if (minMarketCap) {
      tokens = tokens.filter(t => parseFloat(t.marketCap) >= parseFloat(minMarketCap));
    }
    if (maxMarketCap) {
      tokens = tokens.filter(t => parseFloat(t.marketCap) <= parseFloat(maxMarketCap));
    }

    // Sort
    if (sortBy === 'marketCap') {
      tokens.sort((a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap));
    } else if (sortBy === 'priceChange') {
      tokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
    }

    return HttpResponse.json({
      tokens: tokens.slice(0, limit),
      total: tokens.length,
      page,
      limit,
    });
  }),

  // Get new launches
  http.get(`${PUMPFUN_API_BASE}/coins/new`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      tokens: newLaunchesResponse.tokens.slice(0, limit),
      total: newLaunchesResponse.total,
      page,
      limit,
    });
  }),

  // Get graduated tokens
  http.get(`${PUMPFUN_API_BASE}/coins/graduated`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      tokens: graduatedTokensResponse.tokens.slice(0, limit),
      total: graduatedTokensResponse.total,
      page,
      limit,
    });
  }),

  // Search memecoins
  http.get(`${PUMPFUN_API_BASE}/coins/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    if (!query) {
      return HttpResponse.json({ tokens: [], total: 0 });
    }

    const allTokens = Object.values(testMemecoins);
    const results = allTokens.filter(
      t => t.name.toLowerCase().includes(query.toLowerCase()) ||
           t.symbol.toLowerCase().includes(query.toLowerCase())
    );

    return HttpResponse.json({
      query,
      tokens: results,
      total: results.length,
    });
  }),

  // Get token info
  http.get(`${PUMPFUN_API_BASE}/coins/:mintAddress`, ({ params }) => {
    const { mintAddress } = params;

    const token = Object.values(testMemecoins).find(t => t.mintAddress === mintAddress);

    if (token) {
      return HttpResponse.json(token);
    }

    return HttpResponse.json(
      invalidMemecoinResponses.tokenNotFound,
      { status: 404 }
    );
  }),

  // Get bonding curve
  http.get(`${PUMPFUN_API_BASE}/coins/:mintAddress/bonding-curve`, ({ params }) => {
    const { mintAddress } = params;

    if (mintAddress === testMemecoins.newLaunch.mintAddress) {
      return HttpResponse.json(bondingCurve);
    }

    // For graduated tokens, return completed curve
    const token = Object.values(testMemecoins).find(t => t.mintAddress === mintAddress);

    if (token && token.isGraduated) {
      return HttpResponse.json({
        mintAddress,
        progress: 100,
        isGraduated: true,
        graduatedAt: '2025-10-15T00:00:00Z',
      });
    }

    return HttpResponse.json(
      invalidMemecoinResponses.tokenNotFound,
      { status: 404 }
    );
  }),

  // Buy memecoin
  http.post(`${PUMPFUN_API_BASE}/trade/buy`, async ({ request }) => {
    const body = await request.json() as {
      mintAddress: string;
      solAmount: string;
      walletAddress: string;
      slippage?: number;
    };

    if (!body.mintAddress || !body.solAmount || !body.walletAddress) {
      return HttpResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate token exists
    const token = Object.values(testMemecoins).find(t => t.mintAddress === body.mintAddress);

    if (!token) {
      return HttpResponse.json(
        invalidMemecoinResponses.tokenNotFound,
        { status: 404 }
      );
    }

    // Simulate insufficient balance
    if (parseFloat(body.solAmount) > 100) {
      return HttpResponse.json(
        invalidMemecoinResponses.insufficientBalance,
        { status: 400 }
      );
    }

    return HttpResponse.json({
      ...memecoinBuyResponse,
      solSpent: body.solAmount,
      tokenAmount: String(parseFloat(body.solAmount) * 10000000),
    });
  }),

  // Sell memecoin
  http.post(`${PUMPFUN_API_BASE}/trade/sell`, async ({ request }) => {
    const body = await request.json() as {
      mintAddress: string;
      tokenAmount: string;
      walletAddress: string;
      slippage?: number;
    };

    if (!body.mintAddress || !body.tokenAmount || !body.walletAddress) {
      return HttpResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate token exists
    const token = Object.values(testMemecoins).find(t => t.mintAddress === body.mintAddress);

    if (!token) {
      return HttpResponse.json(
        invalidMemecoinResponses.tokenNotFound,
        { status: 404 }
      );
    }

    return HttpResponse.json({
      ...memecoinSellResponse,
      tokenAmount: body.tokenAmount,
      solReceived: String(parseFloat(body.tokenAmount) * 0.00000009),
    });
  }),

  // Solana RPC endpoints
  http.post('https://api.devnet.solana.com', async ({ request }) => {
    const body = await request.json() as {
      method: string;
      params?: unknown[];
    };

    // Handle different RPC methods
    switch (body.method) {
      case 'getBalance':
        return HttpResponse.json({
          jsonrpc: '2.0',
          result: {
            context: { slot: 123456789 },
            value: 50000000000, // 50 SOL in lamports
          },
          id: 1,
        });

      case 'getTokenAccountsByOwner':
        return HttpResponse.json({
          jsonrpc: '2.0',
          result: {
            context: { slot: 123456789 },
            value: [
              {
                account: {
                  data: ['base64data', 'base64'],
                  executable: false,
                  lamports: 2039280,
                  owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                },
                pubkey: 'TokenAccountPubkey123',
              },
            ],
          },
          id: 1,
        });

      case 'getTransaction':
        return HttpResponse.json({
          jsonrpc: '2.0',
          result: {
            slot: 123456789,
            transaction: {
              message: {
                accountKeys: [],
                instructions: [],
              },
              signatures: ['sig1'],
            },
            meta: {
              err: null,
              status: { Ok: null },
            },
            blockTime: Math.floor(Date.now() / 1000),
          },
          id: 1,
        });

      case 'getRecentBlockhash':
        return HttpResponse.json({
          jsonrpc: '2.0',
          result: {
            context: { slot: 123456789 },
            value: {
              blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
              feeCalculator: {
                lamportsPerSignature: 5000,
              },
            },
          },
          id: 1,
        });

      case 'sendTransaction':
        return HttpResponse.json({
          jsonrpc: '2.0',
          result: 'TxSignature123456789abcdefghijklmnopqrstuvwxyz',
          id: 1,
        });

      default:
        return HttpResponse.json({
          jsonrpc: '2.0',
          result: null,
          id: 1,
        });
    }
  }),
];
