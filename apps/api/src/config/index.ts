/**
 * OpenClawDex API Configuration
 * 
 * Centralized configuration loading from environment variables.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
    network: process.env.SOLANA_NETWORK || 'mainnet-beta',
  },

  // Hyperliquid
  hyperliquid: {
    apiUrl: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz',
    testnet: process.env.HYPERLIQUID_TESTNET === 'true',
  },

  // Moltbook
  moltbook: {
    apiUrl: process.env.MOLTBOOK_API_URL || 'https://www.moltbook.com/api/v1',
    apiKey: process.env.MOLTBOOK_API_KEY || '',
  },
} as const;

export type Config = typeof config;

export default config;
