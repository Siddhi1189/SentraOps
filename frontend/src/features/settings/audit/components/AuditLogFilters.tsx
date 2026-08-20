import { Input } from '../../../../components/ui/Input/Input';
import { Select } from '../../../../components/ui/Select/Select';

export interface AuditLogFiltersProps {
  entityType: string;
  onEntityTypeChange: (value: string) => void;
  userId: string;
  onUserIdChange: (value: string) => void;
}

export function AuditLogFilters({
  entityType,
  onEntityTypeChange,
  userId,
  onUserIdChange,
}: AuditLogFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
      <Select
        label="Filter by Entity Type"
        id="audit-entity-type-filter"
        value={entityType}
        onChange={(e) => onEntityTypeChange(e.target.value)}
        options={[
          { label: 'All Entity Types', value: '' },
          { label: 'Service', value: 'Service' },
          { label: 'Incident', value: 'Incident' },
          { label: 'MaintenanceWindow', value: 'MaintenanceWindow' },
          { label: 'EscalationPolicy', value: 'EscalationPolicy' },
          { label: 'User', value: 'User' },
          { label: 'Organization', value: 'Organization' },
        ]}
        style={{ minWidth: '200px' }}
      />

      <Input
        label="Filter by User ID"
        id="audit-user-id-filter"
        value={userId}
        onChange={(e) => onUserIdChange(e.target.value)}
        placeholder="User ID (e.g. u-admin-1)"
        style={{ minWidth: '200px' }}
      />
    </div>
  );
}
