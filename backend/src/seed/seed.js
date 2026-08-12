import prisma from '../config/db.js';
import { hashPassword } from '../utils/hashPassword.js';
import logger from '../utils/logger.js';

async function seed() {
  logger.info('Starting SentraOps database seed...');

  // Clean existing demo data if any
  await prisma.organization.deleteMany({
    where: { slug: 'acme-corp' },
  });

  const passwordHash = await hashPassword('Password123!');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });
  logger.info(`Created Organization: ${org.name} (${org.id})`);

  // 2. Create Users
  const owner = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Alice Owner',
      email: 'owner@acme.com',
      passwordHash,
      role: 'owner',
    },
  });

  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Bob Admin',
      email: 'admin@acme.com',
      passwordHash,
      role: 'admin',
    },
  });
  logger.info(`Created Users: ${owner.email} (owner), ${admin.email} (admin)`);

  // 3. Create Service Groups
  const coreGroup = await prisma.serviceGroup.create({
    data: {
      organizationId: org.id,
      name: 'Core Platform',
    },
  });

  // 4. Create Escalation Policy Defaults
  await prisma.escalationPolicy.create({
    data: {
      organizationId: org.id,
      serviceId: null, // Default
      warningThreshold: 3,
      incidentThreshold: 5,
      criticalThreshold: 10,
    },
  });

  // 5. Create Status Page Settings
  await prisma.statusPageSettings.create({
    data: {
      organizationId: org.id,
      subdomain: 'acme-corp',
      theme: 'dark',
    },
  });

  // 6. Create Demo Services
  const servicesData = [
    {
      name: 'Authentication Service',
      url: 'https://httpbin.org/status/200',
      groupId: coreGroup.id,
      checkIntervalSeconds: 30,
      priority: 'high',
      environment: 'production',
    },
    {
      name: 'Payment Gateway API',
      url: 'https://httpbin.org/status/200',
      groupId: coreGroup.id,
      checkIntervalSeconds: 60,
      priority: 'critical',
      environment: 'production',
    },
    {
      name: 'Search Indexer',
      url: 'https://httpbin.org/delay/1',
      checkIntervalSeconds: 60,
      priority: 'medium',
      environment: 'production',
    },
    {
      name: 'Failing Test Service',
      url: 'https://httpbin.org/status/500',
      checkIntervalSeconds: 30,
      priority: 'low',
      environment: 'staging',
    },
  ];

  for (const sData of servicesData) {
    const service = await prisma.service.create({
      data: {
        ...sData,
        organizationId: org.id,
        currentStatus: 'up',
      },
    });
    logger.info(`Created Service: ${service.name} (${service.url})`);
  }

  logger.info('✅ SentraOps database seed completed successfully.');
}

seed()
  .catch((e) => {
    logger.error(`Seed error: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
