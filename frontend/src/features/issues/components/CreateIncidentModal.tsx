import { useState } from 'react';
import type React from 'react';
import type { Issue } from '../types/issues';
import { useServicesQuery } from '../../services/hooks/useServices';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { Select } from '../../../components/ui/Select/Select';
import { Input } from '../../../components/ui/Input/Input';

export interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue;
  onSubmit: (data: { serviceId: string; title: string; severity: 'low' | 'medium' | 'high' | 'critical' }) => void;
  isLoading?: boolean;
}

export function CreateIncidentModal({
  isOpen,
  onClose,
  issue,
  onSubmit,
  isLoading = false,
}: CreateIncidentModalProps) {
  const { data: servicesResponse } = useServicesQuery();
  const services = servicesResponse?.data || [];

  const [serviceId, setServiceId] = useState('');
  const [title, setTitle] = useState(`Incident: ${issue.title}`);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [error, setError] = useState('');

  const serviceOptions = [
    { value: '', label: '-- Select Affected Service --' },
    ...services.map((s: any) => ({ value: s.id, label: s.name })),
  ];

  const severityOptions = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) {
      setError('Please select a service for this incident');
      return;
    }
    setError('');
    onSubmit({ serviceId, title, severity });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Incident from Issue"
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Incident'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          This will declare an official Incident linked to this Issue, record a timeline event, and notify responders.
        </p>

        <Select
          label="Affected Service *"
          options={serviceOptions}
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            if (e.target.value) setError('');
          }}
          error={error}
          required
        />

        <Input
          label="Incident Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Select
          label="Severity"
          options={severityOptions}
          value={severity}
          onChange={(e) => setSeverity(e.target.value as any)}
        />
      </form>
    </Modal>
  );
}

export default CreateIncidentModal;
