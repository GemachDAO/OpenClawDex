/**
 * Wallet Routes
 * 
 * REST API endpoints for wallet management:
 * - POST /api/wallet/create - Create new wallet
 * - POST /api/wallet/import - Import existing wallet
 * - GET /api/wallet/balance - Get wallet balance
 * - GET /api/wallet/chains - Get supported chains
 */

import { Router, Request, Response } from 'express';
import {
  createWallet,
  importWalletFromPrivateKey,
  importWalletFromMnemonic,
  getWalletBalance,
  isValidAddress,
  getSupportedChains,
} from '../services/wallet.service.js';

const router = Router();

/**
 * POST /api/wallet/create
 * Create a new wallet
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { withMnemonic = true } = req.body;
    
    const wallet = await createWallet(withMnemonic);
    
    res.json({
      success: true,
      data: {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic,
        publicKey: wallet.publicKey,
      },
      warning: '⚠️ SAVE YOUR PRIVATE KEY AND MNEMONIC SECURELY! They cannot be recovered.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    });
  }
});

/**
 * POST /api/wallet/import
 * Import an existing wallet from private key or mnemonic
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { privateKey, mnemonic, index = 0 } = req.body;
    
    if (!privateKey && !mnemonic) {
      return res.status(400).json({
        success: false,
        error: 'Either privateKey or mnemonic is required',
      });
    }
    
    let wallet;
    if (mnemonic) {
      wallet = await importWalletFromMnemonic(mnemonic, index);
    } else {
      wallet = await importWalletFromPrivateKey(privateKey);
    }
    
    res.json({
      success: true,
      data: {
        address: wallet.address,
        publicKey: wallet.publicKey,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import wallet',
    });
  }
});

/**
 * GET /api/wallet/balance
 * Get wallet balance and holdings
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const { address, chainId = '1' } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }
    
    if (!isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }
    
    const balance = await getWalletBalance(address, parseInt(chainId as string, 10));
    
    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet balance',
    });
  }
});

/**
 * GET /api/wallet/validate
 * Validate a wallet address
 */
router.get('/validate', (req: Request, res: Response) => {
  const { address } = req.query;
  
  if (!address || typeof address !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required',
    });
  }
  
  const isValid = isValidAddress(address);
  
  res.json({
    success: true,
    data: {
      address,
      isValid,
    },
  });
});

/**
 * GET /api/wallet/chains
 * Get list of supported chains
 */
router.get('/chains', (_req: Request, res: Response) => {
  const chains = getSupportedChains();
  
  res.json({
    success: true,
    data: chains,
  });
});

export default router;
