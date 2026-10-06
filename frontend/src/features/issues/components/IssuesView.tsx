import { useState } from 'react';
import type { IssueStatus, IssueLevel } from '../types/issues';
import { PageHeader } from '../../../components/ui/PageHeader/PageHeader';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { Button } from '../../../components/ui/Button/Button';
import { IssuesTable } from './IssuesTable';
import { IssueFilters } from './IssueFilters';
import { useIssuesQuery } from '../hooks/useIssues';
import { useProjectsQuery } from '../hooks/useProjects';

export function IssuesView() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<IssueStatus | ''>('');
  const [environment, setEnvironment] = useState<string>('');
  const [level, setLevel] = useState<IssueLevel | ''>('');
  const [search, setSearch] = useState<string>('');

  const queryParams = {
    page,
    limit,
    projectId: projectId || undefined,
    status: status || undefined,
    environment: environment || undefined,
    level: level || undefined,
    search: search ? search.trim() : undefined,
  };

  const { data: issuesData, isLoading, isError, error, refetch } = useIssuesQuery(queryParams);
  const { data: projectsData } = useProjectsQuery();

  const projects = projectsData?.data || [];
  const issues = issuesData?.data || [];
  const total = issuesData?.pagination?.total || 0;

  const hasActiveFilters = !!projectId || !!status || !!environment || !!level || !!search;

  const handleClearFilters = () => {
    setProjectId('');
    setStatus('');
    setEnvironment('');
    setLevel('');
    setSearch('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Issues"
        description="Real-time error monitoring, stack traces, and automated regression detection."
      />

      <IssueFilters
        projects={projects}
        selectedProjectId={projectId}
        selectedStatus={status}
        selectedEnvironment={environment}
        selectedLevel={level}
        searchTerm={search}
        onProjectChange={(p) => {
          setProjectId(p);
          setPage(1);
        }}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        onEnvironmentChange={(e) => {
          setEnvironment(e);
          setPage(1);
        }}
        onLevelChange={(l) => {
          setLevel(l);
          setPage(1);
        }}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load issues"
          message={error instanceof Error ? error.message : 'An error occurred'}
          onRetry={refetch}
        />
      ) : issues.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching issues found' : 'No errors captured yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting or clearing your search and filters.'
              : 'Integrate the SentraOps SDK in your Node.js or browser apps to start capturing issues.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear all filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <IssuesTable
          issues={issues}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export default IssuesView;
