import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SentraOps API Documentation',
      version: '1.0.0',
      description:
        'SentraOps platform backend API for real-time uptime monitoring, incident management, escalation policies, and public status pages.',
      contact: {
        name: 'SentraOps Engineering',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'V1 API Endpoint Base',
      },
      {
        url: '/',
        description: 'Root Base (Legacy support)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token in the format: Bearer <token>',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'UNAUTHORIZED' },
                message: { type: 'string', example: 'Access token is invalid or expired' },
              },
            },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Acme Corp' },
            slug: { type: 'string', example: 'acme-corp' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', example: 'jane@acme.com' },
            role: { type: 'string', enum: ['owner', 'admin', 'viewer'], example: 'admin' },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            organizationId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Payment API' },
            url: { type: 'string', example: 'https://api.acme.com/health' },
            httpMethod: { type: 'string', enum: ['GET', 'POST', 'HEAD', 'PUT'], example: 'GET' },
            expectedStatusCode: { type: 'integer', example: 200 },
            timeoutMs: { type: 'integer', example: 5000 },
            checkIntervalSeconds: { type: 'integer', example: 60 },
            currentStatus: { type: 'string', enum: ['up', 'down', 'degraded', 'maintenance', 'unknown'], example: 'up' },
            consecutiveFailures: { type: 'integer', example: 0 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Incident: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            organizationId: { type: 'string', format: 'uuid' },
            serviceId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Payment Gateway Timeout' },
            status: { type: 'string', enum: ['open', 'investigating', 'identified', 'monitoring', 'resolved'], example: 'investigating' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
            rootCause: { type: 'string', example: 'Upstream provider outage' },
            resolutionNotes: { type: 'string', example: 'Failover triggered' },
            detectedAt: { type: 'string', format: 'date-time' },
            resolvedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            serviceId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['up', 'down', 'timeout'] },
            httpStatusCode: { type: 'integer', example: 200, nullable: true },
            responseTimeMs: { type: 'integer', example: 145, nullable: true },
            errorMessage: { type: 'string', nullable: true },
            checkedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            organizationId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid', nullable: true },
            action: { type: 'string', example: 'service.updated' },
            entityType: { type: 'string', example: 'Service' },
            entityId: { type: 'string', format: 'uuid', nullable: true },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
