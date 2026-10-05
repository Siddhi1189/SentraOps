import { useState } from 'react';
import type { IncidentDetail } from '../types/incidents';
import { generateIncidentSummary } from '../../../api/incidents';
import { Button } from '../../../components/ui/Button/Button';

export interface IncidentAiSummaryProps {
  incident: IncidentDetail;
}

export function IncidentAiSummary({ incident }: IncidentAiSummaryProps) {
  const [summary, setSummary] = useState<string | null>(incident.aiSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled503, setIsDisabled503] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await generateIncidentSummary(incident.id);
      const summaryText = response.data?.summary || '';
      setSummary(summaryText);
    } catch (err: any) {
      if (err?.status === 503 || err?.error?.code === 'SERVICE_UNAVAILABLE') {
        setIsDisabled503(true);
      } else {
        setErrorMessage(err?.error?.message || 'Failed to generate summary');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback if clipboard not available in testing environment
    }
  };

  return (
    <div
      data-testid="ai-summary-container"
      style={{
        margin: 'var(--space-4) 0',
        padding: 'var(--space-4)',
        background: 'var(--surface-card, #FFFFFF)',
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: summary ? 'var(--space-3)' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>AI Incident Summary</span>
          {summary && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(229, 168, 59, 0.15)',
                color: 'var(--color-amber-600)',
                border: '1px solid rgba(200, 141, 39, 0.3)',
              }}
            >
              AI-generated
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {summary && (
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          )}

          <div
            title={
              isDisabled503
                ? 'AI summary service unavailable (API key not configured)'
                : undefined
            }
          >
            <Button
              size="sm"
              variant={summary ? 'ghost' : 'secondary'}
              onClick={handleGenerate}
              disabled={isLoading || isDisabled503}
              title={
                isDisabled503
                  ? 'AI summary service unavailable (API key not configured)'
                  : undefined
              }
            >
              {isLoading ? 'Generating...' : summary ? 'Regenerate' : 'Generate summary'}
            </Button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={{ marginTop: '8px', color: 'var(--color-danger, #ef4444)', fontSize: '13px' }}>
          {errorMessage}
        </div>
      )}

      {summary && (
        <div
          data-testid="ai-summary-text"
          style={{
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'var(--color-text-secondary)',
            whiteSpace: 'pre-wrap',
            padding: '12px',
            background: 'var(--surface-stone)',
            borderRadius: '6px',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {summary}
        </div>
      )}
    </div>
  );
}
