# SentraOps

**Engineering Operations Monitoring & Incident Management Platform**

SentraOps is a backend platform for continuous HTTP service monitoring, automated incident detection and recovery, incident lifecycle management, maintenance windows, escalation policies, notifications, analytics, audit logging, real-time updates, and public status pages.

The system is designed around a strict separation between the HTTP API and background monitoring workers.

---

## Overview

SentraOps monitors registered services continuously and converts health-check failures into operational events.

The platform provides:

* Continuous HTTP health monitoring
* Configurable monitoring intervals
* Expected HTTP status validation
* Request timeout handling
* Response-time tracking
* Consecutive-failure tracking
* Automatic incident creation
* Automatic incident recovery
* Incident severity and lifecycle management
* Immutable incident timeline events
* Maintenance windows
* Escalation policies
* Email notifications
* Notification retry with BullMQ backoff
* Organization-based multi-tenancy
* Owner/Admin/Viewer RBAC
* JWT authentication
* Refresh-token authentication using httpOnly cookies
* Password recovery
* Service groups and tags
* Service analytics
* Incident analytics
* Audit logs
* Redis-based real-time event propagation
* Socket.IO organization rooms
* Public status pages
* Data-retention cleanup
* Swagger/OpenAPI documentation
* Bull Board queue inspection in development
* Docker Compose support
* Jest and Supertest automated tests

---

## Architecture

```text
                         ┌──────────────────────────┐
                         │        Clients           │
                         │                          │
                         │  Dashboard               │
                         │  Public Status Page      │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTP / WebSocket
                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                        EXPRESS API                           │
│                                                              │
│  src/index.js                                                │
│       │                                                      │
│       └── src/app.js                                         │
│                                                              │
│  Middleware                                                  │
│  ├── Helmet                                                  │
│  ├── CORS                                                    │
│  ├── Compression                                              │
│  ├── Cookie Parser                                            │
│  ├── Rate Limiting                                             │
│  ├── Correlation IDs                                          │
│  ├── Request Logging                                          │
│  ├── JWT Authentication                                       │
│  ├── RBAC Authorization                                       │
│  └── Zod Validation                                           │
│                                                              │
│  Routes → Controllers → Services → Repositories              │
│                                      │                       │
│                                      ▼                       │
│                                  PostgreSQL                  │
│                                                              │
│  Socket.IO                                                    │
│       ▲                                                      │
│       │ Redis Pub/Sub                                        │
└───────┼──────────────────────────────────────────────────────┘
        │
        │ sentraops:events
        │
        │
┌───────▼──────────────────────────────────────────────────────┐
│                       WORKER PROCESS                          │
│                    worker/worker.js                           │
│                                                              │
│  BullMQ                                                     │
│                                                              │
│  health-check                                                │
│       │                                                      │
│       └── healthCheck.processor.js                           │
│             ├── HTTP health checks                           │
│             ├── Health result persistence                     │
│             ├── Maintenance detection                        │
│             ├── Incident creation                            │
│             ├── Incident recovery                            │
│             ├── Escalation policy evaluation                 │
│             └── Notification enqueueing                      │
│                                                              │
│  notifications                                               │
│       │                                                      │
│       └── notification.processor.js                          │
│             ├── Email dispatch                               │
│             └── Retry handling                               │
│                                                              │
│  maintenance                                                 │
│       │                                                      │
│       └── maintenance.processor.js                           │
│             └── Maintenance state transitions                │
│                                                              │
│  Cleanup                                                      │
│       │                                                      │
│       └── cleanup.processor.js                               │
│             └── Data retention cleanup                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Architectural Principles

### 1. API Never Performs Monitoring

The Express API does not execute service health checks.

Health checks are executed exclusively by the worker process.

### 2. Worker Never Serves HTTP

The worker process does not expose HTTP endpoints.

It consumes BullMQ jobs, performs monitoring and background processing, and publishes operational events through Redis.

### 3. Repository-Only Prisma Access

Database operations are isolated in `src/repositories/`.

Controllers and business services should not contain direct Prisma queries.

### 4. Tenant Isolation

Organization-scoped operations use the authenticated organization's identity.

Core organization-owned entities are isolated by `organizationId`.

### 5. Transactional Lifecycle Operations

Critical incident lifecycle operations use repository-level transactional handling where required.

### 6. Immutable Timeline

Incident timeline events are append-oriented operational records.

Timeline events are not treated as mutable incident state.

---

# Technology Stack

| Layer                  | Technology                  |
| ---------------------- | --------------------------- |
| Runtime                | Node.js                     |
| Module System          | ES Modules (ESM)            |
| HTTP Framework         | Express.js                  |
| Database               | PostgreSQL                  |
| ORM                    | Prisma ORM 6                |
| Queue                  | BullMQ 5                    |
| Queue Backend          | Redis                       |
| Real-Time              | Socket.IO + Redis Pub/Sub   |
| Authentication         | JWT                         |
| Refresh Authentication | httpOnly Cookie             |
| Password Hashing       | bcryptjs                    |
| Validation             | Zod                         |
| API Documentation      | OpenAPI 3 / Swagger         |
| Email                  | Nodemailer                  |
| Logging                | Winston + Morgan            |
| Security               | Helmet, CORS, Rate Limiting |
| Performance            | Compression                 |
| Testing                | Jest + Supertest            |
| Containerization       | Docker + Docker Compose     |

---

# Why ES Modules?

SentraOps uses Node.js ES Modules rather than CommonJS.

The backend package declares:

```json
"type": "module"
```

and source files use:

```js
import express from 'express';
```

and:

```js
export default router;
```

The `.cjs` files used by the test infrastructure are isolated CommonJS mocks and do not change the application's module system.

---

# Project Structure

```text
SentraOps/
│
├── .github/
│   └── workflows/
│
├── backend/
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── bullBoard.js
│   │   │   ├── db.js
│   │   │   ├── env.js
│   │   │   ├── queue.js
│   │   │   ├── redis.js
│   │   │   └── socket.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── validators/
│   │   │   ├── analytics.controller.js
│   │   │   ├── auditLog.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── escalation.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── healthCheck.controller.js
│   │   │   ├── incident.controller.js
│   │   │   ├── maintenance.controller.js
│   │   │   ├── organization.controller.js
│   │   │   ├── service.controller.js
│   │   │   └── statusPage.controller.js
│   │   │
│   │   ├── docs/
│   │   │   └── swagger.js
│   │   │
│   │   ├── middlewares/
│   │   │
│   │   ├── models/
│   │   │   └── schema.prisma
│   │   │
│   │   ├── repositories/
│   │   │
│   │   ├── routes/
│   │   │
│   │   ├── seed/
│   │   │
│   │   ├── services/
│   │   │   └── notifications/
│   │   │
│   │   ├── utils/
│   │   │
│   │   ├── app.js
│   │   ├── constants.js
│   │   └── index.js
│   │
│   ├── worker/
│   │   ├── processors/
│   │   │   ├── cleanup.processor.js
│   │   │   ├── escalation.processor.js
│   │   │   ├── healthCheck.processor.js
│   │   │   ├── maintenance.processor.js
│   │   │   └── notification.processor.js
│   │   │
│   │   └── worker.js
│   │
│   ├── tests/
│   │   ├── __mocks__/
│   │   ├── auth.test.js
│   │   ├── incidents.test.js
│   │   ├── notifications.test.js
│   │   ├── root.test.js
│   │   ├── services.test.js
│   │   ├── statusPage.test.js
│   │   └── setup.js
│   │
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── jest.config.js
│   ├── package.json
│   └── package-lock.json
│
├── FINAL_REPORT.md
└── README.md
```

---

# Core Modules

## Organizations

SentraOps is organization-based.

Organizations own:

* Users
* Services
* Service groups
* Tags
* Incidents
* Maintenance windows
* Escalation policies
* Notifications
* Status page configuration
* Audit logs
* Invitation tokens

---

## Authentication

Authentication supports:

* Registration
* Login
* JWT access tokens
* httpOnly refresh cookies
* Token refresh
* Logout
* Current-user lookup
* Forgot-password flow
* Password reset flow

Passwords are hashed using bcryptjs.

---

## Role-Based Access Control

Supported roles:

| Role   | Description                      |
| ------ | -------------------------------- |
| Owner  | Full organization administration |
| Admin  | Operational administration       |
| Viewer | Read-only operational access     |

Administrative operations are protected using RBAC middleware.

---

# Service Monitoring

A monitored service contains configuration such as:

* Service name
* URL
* HTTP method
* Expected status code
* Check interval
* Timeout
* Active/inactive state
* Environment
* Priority
* Tags
* Service group

The worker registers repeating BullMQ jobs for active services.

Example monitoring interval:

```text
30 seconds
60 seconds
300 seconds
600 seconds
```

The actual interval is determined by the service configuration.

---

# Health Check Engine

Each monitoring execution:

1. Loads the service configuration.
2. Checks whether the service is active.
3. Performs the HTTP request.
4. Applies the configured timeout.
5. Records HTTP status.
6. Measures response time.
7. Determines health state.
8. Persists the health-check result.
9. Checks for maintenance windows.
10. Evaluates incident recovery or failure.
11. Publishes real-time events.
12. Enqueues notifications when required.

Health states:

```text
up
down
timeout
```

---

# Incident Engine

SentraOps automatically evaluates monitoring failures.

The worker tracks consecutive failures and uses the effective escalation policy associated with the service.

Incident statuses:

```text
open
investigating
identified
monitoring
resolved
```

Incident severities:

```text
low
medium
high
critical
```

The incident engine supports:

* Automatic incident creation
* Failure counting
* Escalation policy evaluation
* Automatic recovery
* Resolution timestamps
* Manual status updates
* Severity updates
* Timeline events
* Real-time incident events
* Notifications

---

# Incident Timeline

Timeline events provide an operational history of incident changes.

Supported event types include:

```text
health_check_failed
failure_count_increased
incident_created
status_changed
assigned
comment_added
resolved
notification_sent
```

Timeline records are designed as append-oriented operational history.

---

# Escalation Policies

Escalation policies define thresholds used by the incident engine.

Policies can be managed per organization/service and are evaluated by the worker during monitoring failures.

Escalation policy operations include:

* List policies
* Get a policy
* Create/update a policy
* Delete a policy

Escalation evaluation is part of the health-check incident engine rather than a separate HTTP server.

---

# Maintenance Windows

Maintenance windows prevent expected operational changes from being treated as incidents.

Lifecycle:

```text
scheduled
     ↓
in_progress
     ↓
completed
```

During an active maintenance window:

* The service can be marked as `maintenance`.
* Consecutive failure processing is suppressed.
* Incident creation/recovery processing is skipped for that monitoring execution.
* Maintenance events are published through Redis.

The worker also periodically checks for maintenance transitions.

---

# Notifications

The current notification pipeline implements email dispatch.

Flow:

```text
Incident / Event
      │
      ▼
BullMQ notifications queue
      │
      ▼
notification.processor.js
      │
      ├── Create notification record
      ├── Resolve recipients
      ├── Dispatch email
      └── Update notification status
```

Notification states:

```text
pending
sent
failed
```

Organization owners and admins are used as default recipients when an explicit recipient is not supplied.

---

# Notification Retry

The notifications queue uses BullMQ retry handling.

Current configuration:

```text
Attempts: 3
Backoff: exponential
Initial delay: 5 seconds
```

Failed notification processing is rethrown so BullMQ can perform the configured retry.

---

# Real-Time Architecture

SentraOps uses:

```text
Worker
   │
   │ publish
   ▼
Redis Pub/Sub
sentraops:events
   │
   ▼
API Redis subscriber
   │
   ├── Socket.IO organization room
   │
   └── Status-page cache invalidation
```

Events are associated with an organization and emitted to the corresponding Socket.IO organization room.

Examples include:

```text
health-check-updated
incident-created
incident-updated
maintenance-started
maintenance-ended
```

---

# Analytics

Analytics endpoints currently provide:

* Service analytics
* Incident analytics

Service analytics are scoped to a specific service.

Incident analytics provide organization-level incident reporting.

---

# Audit Logging

Administrative operations are recorded through the audit-log subsystem.

Audit logs are accessible to:

* Owner
* Admin

Audit records are subject to background retention cleanup.

---

# Public Status Page

The public status page is intentionally unauthenticated.

Public endpoints are exposed using the organization's slug.

The status page can provide:

* Current service status
* Public incidents
* Maintenance information

This allows a frontend status page to be deployed independently from the authenticated operations dashboard.

---

# Data Retention

SentraOps includes a background cleanup processor.

Default retention:

| Data          | Default Retention |
| ------------- | ----------------: |
| Health checks |           30 days |
| Audit logs    |           90 days |

The cleanup processor runs periodically in the worker process.

Retention can be configured through:

```text
HEALTH_CHECK_RETENTION_DAYS
AUDIT_LOG_RETENTION_DAYS
```

---

# BullMQ Queues

SentraOps currently uses three BullMQ queues.

| Queue           | Purpose                                   |
| --------------- | ----------------------------------------- |
| `health-check`  | Repeating service monitoring              |
| `notifications` | Email notification dispatch               |
| `maintenance`   | Maintenance-related background processing |

The worker consumes these queues with dedicated BullMQ workers.

Current worker concurrency:

| Worker        | Concurrency |
| ------------- | ----------: |
| Health checks |          10 |
| Notifications |           5 |
| Maintenance   |           2 |

---

# API

Base path:

```text
/api/v1
```

## Health

| Method | Endpoint  | Auth   |
| ------ | --------- | ------ |
| GET    | `/health` | Public |

---

## Authentication

| Method | Endpoint                | Auth           |
| ------ | ----------------------- | -------------- |
| POST   | `/auth/register`        | Public         |
| POST   | `/auth/login`           | Public         |
| POST   | `/auth/forgot-password` | Public         |
| POST   | `/auth/reset-password`  | Public         |
| POST   | `/auth/refresh`         | Refresh Cookie |
| POST   | `/auth/logout`          | Refresh Cookie |
| GET    | `/auth/me`              | Bearer         |

---

## Organizations

| Method | Endpoint                              | Auth        |
| ------ | ------------------------------------- | ----------- |
| POST   | `/organizations/invite/accept`        | Public      |
| GET    | `/organizations`                      | Bearer      |
| POST   | `/organizations/invite`               | Owner/Admin |
| GET    | `/organizations/members`              | Bearer      |
| PATCH  | `/organizations/members/:userId/role` | Owner       |
| DELETE | `/organizations/members/:userId`      | Owner       |

---

## Services

| Method | Endpoint        | Auth        |
| ------ | --------------- | ----------- |
| POST   | `/services`     | Owner/Admin |
| GET    | `/services`     | Bearer      |
| GET    | `/services/:id` | Bearer      |
| PATCH  | `/services/:id` | Owner/Admin |
| DELETE | `/services/:id` | Owner/Admin |

---

## Service Groups

| Method | Endpoint               | Auth        |
| ------ | ---------------------- | ----------- |
| POST   | `/services/groups`     | Owner/Admin |
| GET    | `/services/groups`     | Bearer      |
| GET    | `/services/groups/:id` | Bearer      |
| PATCH  | `/services/groups/:id` | Owner/Admin |
| DELETE | `/services/groups/:id` | Owner/Admin |

---

## Health Checks

| Method | Endpoint                            | Auth   |
| ------ | ----------------------------------- | ------ |
| GET    | `/health-checks/service/:serviceId` | Bearer |

Health checks themselves are executed by the worker, not by this API endpoint.

---

## Incidents

| Method | Endpoint                  | Auth        |
| ------ | ------------------------- | ----------- |
| GET    | `/incidents`              | Bearer      |
| GET    | `/incidents/:id`          | Bearer      |
| PATCH  | `/incidents/:id`          | Owner/Admin |
| GET    | `/incidents/:id/timeline` | Bearer      |

---

## Maintenance

| Method | Endpoint           | Auth        |
| ------ | ------------------ | ----------- |
| GET    | `/maintenance`     | Bearer      |
| GET    | `/maintenance/:id` | Bearer      |
| POST   | `/maintenance`     | Owner/Admin |
| PATCH  | `/maintenance/:id` | Owner/Admin |
| DELETE | `/maintenance/:id` | Owner/Admin |

---

## Escalation Policies

| Method | Endpoint                   | Auth        |
| ------ | -------------------------- | ----------- |
| GET    | `/escalation-policies`     | Bearer      |
| GET    | `/escalation-policies/:id` | Bearer      |
| POST   | `/escalation-policies`     | Owner/Admin |
| DELETE | `/escalation-policies/:id` | Owner/Admin |

---

## Analytics

| Method | Endpoint                  | Auth   |
| ------ | ------------------------- | ------ |
| GET    | `/analytics/services/:id` | Bearer |
| GET    | `/analytics/incidents`    | Bearer |

---

## Audit Logs

| Method | Endpoint      | Auth        |
| ------ | ------------- | ----------- |
| GET    | `/audit-logs` | Owner/Admin |

---

## Public Status Page

| Method | Endpoint                       | Auth   |
| ------ | ------------------------------ | ------ |
| GET    | `/status/:orgSlug`             | Public |
| GET    | `/status/:orgSlug/incidents`   | Public |
| GET    | `/status/:orgSlug/maintenance` | Public |

---

# API Documentation

Swagger/OpenAPI documentation is available at:

```text
/api/v1/docs
```

Example local URLs:

```text
http://localhost:4000/api/v1/docs
```

or when using the provided Docker Compose configuration:

```text
http://localhost:5000/api/v1/docs
```

---

# Bull Board

Bull Board is available in development for queue inspection.

```text
/admin/queues
```

Example:

```text
http://localhost:4000/admin/queues
```

---

# Environment Configuration

Create a local environment file:

```bash
cp .env.example .env
```

Important configuration includes:

```text
DATABASE_URL
REDIS_URL
PORT
CLIENT_ORIGIN

JWT_ACCESS_SECRET
JWT_REFRESH_SECRET

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM

NODE_ENV

HEALTH_CHECK_RETENTION_DAYS
AUDIT_LOG_RETENTION_DAYS
```

JWT secrets must be at least 32 characters.

SMTP configuration is required for email notification delivery.

---

# Local Development

## 1. Enter the backend directory

```bash
cd backend
```

## 2. Configure environment

```bash
cp .env.example .env
```

Update the values for your PostgreSQL, Redis, JWT, and SMTP configuration.

## 3. Install dependencies

```bash
npm install
```

## 4. Generate Prisma Client

```bash
npm run generate
```

## 5. Apply migrations

```bash
npm run migrate
```

## 6. Seed development data

```bash
npm run seed
```

The seed script creates development/demo organization and service data.

## 7. Start the API

```bash
npm run dev
```

By default, the local API listens on:

```text
http://localhost:4000
```

## 8. Start the worker

In another terminal:

```bash
npm run worker
```

## 9. Run API and worker together

```bash
npm run dev:all
```

---

# Docker

The repository includes Docker Compose definitions for:

```text
PostgreSQL
Redis
API
Worker
```

Start the stack with:

```bash
docker compose up -d
```

The provided Compose configuration exposes the API on:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/api/v1/docs
```

Bull Board:

```text
http://localhost:5000/admin/queues
```

## Important Docker Note

The current Compose file contains development-oriented database credentials and JWT placeholder values.

These values must be replaced before any production deployment.

Docker Compose also does not replace proper production database migration, secret management, or deployment configuration.

---

# Docker Services

```text
sentraops-postgres
        │
        └── PostgreSQL 16

sentraops-redis
        │
        └── Redis 7

sentraops-api
        │
        └── Express API

sentraops-worker
        │
        └── BullMQ workers
```

---

# Testing

Run the automated test suite:

```bash
npm test
```

The test suite uses:

* Jest
* Supertest
* Node test environment
* Redis mocks
* Test setup utilities

Current test areas include:

```text
Authentication
Services
Incidents
Notifications
Status Page
Root/API behavior
```

---

# Security

SentraOps includes several application-level security controls:

* Helmet security headers
* CORS configuration
* Authentication rate limiting
* API rate limiting
* JWT authentication
* httpOnly refresh cookies
* bcrypt password hashing
* Zod request validation
* RBAC authorization
* Organization-scoped data access
* Correlation IDs
* Centralized error handling
* Structured logging

---

# Observability

The backend uses:

* Winston for application logging
* Morgan for HTTP request logging
* Correlation IDs through `X-Request-ID`

Correlation IDs allow requests and operational events to be traced across the API and worker architecture.

---

# Graceful Shutdown

Both API and worker processes implement graceful shutdown handling.

The API shuts down:

* HTTP server
* Socket.IO
* Redis subscriber
* Prisma client

The worker shuts down:

* BullMQ workers
* Maintenance ticker
* Cleanup ticker
* Redis publisher
* Prisma client

This allows active background work to be closed more cleanly during process termination.

---

# Database

SentraOps uses PostgreSQL through Prisma ORM.

The Prisma schema includes core entities for:

```text
Organization
User
Service
ServiceGroup
Tag
ServiceTag
HealthCheck
Incident
MaintenanceWindow
EscalationPolicy
Notification
TimelineEvent
AuditLog
InviteToken
RefreshToken
PasswordResetToken
StatusPageSettings
```

The schema also defines operational enums for:

```text
User roles
HTTP methods
Service status
Health status
Incident status
Incident severity
Maintenance status
Notification channels
Notification status
Timeline event types
Environment
```

---

# Service Lifecycle

A typical service lifecycle looks like:

```text
Create Service
      │
      ▼
Register Monitoring Job
      │
      ▼
Periodic HTTP Health Check
      │
      ├───────────────┐
      │               │
      ▼               ▼
     UP              DOWN
      │               │
      │               ▼
      │        Consecutive Failures
      │               │
      │               ▼
      │        Incident Evaluation
      │               │
      │               ▼
      │        Incident Created
      │               │
      │               ▼
      │        Notification Queue
      │
      ▼
Automatic Recovery
      │
      ▼
Incident Resolved
```

---

# Maintenance Lifecycle

```text
Maintenance Created
        │
        ▼
Scheduled
        │
        ▼
In Progress
        │
        ▼
Service Marked Maintenance
        │
        ▼
Monitoring Failures Ignored
        │
        ▼
Completed
        │
        ▼
Service Returns to Normal Monitoring
```

---

# Incident Lifecycle

```text
Health Check Failure
        │
        ▼
Failure Count
        │
        ▼
Escalation Policy
        │
        ▼
Incident Created
        │
        ├── Investigating
        │
        ├── Identified
        │
        ├── Monitoring
        │
        └── Resolved
                 ▲
                 │
        Automatic Recovery
```

---

# Real-Time Event Lifecycle

```text
Health Check / Incident / Maintenance Event
                    │
                    ▼
               Worker Process
                    │
                    ▼
              Redis Pub/Sub
          sentraops:events
                    │
                    ▼
                API Server
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Socket.IO           Cache Invalidation
   Organization Room       Status Page
```

---

# Design Goals

SentraOps is designed around several engineering goals:

### Separation of concerns

HTTP request handling, business logic, persistence, and background processing are separated.

### Reliability

Monitoring and notifications are handled asynchronously using BullMQ and Redis.

### Tenant isolation

Organization-scoped resources are isolated through organization-aware repository operations.

### Operational traceability

Incidents, timeline events, notifications, and audit logs provide an operational history.

### Extensibility

The architecture separates:

```text
Routes
Controllers
Services
Repositories
Workers
Processors
Queues
Infrastructure
```

so individual subsystems can evolve independently.

---

# Current Scope

The current backend implementation provides:

* Authentication and authorization
* Organization management
* Service management
* Service groups
* Tags
* Continuous HTTP monitoring
* Health-check persistence
* Incident management
* Automatic incident recovery
* Escalation policy evaluation
* Maintenance windows
* Email notifications
* Real-time Socket.IO events
* Analytics
* Audit logs
* Public status pages
* Background cleanup
* Swagger/OpenAPI
* Bull Board
* Docker support
* Automated tests

The frontend/dashboard is intended to consume this backend through the versioned `/api/v1` API.

---

# API Versioning

All application API routes are currently versioned under:

```text
/api/v1
```

This allows future API versions to be introduced without immediately breaking existing clients.

---

# Development Commands

From `backend/`:

```bash
npm install
npm run generate
npm run migrate
npm run seed

npm run dev
npm run worker
npm run dev:all

npm test

npm start
npm run start:worker
```

---

# Production Considerations

Before production deployment:

1. Replace all default JWT secrets.
2. Use secure PostgreSQL credentials.
3. Configure production SMTP credentials.
4. Restrict CORS to trusted frontend origins.
5. Use HTTPS.
6. Configure secure cookie settings for the deployment environment.
7. Use managed or secured PostgreSQL and Redis infrastructure.
8. Run database migrations explicitly as part of deployment.
9. Review retention settings.
10. Do not expose development Bull Board publicly without authentication and network controls.
11. Replace development Docker credentials.
12. Configure production logging and monitoring.
13. Scale API and worker processes independently where required.
14. Configure Redis persistence/availability according to operational requirements.
15. Review rate limits and resource limits for the deployment workload.

---

# Inspiration

SentraOps is conceptually inspired by the operational workflows found in platforms such as:

* Better Stack
* Atlassian Statuspage
* UptimeRobot
* PagerDuty

The implementation and architecture are independently developed for SentraOps.

---

# Repository

[SentraOps on GitHub](https://github.com/Siddhi1189/SentraOps)

---

## License

ISC
