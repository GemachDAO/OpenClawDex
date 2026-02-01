// Test wallet fixtures
export const testWallets = {
  ethereum: {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f5dE12',
    privateKey: '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318',
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    chainId: 1,
  },
  bsc: {
    address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    chainId: 56,
  },
  polygon: {
    address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    chainId: 137,
  },
  arbitrum: {
    address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    chainId: 42161,
  },
  base: {
    address: '0xBc79855178842FDBA0c353494895DEEf509E26bB',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    chainId: 8453,
  },
  solana: {
    address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    privateKey: '5MaiiCavjCmn9Hs1o3eznqDEhRwxo7pXiAYez7keQUviUkauRiTMD8DrESdrNjN8zd9mTmVhRvBJeg5vhyvgrAhG',
    chainId: 'solana-mainnet',
  },
};

export const invalidAddresses = {
  tooShort: '0x742d35Cc',
  tooLong: '0x742d35Cc6634C0532925a3b844Bc9e7595f5dE12AABBCCDD',
  invalidChars: '0xGGGG35Cc6634C0532925a3b844Bc9e7595f5dE12',
  noPrefix: '742d35Cc6634C0532925a3b844Bc9e7595f5dE12',
};

export const walletBalances = {
  ethereum: {
    native: '2.5',
    nativeUsd: '7500.00',
    tokens: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '10000.00',
        decimals: 6,
        priceUsd: '1.00',
        valueUsd: '10000.00',
      },
      {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        name: 'Tether USD',
        balance: '5000.00',
        decimals: 6,
        priceUsd: '1.00',
        valueUsd: '5000.00',
      },
    ],
    totalValueUsd: '22500.00',
  },
  solana: {
    native: '50.0',
    nativeUsd: '5000.00',
    tokens: [
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '2500.00',
        decimals: 6,
        priceUsd: '1.00',
        valueUsd: '2500.00',
      },
    ],
    totalValueUsd: '7500.00',
  },
};

export const supportedChains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://eth.llamarpc.com' },
  { id: 56, name: 'BNB Smart Chain', symbol: 'BNB', rpcUrl: 'https://bsc-dataseed.binance.org' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', rpcUrl: 'https://polygon-rpc.com' },
  { id: 43114, name: 'Avalanche', symbol: 'AVAX', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  { id: 10, name: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io' },
  { id: 8453, name: 'Base', symbol: 'ETH', rpcUrl: 'https://mainnet.base.org' },
];
