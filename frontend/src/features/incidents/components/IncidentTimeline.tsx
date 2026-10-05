import { useState } from 'react';
import type { TimelineEvent } from '../types/incidents';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { Button } from '../../../components/ui/Button/Button';
import { useAddIncidentCommentMutation } from '../hooks/useIncidents';
import styles from './IncidentTimeline.module.css';

export interface IncidentTimelineProps {
  events: TimelineEvent[];
  incidentId?: string;
}

const EVENT_ICONS: Record<string, string> = {};

const EVENT_LABELS: Record<string, string> = {
  INCIDENT_CREATED: 'Incident Detected & Created',
  STATUS_CHANGED: 'Status / Severity Updated',
  ASSIGNED: 'Incident Assignment Changed',
  RESOLVED: 'Incident Resolved',
  COMMENT_ADDED: 'Triage Note Added',
};

export function IncidentTimeline({ events, incidentId }: IncidentTimelineProps) {
  const [commentText, setCommentText] = useState('');
  const addCommentMutation = useAddIncidentCommentMutation();

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !incidentId) return;
    await addCommentMutation.mutateAsync({ id: incidentId, comment: commentText.trim() });
    setCommentText('');
  };

  const commentForm = incidentId ? (
    <form onSubmit={handleAddComment} style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add an investigation note or update to the timeline..."
          rows={2}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-base)',
            color: 'var(--color-text-primary)',
            fontFamily: 'inherit',
            fontSize: '13px',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!commentText.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? 'Adding Note...' : 'Add Note'}
          </Button>
        </div>
      </div>
    </form>
  ) : null;

  if (!events || events.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Incident Audit Timeline</h3>
        {commentForm}
        <EmptyState
          title="No Timeline Events"
          description="Timeline audit logs for this incident will appear here chronologically."
        />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Incident Audit Timeline</h3>
      {commentForm}

      <ol className={styles.timelineList}>
        {events.map((event) => {
          const icon = '';
          const label = EVENT_LABELS[event.eventType] || event.eventType;

          return (
            <li key={event.id} className={styles.item}>
              <div className={styles.iconContainer} aria-hidden="true" />

              <div className={styles.content}>
                <div className={styles.headerRow}>
                  <span className={styles.eventTypeLabel}>{label}</span>
                  <span className={styles.timestamp}>
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={styles.description}>{event.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
