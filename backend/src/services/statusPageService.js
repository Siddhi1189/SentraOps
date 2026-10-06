import StatusPageRepository from '../repositories/statusPage.repository.js';
import OrganizationRepository from '../repositories/organization.repository.js';
import AppError from '../utils/AppError.js';
import { redis } from '../config/redis.js';
import logger from '../utils/logger.js';

// We reuse the central `redis` client exported from src/config/redis.js.
// Using this shared ioredis instance reuses the connection pool, avoiding connection overhead while ensuring
// status page cache state is shared across multiple concurrent API server instances.
const CACHE_TTL_SECONDS = 30; // 30 seconds TTL

async function getCached(key) {
  try {
    const cachedData = await redis.get(key);
    if (!cachedData) return null;
    return JSON.parse(cachedData);
  } catch (err) {
    logger.error(`Redis cache read error for key ${key}: ${err.message}`);
    return null;
  }
}

async function setCache(key, value) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.error(`Redis cache write error for key ${key}: ${err.message}`);
  }
}

class StatusPageService {
  /**
   * Actively invalidate all status page cache keys for an organization
   * @param {string} organizationId
   */
  static async invalidateCache(organizationId) {
    if (!organizationId) return;
    try {
      await redis.del(
        `status:${organizationId}`,
        `status:${organizationId}:incidents`,
        `status:${organizationId}:maintenance`,
        `status:${organizationId}:uptime`
      );
      logger.debug(`Invalidated status page cache for organization: ${organizationId}`);
    } catch (err) {
      logger.error(`Failed to invalidate status page cache for org ${organizationId}: ${err.message}`);
    }
  }

  static async getStatusPage(slug) {
    const settings = await StatusPageRepository.findBySlug(slug);
    if (!settings) throw new AppError('Status page not found', 404, 'NOT_FOUND');

    const { organizationId } = settings;
    const cacheKey = `status:${organizationId}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const [services, openIncidents, maintenance] = await Promise.all([
      StatusPageRepository.findServicesForStatusPage(organizationId),
      StatusPageRepository.findOpenIncidentsForStatusPage(organizationId),
      StatusPageRepository.findMaintenanceForStatusPage(organizationId),
    ]);

    const result = { settings, services, openIncidents, maintenance };
    await setCache(cacheKey, result);
    return result;
  }

  static async getStatusPageIncidents(slug) {
    const settings = await StatusPageRepository.findBySlug(slug);
    if (!settings) throw new AppError('Status page not found', 404, 'NOT_FOUND');

    const { organizationId } = settings;
    const cacheKey = `status:${organizationId}:incidents`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const incidents = await StatusPageRepository.findRecentIncidentsForStatusPage(organizationId);
    await setCache(cacheKey, incidents);
    return incidents;
  }

  static async getStatusPageMaintenance(slug) {
    const settings = await StatusPageRepository.findBySlug(slug);
    if (!settings) throw new AppError('Status page not found', 404, 'NOT_FOUND');

    const { organizationId } = settings;
    const cacheKey = `status:${organizationId}:maintenance`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const maintenance = await StatusPageRepository.findMaintenanceForStatusPage(organizationId);
    await setCache(cacheKey, maintenance);
    return maintenance;
  }

  /**
   * Get status page settings for an organization (returns defaults if not yet created)
   * @param {string} organizationId
   */
  static async getSettings(organizationId) {
    const settings = await StatusPageRepository.findByOrganization(organizationId);
    if (settings) {
      return settings;
    }

    const org = await OrganizationRepository.findById(organizationId);
    return {
      id: null,
      organizationId,
      subdomain: org ? org.slug : '',
      customDomain: null,
      logoUrl: null,
      theme: 'light',
    };
  }

  /**
   * Upsert status page settings for an organization
   * @param {string} organizationId
   * @param {Object} updates
   */
  static async updateSettings(organizationId, updates) {
    const org = await OrganizationRepository.findById(organizationId);
    if (!org) throw new AppError('Organization not found', 404, 'NOT_FOUND');

    const createData = {
      subdomain: updates.subdomain || org.slug,
      customDomain: updates.customDomain !== undefined ? updates.customDomain : null,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : null,
      theme: updates.theme || 'light',
    };

    const updateData = {};
    if (updates.subdomain !== undefined) updateData.subdomain = updates.subdomain;
    if (updates.customDomain !== undefined) updateData.customDomain = updates.customDomain;
    if (updates.logoUrl !== undefined) updateData.logoUrl = updates.logoUrl;
    if (updates.theme !== undefined) updateData.theme = updates.theme;

    const settings = await StatusPageRepository.upsert(organizationId, updateData, createData);
    await this.invalidateCache(organizationId);
    return settings;
  }

  static async getStatusPageUptime(slug) {
    const settings = await StatusPageRepository.findBySlug(slug);
    if (!settings) throw new AppError('Status page not found', 404, 'NOT_FOUND');

    const { organizationId } = settings;
    const cacheKey = `status:${organizationId}:uptime`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const data = await StatusPageRepository.get90DayUptimeForStatusPage(organizationId);
    await setCache(cacheKey, data);
    return data;
  }
}

export default StatusPageService;
