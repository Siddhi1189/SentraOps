import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection URL' }),
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid connection URL' }),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map((origin) => origin.trim()).filter(Boolean)),
  JWT_ACCESS_SECRET: z.string().min(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' }),
  JWT_REFRESH_SECRET: z.string().min(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' }),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string().email().default('noreply@sentraops.com'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const PLACEHOLDER_SECRETS = [
  'default_access_token_secret_key_12345',
  'default_refresh_token_secret_key_67890',
  'your-super-secret-access-key-here',
  'your-super-secret-refresh-key-here',
  'your-super-secret-access-key-minimum-32-chars-long',
  'your-super-secret-refresh-key-minimum-32-chars-long',
  'change_me_to_a_secure_random_string_32_chars',
];

if (parsed.data.NODE_ENV === 'production') {
  const isAccessPlaceholder = PLACEHOLDER_SECRETS.includes(parsed.data.JWT_ACCESS_SECRET) ||
    parsed.data.JWT_ACCESS_SECRET.startsWith('default_') ||
    parsed.data.JWT_ACCESS_SECRET.startsWith('your-super-secret') ||
    parsed.data.JWT_ACCESS_SECRET.startsWith('change_me');
  const isRefreshPlaceholder = PLACEHOLDER_SECRETS.includes(parsed.data.JWT_REFRESH_SECRET) ||
    parsed.data.JWT_REFRESH_SECRET.startsWith('default_') ||
    parsed.data.JWT_REFRESH_SECRET.startsWith('your-super-secret') ||
    parsed.data.JWT_REFRESH_SECRET.startsWith('change_me');

  if (isAccessPlaceholder || isRefreshPlaceholder) {
    console.error('❌ CRITICAL SECURITY ERROR: Production deployment detected with default/placeholder JWT secrets!');
    console.error('Please set strong, custom JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values (minimum 32 characters) in your environment variables.');
    process.exit(1);
  }
}

export default parsed.data;
