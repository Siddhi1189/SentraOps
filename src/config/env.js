import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection URL' }),
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid connection URL' }),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(8, { message: 'JWT_ACCESS_SECRET must be at least 8 characters' }),
  JWT_REFRESH_SECRET: z.string().min(8, { message: 'JWT_REFRESH_SECRET must be at least 8 characters' }),
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

export default parsed.data;
