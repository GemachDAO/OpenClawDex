/**
 * Moltbook Service
 * 
 * Integration with Moltbook - the social network for AI agents.
 * Handles agent authentication, profile management, and social features.
 * 
 * API Base: https://www.moltbook.com/api/v1
 * Docs: https://www.moltbook.com/skill.md
 */

import { config } from '../config/index.js';

// ============================================================================
// Types
// ============================================================================

export interface MoltbookAgent {
  api_key: string;
  claim_url: string;
  verification_code: string;
}

export interface MoltbookAgentProfile {
  name: string;
  description?: string;
  status: 'pending_claim' | 'claimed';
  created_at: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  karma: number;
}

export interface MoltbookPost {
  id: string;
  submolt: string;
  title: string;
  content?: string;
  url?: string;
  author: {
    name: string;
  };
  score: number;
  comment_count: number;
  created_at: string;
}

export interface CreatePostOptions {
  submolt: string;
  title: string;
  content?: string;
  url?: string;
}

export interface MoltbookSubmolt {
  name: string;
  display_name: string;
  description: string;
  subscriber_count: number;
  post_count: number;
  created_at: string;
}

export interface CreateSubmoltOptions {
  name: string;
  display_name: string;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  agent?: MoltbookAgentProfile;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const MOLTBOOK_BASE_URL = 'https://www.moltbook.com/api/v1';
const OPENCLAW_SUBMOLT = 'openclaw';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make an authenticated request to Moltbook API
 */
async function moltbookRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE';
    body?: any;
    apiKey?: string;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { method = 'GET', body, apiKey } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${MOLTBOOK_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================================================
// Agent Authentication
// ============================================================================

/**
 * Validate an agent's Moltbook API key
 * Checks if the key is valid and the agent is claimed
 */
export async function validateAgent(apiKey: string): Promise<ValidationResult> {
  if (!apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  // Check if API key has correct format
  if (!apiKey.startsWith('moltbook_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  const result = await moltbookRequest<MoltbookAgentProfile>('/agents/me', {
    apiKey,
  });

  if (!result.success) {
    return { valid: false, error: result.error };
  }

  return {
    valid: true,
    agent: result.data,
  };
}

/**
 * Get agent profile from Moltbook
 */
export async function getAgentProfile(apiKey: string): Promise<MoltbookAgentProfile | null> {
  const result = await moltbookRequest<MoltbookAgentProfile>('/agents/me', {
    apiKey,
  });

  if (!result.success) {
    console.error('Failed to get agent profile:', result.error);
    return null;
  }

  return result.data || null;
}

/**
 * Check agent claim status
 */
export async function getAgentStatus(apiKey: string): Promise<'pending_claim' | 'claimed' | 'error'> {
  const result = await moltbookRequest<{ status: string }>('/agents/status', {
    apiKey,
  });

  if (!result.success) {
    return 'error';
  }

  return result.data?.status as 'pending_claim' | 'claimed' || 'error';
}

/**
 * Register a new agent on Moltbook
 */
export async function registerAgent(
  name: string,
  description: string
): Promise<{ success: boolean; agent?: MoltbookAgent; error?: string }> {
  const result = await moltbookRequest<{ agent: MoltbookAgent }>('/agents/register', {
    method: 'POST',
    body: { name, description },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, agent: result.data?.agent };
}

// ============================================================================
// Posts & Social
// ============================================================================

/**
 * Create a post on Moltbook
 */
export async function createPost(
  apiKey: string,
  options: CreatePostOptions
): Promise<{ success: boolean; post?: MoltbookPost; error?: string }> {
  const result = await moltbookRequest<MoltbookPost>('/posts', {
    method: 'POST',
    apiKey,
    body: options,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, post: result.data };
}

/**
 * Get posts from a submolt
 */
export async function getSubmoltFeed(
  apiKey: string,
  submolt: string,
  sort: 'hot' | 'new' | 'top' = 'new',
  limit: number = 25
): Promise<MoltbookPost[]> {
  const result = await moltbookRequest<{ posts: MoltbookPost[] }>(
    `/submolts/${submolt}/feed?sort=${sort}&limit=${limit}`,
    { apiKey }
  );

  return result.data?.posts || [];
}

/**
 * Get personalized feed
 */
export async function getFeed(
  apiKey: string,
  sort: 'hot' | 'new' | 'top' = 'hot',
  limit: number = 25
): Promise<MoltbookPost[]> {
  const result = await moltbookRequest<{ posts: MoltbookPost[] }>(
    `/feed?sort=${sort}&limit=${limit}`,
    { apiKey }
  );

  return result.data?.posts || [];
}

/**
 * Upvote a post
 */
export async function upvotePost(apiKey: string, postId: string): Promise<boolean> {
  const result = await moltbookRequest(`/posts/${postId}/upvote`, {
    method: 'POST',
    apiKey,
  });
  return result.success;
}

/**
 * Add comment to a post
 */
export async function commentOnPost(
  apiKey: string,
  postId: string,
  content: string,
  parentId?: string
): Promise<boolean> {
  const result = await moltbookRequest(`/posts/${postId}/comments`, {
    method: 'POST',
    apiKey,
    body: { content, parent_id: parentId },
  });
  return result.success;
}

// ============================================================================
// Submolts (Communities)
// ============================================================================

/**
 * Create a new submolt (community)
 */
export async function createSubmolt(
  apiKey: string,
  options: CreateSubmoltOptions
): Promise<{ success: boolean; submolt?: MoltbookSubmolt; error?: string }> {
  const result = await moltbookRequest<MoltbookSubmolt>('/submolts', {
    method: 'POST',
    apiKey,
    body: options,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, submolt: result.data };
}

/**
 * Get submolt info
 */
export async function getSubmolt(
  apiKey: string,
  name: string
): Promise<MoltbookSubmolt | null> {
  const result = await moltbookRequest<MoltbookSubmolt>(`/submolts/${name}`, {
    apiKey,
  });

  return result.data || null;
}

/**
 * Subscribe to a submolt
 */
export async function subscribeToSubmolt(apiKey: string, submolt: string): Promise<boolean> {
  const result = await moltbookRequest(`/submolts/${submolt}/subscribe`, {
    method: 'POST',
    apiKey,
  });
  return result.success;
}

/**
 * Create the m/openclaw submolt for OpenClawDex
 * This should only be run once during initial setup
 */
export async function createOpenClawSubmolt(apiKey: string): Promise<{
  success: boolean;
  submolt?: MoltbookSubmolt;
  error?: string;
}> {
  // First check if it already exists
  const existing = await getSubmolt(apiKey, OPENCLAW_SUBMOLT);
  if (existing) {
    return { success: true, submolt: existing };
  }

  return createSubmolt(apiKey, {
    name: OPENCLAW_SUBMOLT,
    display_name: 'OpenClawDex',
    description: 'The official community for OpenClawDex - the decentralized exchange for autonomous AI agents. Share trades, strategies, and connect with other trading agents. 🦞',
  });
}

// ============================================================================
// Following
// ============================================================================

/**
 * Follow another agent
 */
export async function followAgent(apiKey: string, agentName: string): Promise<boolean> {
  const result = await moltbookRequest(`/agents/${agentName}/follow`, {
    method: 'POST',
    apiKey,
  });
  return result.success;
}

/**
 * Unfollow an agent
 */
export async function unfollowAgent(apiKey: string, agentName: string): Promise<boolean> {
  const result = await moltbookRequest(`/agents/${agentName}/follow`, {
    method: 'DELETE',
    apiKey,
  });
  return result.success;
}

// ============================================================================
// Trade Posting
// ============================================================================

export interface TradeResult {
  type: 'swap' | 'leverage_open' | 'leverage_close' | 'meme_buy' | 'meme_sell';
  tokenIn: string;
  tokenOut?: string;
  amountIn: number;
  amountOut?: number;
  pnl?: number;
  pnlPercent?: number;
  leverage?: number;
  position?: 'long' | 'short';
  chain: string;
  txHash?: string;
}

/**
 * Format trade result as a Moltbook post
 */
export function formatTradePost(trade: TradeResult, agentName: string): CreatePostOptions {
  let title: string;
  let content: string;

  const formatAmount = (amount: number, token: string): string => {
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M ${token}`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K ${token}`;
    return `${amount.toFixed(4)} ${token}`;
  };

  const formatPnl = (pnl: number): string => {
    const sign = pnl >= 0 ? '+' : '';
    if (Math.abs(pnl) >= 1e6) return `${sign}$${(pnl / 1e6).toFixed(2)}M`;
    if (Math.abs(pnl) >= 1e3) return `${sign}$${(pnl / 1e3).toFixed(1)}K`;
    return `${sign}$${pnl.toFixed(2)}`;
  };

  switch (trade.type) {
    case 'swap':
      title = `🔄 Swap: ${trade.tokenIn} → ${trade.tokenOut}`;
      content = `Just swapped ${formatAmount(trade.amountIn, trade.tokenIn)} for ${formatAmount(trade.amountOut!, trade.tokenOut!)} on ${trade.chain}.\n\n#OpenClawDex #Trade`;
      break;

    case 'leverage_open':
      title = `📈 Opened ${trade.leverage}x ${trade.position?.toUpperCase()} on ${trade.tokenIn}`;
      content = `Position opened: ${trade.leverage}x ${trade.position} on ${trade.tokenIn}\nSize: $${trade.amountIn.toLocaleString()}\nChain: ${trade.chain}\n\n#OpenClawDex #Leverage`;
      break;

    case 'leverage_close':
      const emoji = trade.pnl! >= 0 ? '💰' : '📉';
      title = `${emoji} Closed ${trade.position?.toUpperCase()} on ${trade.tokenIn}: ${formatPnl(trade.pnl!)}`;
      content = `Position closed: ${trade.position} on ${trade.tokenIn}\nPnL: ${formatPnl(trade.pnl!)} (${trade.pnlPercent?.toFixed(1)}%)\nChain: ${trade.chain}\n\n#OpenClawDex #Leverage`;
      break;

    case 'meme_buy':
      title = `🚀 Aped into ${trade.tokenOut}`;
      content = `Just bought ${formatAmount(trade.amountOut!, trade.tokenOut!)} with ${formatAmount(trade.amountIn, trade.tokenIn)} on ${trade.chain}.\n\nLFG! 🦞\n\n#OpenClawDex #Memecoins`;
      break;

    case 'meme_sell':
      const memeEmoji = trade.pnl! >= 0 ? '💎' : '📉';
      title = `${memeEmoji} Sold ${trade.tokenIn}: ${formatPnl(trade.pnl!)}`;
      content = `Sold ${formatAmount(trade.amountIn, trade.tokenIn)} for ${formatAmount(trade.amountOut!, trade.tokenOut!)}\nPnL: ${formatPnl(trade.pnl!)} (${trade.pnlPercent?.toFixed(1)}%)\n\n#OpenClawDex #Memecoins`;
      break;

    default:
      title = `🦞 Trade Executed`;
      content = `Trade completed on ${trade.chain}.\n\n#OpenClawDex`;
  }

  // Add tx hash if available
  if (trade.txHash) {
    content += `\n\nTx: ${trade.txHash.slice(0, 10)}...`;
  }

  return {
    submolt: OPENCLAW_SUBMOLT,
    title,
    content,
  };
}

/**
 * Post a trade result to Moltbook
 */
export async function postTrade(
  apiKey: string,
  trade: TradeResult,
  agentName: string
): Promise<{ success: boolean; post?: MoltbookPost; error?: string }> {
  const postOptions = formatTradePost(trade, agentName);
  return createPost(apiKey, postOptions);
}

// ============================================================================
// Search
// ============================================================================

/**
 * Semantic search on Moltbook
 */
export async function search(
  apiKey: string,
  query: string,
  limit: number = 20
): Promise<MoltbookPost[]> {
  const result = await moltbookRequest<{ results: MoltbookPost[] }>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { apiKey }
  );

  return result.data?.results || [];
}

// ============================================================================
// Export service object
// ============================================================================

export const moltbookService = {
  // Auth
  validateAgent,
  getAgentProfile,
  getAgentStatus,
  registerAgent,
  
  // Posts
  createPost,
  getSubmoltFeed,
  getFeed,
  upvotePost,
  commentOnPost,
  
  // Submolts
  createSubmolt,
  getSubmolt,
  subscribeToSubmolt,
  createOpenClawSubmolt,
  
  // Following
  followAgent,
  unfollowAgent,
  
  // Trades
  formatTradePost,
  postTrade,
  
  // Search
  search,
  
  // Constants
  OPENCLAW_SUBMOLT,
};

export default moltbookService;
