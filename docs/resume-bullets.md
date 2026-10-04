# Engineering Resume Bullets: SentraOps Platform

### Bullet 1
Architected and deployed a full-stack observability platform combining uptime monitoring and error tracking, processing event ingest with an average latency of 205.05ms (p95: 251.89ms) and 100% reliability under concurrent k6 load testing.
- **source:** [docs/load-test-results.md](file:///c:/Users/siddh/OneDrive/Desktop/SentraOps/docs/load-test-results.md) (k6 load test run `docker run --rm -v "${PWD}/tests/load:/scripts" grafana/k6 run /scripts/ingest.js`)

### Bullet 2
Engineered an automated issue grouping engine utilizing SHA-1 fingerprinting over exception types and top-3 stack frames, supporting atomic upserts, live Socket.IO client invalidation, and automated regression detection when resolved issues re-occur.
- **source:** [backend/src/services/issueGroupingService.js](file:///c:/Users/siddh/OneDrive/Desktop/SentraOps/backend/src/services/issueGroupingService.js#L14-L45)

### Bullet 3
Built a lightweight TypeScript Node.js SDK (`@sentraops/node`) and a zero-dependency CLI tool (`@sentraops/cli`), packaging middleware for automatic unhandled exception trapping, breadcrumb logging, and DSN-authenticated HTTP event delivery.
- **source:** [packages/sdk-node/src/index.ts](file:///c:/Users/siddh/OneDrive/Desktop/SentraOps/packages/sdk-node/src/index.ts) and [packages/cli/src/cli.js](file:///c:/Users/siddh/OneDrive/Desktop/SentraOps/packages/cli/src/cli.js)

### Bullet 4
Established end-to-end multi-tenant security and quota enforcement, implementing SHA-256 hashed API keys, organization-scoped resource isolation, and sliding-window rate limiting (100 events/min per key) validated across 140+ unit and integration tests.
- **source:** [backend/src/middlewares/apiKeyAuth.js](file:///c:/Users/siddh/OneDrive/Desktop/SentraOps/backend/src/middlewares/apiKeyAuth.js#L18-L30) and [backend/src/routes/ingest.routes.js](file:///c:/Users/siddh/OneDrive/Desktop/SentraOps/backend/src/routes/ingest.routes.js#L13-L31)

---

## Claims Not Supported

The following claims are omitted because they cannot be verified from executed commands or repository source code:
- *Claim: "Processes 10,000+ requests per second across distributed nodes"* — Ingest is configured with a 100 req/min per-key rate limiter; distributed multi-cluster benchmarks were not run.
- *Claim: "99.99% high-availability production deployment"* — SentraOps runs in local/containerized development environments; no cloud SLA metrics exist.
- *Claim: "Zero-data-loss Kafka pipeline"* — SentraOps utilizes Redis BullMQ queues rather than Kafka.
- *Claim: "Automated Kubernetes auto-scaling"* — No Kubernetes manifests or HPA configurations exist in the repository.
