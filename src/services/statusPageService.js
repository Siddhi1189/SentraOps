import StatusPageRepository from '../repositories/statusPage.repository.js';
import AppError from '../utils/AppError.js';

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

class StatusPageService {
  static async getStatusPage(slug) {
    const cacheKey = `status:${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const settings = await StatusPageRepository.findBySlug(slug);
    if (!settings) throw new AppError('Status page not found', 404, 'NOT_FOUND');

    const { organizationId } = settings;
    const [services, openIncidents, maintenance] = await Promise.all([
      StatusPageRepository.findServicesForStatusPage(organizationId),
      StatusPageRepository.findOpenIncidentsForStatusPage(organizationId),
      StatusPageRepository.findMaintenanceForStatusPage(organizationId),
    ]);

    const result = { settings, services, openIncidents, maintenance };
    setCache(cacheKey, result);
    return result;
  }

  static async getStatusPageIncidents(slug) {
    const cacheKey = `status:${slug}:incidents`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const settings = await StatusPageRepository.findBySlug(slug);
    if (!settings) throw new AppError('Status page not found', 404, 'NOT_FOUND');

    const incidents = await StatusPageRepository.findRecentIncidentsForStatusPage(settings.organizationId);
    setCache(cacheKey, incidents);
    return incidents;
  }

  static async getStatusPageMaintenance(slug) {
    const cacheKey = `status:${slug}:maintenance`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const settings = await StatusPageRepository.findBySlug(slug);
    if (!settings) throw new AppError('Status page not found', 404, 'NOT_FOUND');

    const maintenance = await StatusPageRepository.findMaintenanceForStatusPage(settings.organizationId);
    setCache(cacheKey, maintenance);
    return maintenance;
  }
}

export default StatusPageService;
