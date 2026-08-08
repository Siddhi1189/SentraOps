/**
 * Test Environment Setup
 * All env vars must be set BEFORE any module requiring src/config/env.js is loaded.
 */

// Required environment variables for Zod schema in src/config/env.js
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/sentraops_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_12345';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_12345';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USER = 'testuser';
process.env.SMTP_PASS = 'testpassword';
process.env.SMTP_FROM = 'noreply@sentraops.com';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.PORT = '5001';
