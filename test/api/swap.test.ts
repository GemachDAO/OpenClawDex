import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testSwaps, swapHistory, transactionStatuses, swapErrors, simulationResponse } from '../fixtures/swaps';
import { testWallets } from '../fixtures/wallets';
import { testTokens } from '../fixtures/tokens';

// Create test app for swap routes
const app = express();
app.use(express.json());

app.post('/api/swap', (req, res) => {
  const { fromToken, toToken, amount, walletAddress, slippage, chainId } = req.body;

  if (!fromToken || !toToken || !amount || !walletAddress || !chainId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Simulate insufficient balance
  if (Number(amount) > 1000) {
    return res.status(400).json(swapErrors.insufficientBalance);
  }

  // Simulate slippage exceeded
  if (slippage && Number(slippage) < 0.01) {
    return res.status(400).json(swapErrors.slippageExceeded);
  }

  res.json({
    txHash: testSwaps.ethToUsdc.execution.txHash,
    status: 'pending',
    fromAmount: amount,
    estimatedToAmount: String(parseFloat(amount) * 2985),
    chainId,
  });
});

app.post('/api/swap/simulate', (req, res) => {
  const { fromToken, toToken, amount, chainId } = req.body;

  if (!fromToken || !toToken || !amount || !chainId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Large trades get warnings
  if (Number(amount) > 50) {
    return res.json({
      ...simulationResponse,
      priceImpact: 3.5,
      warnings: [{
        type: 'HIGH_PRICE_IMPACT',
        message: 'This trade has a high price impact. Consider splitting into smaller trades.',
      }],
    });
  }

  res.json(simulationResponse);
});

app.get('/api/swap/:txHash/status', (req, res) => {
  const { txHash } = req.params;

  if (!txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return res.status(400).json({ error: 'Invalid transaction hash format' });
  }

  if (txHash === transactionStatuses.pending.txHash) {
    return res.json(transactionStatuses.pending);
  }

  if (txHash === transactionStatuses.failed.txHash) {
    return res.json(transactionStatuses.failed);
  }

  res.json(transactionStatuses.success);
});

app.get('/api/swap/:chainId/:walletAddress/history', (req, res) => {
  const { chainId, walletAddress } = req.params;
  const { limit = '20', page = '1' } = req.query;

  if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  res.json({
    swaps: swapHistory.slice(0, parseInt(limit as string)),
    total: swapHistory.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    chainId: parseInt(chainId),
    walletAddress,
  });
});

describe('Swap Routes', () => {
  describe('POST /api/swap', () => {
    it('should execute a swap', async () => {
      const response = await request(app)
        .post('/api/swap')
        .send({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '1.0',
          walletAddress: testWallets.ethereum.address,
          slippage: 0.5,
          chainId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('txHash');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('pending');
    });

    it('should return estimated output amount', async () => {
      const response = await request(app)
        .post('/api/swap')
        .send({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '1.0',
          walletAddress: testWallets.ethereum.address,
          chainId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('estimatedToAmount');
    });

    it('should reject missing required parameters', async () => {
      const response = await request(app)
        .post('/api/swap')
        .send({
          fromToken: testTokens.ethereum.native.address,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should reject invalid amount', async () => {
      const response = await request(app)
        .post('/api/swap')
        .send({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '-1',
          walletAddress: testWallets.ethereum.address,
          chainId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return error for insufficient balance', async () => {
      const response = await request(app)
        .post('/api/swap')
        .send({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '10000', // Very large amount
          walletAddress: testWallets.ethereum.address,
          chainId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient');
    });

    it('should handle slippage exceeded', async () => {
      const response = await request(app)
        .post('/api/swap')
        .send({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '1.0',
          walletAddress: testWallets.ethereum.address,
          slippage: 0.001, // Very low slippage
          chainId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('SLIPPAGE_EXCEEDED');
    });
  });

  describe('POST /api/swap/simulate', () => {
    it('should simulate a swap', async () => {
      const response = await request(app)
        .post('/api/swap/simulate')
        .send({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '1.0',
          chainId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('quote');
      expect(response.body).toHaveProperty('estimatedOutput');
      expect(response.body).toHaveProperty('priceImpact');
    });

    it('should return warnings for high price impact', async () => {
      const response = await request(app)
        .post('/api/swap/simulate')
        .send({
          fromToken: testTokens.ethereum.native.address,
          toToken: testTokens.ethereum.usdc.address,
          amount: '100', // Large trade
          chainId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('warnings');
      expect(response.body.warnings.length).toBeGreaterThan(0);
      expect(response.body.warnings[0].type).toBe('HIGH_PRICE_IMPACT');
    });

    it('should reject missing parameters', async () => {
      const response = await request(app)
        .post('/api/swap/simulate')
        .send({
          fromToken: testTokens.ethereum.native.address,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/swap/:txHash/status', () => {
    it('should return pending transaction status', async () => {
      const response = await request(app)
        .get(`/api/swap/${transactionStatuses.pending.txHash}/status`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('confirmations');
      expect(response.body).toHaveProperty('requiredConfirmations');
    });

    it('should return successful transaction status', async () => {
      const response = await request(app)
        .get(`/api/swap/${transactionStatuses.success.txHash}/status`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('blockNumber');
    });

    it('should return failed transaction status', async () => {
      const response = await request(app)
        .get(`/api/swap/${transactionStatuses.failed.txHash}/status`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('failed');
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid transaction hash format', async () => {
      const response = await request(app)
        .get('/api/swap/invalid-hash/status');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('GET /api/swap/:chainId/:walletAddress/history', () => {
    it('should return swap history', async () => {
      const response = await request(app)
        .get(`/api/swap/1/${testWallets.ethereum.address}/history`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('swaps');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.swaps)).toBe(true);
    });

    it('should return swap with expected properties', async () => {
      const response = await request(app)
        .get(`/api/swap/1/${testWallets.ethereum.address}/history`);

      expect(response.status).toBe(200);
      if (response.body.swaps.length > 0) {
        const swap = response.body.swaps[0];
        expect(swap).toHaveProperty('txHash');
        expect(swap).toHaveProperty('fromToken');
        expect(swap).toHaveProperty('toToken');
        expect(swap).toHaveProperty('fromAmount');
        expect(swap).toHaveProperty('toAmount');
        expect(swap).toHaveProperty('status');
      }
    });

    it('should respect pagination', async () => {
      const response = await request(app)
        .get(`/api/swap/1/${testWallets.ethereum.address}/history`)
        .query({ limit: '5', page: '1' });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(5);
      expect(response.body.page).toBe(1);
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .get('/api/swap/1/invalid-address/history');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });
  });
});
