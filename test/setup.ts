import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});

// Global test timeout
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.GDEX_API_KEY = 'test_gdex_api_key';
process.env.GDEX_API_SECRET = 'test_gdex_api_secret';
process.env.MOLTBOOK_API_URL = 'https://api.moltbook.test';
process.env.MOLTBOOK_API_KEY = 'moltbook_test_key';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.HYPERLIQUID_API_URL = 'https://api.hyperliquid.test';
