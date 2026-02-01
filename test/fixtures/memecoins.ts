// Test memecoin fixtures for Pump.fun integration
export const testMemecoins = {
  trending: {
    mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Bonk',
    symbol: 'BONK',
    description: 'The first Solana dog coin for the people',
    image: 'https://arweave.net/bonk-image.png',
    creator: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    marketCap: '1500000000.00',
    volume24h: '85000000.00',
    priceUsd: '0.000025',
    priceChange24h: 45.2,
    holders: 750000,
    isGraduated: true,
    bondingCurveProgress: 100,
    createdAt: '2022-12-25T00:00:00Z',
  },
  newLaunch: {
    mintAddress: 'ABC123xyz789NewTokenMintAddress111111111',
    name: 'New Moon Cat',
    symbol: 'NMCAT',
    description: 'A new meme token with big dreams',
    image: 'https://arweave.net/nmcat-image.png',
    creator: 'CreatorWallet123456789abcdefghijklmnop',
    marketCap: '50000.00',
    volume24h: '25000.00',
    priceUsd: '0.0000001',
    priceChange24h: 150.0,
    holders: 120,
    isGraduated: false,
    bondingCurveProgress: 15,
    createdAt: '2026-01-31T20:00:00Z',
  },
  graduated: {
    mintAddress: 'GraduatedToken999888777666555444333222111',
    name: 'Super Doge Sol',
    symbol: 'SDOGE',
    description: 'The ultimate doge on Solana',
    image: 'https://arweave.net/sdoge-image.png',
    creator: 'AnotherCreatorWallet111222333444555666777',
    marketCap: '25000000.00',
    volume24h: '5000000.00',
    priceUsd: '0.00015',
    priceChange24h: -5.5,
    holders: 45000,
    isGraduated: true,
    bondingCurveProgress: 100,
    createdAt: '2025-08-15T12:00:00Z',
  },
};

export const trendingMemecoinsResponse = {
  tokens: [testMemecoins.trending, testMemecoins.graduated],
  total: 2,
  page: 1,
  limit: 20,
};

export const newLaunchesResponse = {
  tokens: [testMemecoins.newLaunch],
  total: 1,
  page: 1,
  limit: 20,
};

export const graduatedTokensResponse = {
  tokens: [testMemecoins.trending, testMemecoins.graduated],
  total: 2,
  page: 1,
  limit: 20,
};

export const bondingCurve = {
  mintAddress: testMemecoins.newLaunch.mintAddress,
  virtualSolReserves: '30.0',
  virtualTokenReserves: '1000000000.0',
  realSolReserves: '4.5',
  realTokenReserves: '850000000.0',
  progress: 15,
  graduationThreshold: '85.0',
  currentPrice: '0.0000001',
  priceImpact: {
    buy1Sol: 2.5,
    buy5Sol: 12.8,
    buy10Sol: 28.5,
  },
};

export const memecoinBuyResponse = {
  success: true,
  signature: 'BuyTxSignature123456789abcdefghijklmnopqrstuvwxyz',
  tokenAmount: '10000000.0',
  solSpent: '1.0',
  pricePerToken: '0.0000001',
  fee: '0.01',
  newBalance: {
    sol: '49.0',
    token: '10000000.0',
  },
};

export const memecoinSellResponse = {
  success: true,
  signature: 'SellTxSignature987654321zyxwvutsrqponmlkjihgfedcba',
  tokenAmount: '5000000.0',
  solReceived: '0.45',
  pricePerToken: '0.00000009',
  fee: '0.0045',
  newBalance: {
    sol: '49.45',
    token: '5000000.0',
  },
};

export const memecoinSearchResults = {
  query: 'doge',
  tokens: [testMemecoins.graduated],
  total: 1,
};

export const invalidMemecoinResponses = {
  tokenNotFound: {
    error: 'Token not found',
    code: 'TOKEN_NOT_FOUND',
  },
  insufficientBalance: {
    error: 'Insufficient SOL balance',
    code: 'INSUFFICIENT_BALANCE',
  },
  invalidMintAddress: {
    error: 'Invalid mint address format',
    code: 'INVALID_MINT_ADDRESS',
  },
  slippageExceeded: {
    error: 'Slippage tolerance exceeded',
    code: 'SLIPPAGE_EXCEEDED',
  },
};
