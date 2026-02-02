# OpenClawDex - Running Guide

## ✅ Status: UP AND RUNNING

Both the API server and web app are now running successfully in a tmux session.

## Services

### API Server
- **URL**: http://localhost:3001
- **Status**: ✅ Running
- **Health Check**: http://localhost:3001/health
- **Tmux Window**: `openclawdex:api`

### Web App
- **URL**: http://localhost:3000
- **Status**: ✅ Running  
- **Tmux Window**: `openclawdex:web`

## Tmux Commands

### View the servers
```bash
# Attach to the tmux session
tmux attach -t openclawdex

# Switch between windows
Ctrl+b 0  # API server
Ctrl+b 1  # Web app

# Detach from session (keep it running)
Ctrl+b d
```

### Manage the session
```bash
# List sessions
tmux ls

# Kill the session (stop all servers)
tmux kill-session -t openclawdex

# Restart servers (if needed)
tmux kill-session -t openclawdex
tmux new-session -d -s openclawdex -n api "source ~/.nvm/nvm.sh && nvm use 20 && cd /opt/OpenClawDex && npm run dev:api"
tmux new-window -t openclawdex -n web "source ~/.nvm/nvm.sh && nvm use 20 && cd /opt/OpenClawDex && npm run dev:web"
```

## What Was Fixed

1. **Missing Export**: Added `export` to `OPENCLAW_SUBMOLT` constant in `apps/api/src/services/moltbook.service.ts`

2. **Node.js Version**: Upgraded from v16.20.0 to v20.20.0 using nvm (Next.js requires >=20.9.0)

3. **TailwindCSS PostCSS**: 
   - Installed `@tailwindcss/postcss` package
   - Updated `apps/web/postcss.config.js` to use `@tailwindcss/postcss` instead of `tailwindcss`

4. **Undefined Props**: Added default values for destructured props in `apps/web/app/page.tsx` to handle undefined data

## Configuration

- Environment file: `apps/api/.env` (copied from `.env.example`)
- Current setup uses default development configuration
- SDK Status shows "unavailable" because API keys are not configured (optional for local dev)

## Next Steps

To fully configure the application:

1. Get API keys from:
   - Gdex SDK: Add to `GDEX_API_KEY` and `GDEX_API_SECRET`
   - Moltbook: Add to `MOLTBOOK_API_KEY`

2. Update `apps/api/.env` with your API keys

3. Restart the API server to apply changes

## Quick Test

```bash
# Test API
curl http://localhost:3001/health

# Visit web app in browser
open http://localhost:3000  # macOS
# or just navigate to http://localhost:3000 in your browser
```
