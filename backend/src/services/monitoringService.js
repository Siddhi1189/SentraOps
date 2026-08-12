import ServiceRepository from '../repositories/service.repository.js';
import ServiceGroupRepository from '../repositories/serviceGroup.repository.js';
import AppError from '../utils/AppError.js';
import { registerServiceJob, removeServiceJob } from '../config/queue.js';
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
    const service = await ServiceRepository.create(organizationId, serviceData, tagNames || []);

    // Register the repeating health-check job for this service
    if (service.isActive) {
      await registerServiceJob(service).catch((err) => {
        logger.error(`Failed to register monitoring job for service ${service.id}: ${err.message}`);
      });
    }

    return service;
  }

  static async getService(organizationId, serviceId) {
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');
    return service;
  }

  static async listServices(organizationId, query) {
    return ServiceRepository.findMany(organizationId, query);
  }

  static async updateService(organizationId, serviceId, data, tagNames, currentUpdatedAt) {
    const existing = await ServiceRepository.findById(serviceId, organizationId);
    if (!existing) throw new AppError('Service not found', 404, 'NOT_FOUND');

    const { tags: _ignored, ...serviceData } = data;
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

    return updated;
  }

  static async deleteService(organizationId, serviceId) {
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) throw new AppError('Service not found', 404, 'NOT_FOUND');

    // Remove repeating job before deleting
    await removeServiceJob(serviceId).catch(() => {});

    await ServiceRepository.delete(serviceId, organizationId);
  }
}

export default MonitoringService;
