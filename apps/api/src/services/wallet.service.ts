/**
 * Wallet Service
 * 
 * Handles wallet creation, balance retrieval, and wallet management
 * using the Gdex SDK and ethers.js for cryptographic operations.
 */

import { Wallet, HDNodeWallet, randomBytes } from 'ethers';
import { config } from '../config/index.js';

// Dynamic import for CommonJS gdex.pro-sdk
let GDEXSDK: any = null;
let sdkInstance: any = null;

async function loadSDK() {
  if (!GDEXSDK) {
    const module = await import('gdex.pro-sdk');
    GDEXSDK = module.GDEXSDK;
  }
  return GDEXSDK;
}

/**
 * Get or create SDK instance
 */
async function getSDK(): Promise<any> {
  if (!sdkInstance) {
    const SDK = await loadSDK();
    sdkInstance = new SDK('https://trade-api.gemach.io/v1', {
      apiKey: config.gdex.apiKey || undefined,
      timeout: 10000,
    });
  }
  return sdkInstance;
}

/**
 * Wallet creation result
 */
export interface WalletCreationResult {
  address: string;
  privateKey: string;
  mnemonic?: string;
  publicKey: string;
}

/**
 * Wallet balance info
 */
export interface WalletBalance {
  address: string;
  chainId: number;
  nativeBalance: string;
  nativeSymbol: string;
  holdings: HoldingInfo[];
}

/**
 * Holding information for a token
 */
export interface HoldingInfo {
  tokenAddress: string;
  symbol: string;
  name: string;
  amount: string;
  uiAmount: number;
  valueUsd: number;
  pnlPercentage: number;
}

/**
 * Create a new wallet
 * Generates a new Ethereum-compatible wallet with private key and optional mnemonic
 */
export async function createWallet(withMnemonic: boolean = true): Promise<WalletCreationResult> {
  try {
    if (withMnemonic) {
      // Create wallet with mnemonic phrase (more secure, recoverable)
      const wallet = HDNodeWallet.createRandom();
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        publicKey: wallet.publicKey,
      };
    } else {
      // Create wallet with just private key
      const wallet = new Wallet(randomBytes(32));
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.signingKey.publicKey,
      };
    }
  } catch (error) {
    throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import wallet from private key
 */
export async function importWalletFromPrivateKey(privateKey: string): Promise<WalletCreationResult> {
  try {
    const wallet = new Wallet(privateKey);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.signingKey.publicKey,
    };
  } catch (error) {
    throw new Error(`Failed to import wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import wallet from mnemonic phrase
 */
export async function importWalletFromMnemonic(mnemonic: string, index: number = 0): Promise<WalletCreationResult> {
  try {
    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${index}`);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
      publicKey: wallet.publicKey,
    };
  } catch (error) {
    throw new Error(`Failed to import wallet from mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get wallet balance and holdings from Gdex SDK
 */
export async function getWalletBalance(
  address: string, 
  chainId: number = 1 // Default to Ethereum mainnet
): Promise<WalletBalance> {
  try {
    const sdk = await getSDK();
    
    // Get user info and holdings from SDK
    const userInfo = await sdk.user.getUser(address, chainId);
    
    if (!userInfo || userInfo.error) {
      // Return empty balance if user not found
      return {
        address,
        chainId,
        nativeBalance: '0',
        nativeSymbol: getChainSymbol(chainId),
        holdings: [],
      };
    }

    // Get holdings
    const holdingsResponse = await sdk.user.getHoldings(address, chainId);
    
    const holdings: HoldingInfo[] = [];
    if (holdingsResponse && Array.isArray(holdingsResponse)) {
      for (const holding of holdingsResponse) {
        holdings.push({
          tokenAddress: holding.tokenInfo?.address || '',
          symbol: holding.tokenInfo?.symbol || 'UNKNOWN',
          name: holding.tokenInfo?.name || 'Unknown Token',
          amount: holding.amount || '0',
          uiAmount: holding.uiAmount || 0,
          valueUsd: holding.holding || 0,
          pnlPercentage: holding.pnlPercentage || 0,
        });
      }
    }

    return {
      address,
      chainId,
      nativeBalance: userInfo.balance?.toString() || '0',
      nativeSymbol: getChainSymbol(chainId),
      holdings,
    };
  } catch (error) {
    throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate wallet address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get native currency symbol for chain
 */
function getChainSymbol(chainId: number): string {
  const symbols: Record<number, string> = {
    1: 'ETH',      // Ethereum Mainnet
    56: 'BNB',     // BSC
    137: 'MATIC',  // Polygon
    43114: 'AVAX', // Avalanche
    42161: 'ETH',  // Arbitrum
    10: 'ETH',     // Optimism
    8453: 'ETH',   // Base
    // Solana uses different addressing, handled separately
  };
  return symbols[chainId] || 'ETH';
}

/**
 * Get supported chains
 */
export function getSupportedChains(): Array<{ chainId: number; name: string; symbol: string }> {
  return [
    { chainId: 1, name: 'Ethereum', symbol: 'ETH' },
    { chainId: 56, name: 'BNB Chain', symbol: 'BNB' },
    { chainId: 137, name: 'Polygon', symbol: 'MATIC' },
    { chainId: 43114, name: 'Avalanche', symbol: 'AVAX' },
    { chainId: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { chainId: 10, name: 'Optimism', symbol: 'ETH' },
    { chainId: 8453, name: 'Base', symbol: 'ETH' },
  ];
}

export default {
  createWallet,
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  getWalletBalance,
  isValidAddress,
  getSupportedChains,
};
