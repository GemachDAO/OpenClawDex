/**
 * Chains Configuration
 * 
 * Multi-chain support for OpenClawDex:
 * - EVM chains (Ethereum, BSC, Polygon, Arbitrum, etc.)
 * - Solana (for Pump.fun meme coins)
 * - Hyperliquid (for leverage and copy trading)
 */

/**
 * Chain types
 */
export type ChainType = 'evm' | 'solana' | 'hyperliquid';

/**
 * Chain configuration
 */
export interface ChainConfig {
  id: number | string;
  name: string;
  symbol: string;
  type: ChainType;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: {
    symbol: string;
    name: string;
    decimals: number;
  };
  isTestnet: boolean;
  features: ChainFeatures;
}

/**
 * Supported features per chain
 */
export interface ChainFeatures {
  swap: boolean;
  memecoins: boolean;
  leverage: boolean;
  copyTrading: boolean;
}

/**
 * EVM Chain IDs
 */
export const EVM_CHAIN_IDS = {
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  AVALANCHE: 43114,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  // Testnets
  GOERLI: 5,
  SEPOLIA: 11155111,
  BSC_TESTNET: 97,
} as const;

/**
 * Non-EVM Chain IDs (custom identifiers)
 */
export const NON_EVM_CHAIN_IDS = {
  SOLANA: 'solana-mainnet',
  SOLANA_DEVNET: 'solana-devnet',
  HYPERLIQUID: 'hyperliquid-mainnet',
  HYPERLIQUID_TESTNET: 'hyperliquid-testnet',
} as const;

/**
 * All supported chains
 */
export const SUPPORTED_CHAINS: Record<string | number, ChainConfig> = {
  // Ethereum Mainnet
  [EVM_CHAIN_IDS.ETHEREUM]: {
    id: EVM_CHAIN_IDS.ETHEREUM,
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'evm',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
    },
    isTestnet: false,
    features: {
      swap: true,
      memecoins: false,
      leverage: false,
      copyTrading: false,
    },
  },

  // BSC
  [EVM_CHAIN_IDS.BSC]: {
    id: EVM_CHAIN_IDS.BSC,
    name: 'BNB Chain',
    symbol: 'BNB',
    type: 'evm',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeToken: {
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
    },
    isTestnet: false,
    features: {
      swap: true,
      memecoins: false,
      leverage: false,
      copyTrading: false,
    },
  },

  // Polygon
  [EVM_CHAIN_IDS.POLYGON]: {
    id: EVM_CHAIN_IDS.POLYGON,
    name: 'Polygon',
    symbol: 'MATIC',
    type: 'evm',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeToken: {
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
    },
    isTestnet: false,
    features: {
      swap: true,
      memecoins: false,
      leverage: false,
      copyTrading: false,
    },
  },

  // Arbitrum
  [EVM_CHAIN_IDS.ARBITRUM]: {
    id: EVM_CHAIN_IDS.ARBITRUM,
    name: 'Arbitrum',
    symbol: 'ARB',
    type: 'evm',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
    },
    isTestnet: false,
    features: {
      swap: true,
      memecoins: false,
      leverage: false,
      copyTrading: false,
    },
  },

  // Base
  [EVM_CHAIN_IDS.BASE]: {
    id: EVM_CHAIN_IDS.BASE,
    name: 'Base',
    symbol: 'BASE',
    type: 'evm',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
    },
    isTestnet: false,
    features: {
      swap: true,
      memecoins: false,
      leverage: false,
      copyTrading: false,
    },
  },

  // Solana Mainnet - Pump.fun meme coins
  [NON_EVM_CHAIN_IDS.SOLANA]: {
    id: NON_EVM_CHAIN_IDS.SOLANA,
    name: 'Solana',
    symbol: 'SOL',
    type: 'solana',
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeToken: {
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
    },
    isTestnet: false,
    features: {
      swap: true,
      memecoins: true, // Pump.fun support
      leverage: false,
      copyTrading: false,
    },
  },

  // Solana Devnet
  [NON_EVM_CHAIN_IDS.SOLANA_DEVNET]: {
    id: NON_EVM_CHAIN_IDS.SOLANA_DEVNET,
    name: 'Solana Devnet',
    symbol: 'SOL',
    type: 'solana',
    rpcUrl: process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io?cluster=devnet',
    nativeToken: {
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
    },
    isTestnet: true,
    features: {
      swap: true,
      memecoins: true,
      leverage: false,
      copyTrading: false,
    },
  },

  // Hyperliquid Mainnet - Leverage & Copy Trading
  [NON_EVM_CHAIN_IDS.HYPERLIQUID]: {
    id: NON_EVM_CHAIN_IDS.HYPERLIQUID,
    name: 'Hyperliquid',
    symbol: 'HL',
    type: 'hyperliquid',
    rpcUrl: process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz',
    explorerUrl: 'https://hyperliquid.xyz/explorer',
    nativeToken: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    isTestnet: false,
    features: {
      swap: false,
      memecoins: false,
      leverage: true, // Leverage trading
      copyTrading: true, // Copy trading
    },
  },

  // Hyperliquid Testnet
  [NON_EVM_CHAIN_IDS.HYPERLIQUID_TESTNET]: {
    id: NON_EVM_CHAIN_IDS.HYPERLIQUID_TESTNET,
    name: 'Hyperliquid Testnet',
    symbol: 'HL',
    type: 'hyperliquid',
    rpcUrl: process.env.HYPERLIQUID_TESTNET_API_URL || 'https://api.hyperliquid-testnet.xyz',
    explorerUrl: 'https://testnet.hyperliquid.xyz/explorer',
    nativeToken: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
    },
    isTestnet: true,
    features: {
      swap: false,
      memecoins: false,
      leverage: true,
      copyTrading: true,
    },
  },
};

/**
 * Get chain configuration
 */
export function getChainConfig(chainId: number | string): ChainConfig | null {
  return SUPPORTED_CHAINS[chainId] || null;
}

/**
 * Get all supported chains
 */
export function getAllChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS);
}

/**
 * Get chains by type
 */
export function getChainsByType(type: ChainType): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.type === type);
}

/**
 * Get chains with specific feature
 */
export function getChainsWithFeature(feature: keyof ChainFeatures): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.features[feature]);
}

/**
 * Get mainnet chains only
 */
export function getMainnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => !chain.isTestnet);
}

/**
 * Get testnet chains only
 */
export function getTestnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.isTestnet);
}

/**
 * Check if chain supports a feature
 */
export function chainSupportsFeature(chainId: number | string, feature: keyof ChainFeatures): boolean {
  const chain = getChainConfig(chainId);
  return chain ? chain.features[feature] : false;
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerTxUrl(chainId: number | string, txHash: string): string | null {
  const chain = getChainConfig(chainId);
  if (!chain) return null;

  if (chain.type === 'solana') {
    return `${chain.explorerUrl}/tx/${txHash}`;
  } else if (chain.type === 'hyperliquid') {
    return `${chain.explorerUrl}/tx/${txHash}`;
  } else {
    return `${chain.explorerUrl}/tx/${txHash}`;
  }
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(chainId: number | string, address: string): string | null {
  const chain = getChainConfig(chainId);
  if (!chain) return null;

  if (chain.type === 'solana') {
    return `${chain.explorerUrl}/account/${address}`;
  } else if (chain.type === 'hyperliquid') {
    return `${chain.explorerUrl}/address/${address}`;
  } else {
    return `${chain.explorerUrl}/address/${address}`;
  }
}

/**
 * Validate chain ID
 */
export function isValidChainId(chainId: number | string): boolean {
  return chainId in SUPPORTED_CHAINS;
}

export default {
  SUPPORTED_CHAINS,
  EVM_CHAIN_IDS,
  NON_EVM_CHAIN_IDS,
  getChainConfig,
  getAllChains,
  getChainsByType,
  getChainsWithFeature,
  getMainnetChains,
  getTestnetChains,
  chainSupportsFeature,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  isValidChainId,
};
