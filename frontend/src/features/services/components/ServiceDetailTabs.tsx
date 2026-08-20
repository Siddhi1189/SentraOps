import { useState } from 'react';
import type { Service } from '../../../types/domain';
import { Tabs } from '../../../components/ui/Tabs/Tabs';
import { ServiceOverviewTab } from './ServiceOverviewTab';
import { HealthCheckHistoryTable } from './HealthCheckHistoryTable';
import { ServiceEscalationTab } from '../../escalation/components/ServiceEscalationTab';
import { ServiceAnalyticsPanel } from '../../analytics/components/ServiceAnalyticsPanel';

export interface ServiceDetailTabsProps {
  service: Service;
}

export function ServiceDetailTabs({ service }: ServiceDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const tabItems = [
    {
      id: 'overview',
      label: 'Overview',
      content: <ServiceOverviewTab service={service} />,
    },
    {
      id: 'health-checks',
      label: 'Health Check History',
      content: (
        <HealthCheckHistoryTable
          serviceId={service.id}
          enabled={activeTab === 'health-checks'}
        />
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      content: (
        <ServiceAnalyticsPanel
          serviceId={service.id}
          enabled={activeTab === 'analytics'}
        />
      ),
    },
    {
      id: 'escalation',
      label: 'Escalation Policy',
      content: <ServiceEscalationTab serviceId={service.id} />,
    },
  ];

  return <Tabs items={tabItems} activeTab={activeTab} onTabChange={setActiveTab} />;
}
