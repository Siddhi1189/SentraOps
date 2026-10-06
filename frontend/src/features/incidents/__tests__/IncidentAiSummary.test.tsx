import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { IncidentAiSummary } from '../components/IncidentAiSummary';
import type { IncidentDetail } from '../types/incidents';

const mockIncident: IncidentDetail = {
  id: 'inc-ai-123',
  organizationId: 'org-1',
  serviceId: 'srv-1',
  assignedUserId: null,
  title: 'Outage on Production Database',
  status: 'open',
  severity: 'high',
  rootCause: null,
  resolutionNotes: null,
  detectedAt: '2026-10-04T10:00:00Z',
  resolvedAt: null,
  aiSummary: null,
  createdAt: '2026-10-04T10:00:00Z',
  updatedAt: '2026-10-04T10:00:00Z',
};

describe('IncidentAiSummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates summary on button click, displays AI-generated badge and copy button', async () => {
    server.use(
      http.post('/api/v1/incidents/inc-ai-123/summary', () => {
        return HttpResponse.json({
          success: true,
          data: { summary: 'Generated root cause summary by AI.' },
        });
      })
    );

    render(<IncidentAiSummary incident={mockIncident} />);

    const generateBtn = screen.getByRole('button', { name: /generate summary/i });
    expect(generateBtn).toBeInTheDocument();

    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('AI-generated')).toBeInTheDocument();
      expect(screen.getByText('Generated root cause summary by AI.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  it('disables button with tooltip when backend returns 503', async () => {
    server.use(
      http.post('/api/v1/incidents/inc-ai-123/summary', () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'ANTHROPIC_API_KEY missing',
            },
          },
          { status: 503 }
        );
      })
    );

    render(<IncidentAiSummary incident={mockIncident} />);

    const generateBtn = screen.getByRole('button', { name: /generate summary/i });
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(generateBtn).toBeDisabled();
      expect(generateBtn).toHaveAttribute(
        'title',
        'AI summary service unavailable (API key not configured)'
      );
    });
  });
});
