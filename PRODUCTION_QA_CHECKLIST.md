# 🚀 OpenClawDex - Production Deployment Q/A Checklist

This comprehensive checklist ensures OpenClawDex is production-ready and free of mock data, test credentials, and development configurations.

---

## ✅ PRE-DEPLOYMENT VERIFICATION CHECKLIST

### 🔐 1. ENVIRONMENT CONFIGURATION

**Backend API Environment Variables** (`apps/api/.env`)

- [ ] `NODE_ENV=production` (currently defaults to `development`)
- [ ] `GDEX_API_KEY` - Valid production API key configured (currently EMPTY)
- [ ] `GDEX_API_SECRET` - Valid production API secret configured (currently EMPTY)
- [ ] `MOLTBOOK_API_KEY` - Valid production Moltbook API key configured (currently EMPTY)
- [ ] `SOLANA_RPC_URL` - Set to mainnet RPC endpoint (verify not using devnet)
- [ ] `HYPERLIQUID_TESTNET=false` - Confirm using production Hyperliquid network
- [ ] `CORS_ORIGIN` - Updated from `http://localhost:3000` to actual production domain
- [ ] `PORT` - Verify correct production port (default: 3001)

**Frontend Environment Variables** (`apps/web/.env.production`)

- [ ] `NEXT_PUBLIC_API_URL` - Set to production API URL (defaults to `http://localhost:3001/api` if not set)
- [ ] `NEXT_PUBLIC_MOLTBOOK_URL` - Verify Moltbook integration URL if applicable
- [ ] All environment variables properly prefixed with `NEXT_PUBLIC_` for client-side access

---

### 🧪 2. MOCK DATA & TEST FIXTURES VERIFICATION

**Test Directory Isolation** (`/test` directory)

- [ ] Verify ALL mock data is contained within `/test` directory only
- [ ] Confirm `test/mocks/` files are NOT imported in production code
- [ ] Verify `test/fixtures/` data is NOT used in production code
- [ ] Check `test/setup.ts` test configurations don't leak to production

**Specific Mock Files to Verify Are Test-Only:**

- [ ] `test/mocks/gdex.ts` - GDEX API mocks
- [ ] `test/mocks/handlers.ts` - MSW request handlers
- [ ] `test/mocks/hyperliquid.ts` - Hyperliquid API mocks
- [ ] `test/mocks/moltbook.ts` - Moltbook social mocks
- [ ] `test/mocks/solana.ts` - Solana RPC mocks

**Test Fixtures to Verify Are Not in Production:**

- [ ] `test/fixtures/wallets.ts` - Contains test private keys (NEVER use with real funds)
- [ ] `test/fixtures/tokens.ts` - Test token addresses
- [ ] `test/fixtures/traders.ts` - Mock trader profiles
- [ ] `test/fixtures/positions.ts` - Mock position data
- [ ] `test/fixtures/memecoins.ts` - Pump.fun test tokens
- [ ] `test/fixtures/swaps.ts` - Mock swap transactions
- [ ] `test/fixtures/moltbook.ts` - Test agents with hardcoded API keys
- [ ] `test/fixtures/referrals.ts` - Mock referral codes

---

### 🔒 3. HARDCODED CREDENTIALS AUDIT

**Test Credentials to Remove/Replace:**

- [ ] No test API keys in production code (search for `test_gdex_api_key`, `moltbook_test_key`)
- [ ] No hardcoded wallet private keys outside test directory
- [ ] Test wallet addresses from `test/fixtures/wallets.ts` NOT used in production:
  - `0x742d35Cc6634C0532925a3b844Bc9e7595f5dE12` (Ethereum)
  - `0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199` (BSC)
  - All other test addresses with exposed private keys

**Verify No Hardcoded Secrets In:**

- [ ] `apps/api/src/config/index.ts`
- [ ] `apps/api/src/services/*.ts`
- [ ] `apps/web/lib/providers.tsx`
- [ ] Any `.env.example` files (should only have placeholders)

---

### 🌐 4. API ENDPOINTS & NETWORK CONFIGURATION

**Backend API Endpoints** (`apps/api/src/config/index.ts`)

- [ ] Hyperliquid - Verify production URL: `https://api.hyperliquid.xyz`
- [ ] Moltbook - Verify correct URL: `https://www.moltbook.com/api/v1` (with `www`)
- [ ] Solana RPC - Verify mainnet-beta endpoint (not devnet/testnet)
- [ ] EVM RPC URLs - Verify all chains using production RPC endpoints:
  - Ethereum mainnet
  - BSC mainnet
  - Polygon mainnet
  - Arbitrum mainnet
  - Base mainnet

**Frontend API Configuration** (`apps/web/lib/providers.tsx`)

- [ ] Line 128: `API_BASE_URL` properly set via `NEXT_PUBLIC_API_URL` environment variable
- [ ] Not defaulting to `http://localhost:3001/api` in production
- [ ] Block explorer URLs correctly configured (Lines 518-527)

---

### 🎭 5. PRODUCTION CODE MOCK DATA REVIEW

**Frontend Mock Data** (`apps/web/`)

- [ ] `apps/web/app/leaderboard/page.tsx` - Contains `LEADERBOARD_DATA` mock (Lines 44-93)
  - **ACTION REQUIRED:** Replace with real API call to `/api/leaderboard`
- [ ] `apps/web/app/trade/page.tsx` - Review for hardcoded mock data
- [ ] `apps/web/app/copy/page.tsx` - Review for hardcoded mock data
- [ ] `apps/web/components/activity-feed.tsx` - Contains placeholder UI elements
  - **ACTION REQUIRED:** Verify connected to real data feed

**Backend Services Review:**

- [ ] `apps/api/src/routes/leaderboard.ts` - Verify returns real agent data
- [ ] `apps/api/src/routes/wallet.ts` - No test wallets in responses
- [ ] `apps/api/src/routes/memecoins.ts` - Returns real Pump.fun tokens
- [ ] `apps/api/src/routes/copy.ts` - Returns real trader data
- [ ] `apps/api/src/routes/referral.ts` - Generates real referral codes

---

### 🔧 6. BUILD & DEPENDENCY VERIFICATION

**Backend Build:**

- [ ] Run `cd apps/api && npm run build` - Verify no errors
- [ ] Run `cd apps/api && npm run lint` - Verify no critical issues
- [ ] Check `dist/` output for any test imports
- [ ] Verify `package.json` dependencies are production versions

**Frontend Build:**

- [ ] Run `cd apps/web && npm run build` - Verify no errors
- [ ] Run `cd apps/web && npm run lint` - Verify no critical issues
- [ ] Check `.next/` output for test data leakage
- [ ] Verify no test utilities in client bundle

**Root Dependencies:**

- [ ] Run `npm install` - Verify lockfile integrity
- [ ] Check for vulnerable dependencies: `npm audit`
- [ ] Verify all SDK versions are production-ready:
  - `gdex.pro-sdk: ^1.1.6` or higher
  - All other critical dependencies up to date

---

### 🧰 7. SERVICE INTEGRATIONS

**GDEX SDK Integration:**

- [ ] Valid API key configured
- [ ] SDK initialized with production endpoints
- [ ] Wallet creation tested with mainnet
- [ ] Quote service working with real prices
- [ ] Swap execution tested on mainnet (with small amounts)

**Moltbook Integration:**

- [ ] Valid Moltbook API key configured
- [ ] Base URL set to `https://www.moltbook.com/api/v1` (with `www`)
- [ ] Agent registration working
- [ ] Post creation working
- [ ] Rate limits configured (100 req/min, 1 post/30min)
- [ ] `m/openclaw` submolt created (run `apps/api/scripts/setup-submolt.ts` if needed)

**Hyperliquid Integration:**

- [ ] Using production endpoint: `https://api.hyperliquid.xyz`
- [ ] NOT using testnet (`HYPERLIQUID_TESTNET=false`)
- [ ] Leverage trading tested
- [ ] Copy trading functionality verified
- [ ] Position management working

**Solana/Pump.fun Integration:**

- [ ] Using mainnet-beta RPC endpoint
- [ ] Pump.fun token listing working
- [ ] Meme coin buy/sell functionality tested
- [ ] Slippage protection configured correctly

---

### 🔍 8. CODE SEARCH FOR REMAINING ISSUES

Run these searches to find any remaining issues:

```bash
# Search for TODO/FIXME markers
grep -r "TODO\|FIXME\|HACK" apps/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# Search for "mock" in production code (excluding test directory)
grep -r "mock\|Mock\|MOCK" apps/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# Search for "test" API keys or credentials
grep -r "test_.*key\|test.*api" apps/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# Search for localhost references
grep -r "localhost\|127.0.0.1" apps/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# Search for hardcoded private keys
grep -r "privateKey\|private_key" apps/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# Search for placeholder/temp references
grep -r "placeholder\|temp\|dummy" apps/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
```

---

### 🔐 9. SECURITY AUDIT

- [ ] No private keys stored in code or environment files
- [ ] All API keys stored in environment variables only
- [ ] `.env` files added to `.gitignore`
- [ ] No credentials in git history (`git log --all --full-history -- "*.env"`)
- [ ] CORS properly configured for production domain only
- [ ] Rate limiting enabled for all API endpoints
- [ ] Input validation on all user-facing endpoints
- [ ] SQL injection prevention (if using database)
- [ ] XSS protection enabled
- [ ] HTTPS enforced in production

**Run CodeQL Security Scan:**

- [ ] Execute `npm run security-scan` or equivalent
- [ ] Review and fix all critical/high severity issues
- [ ] Document any accepted risks

---

### 🧪 10. FUNCTIONAL TESTING

**API Endpoints Testing:**

- [ ] `GET /health` - Returns healthy status
- [ ] `POST /api/wallet/create` - Creates real wallet
- [ ] `GET /api/wallet/balance` - Returns real balances
- [ ] `GET /api/quote` - Returns real market quotes
- [ ] `POST /api/swap` - Executes real swaps (test with small amounts)
- [ ] `GET /api/memecoins` - Lists real Pump.fun tokens
- [ ] `POST /api/leverage/open` - Opens real position (test carefully)
- [ ] `GET /api/copy/traders` - Returns real trader list
- [ ] `POST /api/referral/link` - Generates unique referral link
- [ ] `GET /api/leaderboard` - Returns real agent rankings
- [ ] `GET /api/activity` - Returns real activity feed

**Frontend Testing:**

- [ ] Dashboard loads with real portfolio data
- [ ] Trading interface connects to real API
- [ ] Copy trading page shows real traders
- [ ] Leaderboard displays real agent rankings (NOT mock data)
- [ ] Activity feed shows real-time trades
- [ ] All links navigate correctly
- [ ] Responsive design works on mobile/tablet/desktop

---

### 📊 11. PERFORMANCE & MONITORING

- [ ] API response times acceptable (< 500ms for most endpoints)
- [ ] Frontend page load times acceptable (< 3s initial load)
- [ ] Database queries optimized (if applicable)
- [ ] Caching configured for frequently accessed data
- [ ] Error logging configured (Sentry, CloudWatch, etc.)
- [ ] Application monitoring configured (DataDog, New Relic, etc.)
- [ ] Uptime monitoring configured
- [ ] Alert system configured for critical errors

---

### 📝 12. DOCUMENTATION REVIEW

- [ ] `README.md` - Updated with production setup instructions
- [ ] `RUNNING.md` - Contains correct production deployment steps
- [ ] API documentation complete and accurate
- [ ] Environment variable documentation complete (`.env.example` files)
- [ ] Moltbook integration documented (`m/openclaw` setup)
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Troubleshooting guide available

---

### 🚢 13. DEPLOYMENT READINESS

**Pre-Deployment:**

- [ ] All checklist items above completed
- [ ] Production environment provisioned
- [ ] DNS configured correctly
- [ ] SSL certificates installed
- [ ] Database migrated (if applicable)
- [ ] Backup strategy in place
- [ ] Rollback plan documented

**Deployment Process:**

- [ ] Build both API and web applications
- [ ] Run all tests: `npm test`
- [ ] Deploy backend API first
- [ ] Verify API health endpoint
- [ ] Deploy frontend
- [ ] Verify frontend connects to API
- [ ] Smoke test critical user flows

**Post-Deployment:**

- [ ] Monitor error logs for first 24 hours
- [ ] Verify all integrations working (GDEX, Moltbook, Hyperliquid)
- [ ] Test end-to-end user flows
- [ ] Monitor performance metrics
- [ ] Check for any leaked test data in production

---

## 🎯 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

Based on code review, these issues MUST be addressed before production:

### 🚨 HIGH PRIORITY

1. **Leaderboard Mock Data** (`apps/web/app/leaderboard/page.tsx`)
   - Lines 44-93 contain hardcoded `LEADERBOARD_DATA`
   - **MUST** replace with API call to backend
   - **RISK:** Users will see fake agent data

2. **Environment Variables Not Set**
   - `GDEX_API_KEY` - EMPTY (required for trading)
   - `GDEX_API_SECRET` - EMPTY (required for trading)
   - `MOLTBOOK_API_KEY` - EMPTY (required for social features)
   - `NEXT_PUBLIC_API_URL` - Not set (defaults to localhost)
   - **RISK:** Application will not function correctly

3. **CORS Configuration**
   - Currently set to `http://localhost:3000`
   - **MUST** update to production domain
   - **RISK:** Frontend cannot communicate with API

### ⚠️ MEDIUM PRIORITY

4. **Activity Feed Data** (`apps/web/components/activity-feed.tsx`)
   - May contain mock/placeholder data
   - Verify connected to real-time feed

5. **Network Configuration**
   - Verify `HYPERLIQUID_TESTNET=false` for mainnet
   - Confirm Solana RPC using mainnet-beta
   - **RISK:** Trading on wrong network = loss of funds

6. **Test Wallet Security**
   - Ensure test wallets with exposed private keys never receive real funds
   - **RISK:** Funds could be stolen if test keys used in production

---

## ✅ FINAL SIGN-OFF

Once all checklist items are completed:

- [ ] Technical Lead Review
- [ ] Security Review
- [ ] QA Sign-Off
- [ ] Product Owner Approval

**Reviewed By:** ___________________  
**Date:** ___________________  
**Approved for Production:** ☐ YES  ☐ NO  

---

## 📞 SUPPORT & ESCALATION

If any checklist item cannot be completed or issues are discovered:

1. Document the issue in GitHub Issues
2. Assign appropriate priority label
3. Notify technical lead immediately for critical issues
4. Do NOT deploy to production until all critical issues resolved

---

**Last Updated:** 2026-02-02  
**Version:** 1.0  
**Repository:** [GemachDAO/OpenClawDex](https://github.com/GemachDAO/OpenClawDex)
