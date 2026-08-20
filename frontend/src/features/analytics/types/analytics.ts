export interface UptimeWindowStats {
  uptimePercent: number;
  avgLatency: number;
  failureCount: number;
  totalCount: number;
}

export interface ServiceAnalyticsData {
  serviceId: string;
  rolling7Days: UptimeWindowStats;
  rolling30Days: UptimeWindowStats;
  rolling90Days: UptimeWindowStats;
}

export interface IncidentAnalyticsData {
  totalIncidents: number;
  resolvedIncidents: number;
  mttrSeconds: number;
  mttrHuman: string;
  severityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}
