import crypto from 'crypto';
import prisma from '../config/db.js';
import ServiceRepository from '../repositories/service.repository.js';
import ServiceGroupRepository from '../repositories/serviceGroup.repository.js';
import AppError from '../utils/AppError.js';
import { registerServiceJob, removeServiceJob, healthCheckQueue } from '../config/queue.js';
import { maskServiceSecrets, maskServicesSecrets, mergeRequestHeaders } from '../utils/maskSecret.js';
import logger from '../utils/logger.js';

class MonitoringService {
  // ─── Service Groups ──────────────────────────────────────────────────────

  static async createGroup(organizationId, data) {
    if (data.parentGroupId) {
      const parent = await ServiceGroupRepository.findById(data.parentGroupId, organizationId);
      if (!parent) {
        throw new AppError('Parent group not found in your organization', 404, 'NOT_FOUND');
      }
    }
    return ServiceGroupRepository.create(organizationId, data);
  }

  static async getGroup(organizationId, groupId) {
    const group = await ServiceGroupRepository.findById(groupId, organizationId);
    if (!group) throw new AppError('Service group not found', 404, 'NOT_FOUND');
    return group;
  }

  static async listGroups(organizationId) {
    return ServiceGroupRepository.findMany(organizationId);
  }

  static async updateGroup(organizationId, groupId, data) {
    const group = await ServiceGroupRepository.findById(groupId, organizationId);
    if (!group) throw new AppError('Service group not found', 404, 'NOT_FOUND');
    await ServiceGroupRepository.update(groupId, organizationId, data);
    return ServiceGroupRepository.findById(groupId, organizationId);
  }

  static async deleteGroup(organizationId, groupId) {
    const group = await ServiceGroupRepository.findById(groupId, organizationId);
    if (!group) throw new AppError('Service group not found', 404, 'NOT_FOUND');
    await ServiceGroupRepository.delete(groupId, organizationId);
  }

  // ─── Services ────────────────────────────────────────────────────────────

  static async createService(organizationId, data, tagNames) {
    const { tags: _ignored, ...serviceData } = data; // Separate tags from service data

    if (serviceData.monitorType === 'heartbeat') {
      if (!serviceData.heartbeatToken) {
        serviceData.heartbeatToken = crypto.randomBytes(20).toString('hex');
      }
      serviceData.heartbeatIntervalSeconds = serviceData.heartbeatIntervalSeconds || 60;
      serviceData.heartbeatGraceSeconds = serviceData.heartbeatGraceSeconds ?? 30;
      if (!serviceData.url) {
        serviceData.url = null;
      }
    }

    // Enforce max 20 monitors per organization (Q4 quota)
    const monitorCount = await ServiceRepository.countByOrg(organizationId);
    if (monitorCount >= 20) {
      throw new AppError('Monitor quota limit of 20 monitors reached for this organization', 400, 'MONITOR_QUOTA_EXCEEDED');
    }

    const service = await ServiceRepository.create(organizationId, serviceData, tagNames || []);


    // Register the repeating health-check job for this service
    if (service.isActive) {
      await registerServiceJob(service).catch((err) => {
        logger.error(`Failed to register monitoring job for service ${service.id}: ${err.message}`);
      });
    }

    return maskServiceSecrets(service);
  }

  static async getService(organizationId, serviceId) {
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');
    return maskServiceSecrets(service);
  }

  static async listServices(organizationId, query) {
    const result = await ServiceRepository.findMany(organizationId, query);
    return {
      services: maskServicesSecrets(result.services),
      total: result.total,
    };
  }

  static async updateService(organizationId, serviceId, data, tagNames, currentUpdatedAt) {
    const existing = await ServiceRepository.findById(serviceId, organizationId);
    if (!existing) throw new AppError('Service not found', 404, 'NOT_FOUND');

    const { tags: _ignored, ...serviceData } = data;
    if (serviceData.requestHeaders && existing.requestHeaders) {
      serviceData.requestHeaders = mergeRequestHeaders(existing.requestHeaders, serviceData.requestHeaders);
    }

    const updated = await ServiceRepository.update(
      serviceId,
      organizationId,
      serviceData,
      tagNames !== undefined ? tagNames : null,
      currentUpdatedAt || null
    );

    // Handle BullMQ job registration/removal based on isActive change
    const wasActive = existing.isActive;
    const nowActive = updated.isActive;

    if (!wasActive && nowActive) {
      await registerServiceJob(updated).catch((err) => {
        logger.error(`Failed to register monitoring job for service ${updated.id}: ${err.message}`);
      });
    } else if (wasActive && !nowActive) {
      await removeServiceJob(updated.id).catch((err) => {
        logger.error(`Failed to remove monitoring job for service ${updated.id}: ${err.message}`);
      });
    } else if (wasActive && nowActive) {
      // Re-register to update the interval if checkIntervalSeconds changed
      await removeServiceJob(updated.id).catch(() => {});
      await registerServiceJob(updated).catch((err) => {
        logger.error(`Failed to re-register monitoring job for service ${updated.id}: ${err.message}`);
      });
    }

    return maskServiceSecrets(updated);
  }

  static async deleteService(organizationId, serviceId) {
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');

    // Remove repeating job before deleting
    await removeServiceJob(serviceId).catch(() => {});

    await ServiceRepository.delete(serviceId, organizationId);
  }

  // ─── 3.2 Management Actions ──────────────────────────────────────────────

  static async pauseService(organizationId, serviceId) {
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');

    await removeServiceJob(serviceId).catch(() => {});
    const updated = await ServiceRepository.update(serviceId, organizationId, { isActive: false });
    return maskServiceSecrets(updated);
  }

  static async resumeService(organizationId, serviceId) {
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');

    const updated = await ServiceRepository.update(serviceId, organizationId, { isActive: true });
    await registerServiceJob(updated).catch((err) => {
      logger.error(`Failed to register monitoring job for service ${updated.id}: ${err.message}`);
    });
    return maskServiceSecrets(updated);
  }

  static async checkNow(organizationId, serviceId) {
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');

    const job = await healthCheckQueue.add(
      'check',
      { serviceId: service.id },
      { jobId: `check-now:${service.id}:${Date.now()}` }
    );

    return {
      enqueued: true,
      jobId: job.id,
      message: 'Health check enqueued successfully',
    };
  }

  // ─── 3.2 Bulk Actions ────────────────────────────────────────────────────

  static async bulkPause(organizationId, serviceIds) {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, organizationId },
      select: { id: true },
    });
    const ids = services.map((s) => s.id);
    if (ids.length === 0) return { count: 0 };

    for (const id of ids) {
      await removeServiceJob(id).catch(() => {});
    }

    const result = await prisma.service.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { isActive: false },
    });
    return { count: result.count };
  }

  static async bulkResume(organizationId, serviceIds) {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, organizationId },
    });
    const ids = services.map((s) => s.id);
    if (ids.length === 0) return { count: 0 };

    const result = await prisma.service.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { isActive: true },
    });

    const activeServices = await prisma.service.findMany({
      where: { id: { in: ids }, organizationId },
    });

    for (const service of activeServices) {
      await registerServiceJob(service).catch(() => {});
    }

    return { count: result.count };
  }

  static async bulkChangeInterval(organizationId, serviceIds, checkIntervalSeconds) {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, organizationId },
    });
    const ids = services.map((s) => s.id);
    if (ids.length === 0) return { count: 0 };

    const result = await prisma.service.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { checkIntervalSeconds },
    });

    const activeServices = await prisma.service.findMany({
      where: { id: { in: ids }, organizationId, isActive: true },
    });

    for (const service of activeServices) {
      await removeServiceJob(service.id).catch(() => {});
      await registerServiceJob(service).catch(() => {});
    }

    return { count: result.count };
  }

  static async bulkChangeGroup(organizationId, serviceIds, groupId) {
    if (groupId) {
      const group = await ServiceGroupRepository.findById(groupId, organizationId);
      if (!group) throw new AppError('Service group not found', 404, 'NOT_FOUND');
    }

    const result = await prisma.service.updateMany({
      where: { id: { in: serviceIds }, organizationId },
      data: { groupId: groupId || null },
    });

    return { count: result.count };
  }

  static async bulkDelete(organizationId, serviceIds) {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, organizationId },
      select: { id: true },
    });
    const ids = services.map((s) => s.id);
    if (ids.length === 0) return { count: 0 };

    for (const id of ids) {
      await removeServiceJob(id).catch(() => {});
    }

    const result = await prisma.service.deleteMany({
      where: { id: { in: ids }, organizationId },
    });

    return { count: result.count };
  }
}

export default MonitoringService;
