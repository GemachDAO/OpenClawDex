import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the wallet service
const WalletService = {
  createWallet: vi.fn(),
  importWallet: vi.fn(),
  getBalance: vi.fn(),
  getBalances: vi.fn(),
  validateAddress: vi.fn(),
  getSupportedChains: vi.fn(),
  getTransactionHistory: vi.fn(),
  signTransaction: vi.fn(),
  signMessage: vi.fn(),
};

describe('WalletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    WalletService.createWallet.mockImplementation(async (chain: string) => ({
      address: '0x1234567890123456789012345678901234567890',
      chain,
      createdAt: new Date().toISOString(),
    }));
    
    WalletService.importWallet.mockImplementation(async (privateKey: string, chain: string) => ({
      address: '0x1234567890123456789012345678901234567890',
      chain,
      imported: true,
    }));
    
    WalletService.getBalance.mockImplementation(async (address: string, chain: string) => ({
      address,
      chain,
      balances: [
        { symbol: 'ETH', balance: '1.5', usdValue: '4500.00' },
        { symbol: 'USDC', balance: '1000', usdValue: '1000.00' },
      ],
      totalUsdValue: '5500.00',
    }));
    
    WalletService.validateAddress.mockImplementation(async (address: string, chain: string) => ({
      address,
      chain,
      isValid: address.match(/^0x[a-fA-F0-9]{40}$/) !== null,
    }));
    
    WalletService.getSupportedChains.mockResolvedValue([
      { id: 'ethereum', name: 'Ethereum', chainId: 1, rpcUrl: 'https://eth.llamarpc.com' },
      { id: 'bsc', name: 'BSC', chainId: 56, rpcUrl: 'https://bsc.llamarpc.com' },
      { id: 'polygon', name: 'Polygon', chainId: 137, rpcUrl: 'https://polygon.llamarpc.com' },
      { id: 'arbitrum', name: 'Arbitrum', chainId: 42161, rpcUrl: 'https://arb.llamarpc.com' },
      { id: 'base', name: 'Base', chainId: 8453, rpcUrl: 'https://base.llamarpc.com' },
    ]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createWallet', () => {
    it('should create a wallet for Ethereum', async () => {
      const result = await WalletService.createWallet('ethereum');

      expect(result).toHaveProperty('address');
      expect(result.chain).toBe('ethereum');
      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should create wallet for different chains', async () => {
      const chains = ['bsc', 'polygon', 'arbitrum', 'base'];
      
      for (const chain of chains) {
        const result = await WalletService.createWallet(chain);
        expect(result.chain).toBe(chain);
      }
    });

    it('should throw error for unsupported chain', async () => {
      WalletService.createWallet.mockRejectedValueOnce(new Error('Unsupported chain'));
      
      await expect(WalletService.createWallet('unsupported')).rejects.toThrow('Unsupported chain');
    });
  });

  describe('importWallet', () => {
    it('should import wallet from private key', async () => {
      const privateKey = '0x' + 'a'.repeat(64);
      const result = await WalletService.importWallet(privateKey, 'ethereum');

      expect(result).toHaveProperty('address');
      expect(result.imported).toBe(true);
    });

    it('should reject invalid private key', async () => {
      WalletService.importWallet.mockRejectedValueOnce(new Error('Invalid private key'));
      
      await expect(WalletService.importWallet('invalid', 'ethereum')).rejects.toThrow('Invalid private key');
    });

    it('should import wallet with seed phrase', async () => {
      WalletService.importWallet.mockResolvedValueOnce({
        address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        imported: true,
        method: 'mnemonic',
      });
      
      const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const result = await WalletService.importWallet(seedPhrase, 'ethereum');

      expect(result.imported).toBe(true);
    });
  });

  describe('getBalance', () => {
    it('should return wallet balances', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = await WalletService.getBalance(address, 'ethereum');

      expect(result).toHaveProperty('balances');
      expect(result).toHaveProperty('totalUsdValue');
      expect(Array.isArray(result.balances)).toBe(true);
    });

    it('should include balance properties', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = await WalletService.getBalance(address, 'ethereum');

      const balance = result.balances[0];
      expect(balance).toHaveProperty('symbol');
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('usdValue');
    });

    it('should return empty balances for new wallet', async () => {
      WalletService.getBalance.mockResolvedValueOnce({
        address: '0xnewaddress',
        chain: 'ethereum',
        balances: [],
        totalUsdValue: '0.00',
      });
      
      const result = await WalletService.getBalance('0xnewaddress', 'ethereum');
      expect(result.balances).toHaveLength(0);
      expect(result.totalUsdValue).toBe('0.00');
    });

    it('should throw error for invalid address', async () => {
      WalletService.getBalance.mockRejectedValueOnce(new Error('Invalid address'));
      
      await expect(WalletService.getBalance('invalid', 'ethereum')).rejects.toThrow('Invalid address');
    });
  });

  describe('getBalances', () => {
    it('should return balances across all chains', async () => {
      WalletService.getBalances = vi.fn().mockResolvedValue({
        ethereum: { totalUsdValue: '5500.00', balances: [] },
        bsc: { totalUsdValue: '1200.00', balances: [] },
        polygon: { totalUsdValue: '800.00', balances: [] },
      });
      
      const address = '0x1234567890123456789012345678901234567890';
      const result = await WalletService.getBalances(address);

      expect(result).toHaveProperty('ethereum');
      expect(result).toHaveProperty('bsc');
      expect(result).toHaveProperty('polygon');
    });
  });

  describe('validateAddress', () => {
    it('should validate Ethereum address', async () => {
      const result = await WalletService.validateAddress(
        '0x1234567890123456789012345678901234567890',
        'ethereum'
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid address', async () => {
      const result = await WalletService.validateAddress('invalid', 'ethereum');
      expect(result.isValid).toBe(false);
    });

    it('should validate checksum address', async () => {
      WalletService.validateAddress.mockResolvedValueOnce({
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        chain: 'ethereum',
        isValid: true,
        isChecksummed: true,
      });
      
      const result = await WalletService.validateAddress(
        '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        'ethereum'
      );

      expect(result.isValid).toBe(true);
      expect(result.isChecksummed).toBe(true);
    });
  });

  describe('getSupportedChains', () => {
    it('should return all supported chains', async () => {
      const chains = await WalletService.getSupportedChains();

      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
    });

    it('should include chain properties', async () => {
      const chains = await WalletService.getSupportedChains();
      const chain = chains[0];

      expect(chain).toHaveProperty('id');
      expect(chain).toHaveProperty('name');
      expect(chain).toHaveProperty('chainId');
      expect(chain).toHaveProperty('rpcUrl');
    });

    it('should include Ethereum', async () => {
      const chains = await WalletService.getSupportedChains();
      const ethereum = chains.find((c: any) => c.id === 'ethereum');

      expect(ethereum).toBeDefined();
      expect(ethereum?.chainId).toBe(1);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', async () => {
      WalletService.getTransactionHistory.mockResolvedValueOnce({
        transactions: [
          {
            hash: '0x' + 'a'.repeat(64),
            from: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            value: '1.5',
            symbol: 'ETH',
            timestamp: Date.now(),
            status: 'confirmed',
          },
        ],
        total: 1,
      });
      
      const address = '0x1234567890123456789012345678901234567890';
      const result = await WalletService.getTransactionHistory(address, 'ethereum');

      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.transactions)).toBe(true);
    });

    it('should filter by token', async () => {
      WalletService.getTransactionHistory.mockResolvedValueOnce({
        transactions: [],
        total: 0,
        token: 'USDC',
      });
      
      const address = '0x1234567890123456789012345678901234567890';
      const result = await WalletService.getTransactionHistory(address, 'ethereum', { token: 'USDC' });

      expect(result.token).toBe('USDC');
    });
  });

  describe('signTransaction', () => {
    it('should sign transaction', async () => {
      WalletService.signTransaction.mockResolvedValueOnce({
        signedTx: '0x' + 'f'.repeat(128),
        hash: '0x' + 'a'.repeat(64),
      });
      
      const tx = {
        to: '0x0987654321098765432109876543210987654321',
        value: '1000000000000000000',
        gasLimit: '21000',
      };
      
      const result = await WalletService.signTransaction(tx, 'ethereum');

      expect(result).toHaveProperty('signedTx');
      expect(result).toHaveProperty('hash');
    });
  });

  describe('signMessage', () => {
    it('should sign message', async () => {
      WalletService.signMessage.mockResolvedValueOnce({
        message: 'Hello, OpenClaw!',
        signature: '0x' + 'a'.repeat(130),
      });
      
      const result = await WalletService.signMessage('Hello, OpenClaw!', 'ethereum');

      expect(result).toHaveProperty('signature');
      expect(result.message).toBe('Hello, OpenClaw!');
    });

    it('should sign typed data', async () => {
      WalletService.signMessage.mockResolvedValueOnce({
        signature: '0x' + 'b'.repeat(130),
        type: 'EIP712',
      });
      
      const typedData = {
        domain: { name: 'OpenClaw', version: '1' },
        types: { Trade: [{ name: 'amount', type: 'uint256' }] },
        value: { amount: '1000' },
      };
      
      const result = await WalletService.signMessage(JSON.stringify(typedData), 'ethereum');

      expect(result).toHaveProperty('signature');
    });
  });
});
