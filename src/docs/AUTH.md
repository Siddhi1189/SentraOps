# Authentication API

## 1. Register Organization & Owner
- **Endpoint**: `POST /auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "organizationName": "Acme Corp",
  "name": "Alice Smith",
  "email": "owner@acme.com",
  "password": "Password123!"
}
```
- **Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Alice Smith",
      "email": "owner@acme.com",
      "role": "owner"
    },
    "organization": {
      "id": "uuid",
      "name": "Acme Corp",
      "slug": "acme-corp"
    },
    "accessToken": "JWT_STRING"
  }
}
```

## 2. Login
- **Endpoint**: `POST /auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "owner@acme.com",
  "password": "Password123!"
}
```

## 3. Refresh Access Token
- **Endpoint**: `POST /auth/refresh`
- **Auth**: Cookie (`refreshToken`)

## 4. Logout
- **Endpoint**: `POST /auth/logout`
- **Auth**: Cookie (`refreshToken`)

## 5. Current Authenticated User
- **Endpoint**: `GET /auth/me`
- **Auth**: Bearer Token
