# SentraOps Demo Shop Target Application

An instrumented e-commerce service designed to demonstrate and validate SentraOps monitoring, Sentry-like error grouping, regression tracking, and alert rule dispatching.

---

## 🚀 Features & Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Interactive browser dashboard with fault injection triggers and activity log. |
| `/health` | `GET` | Returns HTTP `200` (`status: "up"`) normally, or HTTP `500` when an outage is simulated. |
| `/api/products` | `GET` | Returns HTTP `200` with product list for standard health checks. |
| `/api/slow` | `GET` | Waits a configurable delay (default `2500ms`) to trigger `response_time_threshold` alert rules. |
| `/api/error` | `GET` | Throws `PaymentGatewayException`, caught and captured automatically by `@sentraops/node` express middleware. |
| `/api/crash-db` | `GET` | Simulates a database pool exhaustion error and directly calls `SentraOps.captureException()`. |
| `/api/toggle-down`| `POST` | Toggles the `/health` endpoint between `200` and `500` to trigger uptime incidents and automatic recovery. |
| `/api/status` | `GET` | Returns current outage status and SDK configuration. |

---

## 🛠️ Installation & Setup

### 1. Install Dependencies
The demo shop links directly to the local `@sentraops/node` SDK:

```bash
cd demo-shop
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the variables in `.env`:

```env
PORT=4050
SENTRAOPS_DSN=https://<your_api_key>@localhost:4000/<your_project_id>
SLOW_DELAY_MS=2500
NODE_ENV=production
RELEASE=demo-shop@1.0.0
```

> **Note:** Obtain `<your_api_key>` and `<your_project_id>` from the SentraOps UI under **Settings → Projects → Setup Project**.

### 3. Run the Demo Shop

```bash
npm start
```

Or run in development watch mode:

```bash
npm run dev
```

Visit the dashboard in your browser at `http://localhost:4050`.

---

## 🧪 Phase 2 Verification Workflows

### 1. Verify Error Ingest & Grouping
1. Click **Throw error** in the demo shop UI (or `curl http://localhost:4050/api/error`).
2. Navigate to **Monitor → Issues** (`/app/issues`) in SentraOps.
3. Observe `PaymentGatewayException` appears in the table with `Events: 1`.
4. Click **Throw error** again; observe the issue event count increases to `2` without creating a duplicate row.

### 2. Verify Regression Detection
1. Open the issue detail page in SentraOps (`/app/issues/:id`).
2. Click **Resolve** in the top action bar (status becomes `resolved`).
3. Click **Throw error** once more in the demo shop.
4. Refresh/observe the issue state: status reverts to `unresolved`, the **Regression** badge appears, and real-time Socket.IO notification is broadcast.

### 3. Verify Uptime Monitor & Auto-Recovery
1. Click **Toggle outage** in the demo shop. `/health` now returns `500`.
2. The uptime monitor in SentraOps records consecutive failures and creates an Incident.
3. Click **Toggle outage** again to recover `/health` to `200`.
4. The uptime monitor detects recovery and auto-resolves the incident.

### 4. Verify Alert Rules
1. In SentraOps under **Settings → Alerts**, configure a Slack/Webhook/Email channel.
2. Create an alert rule for:
   - `service_down_consecutive_failures`
   - `new_issue_in_environment`
   - `response_time_threshold` (trigger with **Slow endpoint**)
   - `event_rate_threshold`
3. Trigger the conditions from the Demo Shop dashboard and confirm alerts are dispatched to your channels.
