import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import type { IncidentDetail, UpdateIncidentPayload } from '../types/incidents';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import { Select } from '../../../components/ui/Select/Select';
import { Button } from '../../../components/ui/Button/Button';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { AssigneeSelect } from './AssigneeSelect';
import { useUpdateIncidentMutation } from '../hooks/useIncidents';
import styles from './IncidentUpdatePanel.module.css';

export interface IncidentUpdatePanelProps {
  incident: IncidentDetail;
  onReload: () => void;
}

export function IncidentUpdatePanel({ incident, onReload }: IncidentUpdatePanelProps) {
  const { user } = useSession();
  const canUpdate = can(user, 'incident:update');

  const updateMutation = useUpdateIncidentMutation();

  const [formData, setFormData] = useState<{
    status: IncidentDetail['status'];
    severity: IncidentDetail['severity'];
    assignedUserId: string | null;
    rootCause: string;
    resolutionNotes: string;
  }>({
    status: incident.status,
    severity: incident.severity,
    assignedUserId: incident.assignedUserId || null,
    rootCause: incident.rootCause || '',
    resolutionNotes: incident.resolutionNotes || '',
  });

  const [conflictError, setConflictError] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData({
      status: incident.status,
      severity: incident.severity,
      assignedUserId: incident.assignedUserId || null,
      rootCause: incident.rootCause || '',
      resolutionNotes: incident.resolutionNotes || '',
    });
    setConflictError(false);
  }, [incident]);

  useEffect(() => {
    if (conflictError && bannerRef.current) {
      bannerRef.current.focus();
    }
  }, [conflictError]);

  // Gated by permission — fully omit if user cannot update incident (placed after hooks)
  if (!canUpdate) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(false);

    // Build payload sending mandatory last-known updatedAt from server read
    const payload: UpdateIncidentPayload = {
      status: formData.status,
      severity: formData.severity,
      assignedUserId: formData.assignedUserId,
      rootCause: formData.rootCause || null,
      resolutionNotes: formData.resolutionNotes || null,
      updatedAt: incident.updatedAt,
    };

    try {
      await updateMutation.mutateAsync({ id: incident.id, data: payload });
    } catch (err: any) {
      if (err?.status === 409 || err?.error?.code === 'CONCURRENCY_ERROR') {
        setConflictError(true);
      }
    }
  };

  const handleReload = () => {
    setConflictError(false);
    onReload();
  };

  const rootCauseLength = formData.rootCause.length;
  const resolutionNotesLength = formData.resolutionNotes.length;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Incident Triage & Management</h3>

      {/* Accessible HTTP 409 OCC Conflict Banner */}
      {conflictError && (
        <div
          ref={bannerRef}
          className={styles.conflictBanner}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
        >
          <p className={styles.conflictMessage}>
            This incident was updated by someone else — reload to see the latest
          </p>
          <Button type="button" variant="secondary" onClick={handleReload}>
            Reload
          </Button>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <Select
            label="Incident Status"
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as any }))}
            options={[
              { label: 'Open', value: 'open' },
              { label: 'Investigating', value: 'investigating' },
              { label: 'Identified', value: 'identified' },
              { label: 'Monitoring', value: 'monitoring' },
              { label: 'Resolved', value: 'resolved' },
            ]}
          />

          <Select
            label="Incident Severity"
            value={formData.severity}
            onChange={(e) => setFormData((p) => ({ ...p, severity: e.target.value as any }))}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Critical', value: 'critical' },
            ]}
          />
        </div>

        <AssigneeSelect
          value={formData.assignedUserId}
          onChange={(val) => setFormData((p) => ({ ...p, assignedUserId: val }))}
        />

        <div className={styles.textareaGroup}>
          <label className={styles.textareaLabel} htmlFor="rootCause">
            Root Cause Analysis (Max 2000 chars)
          </label>
          <textarea
            id="rootCause"
            className={styles.textarea}
            value={formData.rootCause}
            maxLength={2000}
            onChange={(e) => setFormData((p) => ({ ...p, rootCause: e.target.value }))}
            placeholder="Document root cause details..."
          />
          <span
            className={`${styles.charCount} ${
              rootCauseLength > 1800 ? styles.charCountNearLimit : ''
            }`}
          >
            {rootCauseLength} / 2000
          </span>
        </div>

        <div className={styles.textareaGroup}>
          <label className={styles.textareaLabel} htmlFor="resolutionNotes">
            Resolution Notes (Max 2000 chars)
          </label>
          <textarea
            id="resolutionNotes"
            className={styles.textarea}
            value={formData.resolutionNotes}
            maxLength={2000}
            onChange={(e) => setFormData((p) => ({ ...p, resolutionNotes: e.target.value }))}
            placeholder="Document resolution steps taken..."
          />
          <span
            className={`${styles.charCount} ${
              resolutionNotesLength > 1800 ? styles.charCountNearLimit : ''
            }`}
          >
            {resolutionNotesLength} / 2000
          </span>
        </div>

        <div className={styles.footer}>
          <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
