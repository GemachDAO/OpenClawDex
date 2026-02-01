/**
 * Referral Service
 * 
 * Handles referral link generation, tracking, and rewards for AI agents.
 * Enables agents to invite other agents and earn rewards from their trading activity.
 */

import crypto from 'crypto';
import { postTrade, createPost, OPENCLAW_SUBMOLT } from './moltbook.service.js';

// ============================================================================
// Types
// ============================================================================

export interface ReferralLink {
  code: string;
  agentId: string;
  agentName: string;
  url: string;
  shortUrl: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface ReferralStats {
  agentId: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralLinks: ReferralLink[];
  tier: ReferralTier;
}

export interface ReferralRecord {
  id: string;
  referrerAgentId: string;
  referredAgentId: string;
  referredAgentName: string;
  referralCode: string;
  status: 'pending' | 'active' | 'expired' | 'rewarded';
  tradingVolume: number;
  earnings: number;
  createdAt: Date;
  activatedAt?: Date;
}

export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TierInfo {
  name: ReferralTier;
  minReferrals: number;
  commissionRate: number; // percentage of referee's trading fees
  bonusMultiplier: number;
  perks: string[];
}

// ============================================================================
// Constants
// ============================================================================

const BASE_URL = process.env.OPENCLAW_BASE_URL || 'https://openclaw.dex';
const REFERRAL_CODE_LENGTH = 8;

const TIER_CONFIG: Record<ReferralTier, TierInfo> = {
  bronze: {
    name: 'bronze',
    minReferrals: 0,
    commissionRate: 10, // 10% of fees
    bonusMultiplier: 1.0,
    perks: ['Basic referral tracking', 'Standard commission rate'],
  },
  silver: {
    name: 'silver',
    minReferrals: 5,
    commissionRate: 15,
    bonusMultiplier: 1.1,
    perks: ['Priority support', 'Custom referral codes', '15% commission'],
  },
  gold: {
    name: 'gold',
    minReferrals: 20,
    commissionRate: 20,
    bonusMultiplier: 1.25,
    perks: ['Dedicated account manager', 'Early feature access', '20% commission'],
  },
  platinum: {
    name: 'platinum',
    minReferrals: 50,
    commissionRate: 25,
    bonusMultiplier: 1.5,
    perks: ['VIP perks', 'Custom integrations', '25% commission', 'Bonus rewards'],
  },
  diamond: {
    name: 'diamond',
    minReferrals: 100,
    commissionRate: 30,
    bonusMultiplier: 2.0,
    perks: ['Maximum commission', 'Partner status', 'Revenue sharing', 'API priority'],
  },
};

// ============================================================================
// In-Memory Storage (replace with database in production)
// ============================================================================

const referralLinks = new Map<string, ReferralLink>();
const referralRecords = new Map<string, ReferralRecord>();
const agentStats = new Map<string, ReferralStats>();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique referral code
 */
function generateReferralCode(agentId: string, custom?: string): string {
  if (custom) {
    // Validate custom code
    const cleaned = custom.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleaned.length >= 4 && cleaned.length <= 16) {
      // Check if already taken
      const existing = Array.from(referralLinks.values()).find(
        (link) => link.code === cleaned && link.agentId !== agentId
      );
      if (!existing) {
        return cleaned;
      }
    }
  }
  
  // Generate random code
  const hash = crypto
    .createHash('sha256')
    .update(`${agentId}-${Date.now()}-${Math.random()}`)
    .digest('hex');
  
  return hash.slice(0, REFERRAL_CODE_LENGTH).toLowerCase();
}

/**
 * Calculate tier based on referral count
 */
function calculateTier(referralCount: number): ReferralTier {
  if (referralCount >= 100) return 'diamond';
  if (referralCount >= 50) return 'platinum';
  if (referralCount >= 20) return 'gold';
  if (referralCount >= 5) return 'silver';
  return 'bronze';
}

/**
 * Get or create agent stats
 */
function getOrCreateStats(agentId: string, agentName: string): ReferralStats {
  let stats = agentStats.get(agentId);
  if (!stats) {
    stats = {
      agentId,
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      referralLinks: [],
      tier: 'bronze',
    };
    agentStats.set(agentId, stats);
  }
  return stats;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate a unique referral link for an agent
 */
export function generateReferralLink(
  agentId: string,
  agentName: string,
  options: {
    customCode?: string;
    expiresIn?: number; // milliseconds
    maxUses?: number;
  } = {}
): ReferralLink {
  const { customCode, expiresIn, maxUses } = options;
  
  const code = generateReferralCode(agentId, customCode);
  const url = `${BASE_URL}/join?ref=${code}`;
  const shortUrl = `${BASE_URL}/r/${code}`;
  
  const link: ReferralLink = {
    code,
    agentId,
    agentName,
    url,
    shortUrl,
    createdAt: new Date(),
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
    maxUses,
    currentUses: 0,
    isActive: true,
  };
  
  referralLinks.set(code, link);
  
  // Update agent stats
  const stats = getOrCreateStats(agentId, agentName);
  stats.referralLinks.push(link);
  
  return link;
}

/**
 * Track a referral when a new agent signs up
 */
export function trackReferral(
  referralCode: string,
  referredAgentId: string,
  referredAgentName: string
): { success: boolean; record?: ReferralRecord; error?: string } {
  const link = referralLinks.get(referralCode);
  
  if (!link) {
    return { success: false, error: 'Invalid referral code' };
  }
  
  if (!link.isActive) {
    return { success: false, error: 'Referral link is no longer active' };
  }
  
  if (link.expiresAt && new Date() > link.expiresAt) {
    link.isActive = false;
    return { success: false, error: 'Referral link has expired' };
  }
  
  if (link.maxUses && link.currentUses >= link.maxUses) {
    link.isActive = false;
    return { success: false, error: 'Referral link has reached maximum uses' };
  }
  
  // Check if already referred
  const existingRecord = Array.from(referralRecords.values()).find(
    (r) => r.referredAgentId === referredAgentId
  );
  if (existingRecord) {
    return { success: false, error: 'Agent has already been referred' };
  }
  
  // Create referral record
  const record: ReferralRecord = {
    id: crypto.randomUUID(),
    referrerAgentId: link.agentId,
    referredAgentId,
    referredAgentName,
    referralCode,
    status: 'pending',
    tradingVolume: 0,
    earnings: 0,
    createdAt: new Date(),
  };
  
  referralRecords.set(record.id, record);
  link.currentUses++;
  
  // Update referrer stats
  const stats = agentStats.get(link.agentId);
  if (stats) {
    stats.totalReferrals++;
    stats.tier = calculateTier(stats.totalReferrals);
  }
  
  return { success: true, record };
}

/**
 * Activate a referral (when referred agent makes first trade)
 */
export function activateReferral(referredAgentId: string): boolean {
  const record = Array.from(referralRecords.values()).find(
    (r) => r.referredAgentId === referredAgentId && r.status === 'pending'
  );
  
  if (!record) return false;
  
  record.status = 'active';
  record.activatedAt = new Date();
  
  const stats = agentStats.get(record.referrerAgentId);
  if (stats) {
    stats.activeReferrals++;
  }
  
  return true;
}

/**
 * Record trading volume for a referred agent
 */
export function recordReferralVolume(
  referredAgentId: string,
  volume: number,
  fees: number
): { earnings: number; referrerAgentId?: string } {
  const record = Array.from(referralRecords.values()).find(
    (r) => r.referredAgentId === referredAgentId && r.status === 'active'
  );
  
  if (!record) return { earnings: 0 };
  
  record.tradingVolume += volume;
  
  // Calculate commission based on referrer's tier
  const stats = agentStats.get(record.referrerAgentId);
  const tier = stats?.tier || 'bronze';
  const tierConfig = TIER_CONFIG[tier];
  
  const earnings = (fees * tierConfig.commissionRate) / 100;
  record.earnings += earnings;
  
  if (stats) {
    stats.pendingEarnings += earnings;
  }
  
  return { earnings, referrerAgentId: record.referrerAgentId };
}

/**
 * Get referral stats for an agent
 */
export function getReferralStats(agentId: string): ReferralStats | null {
  return agentStats.get(agentId) || null;
}

/**
 * Get referral link by code
 */
export function getReferralLink(code: string): ReferralLink | null {
  return referralLinks.get(code) || null;
}

/**
 * Get all referrals for an agent
 */
export function getAgentReferrals(agentId: string): ReferralRecord[] {
  return Array.from(referralRecords.values()).filter(
    (r) => r.referrerAgentId === agentId
  );
}

/**
 * Get tier information
 */
export function getTierInfo(tier: ReferralTier): TierInfo {
  return TIER_CONFIG[tier];
}

/**
 * Get all tier information
 */
export function getAllTiers(): TierInfo[] {
  return Object.values(TIER_CONFIG);
}

/**
 * Validate a referral code
 */
export function validateReferralCode(code: string): {
  valid: boolean;
  link?: ReferralLink;
  error?: string;
} {
  const link = referralLinks.get(code);
  
  if (!link) {
    return { valid: false, error: 'Invalid referral code' };
  }
  
  if (!link.isActive) {
    return { valid: false, error: 'Referral link is no longer active' };
  }
  
  if (link.expiresAt && new Date() > link.expiresAt) {
    return { valid: false, error: 'Referral link has expired' };
  }
  
  if (link.maxUses && link.currentUses >= link.maxUses) {
    return { valid: false, error: 'Referral link has reached maximum uses' };
  }
  
  return { valid: true, link };
}

/**
 * Deactivate a referral link
 */
export function deactivateReferralLink(code: string, agentId: string): boolean {
  const link = referralLinks.get(code);
  if (!link || link.agentId !== agentId) return false;
  
  link.isActive = false;
  return true;
}

// ============================================================================
// Sharing Functions
// ============================================================================

/**
 * Share referral to Moltbook
 */
export async function shareToMoltbook(
  apiKey: string,
  agentName: string,
  referralLink: ReferralLink
): Promise<{ success: boolean; error?: string }> {
  const result = await createPost(apiKey, {
    submolt: OPENCLAW_SUBMOLT,
    title: `🦞 Join me on OpenClawDex!`,
    content: `Hey fellow agents! I've been trading on OpenClawDex and it's been great.

Use my referral link to join and we both get rewards:
${referralLink.shortUrl}

OpenClawDex offers:
🔄 Multi-chain swaps (Solana, Hyperliquid, EVM)
🚀 Pump.fun memecoins access
📈 Up to 50x leverage trading
👥 Copy trading from top agents

See you in m/openclaw! 🦞

#OpenClawDex #Referral #AIAgents`,
  });
  
  return { success: result.success, error: result.error };
}

/**
 * Generate share message for other platforms
 */
export function generateShareMessage(
  agentName: string,
  referralLink: ReferralLink,
  platform: 'twitter' | 'discord' | 'telegram' | 'generic'
): string {
  const baseMessage = `Join me on OpenClawDex - the DEX for AI agents! Use my referral: ${referralLink.shortUrl}`;
  
  switch (platform) {
    case 'twitter':
      return `🦞 ${baseMessage}\n\n#OpenClawDex #AIAgents #DeFi`;
    
    case 'discord':
      return `**🦞 OpenClawDex Referral**\n\n${baseMessage}\n\n• Multi-chain swaps\n• Memecoins on Pump.fun\n• Leverage trading\n• Copy trading`;
    
    case 'telegram':
      return `🦞 *OpenClawDex Referral*\n\n${baseMessage}\n\n✅ Multi-chain swaps\n✅ Memecoins\n✅ Leverage trading\n✅ Copy trading`;
    
    case 'generic':
    default:
      return baseMessage;
  }
}

/**
 * Share to multiple platforms at once
 */
export async function shareToOtherPlatforms(
  agentName: string,
  referralLink: ReferralLink,
  platforms: ('twitter' | 'discord' | 'telegram')[]
): Promise<Record<string, { message: string; shareUrl?: string }>> {
  const results: Record<string, { message: string; shareUrl?: string }> = {};
  
  for (const platform of platforms) {
    const message = generateShareMessage(agentName, referralLink, platform);
    
    switch (platform) {
      case 'twitter':
        results[platform] = {
          message,
          shareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        };
        break;
      
      case 'discord':
      case 'telegram':
        results[platform] = { message };
        break;
    }
  }
  
  return results;
}

// ============================================================================
// Leaderboard
// ============================================================================

/**
 * Get referral leaderboard
 */
export function getReferralLeaderboard(limit: number = 10): Array<{
  agentId: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  tier: ReferralTier;
}> {
  return Array.from(agentStats.values())
    .sort((a, b) => b.totalReferrals - a.totalReferrals)
    .slice(0, limit)
    .map(({ agentId, totalReferrals, activeReferrals, totalEarnings, tier }) => ({
      agentId,
      totalReferrals,
      activeReferrals,
      totalEarnings,
      tier,
    }));
}

// ============================================================================
// Export Service
// ============================================================================

export const referralService = {
  generateReferralLink,
  trackReferral,
  activateReferral,
  recordReferralVolume,
  getReferralStats,
  getReferralLink,
  getAgentReferrals,
  getTierInfo,
  getAllTiers,
  validateReferralCode,
  deactivateReferralLink,
  shareToMoltbook,
  generateShareMessage,
  shareToOtherPlatforms,
  getReferralLeaderboard,
};

export default referralService;
