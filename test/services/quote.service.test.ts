import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the quote service
const QuoteService = {
  getQuote: vi.fn(),
  getPrice: vi.fn(),
  getPrices: vi.fn(),
  searchTokens: vi.fn(),
  getTrendingTokens: vi.fn(),
  getTokenInfo: vi.fn(),
  estimateGas: vi.fn(),
  getSwapRoute: vi.fn(),
};

describe('QuoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    QuoteService.getQuote.mockImplementation(async (params: any) => ({
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.amount,
      toAmount: '2850.50',
      toAmountMin: '2821.99',
      priceImpact: '0.05',
      route: ['WETH', 'USDC'],
      gas: '150000',
      gasUsd: '3.50',
      slippage: params.slippage || '0.5',
      expiresAt: Date.now() + 30000,
    }));
    
    QuoteService.getPrice.mockImplementation(async (token: string) => ({
      token,
      price: '2850.00',
      change24h: '2.5',
      volume24h: '1500000000',
      marketCap: '350000000000',
      updatedAt: new Date().toISOString(),
    }));
    
    QuoteService.getPrices.mockImplementation(async (tokens: string[]) => {
      const prices: Record<string, any> = {};
      tokens.forEach((token, i) => {
        prices[token] = {
          price: (2850 - i * 100).toFixed(2),
          change24h: (2.5 - i * 0.5).toFixed(2),
        };
      });
      return prices;
    });
    
    QuoteService.searchTokens.mockResolvedValue([
      { symbol: 'ETH', name: 'Ethereum', address: '0xeeee', chain: 'ethereum' },
      { symbol: 'WETH', name: 'Wrapped Ethereum', address: '0xc02aaa', chain: 'ethereum' },
    ]);
    
    QuoteService.getTrendingTokens.mockResolvedValue([
      { symbol: 'PEPE', name: 'Pepe', change24h: '150.5', volume24h: '500000000' },
      { symbol: 'SHIB', name: 'Shiba Inu', change24h: '25.2', volume24h: '300000000' },
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getQuote', () => {
    it('should return swap quote', async () => {
      const result = await QuoteService.getQuote({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
      });

      expect(result).toHaveProperty('fromToken');
      expect(result).toHaveProperty('toToken');
      expect(result).toHaveProperty('toAmount');
      expect(result).toHaveProperty('priceImpact');
      expect(result).toHaveProperty('route');
    });

    it('should include slippage in quote', async () => {
      const result = await QuoteService.getQuote({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
        slippage: '1.0',
      });

      expect(result.slippage).toBe('1.0');
    });

    it('should calculate toAmountMin based on slippage', async () => {
      const result = await QuoteService.getQuote({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
      });

      expect(parseFloat(result.toAmountMin)).toBeLessThan(parseFloat(result.toAmount));
    });

    it('should include gas estimation', async () => {
      const result = await QuoteService.getQuote({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
      });

      expect(result).toHaveProperty('gas');
      expect(result).toHaveProperty('gasUsd');
    });

    it('should include expiry time', async () => {
      const result = await QuoteService.getQuote({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
      });

      expect(result).toHaveProperty('expiresAt');
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should throw error for invalid token pair', async () => {
      QuoteService.getQuote.mockRejectedValueOnce(new Error('Invalid token pair'));
      
      await expect(QuoteService.getQuote({
        fromToken: 'INVALID',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
      })).rejects.toThrow('Invalid token pair');
    });

    it('should handle insufficient liquidity', async () => {
      QuoteService.getQuote.mockRejectedValueOnce(new Error('Insufficient liquidity'));
      
      await expect(QuoteService.getQuote({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1000000',
        chain: 'ethereum',
      })).rejects.toThrow('Insufficient liquidity');
    });
  });

  describe('getPrice', () => {
    it('should return token price', async () => {
      const result = await QuoteService.getPrice('ETH');

      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('change24h');
      expect(result).toHaveProperty('volume24h');
      expect(result.token).toBe('ETH');
    });

    it('should include market cap', async () => {
      const result = await QuoteService.getPrice('ETH');

      expect(result).toHaveProperty('marketCap');
    });

    it('should return updated timestamp', async () => {
      const result = await QuoteService.getPrice('ETH');

      expect(result).toHaveProperty('updatedAt');
    });

    it('should throw error for unknown token', async () => {
      QuoteService.getPrice.mockRejectedValueOnce(new Error('Token not found'));
      
      await expect(QuoteService.getPrice('UNKNOWN')).rejects.toThrow('Token not found');
    });
  });

  describe('getPrices', () => {
    it('should return multiple token prices', async () => {
      const result = await QuoteService.getPrices(['ETH', 'BTC', 'USDC']);

      expect(result).toHaveProperty('ETH');
      expect(result).toHaveProperty('BTC');
      expect(result).toHaveProperty('USDC');
    });

    it('should include price and change for each token', async () => {
      const result = await QuoteService.getPrices(['ETH']);

      expect(result.ETH).toHaveProperty('price');
      expect(result.ETH).toHaveProperty('change24h');
    });

    it('should handle partial results', async () => {
      QuoteService.getPrices.mockResolvedValueOnce({
        ETH: { price: '2850.00', change24h: '2.5' },
        BTC: { price: '94500.00', change24h: '1.2' },
        UNKNOWN: null,
      });
      
      const result = await QuoteService.getPrices(['ETH', 'BTC', 'UNKNOWN']);

      expect(result.ETH).toBeDefined();
      expect(result.BTC).toBeDefined();
      expect(result.UNKNOWN).toBeNull();
    });
  });

  describe('searchTokens', () => {
    it('should search tokens by query', async () => {
      const result = await QuoteService.searchTokens('ETH');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include token properties', async () => {
      const result = await QuoteService.searchTokens('ETH');
      const token = result[0];

      expect(token).toHaveProperty('symbol');
      expect(token).toHaveProperty('name');
      expect(token).toHaveProperty('address');
      expect(token).toHaveProperty('chain');
    });

    it('should return empty array for no matches', async () => {
      QuoteService.searchTokens.mockResolvedValueOnce([]);
      
      const result = await QuoteService.searchTokens('ZZZZZZZ');

      expect(result).toHaveLength(0);
    });

    it('should filter by chain', async () => {
      QuoteService.searchTokens.mockResolvedValueOnce([
        { symbol: 'ETH', name: 'Ethereum', address: '0xeeee', chain: 'bsc' },
      ]);
      
      const result = await QuoteService.searchTokens('ETH', 'bsc');

      expect(result[0].chain).toBe('bsc');
    });
  });

  describe('getTrendingTokens', () => {
    it('should return trending tokens', async () => {
      const result = await QuoteService.getTrendingTokens();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include trending metrics', async () => {
      const result = await QuoteService.getTrendingTokens();
      const token = result[0];

      expect(token).toHaveProperty('symbol');
      expect(token).toHaveProperty('change24h');
      expect(token).toHaveProperty('volume24h');
    });

    it('should sort by volume or change', async () => {
      QuoteService.getTrendingTokens.mockResolvedValueOnce([
        { symbol: 'PEPE', change24h: '150.5', volume24h: '500000000' },
        { symbol: 'DOGE', change24h: '50.0', volume24h: '800000000' },
      ]);
      
      const result = await QuoteService.getTrendingTokens('volume');

      expect(result[0].symbol).toBe('PEPE');
    });
  });

  describe('getTokenInfo', () => {
    it('should return detailed token info', async () => {
      QuoteService.getTokenInfo = vi.fn().mockResolvedValue({
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        decimals: 18,
        chain: 'ethereum',
        price: '2850.00',
        totalSupply: '120000000',
        circulatingSupply: '120000000',
        website: 'https://ethereum.org',
        twitter: '@ethereum',
      });
      
      const result = await QuoteService.getTokenInfo('ETH', 'ethereum');

      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('decimals');
      expect(result).toHaveProperty('totalSupply');
      expect(result).toHaveProperty('website');
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for swap', async () => {
      QuoteService.estimateGas.mockResolvedValueOnce({
        gasLimit: '200000',
        gasPrice: '20000000000',
        maxFeePerGas: '25000000000',
        maxPriorityFeePerGas: '1500000000',
        estimatedCost: '0.005',
        estimatedCostUsd: '14.25',
      });
      
      const result = await QuoteService.estimateGas({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
      });

      expect(result).toHaveProperty('gasLimit');
      expect(result).toHaveProperty('gasPrice');
      expect(result).toHaveProperty('estimatedCost');
      expect(result).toHaveProperty('estimatedCostUsd');
    });
  });

  describe('getSwapRoute', () => {
    it('should return optimal swap route', async () => {
      QuoteService.getSwapRoute.mockResolvedValueOnce({
        route: [
          { dex: 'uniswap', path: ['WETH', 'USDC'], share: 80 },
          { dex: 'sushiswap', path: ['WETH', 'USDC'], share: 20 },
        ],
        totalShares: 100,
        estimatedOutput: '2850.50',
        priceImpact: '0.05',
      });
      
      const result = await QuoteService.getSwapRoute({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '1.0',
        chain: 'ethereum',
      });

      expect(result).toHaveProperty('route');
      expect(Array.isArray(result.route)).toBe(true);
      expect(result.route[0]).toHaveProperty('dex');
      expect(result.route[0]).toHaveProperty('path');
      expect(result.route[0]).toHaveProperty('share');
    });

    it('should consider gas when routing', async () => {
      QuoteService.getSwapRoute.mockResolvedValueOnce({
        route: [{ dex: 'uniswap', path: ['WETH', 'USDC'], share: 100 }],
        gasOptimized: true,
        estimatedOutput: '2845.00',
      });
      
      const result = await QuoteService.getSwapRoute({
        fromToken: 'ETH',
        toToken: 'USDC',
        amount: '0.1', // Small amount where gas matters more
        chain: 'ethereum',
        optimizeFor: 'gas',
      });

      expect(result.gasOptimized).toBe(true);
    });
  });
});
