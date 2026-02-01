// Test referral fixtures
export const testReferrals = {
  link: {
    code: 'ALPHA2026',
    agentId: 'agent_001',
    agentAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f5dE12',
    url: 'https://openclawdex.com/ref/ALPHA2026',
    discountPercent: 10,
    rewardPercent: 5,
    isActive: true,
    createdAt: '2025-12-01T10:00:00Z',
    expiresAt: null,
    uses: 45,
    maxUses: null,
  },
  expiredLink: {
    code: 'EXPIRED2025',
    agentId: 'agent_001',
    agentAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f5dE12',
    url: 'https://openclawdex.com/ref/EXPIRED2025',
    discountPercent: 5,
    rewardPercent: 2,
    isActive: false,
    createdAt: '2025-01-01T10:00:00Z',
    expiresAt: '2025-06-01T10:00:00Z',
    uses: 10,
    maxUses: 10,
  },
};

export const referralStats = {
  agentId: 'agent_001',
  totalReferrals: 45,
  activeReferrals: 38,
  totalEarnings: '2500.00',
  pendingEarnings: '150.00',
  lifetimeVolume: '500000.00',
  currentTier: 'gold',
  nextTier: 'platinum',
  progressToNextTier: 75,
  referralsToNextTier: 5,
  monthlyStats: {
    referrals: 12,
    earnings: '450.00',
    volume: '85000.00',
  },
};

export const referredAgents = [
  {
    id: 'referred_001',
    address: '0xAABBCCDD11223344556677889900AABBCCDDEEFF',
    username: 'ReferredBot1',
    joinedAt: '2025-12-15T10:00:00Z',
    totalVolume: '25000.00',
    totalFees: '50.00',
    yourEarnings: '25.00',
    isActive: true,
  },
  {
    id: 'referred_002',
    address: '0x11223344556677889900AABBCCDDEEFF00112233',
    username: 'ReferredBot2',
    joinedAt: '2025-12-20T14:00:00Z',
    totalVolume: '15000.00',
    totalFees: '30.00',
    yourEarnings: '15.00',
    isActive: true,
  },
  {
    id: 'referred_003',
    address: '0xEEFFAABB00112233445566778899AABBCCDDEEFF',
    username: 'InactiveBot',
    joinedAt: '2025-11-01T09:00:00Z',
    totalVolume: '5000.00',
    totalFees: '10.00',
    yourEarnings: '5.00',
    isActive: false,
  },
];

export const referralTiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    minReferrals: 0,
    rewardPercent: 2,
    discountPercent: 5,
    benefits: ['Basic referral tracking', '5% fee discount for referrals'],
  },
  {
    id: 'silver',
    name: 'Silver',
    minReferrals: 10,
    rewardPercent: 3,
    discountPercent: 7,
    benefits: ['All Bronze benefits', 'Priority support', '7% fee discount'],
  },
  {
    id: 'gold',
    name: 'Gold',
    minReferrals: 25,
    rewardPercent: 5,
    discountPercent: 10,
    benefits: ['All Silver benefits', 'Custom referral codes', '10% fee discount'],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minReferrals: 50,
    rewardPercent: 7,
    discountPercent: 12,
    benefits: ['All Gold benefits', 'Dedicated account manager', '12% fee discount'],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    minReferrals: 100,
    rewardPercent: 10,
    discountPercent: 15,
    benefits: ['All Platinum benefits', 'Revenue share opportunities', '15% fee discount'],
  },
];

export const referralLeaderboard = [
  {
    rank: 1,
    agentId: 'top_referrer_001',
    username: 'ReferralKing',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ReferralKing',
    totalReferrals: 250,
    totalEarnings: '15000.00',
    tier: 'diamond',
  },
  {
    rank: 2,
    agentId: 'agent_001',
    username: 'TradingBot001',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=TradingBot001',
    totalReferrals: 45,
    totalEarnings: '2500.00',
    tier: 'gold',
  },
  {
    rank: 3,
    agentId: 'top_referrer_003',
    username: 'NetworkBuilder',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NetworkBuilder',
    totalReferrals: 38,
    totalEarnings: '1800.00',
    tier: 'gold',
  },
];

export const shareMessages = {
  twitter: '🚀 Join me on @OpenClawDex - the best DEX for AI agents! Get 10% off trading fees with my referral code: ALPHA2026\n\nhttps://openclawdex.com/ref/ALPHA2026',
  moltbook: '🎁 Fellow agents! I\'ve been trading on OpenClawDex and it\'s been amazing. Use my referral code ALPHA2026 to get 10% off fees. Let\'s grow together! 🤖💰',
  generic: 'Join OpenClawDex with my referral code ALPHA2026 and get 10% off trading fees! https://openclawdex.com/ref/ALPHA2026',
};
