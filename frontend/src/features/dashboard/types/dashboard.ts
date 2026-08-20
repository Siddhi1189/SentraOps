export interface IncidentAnalyticsData {
  totalIncidents: number;
  resolvedIncidents: number;
  mttrSeconds: number;
  mttrHuman: string;
  severityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}
