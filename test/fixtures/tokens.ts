// Test token fixtures
export const testTokens = {
  ethereum: {
    native: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      priceUsd: '3000.00',
      chainId: 1,
    },
    usdc: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      priceUsd: '1.00',
      chainId: 1,
    },
    usdt: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      priceUsd: '1.00',
      chainId: 1,
    },
    wbtc: {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      priceUsd: '95000.00',
      chainId: 1,
    },
    link: {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      priceUsd: '15.50',
      chainId: 1,
    },
  },
  solana: {
    native: {
      address: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      priceUsd: '100.00',
      chainId: 'solana-mainnet',
    },
    usdc: {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      priceUsd: '1.00',
      chainId: 'solana-mainnet',
    },
    bonk: {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      symbol: 'BONK',
      name: 'Bonk',
      decimals: 5,
      priceUsd: '0.000025',
      chainId: 'solana-mainnet',
    },
  },
  bsc: {
    native: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      priceUsd: '600.00',
      chainId: 56,
    },
    busd: {
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      symbol: 'BUSD',
      name: 'Binance USD',
      decimals: 18,
      priceUsd: '1.00',
      chainId: 56,
    },
  },
};

export const trendingTokens = [
  {
    ...testTokens.ethereum.link,
    volume24h: '125000000',
    priceChange24h: 12.5,
    marketCap: '8500000000',
  },
  {
    ...testTokens.solana.bonk,
    volume24h: '85000000',
    priceChange24h: 45.2,
    marketCap: '1500000000',
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    priceUsd: '7.50',
    chainId: 1,
    volume24h: '95000000',
    priceChange24h: -3.2,
    marketCap: '5600000000',
  },
];

export const tokenSearchResults = {
  query: 'usd',
  results: [
    testTokens.ethereum.usdc,
    testTokens.ethereum.usdt,
    testTokens.bsc.busd,
    testTokens.solana.usdc,
  ],
};

export const invalidTokens = {
  nonexistent: '0x0000000000000000000000000000000000000000',
  invalidFormat: 'not-a-valid-address',
  wrongChain: {
    address: testTokens.ethereum.usdc.address,
    chainId: 56, // USDC address on wrong chain
  },
};
