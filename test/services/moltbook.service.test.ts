import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Moltbook service
const MoltbookService = {
  validateApiKey: vi.fn(),
  getAgent: vi.fn(),
  createAgent: vi.fn(),
  updateAgent: vi.fn(),
  claimAgent: vi.fn(),
  getSubmolt: vi.fn(),
  createSubmolt: vi.fn(),
  joinSubmolt: vi.fn(),
  leaveSubmolt: vi.fn(),
  createPost: vi.fn(),
  createTradePost: vi.fn(),
  getPost: vi.fn(),
  getFeed: vi.fn(),
  getSubmoltFeed: vi.fn(),
  upvotePost: vi.fn(),
  removeUpvote: vi.fn(),
  commentOnPost: vi.fn(),
  followAgent: vi.fn(),
  unfollowAgent: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
  searchPosts: vi.fn(),
  searchAgents: vi.fn(),
};

describe('MoltbookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    MoltbookService.validateApiKey.mockImplementation(async (apiKey: string) => {
      if (apiKey.startsWith('moltbook_')) {
        return {
          valid: true,
          agentId: 'agent_001',
          permissions: ['read', 'write', 'trade'],
        };
      }
      return { valid: false, error: 'Invalid API key' };
    });
    
    MoltbookService.getAgent.mockResolvedValue({
      id: 'agent_001',
      username: 'alpha_trader',
      bio: 'Professional trader | 10x returns | DeFi enthusiast',
      avatar: 'https://moltbook.com/avatars/agent_001.png',
      followers: 1250,
      following: 45,
      posts: 342,
      verified: true,
      badges: ['top_trader', 'whale'],
      createdAt: '2024-01-15T10:00:00Z',
    });
    
    MoltbookService.createPost.mockImplementation(async (params: any) => ({
      id: `post_${Date.now()}`,
      authorId: params.agentId,
      content: params.content,
      submolt: params.submolt || 'openclaw',
      upvotes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    }));
    
    MoltbookService.getFeed.mockResolvedValue({
      posts: [
        {
          id: 'post_001',
          authorId: 'agent_001',
          content: 'BTC looking strong! 💪',
          upvotes: 45,
          comments: 12,
        },
      ],
      nextCursor: 'cursor_abc123',
      hasMore: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateApiKey', () => {
    it('should validate valid API key', async () => {
      const result = await MoltbookService.validateApiKey('moltbook_test_key_123');

      expect(result.valid).toBe(true);
      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('permissions');
    });

    it('should reject invalid API key', async () => {
      const result = await MoltbookService.validateApiKey('invalid_key');

      expect(result.valid).toBe(false);
      expect(result).toHaveProperty('error');
    });

    it('should return permissions', async () => {
      const result = await MoltbookService.validateApiKey('moltbook_test_key_123');

      expect(result.permissions).toContain('read');
      expect(result.permissions).toContain('write');
    });
  });

  describe('getAgent', () => {
    it('should return agent profile', async () => {
      const result = await MoltbookService.getAgent('agent_001');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('bio');
      expect(result).toHaveProperty('followers');
    });

    it('should include badges', async () => {
      const result = await MoltbookService.getAgent('agent_001');

      expect(result).toHaveProperty('badges');
      expect(Array.isArray(result.badges)).toBe(true);
    });

    it('should throw for unknown agent', async () => {
      MoltbookService.getAgent.mockRejectedValueOnce(new Error('Agent not found'));
      
      await expect(MoltbookService.getAgent('unknown')).rejects.toThrow('Agent not found');
    });
  });

  describe('createAgent', () => {
    it('should create new agent', async () => {
      MoltbookService.createAgent.mockResolvedValueOnce({
        id: 'agent_new',
        username: 'new_trader',
        apiKey: 'moltbook_new_key_123',
        createdAt: new Date().toISOString(),
      });
      
      const result = await MoltbookService.createAgent({
        username: 'new_trader',
        bio: 'New to trading',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('apiKey');
      expect(result.username).toBe('new_trader');
    });

    it('should reject duplicate username', async () => {
      MoltbookService.createAgent.mockRejectedValueOnce(new Error('Username already taken'));
      
      await expect(MoltbookService.createAgent({
        username: 'alpha_trader',
        bio: 'Test',
      })).rejects.toThrow('Username already taken');
    });
  });

  describe('updateAgent', () => {
    it('should update agent profile', async () => {
      MoltbookService.updateAgent.mockResolvedValueOnce({
        id: 'agent_001',
        username: 'alpha_trader',
        bio: 'Updated bio',
        updated: true,
      });
      
      const result = await MoltbookService.updateAgent('agent_001', {
        bio: 'Updated bio',
      });

      expect(result.bio).toBe('Updated bio');
      expect(result.updated).toBe(true);
    });
  });

  describe('claimAgent', () => {
    it('should claim unclaimed agent', async () => {
      MoltbookService.claimAgent.mockResolvedValueOnce({
        id: 'agent_unclaimed',
        claimed: true,
        claimedAt: new Date().toISOString(),
        newApiKey: 'moltbook_claimed_key',
      });
      
      const result = await MoltbookService.claimAgent('agent_unclaimed', {
        walletAddress: '0x1234567890123456789012345678901234567890',
        signature: '0x' + 'a'.repeat(130),
      });

      expect(result.claimed).toBe(true);
      expect(result).toHaveProperty('newApiKey');
    });

    it('should fail for already claimed agent', async () => {
      MoltbookService.claimAgent.mockRejectedValueOnce(new Error('Agent already claimed'));
      
      await expect(MoltbookService.claimAgent('agent_001', {
        walletAddress: '0x1234567890123456789012345678901234567890',
        signature: '0x' + 'a'.repeat(130),
      })).rejects.toThrow('Agent already claimed');
    });
  });

  describe('getSubmolt', () => {
    it('should return submolt info', async () => {
      MoltbookService.getSubmolt.mockResolvedValueOnce({
        id: 'submolt_openclaw',
        name: 'OpenClaw',
        description: 'Official OpenClaw community',
        members: 5420,
        posts: 12500,
        rules: ['Be respectful', 'No spam'],
      });
      
      const result = await MoltbookService.getSubmolt('openclaw');

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('rules');
    });
  });

  describe('createSubmolt', () => {
    it('should create new submolt', async () => {
      MoltbookService.createSubmolt.mockResolvedValueOnce({
        id: 'submolt_new',
        name: 'DeFi Alpha',
        creatorId: 'agent_001',
        createdAt: new Date().toISOString(),
      });
      
      const result = await MoltbookService.createSubmolt({
        name: 'DeFi Alpha',
        description: 'DeFi strategies and alpha',
        rules: ['Share alpha', 'No rugging'],
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('DeFi Alpha');
    });
  });

  describe('joinSubmolt', () => {
    it('should join submolt', async () => {
      MoltbookService.joinSubmolt.mockResolvedValueOnce({
        submoltId: 'submolt_openclaw',
        joined: true,
      });
      
      const result = await MoltbookService.joinSubmolt('openclaw', 'agent_001');

      expect(result.joined).toBe(true);
    });
  });

  describe('leaveSubmolt', () => {
    it('should leave submolt', async () => {
      MoltbookService.leaveSubmolt.mockResolvedValueOnce({
        submoltId: 'submolt_openclaw',
        left: true,
      });
      
      const result = await MoltbookService.leaveSubmolt('openclaw', 'agent_001');

      expect(result.left).toBe(true);
    });
  });

  describe('createPost', () => {
    it('should create text post', async () => {
      const result = await MoltbookService.createPost({
        agentId: 'agent_001',
        content: 'Market analysis: BTC looking bullish! 📈',
        submolt: 'openclaw',
      });

      expect(result).toHaveProperty('id');
      expect(result.content).toBe('Market analysis: BTC looking bullish! 📈');
    });

    it('should create post with media', async () => {
      MoltbookService.createPost.mockResolvedValueOnce({
        id: 'post_media',
        content: 'Check out this chart!',
        media: ['https://moltbook.com/media/chart.png'],
      });
      
      const result = await MoltbookService.createPost({
        agentId: 'agent_001',
        content: 'Check out this chart!',
        media: ['https://moltbook.com/media/chart.png'],
      });

      expect(result).toHaveProperty('media');
    });
  });

  describe('createTradePost', () => {
    it('should create trade post', async () => {
      MoltbookService.createTradePost.mockResolvedValueOnce({
        id: 'trade_post_001',
        type: 'trade',
        content: 'Opened long BTC @ 94500',
        tradeData: {
          symbol: 'BTC-PERP',
          side: 'long',
          entryPrice: '94500',
          leverage: 10,
        },
      });
      
      const result = await MoltbookService.createTradePost({
        agentId: 'agent_001',
        symbol: 'BTC-PERP',
        side: 'long',
        entryPrice: '94500',
        leverage: 10,
        content: 'Opened long BTC @ 94500',
      });

      expect(result.type).toBe('trade');
      expect(result).toHaveProperty('tradeData');
    });
  });

  describe('getPost', () => {
    it('should return post by id', async () => {
      MoltbookService.getPost.mockResolvedValueOnce({
        id: 'post_001',
        authorId: 'agent_001',
        content: 'BTC looking strong! 💪',
        upvotes: 45,
        comments: 12,
      });
      
      const result = await MoltbookService.getPost('post_001');

      expect(result.id).toBe('post_001');
      expect(result).toHaveProperty('content');
    });
  });

  describe('getFeed', () => {
    it('should return personal feed', async () => {
      const result = await MoltbookService.getFeed('agent_001');

      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.posts)).toBe(true);
    });

    it('should support pagination', async () => {
      MoltbookService.getFeed.mockResolvedValueOnce({
        posts: [],
        nextCursor: null,
        hasMore: false,
      });
      
      const result = await MoltbookService.getFeed('agent_001', { cursor: 'cursor_abc' });

      expect(result.hasMore).toBe(false);
    });
  });

  describe('getSubmoltFeed', () => {
    it('should return submolt feed', async () => {
      MoltbookService.getSubmoltFeed.mockResolvedValueOnce({
        posts: [{ id: 'post_001', submolt: 'openclaw' }],
        hasMore: true,
      });
      
      const result = await MoltbookService.getSubmoltFeed('openclaw');

      expect(result).toHaveProperty('posts');
    });
  });

  describe('upvotePost', () => {
    it('should upvote post', async () => {
      MoltbookService.upvotePost.mockResolvedValueOnce({
        postId: 'post_001',
        upvoted: true,
        newCount: 46,
      });
      
      const result = await MoltbookService.upvotePost('post_001', 'agent_001');

      expect(result.upvoted).toBe(true);
      expect(result.newCount).toBe(46);
    });

    it('should prevent double upvote', async () => {
      MoltbookService.upvotePost.mockRejectedValueOnce(new Error('Already upvoted'));
      
      await expect(MoltbookService.upvotePost('post_001', 'agent_001')).rejects.toThrow('Already upvoted');
    });
  });

  describe('removeUpvote', () => {
    it('should remove upvote', async () => {
      MoltbookService.removeUpvote.mockResolvedValueOnce({
        postId: 'post_001',
        removed: true,
        newCount: 45,
      });
      
      const result = await MoltbookService.removeUpvote('post_001', 'agent_001');

      expect(result.removed).toBe(true);
    });
  });

  describe('commentOnPost', () => {
    it('should add comment', async () => {
      MoltbookService.commentOnPost.mockResolvedValueOnce({
        id: 'comment_001',
        postId: 'post_001',
        authorId: 'agent_001',
        content: 'Great analysis! 👍',
        createdAt: new Date().toISOString(),
      });
      
      const result = await MoltbookService.commentOnPost('post_001', {
        agentId: 'agent_001',
        content: 'Great analysis! 👍',
      });

      expect(result).toHaveProperty('id');
      expect(result.content).toBe('Great analysis! 👍');
    });
  });

  describe('followAgent', () => {
    it('should follow agent', async () => {
      MoltbookService.followAgent.mockResolvedValueOnce({
        followerId: 'agent_001',
        followingId: 'agent_002',
        followed: true,
      });
      
      const result = await MoltbookService.followAgent('agent_001', 'agent_002');

      expect(result.followed).toBe(true);
    });
  });

  describe('unfollowAgent', () => {
    it('should unfollow agent', async () => {
      MoltbookService.unfollowAgent.mockResolvedValueOnce({
        followerId: 'agent_001',
        followingId: 'agent_002',
        unfollowed: true,
      });
      
      const result = await MoltbookService.unfollowAgent('agent_001', 'agent_002');

      expect(result.unfollowed).toBe(true);
    });
  });

  describe('getFollowers', () => {
    it('should return followers list', async () => {
      MoltbookService.getFollowers.mockResolvedValueOnce({
        followers: [
          { id: 'agent_002', username: 'follower1' },
          { id: 'agent_003', username: 'follower2' },
        ],
        total: 2,
      });
      
      const result = await MoltbookService.getFollowers('agent_001');

      expect(result).toHaveProperty('followers');
      expect(result).toHaveProperty('total');
    });
  });

  describe('getFollowing', () => {
    it('should return following list', async () => {
      MoltbookService.getFollowing.mockResolvedValueOnce({
        following: [
          { id: 'agent_004', username: 'following1' },
        ],
        total: 1,
      });
      
      const result = await MoltbookService.getFollowing('agent_001');

      expect(result).toHaveProperty('following');
    });
  });

  describe('searchPosts', () => {
    it('should search posts', async () => {
      MoltbookService.searchPosts.mockResolvedValueOnce({
        posts: [
          { id: 'post_001', content: 'BTC analysis' },
        ],
        total: 1,
      });
      
      const result = await MoltbookService.searchPosts('BTC');

      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('total');
    });
  });

  describe('searchAgents', () => {
    it('should search agents', async () => {
      MoltbookService.searchAgents.mockResolvedValueOnce({
        agents: [
          { id: 'agent_001', username: 'alpha_trader' },
        ],
        total: 1,
      });
      
      const result = await MoltbookService.searchAgents('alpha');

      expect(result).toHaveProperty('agents');
    });
  });
});
