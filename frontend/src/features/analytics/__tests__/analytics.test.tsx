import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceAnalyticsPanel } from '../components/ServiceAnalyticsPanel';
import { IncidentAnalyticsPage } from '../components/IncidentAnalyticsPage';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Phase 9 — Analytics Integration & Compliance', () => {
  describe('Service Analytics Panel', () => {
    it('renders 7, 30, and 90-day uptime and latency statistics when data exists', async () => {
      renderWithProviders(<ServiceAnalyticsPanel serviceId="service-1" enabled={true} />);

      await waitFor(() => {
        expect(screen.getByText('Rolling 7 Days')).toBeInTheDocument();
      });

      expect(screen.getByText('Rolling 30 Days')).toBeInTheDocument();
      expect(screen.getByText('Rolling 90 Days')).toBeInTheDocument();

      expect(screen.getByText('99.85%')).toBeInTheDocument();
      expect(screen.getByText('142.3 ms')).toBeInTheDocument();
      expect(screen.getByText('2 / 1340')).toBeInTheDocument();
    });

    it('renders exact empty state for brand-new service with zero total checks across all windows', async () => {
      renderWithProviders(<ServiceAnalyticsPanel serviceId="zero-history-service-id" enabled={true} />);

      await waitFor(() => {
        expect(
          screen.getByText('Not enough data yet — check back once monitoring has run for a while')
        ).toBeInTheDocument();
      });

      // Does not render misleading zeroed stats or broken percentages
      expect(screen.queryByText('99.85%')).not.toBeInTheDocument();
    });

    it('does NOT render empty state if at least one rolling window contains valid health checks', async () => {
      renderWithProviders(<ServiceAnalyticsPanel serviceId="partial-history-service-id" enabled={true} />);

      await waitFor(() => {
        expect(screen.getByText('Rolling 30 Days')).toBeInTheDocument();
      });

      expect(screen.getByText('99.5%')).toBeInTheDocument();
      expect(screen.getByText('120 ms')).toBeInTheDocument();
      expect(
        screen.queryByText('Not enough data yet — check back once monitoring has run for a while')
      ).not.toBeInTheDocument();
    });

    it('does NOT fetch data when enabled flag is false (lazy loading)', () => {
      renderWithProviders(<ServiceAnalyticsPanel serviceId="service-1" enabled={false} />);

      expect(screen.queryByText('Rolling 7 Days')).not.toBeInTheDocument();
      expect(screen.queryByTestId('analytics-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Incident Analytics Page', () => {
    it('renders organization-wide incident analytics and binds mttrHuman directly', async () => {
      renderWithProviders(<IncidentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Incidents')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1, name: /incident analytics/i })).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();

      expect(screen.getByText('Resolved Incidents')).toBeInTheDocument();
      expect(screen.getAllByText('9').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Mean Time to Resolve (MTTR)')).toBeInTheDocument();
      expect(screen.getByText('39m 0s')).toBeInTheDocument();

      expect(screen.getByText('Severity Distribution')).toBeInTheDocument();
      expect(screen.getByText('Status Distribution')).toBeInTheDocument();
    });

    it('updates incident analytics data when service filter is changed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IncidentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by service/i)).toBeInTheDocument();
      });

      // Wait for services dropdown options to load from MSW
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /payment gateway/i })).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/filter by service/i);
      const option = screen.getByRole('option', { name: /payment gateway/i }) as HTMLOptionElement;
      await user.selectOptions(select, option.value);

      await waitFor(() => {
        expect(screen.getByText('15m 0s')).toBeInTheDocument();
      });

      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });

    it('strictly enforces no MTTD, no incident uptime claims, and no time-series/time-axis charts', async () => {
      const { container } = renderWithProviders(<IncidentAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Incidents')).toBeInTheDocument();
      });

      // No MTTD UI
      expect(screen.queryByText(/mttd/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/mean time to detect/i)).not.toBeInTheDocument();

      // No uptime percentage claims in incident analytics
      expect(screen.queryByText(/uptime/i)).not.toBeInTheDocument();

      // No time-series / time-axis canvas, svg charts, or line trend elements
      expect(container.querySelector('canvas')).toBeNull();
      expect(container.querySelector('svg.recharts-surface')).toBeNull();
      expect(container.querySelector('.chartjs-render-monitor')).toBeNull();
    });
  });
});
