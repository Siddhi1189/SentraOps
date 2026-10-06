# SentraOps Security Advisory: Server-Side Request Forgery (SSRF)

## 1. Vulnerability Surface
SentraOps accepts user-configured destination URLs in multiple features:
- **Uptime Health Checks:** User-specified endpoint URLs (`Service.url`) periodically polled by workers.
- **Webhook Alert Channels:** Custom destination URLs (`AlertChannel.config.url`) receiving alert payloads.
- **Slack Alert Channels:** Incoming webhook URLs (`AlertChannel.config.url`) receiving alert messages.

Without network validation, malicious tenants can target internal networks, cloud metadata, or services.

## 2. Risk Scenarios
- **Cloud Metadata Access:** Querying `169.254.169.254` (AWS/GCP/Azure) to exfiltrate IAM role credentials.
- **Internal Infrastructure Probing:** Scanning localhost (`127.0.0.1`, `::1`) or private services (Postgres, Redis).
- **Private Subnet Probing:** Targeting RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).

## 3. Proposed Mitigation (Do Not Implement in Phase 6)
- **Pre-Flight DNS Resolution & IP Blocklisting:**
  - Resolve hostnames prior to connection and reject loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), and private RFC 1918 addresses.
  - Pin the validated IP address to prevent DNS rebinding attacks (TOCTOU).
  - Restrict allowed schemes exclusively to `http://` and `https://` (disallowing `file://`, `gopher://`, etc.).
