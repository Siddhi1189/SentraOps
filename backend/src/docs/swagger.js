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
            url: { type: 'string', nullable: true, example: 'https://api.acme.com/health' },
            monitorType: { type: 'string', enum: ['http', 'heartbeat'], example: 'http' },
            httpMethod: { type: 'string', enum: ['GET', 'POST', 'HEAD', 'PUT'], example: 'GET' },
            expectedStatusCode: { type: 'integer', example: 200 },
            timeoutMs: { type: 'integer', example: 5000 },
            checkIntervalSeconds: { type: 'integer', example: 60 },
            requestHeaders: { type: 'object', nullable: true },
            requestBody: { type: 'string', nullable: true },
            assertions: { type: 'array', items: { type: 'object' } },
            heartbeatToken: { type: 'string', nullable: true },
            heartbeatIntervalSeconds: { type: 'integer', nullable: true },
            heartbeatGraceSeconds: { type: 'integer', nullable: true },
            lastHeartbeatAt: { type: 'string', format: 'date-time', nullable: true },
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
            sslDaysRemaining: { type: 'integer', example: 45, nullable: true },
            failedAssertion: { type: 'object', nullable: true },
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
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['email', 'slack', 'discord', 'webhook'] },
            recipient: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'sent', 'failed'] },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            title: { type: 'string' },
            isRead: { type: 'boolean' },
            incident: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                severity: { type: 'string' },
              },
            },
            maintenance: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
              },
            },
          },
        },
        StatusPageSettings: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            organizationId: { type: 'string', format: 'uuid' },
            subdomain: { type: 'string', example: 'acme-status' },
            customDomain: { type: 'string', nullable: true, example: 'status.acme.com' },
            logoUrl: { type: 'string', nullable: true },
            theme: { type: 'string', example: 'light' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            organizationId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'web-store' },
            platform: { type: 'string', enum: ['node', 'browser', 'other'] },
            environmentDefault: { type: 'string', enum: ['production', 'staging'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Production Key' },
            keyPrefix: { type: 'string', example: 'sops_abc' },
            lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
            revokedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Issue: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            organizationId: { type: 'string', format: 'uuid' },
            fingerprint: { type: 'string' },
            title: { type: 'string' },
            type: { type: 'string' },
            level: { type: 'string', enum: ['error', 'warning', 'info'] },
            status: { type: 'string', enum: ['unresolved', 'resolved', 'ignored'] },
            environment: { type: 'string' },
            eventCount: { type: 'integer' },
            userCount: { type: 'integer' },
            isRegression: { type: 'boolean' },
            firstSeenAt: { type: 'string', format: 'date-time' },
            lastSeenAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            issueId: { type: 'string', format: 'uuid', nullable: true },
            type: { type: 'string' },
            message: { type: 'string' },
            stack: { type: 'string', nullable: true },
            environment: { type: 'string' },
            level: { type: 'string', enum: ['error', 'warning', 'info'] },
            occurredAt: { type: 'string', format: 'date-time' },
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
