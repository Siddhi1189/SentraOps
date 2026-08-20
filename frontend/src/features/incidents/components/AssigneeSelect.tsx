import { useState } from 'react';
import type React from 'react';
import { useOrganizationMembersQuery } from '../hooks/useIncidents';
import { Select } from '../../../components/ui/Select/Select';
import { Input } from '../../../components/ui/Input/Input';
import type { User } from '../../../types/domain';

export interface AssigneeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function AssigneeSelect({ value, onChange, disabled }: AssigneeSelectProps) {
  const [search, setSearch] = useState('');

  // §J.9 pagination discipline: search-as-you-type, limit=20, never limit=1000
  const memberFilters = search ? { search, limit: 20 } : { limit: 20 };
  const { data: membersData, isLoading } = useOrganizationMembersQuery(memberFilters);

  const members = membersData?.data || [];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange(val === '' ? null : val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Input
        label="Filter Assignees (search-as-you-type)"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members by name..."
        disabled={disabled}
      />
      <Select
        label="Assigned User"
        value={value || ''}
        onChange={handleSelectChange}
        disabled={disabled || isLoading}
        options={[
          { label: 'Unassigned', value: '' },
          ...members.map((m: User) => ({ label: `${m.name} (${m.email})`, value: m.id })),
        ]}
      />
    </div>
  );
}
