# Incidents API

## Endpoints
- `GET /incidents` - List organization incidents (`?status=open&severity=high&page=1&limit=10`)
- `GET /incidents/:id` - Get incident details
- `PATCH /incidents/:id` - Update status, severity, assignment, root cause, resolution notes
  - **Body**:
  ```json
  {
    "status": "investigating",
    "assignedUserId": "user-uuid",
    "rootCause": "Database connection pool exhaustion",
    "resolutionNotes": "Increased connection pool size to 50"
  }
  ```
- `GET /incidents/:id/timeline` - Get chronological append-only timeline events for the incident
