import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';

export class DemoService {
  /**
   * Seed realistic demo data for an organization.
   * Refuses if demo data already exists.
   *
   * @param {string} organizationId
   */
  static async seedDemoData(organizationId) {
    // 1. Check if demo data already exists
    const [existingService, existingProject, existingIncident] = await Promise.all([
      prisma.service.findFirst({
        where: { organizationId, isDemo: true },
      }),
      prisma.project.findFirst({
        where: { organizationId, isDemo: true },
      }),
      prisma.incident.findFirst({
        where: { organizationId, isDemo: true },
      }),
    ]);

    if (existingService || existingProject || existingIncident) {
      throw new AppError(
        'Demo data already exists for this organization',
        400,
        'DEMO_DATA_EXISTS'
      );
    }

    const now = new Date();

    // 2. Create 3 Services
    const service1 = await prisma.service.create({
      data: {
        organizationId,
        name: 'API Gateway',
        url: 'https://gateway.demo.internal/health',
        currentStatus: 'up',
        priority: 'critical',
        environment: 'production',
        isDemo: true,
      },
    });

    const service2 = await prisma.service.create({
      data: {
        organizationId,
        name: 'Payments Worker',
        url: 'https://payments.demo.internal/health',
        currentStatus: 'up',
        priority: 'high',
        environment: 'production',
        isDemo: true,
      },
    });

    const service3 = await prisma.service.create({
      data: {
        organizationId,
        name: 'Search Service',
        url: 'https://search.demo.internal/health',
        currentStatus: 'degraded',
        priority: 'medium',
        environment: 'production',
        isDemo: true,
      },
    });

    // 3. 7 Days of Health Checks
    const healthChecksData = [];
    const services = [service1, service2, service3];

    for (let day = 7; day >= 0; day--) {
      for (const srv of services) {
        // 2 checks per day per service
        for (let hour of [8, 20]) {
          const checkedAt = new Date(now.getTime() - day * 24 * 60 * 60 * 1000 + hour * 3600 * 1000);
          const isFailing = srv.id === service3.id && day <= 2 && hour === 20;

          healthChecksData.push({
            serviceId: srv.id,
            status: isFailing ? 'down' : 'up',
            httpStatusCode: isFailing ? 503 : 200,
            responseTimeMs: isFailing ? 4500 : Math.floor(45 + Math.random() * 60),
            errorMessage: isFailing ? 'Service Unavailable (Query Timeout)' : null,
            checkedAt,
            isDemo: true,
          });
        }
      }
    }

    await prisma.healthCheck.createMany({
      data: healthChecksData,
    });

    // 4. Demo Project, Issues, Error Events
    const project = await prisma.project.create({
      data: {
        organizationId,
        name: 'Demo Storefront',
        platform: 'node',
        environmentDefault: 'production',
        isDemo: true,
      },
    });

    const issue1 = await prisma.issue.create({
      data: {
        projectId: project.id,
        organizationId,
        fingerprint: 'demo-fp-conn-pool-timeout',
        title: 'ConnectionPoolTimeoutError: Timeout acquiring connection from pool',
        type: 'ConnectionPoolTimeoutError',
        level: 'error',
        status: 'unresolved',
        eventCount: 14,
        userCount: 8,
        firstSeenAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
        lastSeenAt: new Date(now.getTime() - 2 * 3600 * 1000),
        isDemo: true,
      },
    });

    const issue2 = await prisma.issue.create({
      data: {
        projectId: project.id,
        organizationId,
        fingerprint: 'demo-fp-redis-conn-refused',
        title: 'RedisConnectionRefused: connect ECONNREFUSED 127.0.0.1:6379',
        type: 'RedisConnectionRefused',
        level: 'error',
        status: 'unresolved',
        eventCount: 5,
        userCount: 3,
        firstSeenAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
        lastSeenAt: new Date(now.getTime() - 6 * 3600 * 1000),
        isDemo: true,
      },
    });

    const issue3 = await prisma.issue.create({
      data: {
        projectId: project.id,
        organizationId,
        fingerprint: 'demo-fp-stripe-sig-error',
        title: 'StripeWebhookSignatureVerificationError: Invalid signature timestamp',
        type: 'StripeWebhookSignatureVerificationError',
        level: 'warning',
        status: 'resolved',
        eventCount: 2,
        userCount: 1,
        resolvedAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
        firstSeenAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
        lastSeenAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        isDemo: true,
      },
    });

    await prisma.errorEvent.createMany({
      data: [
        {
          projectId: project.id,
          issueId: issue1.id,
          type: 'ConnectionPoolTimeoutError',
          message: 'Timeout acquiring connection from pool after 5000ms',
          stack: 'Error: ConnectionPoolTimeoutError\n    at Pool.acquire (/app/node_modules/pg/lib/pool.js:45:11)',
          level: 'error',
          environment: 'production',
          occurredAt: new Date(now.getTime() - 2 * 3600 * 1000),
          isDemo: true,
        },
        {
          projectId: project.id,
          issueId: issue2.id,
          type: 'RedisConnectionRefused',
          message: 'connect ECONNREFUSED 127.0.0.1:6379',
          stack: 'Error: RedisConnectionRefused\n    at RedisClient.connect (/app/node_modules/ioredis/lib/redis.js:102:14)',
          level: 'error',
          environment: 'production',
          occurredAt: new Date(now.getTime() - 6 * 3600 * 1000),
          isDemo: true,
        },
      ],
    });

    // 5. 2 Incidents with Timelines
    const incident1 = await prisma.incident.create({
      data: {
        organizationId,
        serviceId: service3.id,
        title: 'Degraded Search Latency',
        status: 'investigating',
        severity: 'high',
        detectedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        isDemo: true,
      },
    });

    const incident2 = await prisma.incident.create({
      data: {
        organizationId,
        serviceId: service2.id,
        title: 'Payments Webhook Outage',
        status: 'resolved',
        severity: 'critical',
        rootCause: 'Stripe webhook signature validation mismatch',
        resolutionNotes: 'Rotated webhook secret and flushed retry queue',
        detectedAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
        resolvedAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
        isDemo: true,
      },
    });

    await prisma.timelineEvent.createMany({
      data: [
        {
          incidentId: incident1.id,
          eventType: 'created',
          description: 'Elevated latency detected across query cluster',
          createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
          isDemo: true,
        },
        {
          incidentId: incident1.id,
          eventType: 'comment',
          description: 'Investigating Elasticsearch cluster shard rebalancing',
          createdAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
          isDemo: true,
        },
        {
          incidentId: incident2.id,
          eventType: 'created',
          description: 'Payment callback timeouts exceeded critical threshold',
          createdAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
          isDemo: true,
        },
        {
          incidentId: incident2.id,
          eventType: 'resolved',
          description: 'Secret updated in worker deployment and webhooks confirmed green',
          createdAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
          isDemo: true,
        },
      ],
    });

    return {
      servicesCount: 3,
      healthChecksCount: healthChecksData.length,
      issuesCount: 3,
      incidentsCount: 2,
    };
  }

  /**
   * Remove exactly the isDemo=true rows for an organization.
   *
   * @param {string} organizationId
   */
  static async removeDemoData(organizationId) {
    // Delete in dependency order
    await prisma.timelineEvent.deleteMany({
      where: {
        isDemo: true,
        incident: { organizationId },
      },
    });

    await prisma.incident.deleteMany({
      where: {
        organizationId,
        isDemo: true,
      },
    });

    await prisma.errorEvent.deleteMany({
      where: {
        isDemo: true,
        project: { organizationId },
      },
    });

    await prisma.issue.deleteMany({
      where: {
        organizationId,
        isDemo: true,
      },
    });

    await prisma.project.deleteMany({
      where: {
        organizationId,
        isDemo: true,
      },
    });

    await prisma.healthCheck.deleteMany({
      where: {
        isDemo: true,
        service: { organizationId },
      },
    });

    const deletedServices = await prisma.service.deleteMany({
      where: {
        organizationId,
        isDemo: true,
      },
    });

    return {
      deleted: true,
      servicesRemoved: deletedServices.count,
    };
  }
}

export default DemoService;
