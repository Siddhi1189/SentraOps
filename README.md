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

## Deployment

Follow this guide to deploy SentraOps to [Render](https://render.com) (Backend API & Background Worker) and [Vercel](https://vercel.com) (Frontend).

### Recommended Deployment Order
1. **Render PostgreSQL**: Provision a managed PostgreSQL instance.
2. **Render Redis**: Provision a managed Key Value / Redis instance.
3. **Render Web Service (API)**: Deploy the `backend/` directory as a Web Service.
4. **Render Background Worker**: Deploy the `backend/` directory as a Background Worker using the same database and Redis connections.
5. **Vercel Frontend**: Deploy the `frontend/` directory to Vercel.
6. **Configure Web Origin**: Set `CLIENT_ORIGIN` and `FRONTEND_URL` on both Render services to the Vercel production URL, then redeploy the backend services.

---

### Render Configuration

#### 1. Web Service (Backend API)
- **Root Directory**: `backend`
- **Environment**: Node
- **Build Command**: `npm install --include=dev && npx prisma migrate deploy --schema=src/models/schema.prisma`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

#### 2. Background Worker
- **Root Directory**: `backend`
- **Environment**: Node
- **Build Command**: `npm install --include=dev && npx prisma migrate deploy --schema=src/models/schema.prisma`
- **Start Command**: `npm run start:worker`

#### Environment Variables for Render (Web Service & Worker)

| Variable | Requirement | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Required** | PostgreSQL connection URL (e.g. internal Render connection string with `?schema=public`). |
| `REDIS_URL` | **Required** | Redis connection URL for BullMQ queues and pub/sub relay. |
| `JWT_ACCESS_SECRET` | **Required** | Random signing secret for JWT access tokens (minimum 32 characters; placeholders rejected in production). |
| `JWT_REFRESH_SECRET` | **Required** | Random signing secret for JWT refresh tokens (minimum 32 characters; placeholders rejected in production). |
| `SMTP_HOST` | **Required** | Outbound SMTP server host for transactional emails. |
| `SMTP_USER` | **Required** | SMTP authentication username. |
| `SMTP_PASS` | **Required** | SMTP authentication password. |
| `CLIENT_ORIGIN` | Optional | Comma-separated allowed CORS web origins with no trailing slashes (e.g. `https://<your-app>.vercel.app`). |
| `FRONTEND_URL` | Optional | Public frontend URL for notification emails and subscriber confirmation links. |
| `PORT` | Optional | Web server HTTP port (automatically set by Render; defaults to `4000`). |
| `NODE_ENV` | Optional | Runtime mode: `production`. |
| `SMTP_PORT` | Optional | SMTP port (defaults to `587`). |
| `SMTP_FROM` | Optional | Sender address (defaults to `noreply@sentraops.com`). |
| `ANTHROPIC_API_KEY` | Optional | Anthropic API key for AI-assisted incident summaries. |
| `ANTHROPIC_MODEL` | Optional | Anthropic Claude model identifier (defaults to `claude-sonnet-5-5`). |
| `DEMO_SEED_PASSWORD` | Optional | Password for demo accounts when running manual seed. |
| `DEMO_APP_BASE_URL` | Optional | Base URL for target demo store monitored during seed. |
| `HEALTH_CHECK_RETENTION_DAYS` | Optional | Retention period in days for health check logs (defaults to `30`). |
| `AUDIT_LOG_RETENTION_DAYS` | Optional | Retention period in days for audit log entries (defaults to `90`). |
| `ERROR_EVENT_RETENTION_DAYS` | Optional | Retention period in days for error events (defaults to `30`). |

---

### Vercel Configuration (Frontend)

- **Root Directory**: `frontend`
- **Framework Preset**: Vite
- **Build Command**: `npx vite build`
- **Output Directory**: `dist`

> **Note**: The Vercel Build Command uses `npx vite build` because `npm run build` runs `tsc` first and the repo has known pre-existing TypeScript errors.

#### Environment Variables for Vercel

| Variable | Requirement | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Optional | Full base URL of the backend API including the `/api/v1` prefix (e.g. `https://<your-render-service>.onrender.com/api/v1`). If omitted, defaults to `/api/v1` (for setups where Vercel rewrites `/api` to Render). |

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
