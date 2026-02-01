/**
 * OpenClawDex API Configuration
 * 
 * Centralized configuration loading from environment variables.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Re-export chain configuration
export * from './chains.js';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Gdex SDK
  gdex: {
    apiKey: process.env.GDEX_API_KEY || '',
    apiSecret: process.env.GDEX_API_SECRET || '',
  },

  // Solana
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    devnetRpcUrl: process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
    network: process.env.SOLANA_NETWORK || 'mainnet-beta',
  },

  // Hyperliquid
  hyperliquid: {
    apiUrl: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz',
    testnetApiUrl: process.env.HYPERLIQUID_TESTNET_API_URL || 'https://api.hyperliquid-testnet.xyz',
    testnet: process.env.HYPERLIQUID_TESTNET === 'true',
  },

  // EVM RPCs
  rpc: {
    ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    bsc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    polygon: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  },

  // Moltbook
  moltbook: {
    apiUrl: process.env.MOLTBOOK_API_URL || 'https://www.moltbook.com/api/v1',
    apiKey: process.env.MOLTBOOK_API_KEY || '',
  },
} as const;

export type Config = typeof config;

export default config;
