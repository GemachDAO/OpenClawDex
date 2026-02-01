// Test swap fixtures
export const testSwaps = {
  ethToUsdc: {
    quote: {
      fromToken: {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        decimals: 18,
      },
      toToken: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
      },
      fromAmount: '1.0',
      toAmount: '2985.50',
      priceImpact: 0.05,
      route: ['ETH', 'WETH', 'USDC'],
      estimatedGas: '150000',
      gasCostUsd: '5.25',
      exchangeRate: '2985.50',
      slippage: 0.5,
      chainId: 1,
    },
    execution: {
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'success',
      fromAmount: '1.0',
      toAmount: '2982.15',
      actualPriceImpact: 0.06,
      gasCost: '0.005',
      gasCostUsd: '15.00',
      executedAt: '2026-02-01T10:00:00Z',
    },
  },
  usdcToLink: {
    quote: {
      fromToken: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
      },
      toToken: {
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        symbol: 'LINK',
        decimals: 18,
      },
      fromAmount: '100.00',
      toAmount: '6.45',
      priceImpact: 0.02,
      route: ['USDC', 'WETH', 'LINK'],
      estimatedGas: '200000',
      gasCostUsd: '7.00',
      exchangeRate: '0.0645',
      slippage: 0.5,
      chainId: 1,
    },
    execution: {
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      status: 'success',
      fromAmount: '100.00',
      toAmount: '6.42',
      actualPriceImpact: 0.03,
      gasCost: '0.0035',
      gasCostUsd: '10.50',
      executedAt: '2026-02-01T11:00:00Z',
    },
  },
  solToUsdc: {
    quote: {
      fromToken: {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        decimals: 9,
      },
      toToken: {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
      },
      fromAmount: '10.0',
      toAmount: '995.00',
      priceImpact: 0.08,
      route: ['SOL', 'USDC'],
      estimatedGas: '5000',
      gasCostUsd: '0.01',
      exchangeRate: '99.50',
      slippage: 1.0,
      chainId: 'solana-mainnet',
    },
    execution: {
      txHash: 'SolanaSwapSignature123456789abcdefghijklmnopqrstuvwxyz1234567890ab',
      status: 'success',
      fromAmount: '10.0',
      toAmount: '990.50',
      actualPriceImpact: 0.12,
      gasCost: '0.000005',
      gasCostUsd: '0.0005',
      executedAt: '2026-02-01T12:00:00Z',
    },
  },
};

export const swapHistory = [
  {
    txHash: testSwaps.ethToUsdc.execution.txHash,
    chainId: 1,
    fromToken: testSwaps.ethToUsdc.quote.fromToken,
    toToken: testSwaps.ethToUsdc.quote.toToken,
    fromAmount: testSwaps.ethToUsdc.execution.fromAmount,
    toAmount: testSwaps.ethToUsdc.execution.toAmount,
    priceImpact: testSwaps.ethToUsdc.execution.actualPriceImpact,
    status: 'success',
    timestamp: testSwaps.ethToUsdc.execution.executedAt,
  },
  {
    txHash: testSwaps.usdcToLink.execution.txHash,
    chainId: 1,
    fromToken: testSwaps.usdcToLink.quote.fromToken,
    toToken: testSwaps.usdcToLink.quote.toToken,
    fromAmount: testSwaps.usdcToLink.execution.fromAmount,
    toAmount: testSwaps.usdcToLink.execution.toAmount,
    priceImpact: testSwaps.usdcToLink.execution.actualPriceImpact,
    status: 'success',
    timestamp: testSwaps.usdcToLink.execution.executedAt,
  },
];

export const transactionStatuses = {
  pending: {
    txHash: '0xaabbccdd1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    status: 'pending',
    confirmations: 2,
    requiredConfirmations: 12,
  },
  success: {
    txHash: testSwaps.ethToUsdc.execution.txHash,
    status: 'success',
    confirmations: 15,
    requiredConfirmations: 12,
    blockNumber: 19500000,
    blockTimestamp: '2026-02-01T10:00:00Z',
  },
  failed: {
    txHash: '0xdead00001234567890abcdef1234567890abcdef1234567890abcdef12345678',
    status: 'failed',
    error: 'Insufficient output amount',
    errorCode: 'SLIPPAGE_EXCEEDED',
  },
};

export const swapErrors = {
  insufficientBalance: {
    error: 'Insufficient balance',
    code: 'INSUFFICIENT_BALANCE',
    details: {
      required: '10.0',
      available: '5.0',
      token: 'ETH',
    },
  },
  slippageExceeded: {
    error: 'Slippage tolerance exceeded',
    code: 'SLIPPAGE_EXCEEDED',
    details: {
      expected: '2985.50',
      actual: '2900.00',
      slippage: 2.86,
      maxSlippage: 0.5,
    },
  },
  invalidPair: {
    error: 'Invalid token pair',
    code: 'INVALID_PAIR',
    details: {
      fromToken: 'UNKNOWN',
      toToken: 'USDC',
    },
  },
  priceImpactTooHigh: {
    error: 'Price impact too high',
    code: 'PRICE_IMPACT_TOO_HIGH',
    details: {
      priceImpact: 15.5,
      maxPriceImpact: 5.0,
    },
  },
};

export const simulationResponse = {
  success: true,
  quote: testSwaps.ethToUsdc.quote,
  estimatedOutput: '2985.50',
  minOutput: '2970.57',
  priceImpact: 0.05,
  route: ['ETH', 'WETH', 'USDC'],
  warnings: [],
};

export const simulationWithWarnings = {
  success: true,
  quote: {
    ...testSwaps.ethToUsdc.quote,
    fromAmount: '100.0',
    toAmount: '285000.00',
    priceImpact: 3.5,
  },
  estimatedOutput: '285000.00',
  minOutput: '283575.00',
  priceImpact: 3.5,
  route: ['ETH', 'WETH', 'USDC'],
  warnings: [
    {
      type: 'HIGH_PRICE_IMPACT',
      message: 'This trade has a high price impact of 3.5%. Consider splitting into smaller trades.',
    },
  ],
};
