# SentraOps

> An integrated observability and incident response platform combining real-time error tracking, uptime health checks, and automated alerting for engineering teams.

---

## Architecture

```mermaid
graph TD
    ClientApp[Client App / demo-shop] -->|@sentraops/node SDK| IngestAPI[API: /api/ingest/events]
    BrowserUser[Browser Client] -->|React Vite Frontend| WebAPI[API: /api/*]
    
    IngestAPI -->|Enqueue Event| RedisIngestQ[(BullMQ: ingest queue)]
    Worker[Background Worker] -->|Consume| RedisIngestQ
    
    Worker -->|Group & Deduplicate| Postgres[(PostgreSQL 16)]
    Worker -->|Evaluate AlertRules| AlertChannels[Slack / Webhooks / Email]
    Worker -->|Publish Event| SocketIO[Socket.IO Gateway]
    
    SocketIO -->|Live Updates| BrowserUser
    
    Worker -->|Poll Health Checks| TargetServices[Target Services /demo-shop]
    Worker -->|Store Health Checks| Postgres
```

---

## Screenshots

<!-- SCREENSHOTS PLACEHOLDER: Add UI screenshots here (Issues list, Service monitoring, AI summary) -->
```
[ Screenshots will be placed here ]
- Monitor Dashboard: /app/overview
- Issues & Stack Trace View: /app/issues/:id
- Incident Detail & AI Summary: /app/incidents/:id
- Organization Quotas & Limits: /app/settings/limits
```

---

## Core Features

- **Error Tracking & Grouping:** Automatic stack trace extraction, SHA-1 fingerprinting, in-app frame detection, and regression detection when resolved issues recur.
- **Uptime Monitoring:** Configurable HTTP/HTTPS health checks, custom intervals (down to 10s), HTTP assertions (status, keyword, response time), SSL certificate expiry tracking, and heartbeat monitors.
- **Incident Management & AI Summaries:** Auto-open incidents on consecutive check failures, manual incident lifecycle (investigating, identified, monitoring, resolved), incident timeline, and AI incident summaries powered by Anthropic Claude.
- **Alert Rules & Channels:** Flexible alert triggers (`service_down_consecutive_failures`, `new_issue_in_environment`, `event_rate_threshold`, `response_time_threshold`), cooldown periods, snooze intervals, and dispatch via Slack, Webhook, and Email.
- **Public Status Pages:** Organization-scoped public status pages, 90-day historical uptime bars, and double opt-in email subscriptions for incident updates.
- **Demo Data:** One-click demo seed and cleanup via `isDemo` tags.
- **Developer CLI & SDK:** Lightweight Node.js SDK (`@sentraops/node`) with Express middleware and a standalone CLI (`@sentraops/cli`) for synthetic event generation.

---

## Tech Stack

- **Backend:** Node.js 24, Express, Prisma ORM, BullMQ, Redis, PostgreSQL 16, Socket.IO, Anthropic SDK.
- **Frontend:** React 18, TypeScript, Vite, TanStack Query, CSS Tokens & Modules, Lucide React.
- **Packages & Tooling:** `@sentraops/node` (SDK), `@sentraops/cli` (CLI), Vitest, Jest, k6, Docker.

---

## Quick Start

### 1. Prerequisites & Environment
Ensure Docker, Node.js 20+, and npm are installed.

```bash
# Clone and enter repository
cd SentraOps

# Start PostgreSQL and Redis
docker compose up -d postgres redis
```

Configure backend environment variables in `backend/.env` (reference `backend/.env.example`):
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/sentraops?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
ANTHROPIC_API_KEY="your-anthropic-key" # Optional for AI summaries
DEMO_APP_BASE_URL="http://localhost:4050"
```

### 2. Database Migration & Backend Setup
```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed     # Seeds default organization and admin users
npm run dev      # Starts API server and BullMQ background workers
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev      # Accessible at http://localhost:5173
```

---

## SDK Usage

Install `@sentraops/node` in your Node/Express project:

```javascript
import express from 'express';
import * as SentraOps from '@sentraops/node';

const app = express();

SentraOps.init({
  dsn: 'http://<api_key>@localhost:4000/<project_id>',
  environment: 'production',
  release: 'v1.0.0',
});

// The request handler must be the first middleware
app.use(SentraOps.requestHandler());

app.get('/api/example', (req, res) => {
  throw new Error('Something broke!');
});

// The error handler must be before any other error middleware
app.use(SentraOps.errorHandler());
```

---

## Demo Shop Walkthrough

A sample target e-commerce service is provided under `demo-shop/`:

```bash
cd demo-shop
npm install
# Set DSN pointing to your local SentraOps instance:
export SENTRAOPS_DSN="http://<api_key>@localhost:4000/<project_id>"
npm start # Runs on http://localhost:4050
```

1. Open `http://localhost:4050` in your browser.
2. Click **"Throw error"** to dispatch an unhandled exception into SentraOps.
3. Open SentraOps at `http://localhost:5173/app/issues` to observe the issue appear in real time.
4. Click **"Toggle outage"** to force `/health` to return 500, triggering an incident in SentraOps.

---

## Limits & Supported Features

| Feature Category | Supported in Code | Not Supported Yet |
| :--- | :--- | :--- |
| **Monitors** | HTTP, HTTPS, Heartbeat | TCP port check, DNS, ICMP ping |
| **Assertions** | Status code, body contains/not contains, response time | Full XPath / complex JSONPath |
| **Alert Channels** | Slack, Webhook, Email | PagerDuty, Opsgenie, SMS/Twilio |
| **Ingest Rate Limit**| 100 requests/minute per API key | Dynamic per-plan burst tokens |
| **Projects Quota** | Max 5 projects per organization | Unlimited projects tier |
| **Retention** | 30-day error event retention | Custom retention rules |

---

## Testing

Run unit, integration, and load test suites across all workspaces:

```bash
# Backend test suite (13 suites, 90+ tests)
cd backend && npm test

# Frontend typecheck & test suite (19 suites, 100+ tests)
cd ../frontend && npx tsc --noEmit && npm test && npm run build

# SDK and CLI tests
cd ../packages/sdk-node && npm test
cd ../packages/cli && npm test

# k6 Ingest Load Test
docker run --rm -v "${PWD}/tests/load:/scripts" grafana/k6 run /scripts/ingest.js
```
