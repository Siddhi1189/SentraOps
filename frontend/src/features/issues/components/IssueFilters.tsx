import type { Project, IssueStatus, IssueLevel } from '../types/issues';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import styles from './IssueFilters.module.css';

export interface IssueFiltersProps {
  projects: Project[];
  selectedProjectId?: string;
  selectedStatus?: IssueStatus;
  selectedEnvironment?: string;
  selectedLevel?: IssueLevel;
  searchTerm: string;
  onProjectChange: (projectId: string) => void;
  onStatusChange: (status: IssueStatus | '') => void;
  onEnvironmentChange: (env: string) => void;
  onLevelChange: (level: IssueLevel | '') => void;
  onSearchChange: (search: string) => void;
}

export function IssueFilters({
  projects,
  selectedProjectId = '',
  selectedStatus = '',
  selectedEnvironment = '',
  selectedLevel = '',
  searchTerm,
  onProjectChange,
  onStatusChange,
  onEnvironmentChange,
  onLevelChange,
  onSearchChange,
}: IssueFiltersProps) {
  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'unresolved', label: 'Unresolved' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'ignored', label: 'Ignored' },
  ];

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

  const envOptions = [
    { value: '', label: 'All Environments' },
    { value: 'production', label: 'Production' },
    { value: 'staging', label: 'Staging' },
    { value: 'development', label: 'Development' },
  ];

  return (
    <div className={styles.filtersContainer}>
      <Input
        placeholder="Search issues by title or type..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.searchInput}
        aria-label="Search issues"
      />

      <Select
        options={projectOptions}
        value={selectedProjectId}
        onChange={(e) => onProjectChange(e.target.value)}
        className={styles.filterSelect}
        aria-label="Filter by project"
      />

      <Select
        options={statusOptions}
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as IssueStatus | '')}
        className={styles.filterSelect}
        aria-label="Filter by status"
      />

      <Select
        options={levelOptions}
        value={selectedLevel}
        onChange={(e) => onLevelChange(e.target.value as IssueLevel | '')}
        className={styles.filterSelect}
        aria-label="Filter by level"
      />

      <Select
        options={envOptions}
        value={selectedEnvironment}
        onChange={(e) => onEnvironmentChange(e.target.value)}
        className={styles.filterSelect}
        aria-label="Filter by environment"
      />
    </div>
  );
}

export default IssueFilters;
