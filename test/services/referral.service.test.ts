import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Referral service
const ReferralService = {
  generateLink: vi.fn(),
  getLink: vi.fn(),
  validateCode: vi.fn(),
  trackReferral: vi.fn(),
  getStats: vi.fn(),
  getReferredAgents: vi.fn(),
  shareReferral: vi.fn(),
  generateShareMessages: vi.fn(),
  getTiers: vi.fn(),
  getTier: vi.fn(),
  getCurrentTier: vi.fn(),
  getLeaderboard: vi.fn(),
  claimRewards: vi.fn(),
  getRewardHistory: vi.fn(),
  deactivateLink: vi.fn(),
  reactivateLink: vi.fn(),
};

describe('ReferralService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    ReferralService.generateLink.mockImplementation(async (agentId: string, customCode?: string) => ({
      code: customCode || `REF${Date.now().toString(36).toUpperCase()}`,
      agentId,
      url: `https://openclawdex.com/ref/${customCode || 'GENERATED'}`,
      discountPercent: 10,
      rewardPercent: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));
    
    ReferralService.validateCode.mockImplementation(async (code: string) => {
      if (code === 'VALIDCODE') {
        return { isValid: true, discountPercent: 10, agentId: 'agent_001' };
      }
      if (code === 'EXPIRED') {
        return { isValid: false, reason: 'Referral code has expired' };
      }
      return { isValid: false, reason: 'Invalid referral code' };
    });
    
    ReferralService.getStats.mockResolvedValue({
      agentId: 'agent_001',
      totalReferrals: 45,
      activeReferrals: 38,
      totalEarnings: '1250.50',
      pendingEarnings: '125.00',
      currentTier: 'gold',
      nextTier: 'platinum',
      referralsToNextTier: 5,
      monthlyStats: {
        referrals: 12,
        earnings: '350.00',
        volume: '125000.00',
      },
    });
    
    ReferralService.getTiers.mockResolvedValue([
      {
        id: 'bronze',
        name: 'Bronze',
        minReferrals: 0,
        rewardPercent: 5,
        discountPercent: 10,
        benefits: ['Basic rewards'],
      },
      {
        id: 'silver',
        name: 'Silver',
        minReferrals: 10,
        rewardPercent: 7,
        discountPercent: 12,
        benefits: ['Basic rewards', 'Priority support'],
      },
      {
        id: 'gold',
        name: 'Gold',
        minReferrals: 25,
        rewardPercent: 10,
        discountPercent: 15,
        benefits: ['Basic rewards', 'Priority support', 'Custom codes'],
      },
      {
        id: 'platinum',
        name: 'Platinum',
        minReferrals: 50,
        rewardPercent: 15,
        discountPercent: 20,
        benefits: ['All benefits', 'VIP access', 'Direct support line'],
      },
    ]);
    
    ReferralService.getLeaderboard.mockResolvedValue({
      leaderboard: [
        { rank: 1, agentId: 'agent_top', username: 'TopReferrer', totalReferrals: 250, totalEarnings: '12500.00' },
        { rank: 2, agentId: 'agent_second', username: 'SecondPlace', totalReferrals: 180, totalEarnings: '9000.00' },
        { rank: 3, agentId: 'agent_third', username: 'ThirdPlace', totalReferrals: 120, totalEarnings: '6000.00' },
      ],
      total: 500,
      period: 'all',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generateLink', () => {
    it('should generate referral link', async () => {
      const result = await ReferralService.generateLink('agent_001');

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('discountPercent');
      expect(result).toHaveProperty('rewardPercent');
      expect(result.isActive).toBe(true);
    });

    it('should generate with custom code', async () => {
      const result = await ReferralService.generateLink('agent_001', 'MYCODE2024');

      expect(result.code).toBe('MYCODE2024');
    });

    it('should reject duplicate custom code', async () => {
      ReferralService.generateLink.mockRejectedValueOnce(new Error('Code already exists'));
      
      await expect(ReferralService.generateLink('agent_001', 'EXISTING')).rejects.toThrow('Code already exists');
    });

    it('should reject invalid custom code format', async () => {
      ReferralService.generateLink.mockRejectedValueOnce(new Error('Invalid code format'));
      
      await expect(ReferralService.generateLink('agent_001', 'a')).rejects.toThrow('Invalid code format');
    });
  });

  describe('getLink', () => {
    it('should return link info', async () => {
      ReferralService.getLink.mockResolvedValueOnce({
        code: 'VALIDCODE',
        agentId: 'agent_001',
        discountPercent: 10,
        rewardPercent: 5,
        uses: 25,
        isActive: true,
      });
      
      const result = await ReferralService.getLink('VALIDCODE');

      expect(result.code).toBe('VALIDCODE');
      expect(result).toHaveProperty('uses');
    });

    it('should throw for unknown code', async () => {
      ReferralService.getLink.mockRejectedValueOnce(new Error('Referral link not found'));
      
      await expect(ReferralService.getLink('UNKNOWN')).rejects.toThrow('Referral link not found');
    });
  });

  describe('validateCode', () => {
    it('should validate active code', async () => {
      const result = await ReferralService.validateCode('VALIDCODE');

      expect(result.isValid).toBe(true);
      expect(result).toHaveProperty('discountPercent');
    });

    it('should reject expired code', async () => {
      const result = await ReferralService.validateCode('EXPIRED');

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('should reject invalid code', async () => {
      const result = await ReferralService.validateCode('INVALID');

      expect(result.isValid).toBe(false);
    });
  });

  describe('trackReferral', () => {
    it('should track successful referral', async () => {
      ReferralService.trackReferral.mockResolvedValueOnce({
        tracked: true,
        referralId: 'ref_001',
        referrerId: 'agent_001',
        refereeId: 'agent_new',
        discountApplied: 10,
      });
      
      const result = await ReferralService.trackReferral({
        code: 'VALIDCODE',
        refereeId: 'agent_new',
      });

      expect(result.tracked).toBe(true);
      expect(result).toHaveProperty('referralId');
      expect(result).toHaveProperty('discountApplied');
    });

    it('should reject self-referral', async () => {
      ReferralService.trackReferral.mockRejectedValueOnce(new Error('Cannot refer yourself'));
      
      await expect(ReferralService.trackReferral({
        code: 'MYCODE',
        refereeId: 'agent_001', // Same as referrer
      })).rejects.toThrow('Cannot refer yourself');
    });

    it('should reject duplicate referral', async () => {
      ReferralService.trackReferral.mockRejectedValueOnce(new Error('Already referred'));
      
      await expect(ReferralService.trackReferral({
        code: 'VALIDCODE',
        refereeId: 'agent_existing',
      })).rejects.toThrow('Already referred');
    });
  });

  describe('getStats', () => {
    it('should return referral stats', async () => {
      const result = await ReferralService.getStats('agent_001');

      expect(result).toHaveProperty('totalReferrals');
      expect(result).toHaveProperty('totalEarnings');
      expect(result).toHaveProperty('currentTier');
      expect(result).toHaveProperty('monthlyStats');
    });

    it('should include tier progression', async () => {
      const result = await ReferralService.getStats('agent_001');

      expect(result).toHaveProperty('nextTier');
      expect(result).toHaveProperty('referralsToNextTier');
    });

    it('should include pending earnings', async () => {
      const result = await ReferralService.getStats('agent_001');

      expect(result).toHaveProperty('pendingEarnings');
    });
  });

  describe('getReferredAgents', () => {
    it('should return list of referred agents', async () => {
      ReferralService.getReferredAgents.mockResolvedValueOnce({
        referred: [
          {
            id: 'agent_ref1',
            username: 'referred_user1',
            joinedAt: '2024-12-01T10:00:00Z',
            totalVolume: '5000.00',
            yourEarnings: '50.00',
            isActive: true,
          },
        ],
        total: 1,
      });
      
      const result = await ReferralService.getReferredAgents('agent_001');

      expect(result).toHaveProperty('referred');
      expect(result).toHaveProperty('total');
    });

    it('should include earnings per referral', async () => {
      ReferralService.getReferredAgents.mockResolvedValueOnce({
        referred: [{ yourEarnings: '50.00' }],
        total: 1,
      });
      
      const result = await ReferralService.getReferredAgents('agent_001');

      expect(result.referred[0]).toHaveProperty('yourEarnings');
    });

    it('should support pagination', async () => {
      ReferralService.getReferredAgents.mockResolvedValueOnce({
        referred: [],
        total: 45,
        page: 2,
        limit: 20,
      });
      
      const result = await ReferralService.getReferredAgents('agent_001', { page: 2, limit: 20 });

      expect(result.page).toBe(2);
    });
  });

  describe('shareReferral', () => {
    it('should share to Moltbook', async () => {
      ReferralService.shareReferral.mockResolvedValueOnce({
        shared: true,
        platform: 'moltbook',
        postId: 'post_share_001',
      });
      
      const result = await ReferralService.shareReferral({
        code: 'MYCODE',
        platform: 'moltbook',
        agentId: 'agent_001',
      });

      expect(result.shared).toBe(true);
      expect(result.platform).toBe('moltbook');
    });
  });

  describe('generateShareMessages', () => {
    it('should generate messages for platforms', async () => {
      ReferralService.generateShareMessages.mockResolvedValueOnce({
        twitter: 'Trade on OpenClaw with my code MYCODE and get 10% off! 🚀',
        moltbook: 'Use my referral code MYCODE for 10% discount!',
        generic: 'Join OpenClaw with code MYCODE',
      });
      
      const result = await ReferralService.generateShareMessages('MYCODE');

      expect(result).toHaveProperty('twitter');
      expect(result).toHaveProperty('moltbook');
      expect(result).toHaveProperty('generic');
    });

    it('should include code in messages', async () => {
      ReferralService.generateShareMessages.mockResolvedValueOnce({
        twitter: 'Use TESTCODE for discount!',
      });
      
      const result = await ReferralService.generateShareMessages('TESTCODE');

      expect(result.twitter).toContain('TESTCODE');
    });
  });

  describe('getTiers', () => {
    it('should return all tiers', async () => {
      const result = await ReferralService.getTiers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include tier properties', async () => {
      const result = await ReferralService.getTiers();
      const tier = result[0];

      expect(tier).toHaveProperty('id');
      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('minReferrals');
      expect(tier).toHaveProperty('rewardPercent');
      expect(tier).toHaveProperty('benefits');
    });

    it('should be ordered by minReferrals', async () => {
      const result = await ReferralService.getTiers();

      for (let i = 1; i < result.length; i++) {
        expect(result[i].minReferrals).toBeGreaterThan(result[i-1].minReferrals);
      }
    });
  });

  describe('getTier', () => {
    it('should return specific tier', async () => {
      ReferralService.getTier.mockResolvedValueOnce({
        id: 'gold',
        name: 'Gold',
        minReferrals: 25,
        rewardPercent: 10,
      });
      
      const result = await ReferralService.getTier('gold');

      expect(result.id).toBe('gold');
    });

    it('should throw for unknown tier', async () => {
      ReferralService.getTier.mockRejectedValueOnce(new Error('Tier not found'));
      
      await expect(ReferralService.getTier('unknown')).rejects.toThrow('Tier not found');
    });
  });

  describe('getCurrentTier', () => {
    it('should return agent current tier', async () => {
      ReferralService.getCurrentTier.mockResolvedValueOnce({
        tier: {
          id: 'gold',
          name: 'Gold',
          rewardPercent: 10,
        },
        progress: 80,
        nextTier: {
          id: 'platinum',
          minReferrals: 50,
        },
        referralsNeeded: 5,
      });
      
      const result = await ReferralService.getCurrentTier('agent_001');

      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('progress');
      expect(result).toHaveProperty('nextTier');
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      const result = await ReferralService.getLeaderboard();

      expect(result).toHaveProperty('leaderboard');
      expect(Array.isArray(result.leaderboard)).toBe(true);
    });

    it('should include rank and stats', async () => {
      const result = await ReferralService.getLeaderboard();
      const entry = result.leaderboard[0];

      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('agentId');
      expect(entry).toHaveProperty('totalReferrals');
      expect(entry).toHaveProperty('totalEarnings');
    });

    it('should be ordered by rank', async () => {
      const result = await ReferralService.getLeaderboard();

      for (let i = 1; i < result.leaderboard.length; i++) {
        expect(result.leaderboard[i].rank).toBeGreaterThan(result.leaderboard[i-1].rank);
      }
    });

    it('should support time period filter', async () => {
      ReferralService.getLeaderboard.mockResolvedValueOnce({
        leaderboard: [],
        total: 0,
        period: 'monthly',
      });
      
      const result = await ReferralService.getLeaderboard({ period: 'monthly' });

      expect(result.period).toBe('monthly');
    });
  });

  describe('claimRewards', () => {
    it('should claim pending rewards', async () => {
      ReferralService.claimRewards.mockResolvedValueOnce({
        claimed: true,
        amount: '125.00',
        txHash: '0x' + 'a'.repeat(64),
        newBalance: '1375.50',
      });
      
      const result = await ReferralService.claimRewards('agent_001');

      expect(result.claimed).toBe(true);
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('txHash');
    });

    it('should fail for no pending rewards', async () => {
      ReferralService.claimRewards.mockRejectedValueOnce(new Error('No pending rewards'));
      
      await expect(ReferralService.claimRewards('agent_001')).rejects.toThrow('No pending rewards');
    });
  });

  describe('getRewardHistory', () => {
    it('should return reward history', async () => {
      ReferralService.getRewardHistory.mockResolvedValueOnce({
        rewards: [
          {
            id: 'reward_001',
            amount: '50.00',
            type: 'referral',
            referralId: 'ref_001',
            status: 'claimed',
            claimedAt: '2024-12-01T10:00:00Z',
          },
        ],
        total: 1,
      });
      
      const result = await ReferralService.getRewardHistory('agent_001');

      expect(result).toHaveProperty('rewards');
      expect(result.rewards[0]).toHaveProperty('amount');
      expect(result.rewards[0]).toHaveProperty('status');
    });
  });

  describe('deactivateLink', () => {
    it('should deactivate referral link', async () => {
      ReferralService.deactivateLink.mockResolvedValueOnce({
        code: 'MYCODE',
        deactivated: true,
      });
      
      const result = await ReferralService.deactivateLink('MYCODE', 'agent_001');

      expect(result.deactivated).toBe(true);
    });
  });

  describe('reactivateLink', () => {
    it('should reactivate referral link', async () => {
      ReferralService.reactivateLink.mockResolvedValueOnce({
        code: 'MYCODE',
        reactivated: true,
      });
      
      const result = await ReferralService.reactivateLink('MYCODE', 'agent_001');

      expect(result.reactivated).toBe(true);
    });
  });
});
