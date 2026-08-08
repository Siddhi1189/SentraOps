# Services & Groups API

## Service Groups
- `POST /services/groups` - Create a service group category (Owner/Admin)
- `GET /services/groups` - List service groups
- `GET /services/groups/:id` - Get group details
- `PATCH /services/groups/:id` - Update group (Owner/Admin)
- `DELETE /services/groups/:id` - Delete group (Owner/Admin)

## Monitored Services
- `POST /services` - Create a new monitored service (Owner/Admin)
  - **Body**:
  ```json
  {
    "name": "Payment Gateway API",
    "url": "https://api.acme.com/health",
    "httpMethod": "GET",
    "expectedStatusCode": 200,
    "timeoutMs": 5000,
    "checkIntervalSeconds": 60,
    "priority": "critical",
    "environment": "production",
    "tags": ["payments", "api"]
  }
  ```
- `GET /services` - List services (`?page=1&limit=10&groupId=uuid&search=keyword`)
- `GET /services/:id` - Get service details
- `PATCH /services/:id` - Update service settings (Owner/Admin)
- `DELETE /services/:id` - Delete service (Owner/Admin)
