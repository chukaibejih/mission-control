# Mission Control

OpenClaw agent dashboard — 6 screens, real-time via SSE, password-protected.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local — set MC_PASSWORD and SESSION_SECRET

# 3. Make sure Clawd daemon is running on port 4310

# 4. Start dev server
npm run dev
# → http://localhost:3131
```

## Screens

| Screen    | Path       | Data source            |
|-----------|------------|------------------------|
| Tasks     | /tasks     | GET /tasks (SSE)       |
| Projects  | /projects  | GET /projects (SSE)    |
| Calendar  | /calendar  | GET /schedules (SSE)   |
| Agents    | /agents    | GET /agents (SSE)      |
| Memory    | /memory    | GET /memory            |
| Docs      | /docs      | GET /docs              |

## Environment Variables

| Variable        | Default                            | Description                    |
|-----------------|------------------------------------|--------------------------------|
| CLAWD_API_URL   | http://127.0.0.1:4310              | Clawd daemon base URL          |
| CLAWD_API_KEY   | mission-control-dev-key            | API key header value           |
| MC_PASSWORD     | changeme                           | Dashboard login password       |
| SESSION_SECRET  | (weak default)                     | Cookie signing secret (32+ chars) |
