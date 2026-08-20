import type { IncidentStatus, IncidentSeverity, Service } from '../../../types/domain';
import { Select } from '../../../components/ui/Select/Select';
import { Button } from '../../../components/ui/Button/Button';
import styles from './IncidentFilters.module.css';

export interface IncidentFiltersProps {
  status: IncidentStatus | '';
  severity: IncidentSeverity | '';
  serviceId: string;
  services: Service[];
  onStatusChange: (status: IncidentStatus | '') => void;
  onSeverityChange: (severity: IncidentSeverity | '') => void;
  onServiceIdChange: (serviceId: string) => void;
  onClearFilters: () => void;
}

export function IncidentFilters({
  status,
  severity,
  serviceId,
  services,
  onStatusChange,
  onSeverityChange,
  onServiceIdChange,
  onClearFilters,
}: IncidentFiltersProps) {
  const hasActiveFilters = !!status || !!severity || !!serviceId;

  return (
    <div className={styles.container}>
      <div className={styles.filterGroup}>
        <Select
          label="Filter by Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as IncidentStatus | '')}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'Open', value: 'open' },
            { label: 'Investigating', value: 'investigating' },
            { label: 'Identified', value: 'identified' },
            { label: 'Monitoring', value: 'monitoring' },
            { label: 'Resolved', value: 'resolved' },
          ]}
        />
      </div>

      <div className={styles.filterGroup}>
        <Select
          label="Filter by Severity"
          value={severity}
          onChange={(e) => onSeverityChange(e.target.value as IncidentSeverity | '')}
          options={[
            { label: 'All Severities', value: '' },
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Critical', value: 'critical' },
          ]}
        />
      </div>

      <div className={styles.filterGroup}>
        <Select
          label="Filter by Service"
          value={serviceId}
          onChange={(e) => onServiceIdChange(e.target.value)}
          options={[
            { label: 'All Services', value: '' },
            ...services.map((s) => ({ label: s.name, value: s.id })),
          ]}
        />
      </div>

      {hasActiveFilters && (
        <div className={styles.actionGroup}>
          <Button type="button" variant="secondary" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
