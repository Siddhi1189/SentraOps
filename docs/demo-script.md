# SentraOps 2-Minute Demo Walkthrough Script

**Objective:** Demonstrate full-lifecycle error tracking, real-time alerting, regression detection, and uptime monitoring using the `demo-shop` application.

---

### [0:00 - 0:15] 1. SDK Installation & Initialization
- **Action:** Open `demo-shop/server.js` and show the SentraOps Node SDK integration:
  ```javascript
  import * as SentraOps from '@sentraops/node';
  SentraOps.init({ dsn: process.env.SENTRAOPS_DSN });
  app.use(SentraOps.requestHandler());
  app.use(SentraOps.errorHandler());
  ```
- **Spoken:** *"In just three lines, SentraOps wraps our Express application with request context, breadcrumb tracking, and unhandled exception capture."*

---

### [0:15 - 0:35] 2. Trigger Error & Live Event Ingestion
- **Action:** Navigate to the Demo Shop UI (`http://localhost:4050`) and click **"Throw error"** (calling `GET /api/error`).
- **SentraOps UI:** Switch immediately to the SentraOps **Issues** dashboard (`/app/issues`).
- **Outcome:** The new issue `PaymentGatewayException: Card charge rejected` appears instantly at the top of the table via Socket.IO live updates with event count `1` and level `error`.

---

### [0:35 - 0:50] 3. Issue Inspection & Alert Notification
- **Action:** Click into the issue to open the **Issue Detail** view (`/app/issues/:id`).
- **Inspect:** Monospace stack trace with highlighted in-app frames, request payload headers, and breadcrumbs.
- **Alert:** Show the alert event under Settings > Alerts: an `AlertRule` (`new_issue_in_environment`) triggered and dispatched a notification payload through the configured channel.

---

### [0:50 - 1:10] 4. Issue Resolution & Regression Detection
- **Action:** In the issue detail header, click the **"Resolve"** button (status transitions to `resolved`).
- **Trigger Regression:** Return to Demo Shop and click **"Throw error"** again.
- **Outcome:** In SentraOps, the issue status immediately reverts to `unresolved`, and an orange **"Regression"** badge appears, showing automatic regression detection on new incoming events for resolved issues.

---

### [1:10 - 1:40] 5. Outage Simulation, Incident Creation & Auto-Recovery
- **Action:** In Demo Shop, click **"Toggle outage"** (switches `GET /health` to return HTTP 500).
- **SentraOps UI:** Navigate to **Monitor > Services** and **Respond > Incidents**.
- **Incident Open:** When the consecutive failure threshold is reached (e.g. 2 checks), an incident is automatically opened, status transitions to `down`, and timeline records the failure.
- **Incident Summary:** Click **"Generate summary"** on the incident detail page to demonstrate Anthropic AI incident analysis.
- **Auto-Recovery:** Click **"Toggle outage"** again in Demo Shop (returns to HTTP 200). The next health check passes and the incident is automatically marked `resolved`.

---

### [1:40 - 2:00] 6. Organization Quotas & Limits Page
- **Action:** Navigate to **Settings > Limits** (`/app/settings/limits`).
- **Outcome:** Review the active limits and quotas dashboard: project usage (e.g. 1/5 projects), rate limits (100 events/min), retention periods, supported monitor types (HTTP, Heartbeat), and verifiable "Not supported yet" features.
