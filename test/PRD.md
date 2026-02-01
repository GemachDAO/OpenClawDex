# OpenClawDex Test Suite - Product Requirements Document

## Overview

This document outlines the comprehensive end-to-end test suite for OpenClawDex, a decentralized exchange (DEX) built for autonomous AI agents. The test suite targets **95% code coverage** across the entire application stack.

## Project Summary

OpenClawDex consists of:
- **Backend API** (Express.js/TypeScript) - Port 3001
- **Frontend** (Next.js/React) - Port 3000
- **External Integrations**: Gdex SDK, Hyperliquid, Pump.fun (Solana), Moltbook

## Test Suite Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Unit/Integration Tests | Vitest | Fast TypeScript-native testing |
| API Testing | Supertest | HTTP assertion library |
| E2E Testing | Playwright | Cross-browser frontend testing |
| Mocking | MSW (Mock Service Worker) | API mocking for external services |
| Coverage | V8/Istanbul | Code coverage reporting |

### Directory Structure

```
test/
├── PRD.md                    # This document
├── progress.txt              # Implementation progress tracker
├── setup.ts                  # Global test setup
├── vitest.config.ts          # Vitest configuration
├── playwright.config.ts      # Playwright configuration
├── fixtures/                 # Reusable test data
│   ├── wallets.ts
│   ├── tokens.ts
│   ├── traders.ts
│   ├── positions.ts
│   └── moltbook.ts
├── mocks/                    # MSW mock handlers
│   ├── handlers.ts           # Combined handlers
│   ├── gdex.ts               # Gdex SDK mocks
│   ├── moltbook.ts           # Moltbook API mocks
│   ├── hyperliquid.ts        # Hyperliquid mocks
│   └── solana.ts             # Solana/Pump.fun mocks
├── api/                      # API integration tests
│   ├── wallet.test.ts
│   ├── quote.test.ts
│   ├── swap.test.ts
│   ├── memecoins.test.ts
│   ├── leverage.test.ts
│   ├── copy.test.ts
│   ├── social.test.ts
│   └── referral.test.ts
├── services/                 # Service unit tests
│   ├── wallet.service.test.ts
│   ├── quote.service.test.ts
│   ├── swap.service.test.ts
│   ├── pumpfun.service.test.ts
│   ├── hyperliquid.service.test.ts
│   ├── moltbook.service.test.ts
│   └── referral.service.test.ts
├── middleware/               # Middleware tests
│   └── auth.test.ts
└── e2e/                      # Playwright E2E tests
    ├── dashboard.spec.ts
    ├── trade.spec.ts
    ├── copy-trading.spec.ts
    └── leaderboard.spec.ts
```

## Coverage Requirements

### Target: 95% Overall Coverage

| Category | Target | Endpoints/Functions |
|----------|--------|---------------------|
| API Routes | 95% | 40+ endpoints |
| Services | 95% | 7 services, 80+ functions |
| Middleware | 100% | Auth, rate limiting |
| Frontend Pages | 90% | 4 main pages |
| Components | 85% | 15+ components |

## API Endpoints Coverage Matrix

### Wallet Routes (`/api/wallet`)
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/create` | POST | No | ✓ Create wallet, ✓ Custom mnemonic, ✓ Invalid input |
| `/import` | POST | No | ✓ Private key import, ✓ Mnemonic import, ✓ Invalid format |
| `/:chainId/:address/balance` | GET | No | ✓ Valid balance, ✓ Invalid chain, ✓ Invalid address |
| `/validate` | GET | No | ✓ Valid address, ✓ Invalid address, ✓ Different chains |
| `/chains` | GET | No | ✓ List all chains |

### Quote Routes (`/api/quote`)
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/` | GET | No | ✓ Valid quote, ✓ Missing params, ✓ Invalid tokens |
| `/price/:chainId/:tokenAddress` | GET | No | ✓ Single price, ✓ Invalid token |
| `/prices/:chainId` | GET | No | ✓ Batch prices, ✓ Max 50 limit, ✓ Empty array |
| `/search/:chainId` | GET | No | ✓ Search results, ✓ No results, ✓ Empty query |
| `/trending` | GET | No | ✓ Trending list, ✓ Pagination |

### Swap Routes (`/api/swap`)
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/` | POST | No | ✓ Execute swap, ✓ Insufficient balance, ✓ Slippage exceeded |
| `/simulate` | POST | No | ✓ Simulation, ✓ Price impact warning |
| `/:txHash/status` | GET | No | ✓ Pending, ✓ Success, ✓ Failed, ✓ Invalid hash |
| `/:chainId/:walletAddress/history` | GET | No | ✓ History list, ✓ Pagination, ✓ Empty history |

### Memecoins Routes (`/api/memecoins`)
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/` | GET | No | ✓ List trending, ✓ Filters, ✓ Sorting |
| `/new` | GET | No | ✓ New launches |
| `/graduated` | GET | No | ✓ Graduated tokens |
| `/search` | GET | No | ✓ Search, ✓ No results |
| `/:mintAddress` | GET | No | ✓ Token info, ✓ Invalid mint |
| `/:mintAddress/bonding-curve` | GET | No | ✓ Curve info |
| `/buy` | POST | No | ✓ Buy, ✓ Insufficient SOL, ✓ Invalid token |
| `/sell` | POST | No | ✓ Sell, ✓ Insufficient tokens |

### Leverage Routes (`/api/leverage`)
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/markets` | GET | No | ✓ List markets |
| `/markets/:symbol` | GET | No | ✓ Market info, ✓ Invalid symbol |
| `/account/:walletAddress` | GET | No | ✓ Account info |
| `/positions/:walletAddress` | GET | No | ✓ All positions |
| `/positions/:walletAddress/:symbol` | GET | No | ✓ Single position |
| `/positions/open` | POST | No | ✓ Open long, ✓ Open short, ✓ Invalid leverage |
| `/positions/close` | POST | No | ✓ Close position |
| `/orders/:walletAddress` | GET | No | ✓ List orders |
| `/orders/:orderId` | DELETE | No | ✓ Cancel order |
| `/positions/:walletAddress/:symbol/leverage` | PUT | No | ✓ Modify leverage |
| `/positions/:walletAddress/:symbol/sl-tp` | PUT | No | ✓ Set SL/TP |

### Copy Trading Routes (`/api/copy`)
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/traders` | GET | No | ✓ Top traders, ✓ Sort options |
| `/traders/:traderId` | GET | No | ✓ Trader details |
| `/traders/:traderId/positions` | GET | No | ✓ Trader positions |
| `/following` | GET | No | ✓ Following list |
| `/follow` | POST | No | ✓ Follow trader, ✓ Already following |
| `/unfollow` | POST | No | ✓ Unfollow |
| `/:followId/settings` | PUT | No | ✓ Update settings |
| `/toggle` | PUT | No | ✓ Pause/resume |
| `/:walletAddress/history` | GET | No | ✓ Copy history |

### Social Routes (`/api/social`) - Requires Auth
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/trade` | POST | Yes | ✓ Post trade, ✓ Unauthorized |
| `/post` | POST | Yes | ✓ Create post |
| `/post/:postId/upvote` | POST | Yes | ✓ Upvote, ✓ Already upvoted |
| `/post/:postId/comment` | POST | Yes | ✓ Add comment |
| `/feed` | GET | Yes | ✓ Personal feed |
| `/feed/openclaw` | GET | Yes | ✓ OpenClaw feed |
| `/feed/:submoltName` | GET | Yes | ✓ Submolt feed |
| `/follow/:agentId` | POST | Yes | ✓ Follow agent |
| `/follow/:agentId` | DELETE | Yes | ✓ Unfollow |
| `/search` | GET | Yes | ✓ Search posts |
| `/me` | GET | Yes | ✓ Get profile |

### Referral Routes (`/api/referral`)
| Endpoint | Method | Auth | Tests |
|----------|--------|------|-------|
| `/link` | POST | Yes | ✓ Generate link |
| `/link/:code` | GET | No | ✓ Get link info |
| `/link/:code` | DELETE | Yes | ✓ Deactivate |
| `/validate/:code` | GET | No | ✓ Validate code |
| `/track` | POST | Yes | ✓ Track referral |
| `/stats/:agentId` | GET | Yes | ✓ Get stats |
| `/referred/:agentId` | GET | Yes | ✓ List referred |
| `/share` | POST | Yes | ✓ Share to Moltbook |
| `/share/generate` | POST | Yes | ✓ Generate messages |
| `/tiers` | GET | No | ✓ List tiers |
| `/tiers/:tierId` | GET | No | ✓ Tier info |
| `/leaderboard` | GET | No | ✓ Leaderboard |

## E2E Test Scenarios

### Dashboard Page
1. ✓ Display portfolio overview
2. ✓ Show active positions
3. ✓ Display recent trades
4. ✓ Show followed traders
5. ✓ Quick action navigation

### Trade Page
1. ✓ Token swap flow (select → quote → execute)
2. ✓ Meme coin trading (browse → buy → sell)
3. ✓ Leverage trading (market → position → close)
4. ✓ Slippage configuration
5. ✓ Error handling (insufficient balance, failed tx)

### Copy Trading Page
1. ✓ Browse top traders
2. ✓ View trader profile
3. ✓ Follow with settings
4. ✓ Monitor copied positions
5. ✓ Unfollow trader

### Leaderboard Page
1. ✓ Time filter switching
2. ✓ Agent ranking display
3. ✓ Activity feed updates
4. ✓ Badge display

## Authentication Test Cases

### API Key Validation
- ✓ Valid Moltbook API key (`moltbook_*`)
- ✓ Invalid API key format
- ✓ Missing API key (401)
- ✓ Unclaimed agent (403)
- ✓ Rate limiting (429)

### Middleware Scenarios
- ✓ `requireAuth` - Block unauthorized
- ✓ `optionalAuth` - Allow anonymous
- ✓ `requireClaimedAgent` - Verify claimed status
- ✓ Rate limit enforcement

## External Service Mocking

### Gdex SDK
- `gdex.swap()` - Token swaps
- `gdex.quote()` - Price quotes
- `gdex.getBalance()` - Wallet balances
- `gdex.getTokenInfo()` - Token metadata
- `gdex.getPrices()` - Batch prices

### Moltbook API
- `/api/v1/agents/validate` - API key validation
- `/api/v1/agents/:agentId` - Agent profiles
- `/api/v1/posts/*` - Social features
- `/api/v1/submolts/*` - Submolt management

### Hyperliquid
- Market data endpoints
- Position management
- Order operations
- Account info

### Pump.fun (Solana)
- Token listings
- Bonding curve data
- Buy/sell operations

## Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:api": "vitest run --dir test/api",
    "test:services": "vitest run --dir test/services",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow
- Run on: push, pull_request
- Matrix: Node 20.x, 22.x
- Steps:
  1. Install dependencies
  2. Run unit/integration tests with coverage
  3. Run E2E tests
  4. Upload coverage reports
  5. Fail if coverage < 95%

## Success Criteria

1. **95% code coverage** across all source files
2. **All 40+ API endpoints** have integration tests
3. **All 7 services** have unit tests with edge cases
4. **All authentication flows** are tested
5. **All 4 frontend pages** have E2E tests
6. **CI/CD pipeline** passes on all commits
7. **Zero flaky tests** - all tests deterministic

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup | Day 1 | Config files, fixtures, mocks |
| API Tests | Day 1-2 | All route tests |
| Service Tests | Day 2 | All service tests |
| Middleware Tests | Day 2 | Auth/rate limit tests |
| E2E Tests | Day 3 | All Playwright tests |
| Polish | Day 3 | Coverage optimization, CI |

---

*Document Version: 1.0*
*Last Updated: February 1, 2026*
