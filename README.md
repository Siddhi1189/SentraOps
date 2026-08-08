# SentraOps Backend Platform

SentraOps is a production-grade engineering operations monitoring platform: continuous HTTP health checks, automatic incident detection, full incident lifecycle management, and a public status page.

Inspired by Better Stack, Atlassian Statuspage, UptimeRobot, and PagerDuty.

---

## Architecture

```
Clients (Dashboard / Public Status Page)
        │
        ▼
┌─────────────────────────────────────┐
│          Express API Server         │
│   src/index.js ←→ src/app.js        │
│                                     │
│  Helmet · Compression · CORS        │
│  JWT Auth · RBAC · Zod · Rate Limit │
│  Correlation IDs (X-Request-ID)     │
│  Swagger UI (/api/v1/docs)          │
│                                     │
│  Middleware Layer                   │
│  Service Layer                      │
│  Repository Layer                   │
│  PostgreSQL                         │
└────────────────┬────────────────────┘
                 │ Redis Pub/Sub
                 │ Channel: sentraops:events
                 │ (API subscribes / Worker publishes)
                 │
┌────────────────▼────────────────────┐
│          Worker Process             │
│         worker/worker.js            │
│                                     │
│  healthCheckQueue                   │
│  → healthCheck.processor.js         │
│    • HTTP health checks             │
│    • Incident engine                │
│    • Enqueues notificationQueue     │
│                                     │
│  notificationQueue                  │
│  → notification.processor.js        │
│    • Email dispatch (Nodemailer)    │
│    • Exponential retry backoff      │
│                                     │
│  maintenanceQueue                   │
│  → maintenance.processor.js         │
│    • Window state transitions       │
│                                     │
│  cleanupProcessor                   │
│  → cleanup.processor.js             │
│    • Data retention cleanup worker  │
└─────────────────────────────────────┘
```

---

## Core Design Rules

| Rule | Detail |
|---|---|
| API never monitors | The API server performs zero health checks |
| Worker never serves HTTP | The Worker process exposes no HTTP endpoints |
| Repository-only Prisma | All Prisma queries live strictly in `src/repositories/` |
| Tenant isolation | Every repository method requires `organizationId` from the JWT |
| Transactions | Incident creation, recovery, escalation, and manual updates use transactions in repositories |
| Immutable timeline | `timeline_events` rows are append-only; no update or delete methods exist |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| HTTP Framework | Express.js |
| Documentation | OpenAPI 3.0 via `swagger-jsdoc` & `swagger-ui-express` |
| Database | PostgreSQL via Prisma ORM v6 |
| Queue / Scheduling | BullMQ backed by Redis |
| Real-time | Socket.IO with Redis Pub/Sub bridge |
| Authentication | JWT (access token) + httpOnly refresh cookie (bcryptjs) |
| Validation | Zod |
| Containerization | Docker & Docker Compose |
| Testing | Jest + Supertest |
| Security | Helmet, CORS, express-rate-limit, correlation ID tracking |
| Performance | Compression (Gzip) |
| Logging | Winston + Morgan with correlation IDs (`X-Request-ID`) |

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start PostgreSQL, Redis, API, and Worker via Docker Compose
docker compose up -d

# API running on http://localhost:5000
# Swagger API docs on http://localhost:5000/api/v1/docs
```

### Option 2: Local Development

```bash
# 1. Copy and configure environment
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run generate

# 4. Apply database migrations
npm run migrate

# 5. Seed demo data (Acme Corp org + services)
npm run seed

# 6. Run API server and Worker concurrently
npm run dev:all

# 7. Run automated tests
npm test
```

---

## Interactive API Documentation & Dev Tools

- **Swagger / OpenAPI Documentation**: `http://localhost:5000/api/v1/docs`
- **Health Diagnostic Endpoint**: `http://localhost:5000/api/v1/health`
- **Bull Board Queue Monitoring** (Development Mode): `http://localhost:5000/admin/queues`

---

## API Routes Summary (/api/v1/)

| Route | Auth | Roles |
|---|---|---|
| `GET /api/v1/health` | Public | — |
| `POST /api/v1/auth/register` | Public | — |
| `POST /api/v1/auth/login` | Public | — |
| `POST /api/v1/auth/refresh` | Cookie | — |
| `POST /api/v1/auth/logout` | Cookie | — |
| `GET /api/v1/auth/me` | Bearer | Any |
| `GET /api/v1/organizations` | Bearer | Any |
| `POST /api/v1/organizations/invite` | Bearer | Owner, Admin |
| `GET /api/v1/organizations/members` | Bearer | Any |
| `PATCH /api/v1/organizations/members/:userId/role` | Bearer | Owner |
| `DELETE /api/v1/organizations/members/:userId` | Bearer | Owner |
| `POST /api/v1/services` | Bearer | Owner, Admin |
| `GET /api/v1/services` | Bearer | Any |
| `GET /api/v1/services/:id` | Bearer | Any |
| `PATCH /api/v1/services/:id` | Bearer | Owner, Admin |
| `DELETE /api/v1/services/:id` | Bearer | Owner, Admin |
| `POST /api/v1/services/groups` | Bearer | Owner, Admin |
| `GET /api/v1/services/groups` | Bearer | Any |
| `GET /api/v1/health-checks/service/:serviceId` | Bearer | Any |
| `GET /api/v1/incidents` | Bearer | Any |
| `GET /api/v1/incidents/:id` | Bearer | Any |
| `PATCH /api/v1/incidents/:id` | Bearer | Owner, Admin |
| `GET /api/v1/incidents/:id/timeline` | Bearer | Any |
| `POST /api/v1/maintenance` | Bearer | Owner, Admin |
| `GET /api/v1/maintenance` | Bearer | Any |
| `POST /api/v1/escalation-policies` | Bearer | Owner, Admin |
| `GET /api/v1/escalation-policies` | Bearer | Any |
| `GET /api/v1/analytics/services/:id` | Bearer | Any |
| `GET /api/v1/analytics/incidents` | Bearer | Any |
| `GET /api/v1/audit-logs` | Bearer | Owner, Admin |
| `GET /api/v1/status/:orgSlug` | **Public** | — |
| `GET /api/v1/status/:orgSlug/incidents` | **Public** | — |
| `GET /api/v1/status/:orgSlug/maintenance` | **Public** | — |
