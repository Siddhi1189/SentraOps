import HealthCheckRepository from '../repositories/healthCheck.repository.js';
import IncidentRepository from '../repositories/incident.repository.js';
import AppError from '../utils/AppError.js';

class AnalyticsService {
  /**
   * Get service uptime and latency analytics over rolling windows
   * @param {string} serviceId
   * @param {string} organizationId
   */
  static async getServiceAnalytics(serviceId, organizationId) {
    const [stats7, stats30, stats90] = await Promise.all([
      HealthCheckRepository.getUptimeStats(serviceId, organizationId, 7),
      HealthCheckRepository.getUptimeStats(serviceId, organizationId, 30),
      HealthCheckRepository.getUptimeStats(serviceId, organizationId, 90),
    ]);

    return {
      serviceId,
      rolling7Days: stats7,
      rolling30Days: stats30,
      rolling90Days: stats90,
    };
  }

  /**
   * Get incident analytics: MTTD, MTTR, frequency, severity distribution
   * @param {string} organizationId
   * @param {Object} query
   * @param {string} [query.serviceId]
   */
  static async getIncidentAnalytics(organizationId, { serviceId } = {}) {
    const incidents = await IncidentRepository.findAnalyticsData(organizationId, { serviceId });

    const total = incidents.length;
    const resolved = incidents.filter((i) => i.resolvedAt);

    // MTTD: avg time from creation to detected_at (they are equal on auto-creation; for manual incidents this differs)
    // MTTR: avg time from detectedAt to resolvedAt
    let totalMttrMs = 0;
    for (const i of resolved) {
      totalMttrMs += new Date(i.resolvedAt).getTime() - new Date(i.detectedAt).getTime();
    }
    const mttrMs = resolved.length > 0 ? totalMttrMs / resolved.length : 0;

    const severityDistribution = incidents.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = incidents.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalIncidents: total,
      resolvedIncidents: resolved.length,
      mttrSeconds: parseFloat((mttrMs / 1000).toFixed(2)),
      mttrHuman: formatDuration(mttrMs),
      severityDistribution,
      statusDistribution,
    };
  }
}

function formatDuration(ms) {
  if (ms === 0) return 'N/A';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default AnalyticsService;
