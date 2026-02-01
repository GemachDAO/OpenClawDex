import { testAgents } from '../fixtures/moltbook';

/**
 * Generate authorization headers for testing
 */
export function getAuthHeaders(agentType: 'claimed' | 'unclaimed' | 'invalid' = 'claimed') {
  const keys: Record<string, string> = {
    claimed: testAgents.claimed.apiKey,
    unclaimed: testAgents.unclaimed.apiKey,
    invalid: 'invalid_api_key',
  };

  return {
    Authorization: `Bearer ${keys[agentType]}`,
  };
}

/**
 * Generate random Ethereum address
 */
export function randomAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Generate random transaction hash
 */
export function randomTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Generate random Solana address (base58)
 */
export function randomSolanaAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '';
  for (let i = 0; i < 44; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert response has expected structure
 */
export function assertApiResponse(response: any, expectedFields: string[]): void {
  for (const field of expectedFields) {
    if (!(field in response)) {
      throw new Error(`Expected field '${field}' not found in response`);
    }
  }
}

/**
 * Format error for test output
 */
export function formatTestError(error: any): string {
  if (error.response) {
    return `HTTP ${error.response.status}: ${JSON.stringify(error.response.body)}`;
  }
  return error.message || String(error);
}

/**
 * Create pagination params
 */
export function paginationParams(page: number = 1, limit: number = 20): Record<string, string> {
  return {
    page: String(page),
    limit: String(limit),
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is a valid ISO date string
 */
export function isISODateString(value: string): boolean {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime()) && value.includes('T');
}

/**
 * Check if value is a valid Ethereum address
 */
export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if value is a valid transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Generate test data with timestamp
 */
export function withTimestamp<T extends object>(data: T): T & { timestamp: string } {
  return {
    ...data,
    timestamp: new Date().toISOString(),
  };
}
