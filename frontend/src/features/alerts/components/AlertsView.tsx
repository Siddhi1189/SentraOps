import { useState } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import { useAlertChannelsQuery } from '../hooks/useAlerts';
import { PageHeader } from '../../../components/ui/PageHeader/PageHeader';
import { AlertChannelsTab } from './AlertChannelsTab';
import { AlertRulesTab } from './AlertRulesTab';
import styles from './Alerts.module.css';

export function AlertsView() {
  const { user } = useSession();
  const canManage = can(user, 'alert:manage');
  const [activeTab, setActiveTab] = useState<'channels' | 'rules'>('channels');

  const { data: channelsResponse } = useAlertChannelsQuery();
  const channels = channelsResponse?.data || [];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Alerts & Notification Channels"
        subtitle="Manage where and when alerts are dispatched for uptime incidents and error event spikes."
      />

      {/* Tab Navigation */}
      <div className={styles.tabNav} role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'channels'}
          className={`${styles.tabButton} ${activeTab === 'channels' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          Channels ({channels.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'rules'}
          className={`${styles.tabButton} ${activeTab === 'rules' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Alert Rules
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'channels' ? (
        <AlertChannelsTab canManage={canManage} />
      ) : (
        <AlertRulesTab channels={channels} canManage={canManage} />
      )}
    </div>
  );
}
