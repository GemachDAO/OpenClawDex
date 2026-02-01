import { http, HttpResponse } from 'msw';
import { 
  testAgents, 
  testPosts, 
  testComments, 
  feedResponse,
  submolts,
  searchResults,
  apiKeyValidation 
} from '../fixtures/moltbook';

const MOLTBOOK_API_BASE = 'https://api.moltbook.test';

export const moltbookHandlers = [
  // Validate API key
  http.post(`${MOLTBOOK_API_BASE}/api/v1/agents/validate`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || !apiKey.startsWith('moltbook_')) {
      return HttpResponse.json(
        { error: 'Invalid API key format', isValid: false },
        { status: 401 }
      );
    }

    if (apiKey === testAgents.claimed.apiKey) {
      return HttpResponse.json({
        isValid: true,
        agent: testAgents.claimed,
      });
    }

    if (apiKey === testAgents.unclaimed.apiKey) {
      return HttpResponse.json({
        isValid: true,
        agent: testAgents.unclaimed,
      });
    }

    return HttpResponse.json(
      { error: 'Invalid API key', isValid: false },
      { status: 401 }
    );
  }),

  // Get agent profile
  http.get(`${MOLTBOOK_API_BASE}/api/v1/agents/:agentId`, ({ params }) => {
    const { agentId } = params;

    if (agentId === testAgents.claimed.id) {
      return HttpResponse.json(testAgents.claimed);
    }

    if (agentId === testAgents.unclaimed.id) {
      return HttpResponse.json(testAgents.unclaimed);
    }

    return HttpResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }),

  // Get current agent (me)
  http.get(`${MOLTBOOK_API_BASE}/api/v1/agents/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (apiKey === testAgents.claimed.apiKey) {
      return HttpResponse.json(testAgents.claimed);
    }

    if (apiKey === testAgents.unclaimed.apiKey) {
      return HttpResponse.json(testAgents.unclaimed);
    }

    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // Post trade
  http.post(`${MOLTBOOK_API_BASE}/api/v1/posts/trade`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      symbol: string;
      side: string;
      entryPrice: string;
      leverage?: number;
      size: string;
      content?: string;
    };

    return HttpResponse.json({
      id: `post_${Date.now()}`,
      type: 'trade',
      content: body.content || `Opened ${body.side.toUpperCase()} position on ${body.symbol}`,
      tradeData: {
        symbol: body.symbol,
        side: body.side,
        entryPrice: body.entryPrice,
        leverage: body.leverage || 1,
        size: body.size,
      },
      submolt: 'openclaw',
      upvotes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    });
  }),

  // Create post
  http.post(`${MOLTBOOK_API_BASE}/api/v1/posts`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      content: string;
      submolt?: string;
    };

    return HttpResponse.json({
      id: `post_${Date.now()}`,
      type: 'text',
      content: body.content,
      submolt: body.submolt || 'openclaw',
      upvotes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    });
  }),

  // Upvote post
  http.post(`${MOLTBOOK_API_BASE}/api/v1/posts/:postId/upvote`, ({ params, request }) => {
    const { postId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if already upvoted
    if (postId === testPosts.textPost.id) {
      return HttpResponse.json(
        { error: 'Already upvoted', alreadyUpvoted: true },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      postId,
      upvoted: true,
      newUpvoteCount: 46,
    });
  }),

  // Add comment
  http.post(`${MOLTBOOK_API_BASE}/api/v1/posts/:postId/comment`, async ({ params, request }) => {
    const { postId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as { content: string };

    return HttpResponse.json({
      id: `comment_${Date.now()}`,
      postId,
      content: body.content,
      upvotes: 0,
      createdAt: new Date().toISOString(),
    });
  }),

  // Get personal feed
  http.get(`${MOLTBOOK_API_BASE}/api/v1/feed`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    return HttpResponse.json({
      posts: feedResponse.posts.slice(0, limit),
      nextCursor: cursor ? null : feedResponse.nextCursor,
      hasMore: !cursor,
    });
  }),

  // Get OpenClaw feed
  http.get(`${MOLTBOOK_API_BASE}/api/v1/feed/openclaw`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json(feedResponse);
  }),

  // Get submolt feed
  http.get(`${MOLTBOOK_API_BASE}/api/v1/submolts/:submoltName/feed`, ({ params, request }) => {
    const { submoltName } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (submoltName === 'openclaw' || submoltName === 'defi') {
      return HttpResponse.json(feedResponse);
    }

    return HttpResponse.json(
      { error: 'Submolt not found' },
      { status: 404 }
    );
  }),

  // Get submolt info
  http.get(`${MOLTBOOK_API_BASE}/api/v1/submolts/:submoltName`, ({ params }) => {
    const { submoltName } = params;

    if (submoltName === 'openclaw') {
      return HttpResponse.json(submolts.openclaw);
    }

    if (submoltName === 'defi') {
      return HttpResponse.json(submolts.defi);
    }

    return HttpResponse.json(
      { error: 'Submolt not found' },
      { status: 404 }
    );
  }),

  // Follow agent
  http.post(`${MOLTBOOK_API_BASE}/api/v1/agents/:agentId/follow`, ({ params, request }) => {
    const { agentId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      followed: true,
      agentId,
    });
  }),

  // Unfollow agent
  http.delete(`${MOLTBOOK_API_BASE}/api/v1/agents/:agentId/follow`, ({ params, request }) => {
    const { agentId } = params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      unfollowed: true,
      agentId,
    });
  }),

  // Search posts
  http.get(`${MOLTBOOK_API_BASE}/api/v1/search`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    if (!query) {
      return HttpResponse.json({ posts: [], agents: [], total: 0 });
    }

    return HttpResponse.json(searchResults);
  }),

  // Get post comments
  http.get(`${MOLTBOOK_API_BASE}/api/v1/posts/:postId/comments`, ({ params }) => {
    const { postId } = params;

    const comments = testComments.filter(c => c.postId === postId);

    return HttpResponse.json({
      comments,
      total: comments.length,
    });
  }),

  // Get single post
  http.get(`${MOLTBOOK_API_BASE}/api/v1/posts/:postId`, ({ params }) => {
    const { postId } = params;

    const post = Object.values(testPosts).find(p => p.id === postId);

    if (post) {
      return HttpResponse.json(post);
    }

    return HttpResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    );
  }),
];
