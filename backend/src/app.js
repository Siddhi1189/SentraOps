import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';
import env from './config/env.js';
import swaggerSpec from './docs/swagger.js';
import correlationIdMiddleware from './middlewares/correlationId.js';
import requestLogger from './middlewares/requestLogger.js';
import { authRateLimiter, apiRateLimiter } from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';
import ApiResponse from './utils/apiResponse.js';
import { getHealth } from './controllers/health.controller.js';
import { setupBullBoard } from './config/bullBoard.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import serviceRoutes from './routes/service.routes.js';
import healthCheckRoutes from './routes/healthCheck.routes.js';
import incidentRoutes from './routes/incident.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import escalationRoutes from './routes/escalation.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import statusPageRoutes from './routes/statusPage.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const app = express();

// Security and Performance Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.CLIENT_ORIGIN.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(correlationIdMiddleware);
app.use(requestLogger);

// API landing endpoint for direct browser visits to the server root.
app.get('/', (req, res) => ApiResponse.success(res, {
  name: 'SentraOps API',
  version: pkg.version || '1.0.0',
  status: 'running',
  environment: env.NODE_ENV,
  apiBasePath: '/api/v1',
  docs: '/api/v1/docs',
  health: '/health',
}));

// Setup Bull Board for queues (Development mode only)
setupBullBoard(app);

// Interactive Swagger / OpenAPI Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Comprehensive Health check endpoint
app.get('/health', getHealth);
app.get('/api/v1/health', getHealth);

// Express Router for API v1
const v1Router = express.Router();

v1Router.use('/auth', authRateLimiter, authRoutes);
v1Router.use('/organizations', apiRateLimiter, organizationRoutes);
v1Router.use('/services', apiRateLimiter, serviceRoutes);
v1Router.use('/health-checks', apiRateLimiter, healthCheckRoutes);
v1Router.use('/incidents', apiRateLimiter, incidentRoutes);
v1Router.use('/maintenance', apiRateLimiter, maintenanceRoutes);
v1Router.use('/escalation-policies', apiRateLimiter, escalationRoutes);
v1Router.use('/analytics', apiRateLimiter, analyticsRoutes);
v1Router.use('/status', statusPageRoutes);
v1Router.use('/audit-logs', apiRateLimiter, auditLogRoutes);

// Mount versioned API router at /api/v1
app.use('/api/v1', v1Router);

// Unversioned fallback routing for backward compatibility
app.use('/auth', authRateLimiter, authRoutes);
app.use('/organizations', apiRateLimiter, organizationRoutes);
app.use('/services', apiRateLimiter, serviceRoutes);
app.use('/health-checks', apiRateLimiter, healthCheckRoutes);
app.use('/incidents', apiRateLimiter, incidentRoutes);
app.use('/maintenance', apiRateLimiter, maintenanceRoutes);
app.use('/escalation-policies', apiRateLimiter, escalationRoutes);
app.use('/analytics', apiRateLimiter, analyticsRoutes);
app.use('/status', statusPageRoutes);
app.use('/audit-logs', apiRateLimiter, auditLogRoutes);

// Return JSON for unmatched API routes instead of Express's default "Cannot GET /path".
app.use((req, res) => ApiResponse.error(
  res,
  'ROUTE_NOT_FOUND',
  `Route ${req.method} ${req.originalUrl} not found`,
  404,
  {
    apiBasePath: '/api/v1',
    docs: '/api/v1/docs',
    health: '/health',
  }
));

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
