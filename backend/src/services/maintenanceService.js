import MaintenanceWindowRepository from '../repositories/maintenanceWindow.repository.js';
import StatusPageService from './statusPageService.js';
import AppError from '../utils/AppError.js';

class MaintenanceService {
  static async list(organizationId, query) {
    return MaintenanceWindowRepository.findMany(organizationId, query);
  }

  static async get(organizationId, id) {
    const window = await MaintenanceWindowRepository.findById(id, organizationId);
    if (!window) throw new AppError('Maintenance window not found', 404, 'NOT_FOUND');
    return window;
  }

  static async create(organizationId, data) {
    if (new Date(data.endTime) <= new Date(data.startTime)) {
      throw new AppError('end_time must be after start_time', 400, 'INVALID_TIME_RANGE');
    }

    const now = new Date();
    // Determine initial status
    let status = 'scheduled';
    if (new Date(data.startTime) <= now && new Date(data.endTime) > now) {
      status = 'in_progress';
    } else if (new Date(data.endTime) <= now) {
      status = 'completed';
    }

    const created = await MaintenanceWindowRepository.create(organizationId, { ...data, status });
    await StatusPageService.invalidateCache(organizationId);
    return created;
  }

  static async update(organizationId, id, data) {
    const existing = await MaintenanceWindowRepository.findById(id, organizationId);
    if (!existing) throw new AppError('Maintenance window not found', 404, 'NOT_FOUND');

    if (existing.status === 'completed') {
      throw new AppError('Cannot modify a completed maintenance window', 400, 'WINDOW_COMPLETED');
    }

    const updated = await MaintenanceWindowRepository.update(id, organizationId, data);
    await StatusPageService.invalidateCache(organizationId);
    return updated;
  }

  static async remove(organizationId, id) {
    const existing = await MaintenanceWindowRepository.findById(id, organizationId);
    if (!existing) throw new AppError('Maintenance window not found', 404, 'NOT_FOUND');
    await MaintenanceWindowRepository.delete(id, organizationId);
    await StatusPageService.invalidateCache(organizationId);
  }
}

export default MaintenanceService;
