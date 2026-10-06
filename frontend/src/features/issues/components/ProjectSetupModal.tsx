import { useState, useEffect } from 'react';
import type { Project } from '../types/issues';
import { getSocket } from '../../../lib/socket';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ProjectSetupModal.module.css';

export interface ProjectSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  plainKey: string;
}

export function ProjectSetupModal({
  isOpen,
  onClose,
  project,
  plainKey,
}: ProjectSetupModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [hasReceivedEvent, setHasReceivedEvent] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.host : 'localhost:5000';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const dsn = `${protocol}//${plainKey}@${origin}/${project.id}`;

  const nodeSnippet = `// 1. Install SDK: npm install @sentraops/node
import SentraOps from '@sentraops/node';

SentraOps.init({
  dsn: '${dsn}',
  environment: process.env.NODE_ENV || 'production',
});`;

  const browserSnippet = `<!-- 1. Include SentraOps snippet -->
<script src="/sentraops.js"></script>
<script>
  window.SentraOps.init({
    dsn: '${dsn}',
    environment: 'production',
  });
</script>`;

  useEffect(() => {
    if (!isOpen) return;

    const socket = getSocket();
    if (!socket) return;

    const handleIssueCreated = (data: any) => {
      if (data?.projectId === project.id) {
        setHasReceivedEvent(true);
      }
    };

    socket.on('issue-created', handleIssueCreated);
    return () => {
      socket.off('issue-created', handleIssueCreated);
    };
  }, [isOpen, project.id]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(plainKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Project: ${project.name}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={styles.keyAlert}>
          <strong>Store this key securely!</strong> This is the only time your full API key and DSN will be displayed in plaintext.
        </div>

        <div className={styles.sectionTitle}>Project API Key</div>
        <div className={styles.keyBox}>
          <span className={styles.keyText}>{plainKey}</span>
          <Button size="sm" variant="secondary" onClick={handleCopyKey}>
            {copiedKey ? '✓ Copied' : 'Copy'}
          </Button>
        </div>

        <div className={styles.sectionTitle}>DSN (Data Source Name)</div>
        <div className={styles.keyBox}>
          <span className={styles.keyText}>{dsn}</span>
          <Button size="sm" variant="secondary" onClick={() => handleCopySnippet(dsn)}>
            {copiedSnippet ? '✓ Copied' : 'Copy'}
          </Button>
        </div>

        <div className={styles.sectionTitle}>Node.js Quickstart</div>
        <pre className={styles.codeSnippet}>{nodeSnippet}</pre>

        <div className={styles.sectionTitle}>Browser Snippet Quickstart</div>
        <pre className={styles.codeSnippet}>{browserSnippet}</pre>

        {/* Live Event Listener Card */}
        <div
          className={`${styles.statusCard} ${
            hasReceivedEvent ? styles.receivedStatus : styles.waitingStatus
          }`}
        >
          {hasReceivedEvent ? (
            <>
              <span className={styles.successDot} />
              <span>First event received! Project is connected and capturing errors.</span>
            </>
          ) : (
            <>
              <span className={styles.pulseDot} />
              <span>Waiting for first event… Send an error to verify your setup.</span>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ProjectSetupModal;
