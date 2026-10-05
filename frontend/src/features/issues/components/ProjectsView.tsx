import { useState } from 'react';
import type React from 'react';
import type { Project, PlatformType } from '../types/issues';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useCreateApiKeyMutation,
  useProjectKeysQuery,
  useRevokeApiKeyMutation,
} from '../hooks/useProjects';
import { PageHeader } from '../../../components/ui/PageHeader/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Drawer } from '../../../components/ui/Drawer/Drawer';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../../../components/ui/Table/Table';
import { ProjectSetupModal } from './ProjectSetupModal';

export function ProjectsView() {
  const { user } = useSession();
  const canCreate = can(user, 'project:create');
  const canDelete = can(user, 'project:delete');

  const { data: projectsResponse, isLoading, isError, error, refetch } = useProjectsQuery();
  const createProjectMutation = useCreateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();
  const createKeyMutation = useCreateApiKeyMutation();
  const revokeKeyMutation = useRevokeApiKeyMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('node');
  const [createError, setCreateError] = useState('');

  // Setup modal state
  const [setupProject, setSetupProject] = useState<Project | null>(null);
  const [setupKey, setSetupKey] = useState<string | null>(null);

  // Manage keys drawer state
  const [managingProject, setManagingProject] = useState<Project | null>(null);
  const { data: keysResponse, isLoading: isLoadingKeys } = useProjectKeysQuery(
    managingProject?.id || ''
  );
  const keys = keysResponse?.data || [];

  const projects = projectsResponse?.data || [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setCreateError('Project name is required');
      return;
    }
    setCreateError('');

    try {
      const newProj = await createProjectMutation.mutateAsync({
        name: projectName.trim(),
        platform,
      });

      // Automatically generate first key for quickstart
      const generatedKey = await createKeyMutation.mutateAsync({
        projectId: newProj.id,
        data: { name: 'Default SDK Key' },
      });

      setIsCreateModalOpen(false);
      setProjectName('');
      setPlatform('node');

      // Open setup modal
      setSetupProject(newProj);
      setSetupKey(generatedKey.key || '');
    } catch (err: any) {
      setCreateError(err.error?.message || err.message || 'Failed to create project');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"? All associated issues and error events will be permanently removed.`)) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleGenerateKey = async (projectId: string) => {
    const keyName = window.prompt('Enter a name for this API key:', 'Production Key');
    if (!keyName) return;

    try {
      const generatedKey = await createKeyMutation.mutateAsync({
        projectId,
        data: { name: keyName },
      });

      const currentProj = projects.find((p) => p.id === projectId);
      if (currentProj) {
        setSetupProject(currentProj);
        setSetupKey(generatedKey.key || '');
      }
    } catch {
      // Handled by hook toast
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage application projects, generate SDK ingest keys, and monitor connected platforms."
        action={
          canCreate ? (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Create Project
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load projects"
          message={error instanceof Error ? error.message : 'An error occurred'}
          onRetry={refetch}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects configured"
          description="Create a project to obtain an API key and begin monitoring errors in your application."
          action={
            canCreate ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Create First Project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table responsive>
          <TableHeader>
            <TableRow>
              <TableCell as="th">Name</TableCell>
              <TableCell as="th">Platform</TableCell>
              <TableCell as="th">Default Env</TableCell>
              <TableCell as="th">Created</TableCell>
              <TableCell as="th" style={{ textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((proj) => (
              <TableRow key={proj.id}>
                <TableCell dataLabel="Name">
                  <strong>{proj.name}</strong>
                </TableCell>
                <TableCell dataLabel="Platform">
                  <span style={{ textTransform: 'capitalize' }}>{proj.platform}</span>
                </TableCell>
                <TableCell dataLabel="Default Env">{proj.environmentDefault}</TableCell>
                <TableCell dataLabel="Created">
                  {new Date(proj.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell dataLabel="Actions" style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setManagingProject(proj)}
                    >
                      API Keys
                    </Button>
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(proj.id, proj.name)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Project"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateSubmit}
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Project Name *"
              placeholder="e.g. backend-api, store-frontend"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (e.target.value) setCreateError('');
              }}
              error={createError}
              required
              autoFocus
            />

            <Select
              label="Platform *"
              options={[
                { value: 'node', label: 'Node.js (Backend / Microservices)' },
                { value: 'browser', label: 'Browser (Single Page Apps / Frontend)' },
                { value: 'other', label: 'Other / Custom Ingest' },
              ]}
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformType)}
            />
          </form>
        </Modal>
      )}

      {/* Setup / Instructions Modal with plaintext key shown once */}
      {setupProject && setupKey && (
        <ProjectSetupModal
          isOpen={true}
          onClose={() => {
            setSetupProject(null);
            setSetupKey(null);
          }}
          project={setupProject}
          plainKey={setupKey}
        />
      )}

      {/* API Keys Drawer */}
      {managingProject && (
        <Drawer
          isOpen={true}
          onClose={() => setManagingProject(null)}
          title={`API Keys: ${managingProject.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Active keys used to ingest error events.
              </span>
              {canCreate && (
                <Button size="sm" variant="primary" onClick={() => handleGenerateKey(managingProject.id)}>
                  + New Key
                </Button>
              )}
            </div>

            {isLoadingKeys ? (
              <Spinner size="md" />
            ) : keys.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No API keys generated yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {keys.map((k) => (
                  <div
                    key={k.id}
                    style={{
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '6px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: k.revokedAt ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{k.name}</div>
                      <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        Prefix: {k.keyPrefix}...
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Created: {new Date(k.createdAt).toLocaleDateString()}
                        {k.lastUsedAt && ` • Last used: ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                        {k.revokedAt && ' • REVOKED'}
                      </div>
                    </div>

                    {!k.revokedAt && canCreate && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Revoking this key will immediately reject all future ingest requests using it. Continue?')) {
                            revokeKeyMutation.mutate({ projectId: managingProject.id, keyId: k.id });
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default ProjectsView;
