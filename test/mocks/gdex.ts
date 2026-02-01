import { http, HttpResponse } from 'msw';
import { 
  testTokens, 
  trendingTokens, 
  tokenSearchResults 
} from '../fixtures/tokens';
import { 
  walletBalances, 
  testWallets 
} from '../fixtures/wallets';
import { 
  testSwaps, 
  transactionStatuses, 
  swapHistory,
  simulationResponse 
} from '../fixtures/swaps';

const GDEX_API_BASE = 'https://api.gdex.pro';

export const gdexHandlers = [
  // Quote endpoints
  http.get(`${GDEX_API_BASE}/v1/quote`, ({ request }) => {
    const url = new URL(request.url);
    const fromToken = url.searchParams.get('fromToken');
    const toToken = url.searchParams.get('toToken');
    const amount = url.searchParams.get('amount');
    const chainId = url.searchParams.get('chainId');

    if (!fromToken || !toToken || !amount || !chainId) {
      return HttpResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Return appropriate quote based on token pair
    if (fromToken.toLowerCase().includes('eeee') && toToken.toLowerCase().includes('a0b8')) {
      return HttpResponse.json(testSwaps.ethToUsdc.quote);
    }

    // Default quote response
    return HttpResponse.json({
      fromToken: { address: fromToken, symbol: 'FROM', decimals: 18 },
      toToken: { address: toToken, symbol: 'TO', decimals: 18 },
      fromAmount: amount,
      toAmount: String(parseFloat(amount) * 100),
      priceImpact: 0.05,
      route: ['FROM', 'TO'],
      estimatedGas: '150000',
      gasCostUsd: '5.00',
      exchangeRate: '100.00',
      slippage: 0.5,
      chainId: parseInt(chainId),
    });
  }),

  // Price endpoints
  http.get(`${GDEX_API_BASE}/v1/price/:chainId/:tokenAddress`, ({ params }) => {
    const { chainId, tokenAddress } = params;
    const address = tokenAddress as string;

    // Check for known tokens
    if (address.toLowerCase() === testTokens.ethereum.usdc.address.toLowerCase()) {
      return HttpResponse.json({
        address,
        chainId,
        priceUsd: '1.00',
        priceChange24h: 0.01,
      });
    }

    if (address.toLowerCase() === testTokens.ethereum.wbtc.address.toLowerCase()) {
      return HttpResponse.json({
        address,
        chainId,
        priceUsd: '95000.00',
        priceChange24h: 2.5,
      });
    }

    // Default price
    return HttpResponse.json({
      address,
      chainId,
      priceUsd: '1.00',
      priceChange24h: 0,
    });
  }),

  // Batch prices
  http.post(`${GDEX_API_BASE}/v1/prices/:chainId`, async ({ request, params }) => {
    const { chainId } = params;
    const body = await request.json() as { addresses: string[] };
    const addresses = body.addresses || [];

    if (addresses.length > 50) {
      return HttpResponse.json(
        { error: 'Maximum 50 addresses allowed' },
        { status: 400 }
      );
    }

    const prices = addresses.map((address: string) => ({
      address,
      chainId,
      priceUsd: '1.00',
      priceChange24h: Math.random() * 10 - 5,
    }));

    return HttpResponse.json({ prices });
  }),

  // Token search
  http.get(`${GDEX_API_BASE}/v1/tokens/search/:chainId`, ({ request, params }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const { chainId } = params;

    if (!query) {
      return HttpResponse.json({ results: [], total: 0 });
    }

    const results = tokenSearchResults.results.filter(
      (t) => t.symbol.toLowerCase().includes(query.toLowerCase()) ||
             t.name.toLowerCase().includes(query.toLowerCase())
    );

    return HttpResponse.json({ results, total: results.length, chainId });
  }),

  // Trending tokens
  http.get(`${GDEX_API_BASE}/v1/tokens/trending`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      tokens: trendingTokens.slice(0, limit),
      total: trendingTokens.length,
      page,
      limit,
    });
  }),

  // Wallet balance
  http.get(`${GDEX_API_BASE}/v1/wallet/:chainId/:address/balance`, ({ params }) => {
    const { chainId, address } = params;

    // Check for invalid address format
    if (typeof address === 'string' && !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return HttpResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Return mock balance based on chain
    if (chainId === '1') {
      return HttpResponse.json(walletBalances.ethereum);
    }

    return HttpResponse.json({
      native: '10.0',
      nativeUsd: '1000.00',
      tokens: [],
      totalValueUsd: '1000.00',
    });
  }),

  // Swap execution
  http.post(`${GDEX_API_BASE}/v1/swap`, async ({ request }) => {
    const body = await request.json() as {
      fromToken: string;
      toToken: string;
      amount: string;
      walletAddress: string;
      slippage: number;
      chainId: number;
    };

    if (!body.fromToken || !body.toToken || !body.amount || !body.walletAddress) {
      return HttpResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Simulate insufficient balance
    if (parseFloat(body.amount) > 1000) {
      return HttpResponse.json(
        { error: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      status: 'pending',
      fromAmount: body.amount,
      estimatedToAmount: String(parseFloat(body.amount) * 100),
    });
  }),

  // Swap simulation
  http.post(`${GDEX_API_BASE}/v1/swap/simulate`, async ({ request }) => {
    const body = await request.json() as {
      fromToken: string;
      toToken: string;
      amount: string;
    };

    if (!body.fromToken || !body.toToken || !body.amount) {
      return HttpResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    return HttpResponse.json(simulationResponse);
  }),

  // Transaction status
  http.get(`${GDEX_API_BASE}/v1/tx/:txHash/status`, ({ params }) => {
    const { txHash } = params;

    if (txHash === transactionStatuses.pending.txHash) {
      return HttpResponse.json(transactionStatuses.pending);
    }

    if (txHash === transactionStatuses.failed.txHash) {
      return HttpResponse.json(transactionStatuses.failed);
    }

    // Default to success
    return HttpResponse.json({
      txHash,
      status: 'success',
      confirmations: 15,
      requiredConfirmations: 12,
      blockNumber: 19500000,
    });
  }),

  // Swap history
  http.get(`${GDEX_API_BASE}/v1/wallet/:chainId/:address/swaps`, ({ request, params }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      swaps: swapHistory.slice(0, limit),
      total: swapHistory.length,
      page,
      limit,
    });
  }),

  // Token info
  http.get(`${GDEX_API_BASE}/v1/token/:chainId/:address`, ({ params }) => {
    const { chainId, address } = params;
    const addr = address as string;

    // Find token in fixtures
    const allTokens = [
      ...Object.values(testTokens.ethereum),
      ...Object.values(testTokens.solana),
      ...Object.values(testTokens.bsc),
    ];

    const token = allTokens.find(t => t.address.toLowerCase() === addr.toLowerCase());

    if (token) {
      return HttpResponse.json(token);
    }

    return HttpResponse.json(
      { error: 'Token not found' },
      { status: 404 }
    );
  }),
];
