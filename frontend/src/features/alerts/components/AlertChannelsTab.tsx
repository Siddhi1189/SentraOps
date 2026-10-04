import { useState } from 'react';
import type React from 'react';
import type {
  AlertChannel,
  NotificationChannelType,
} from '../types/alerts';
import {
  useAlertChannelsQuery,
  useCreateAlertChannelMutation,
  useUpdateAlertChannelMutation,
  useDeleteAlertChannelMutation,
  useTestAlertChannelMutation,
} from '../hooks/useAlerts';
import { Button } from '../../../components/ui/Button/Button';
import { Modal } from '../../../components/ui/Modal/Modal';
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
import { StatusChip } from '../../../components/ui/StatusChip/StatusChip';
import styles from './Alerts.module.css';

interface AlertChannelsTabProps {
  canManage: boolean;
}

export function AlertChannelsTab({ canManage }: AlertChannelsTabProps) {
  const { data: channelsResponse, isLoading, isError, error, refetch } = useAlertChannelsQuery();
  const createChannelMutation = useCreateAlertChannelMutation();
  const updateChannelMutation = useUpdateAlertChannelMutation();
  const deleteChannelMutation = useDeleteAlertChannelMutation();
  const testChannelMutation = useTestAlertChannelMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<AlertChannel | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<NotificationChannelType>('slack');
  const [url, setUrl] = useState('');
  const [recipients, setRecipients] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const channels = channelsResponse?.data || [];

  const openCreateModal = () => {
    setEditingChannel(null);
    setName('');
    setType('slack');
    setUrl('');
    setRecipients('');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (channel: AlertChannel) => {
    setEditingChannel(channel);
    setName(channel.name);
    setType(channel.type);
    setUrl(channel.config?.url ? String(channel.config.url) : '');
    setRecipients(
      Array.isArray(channel.config?.recipients)
        ? channel.config.recipients.join(', ')
        : (channel.config?.recipients as string) || ''
    );
    setIsActive(channel.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Channel name is required');
      return;
    }

    const config: Record<string, unknown> = {};
    if (type === 'email') {
      const emailList = recipients
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (emailList.length === 0) {
        setFormError('Please enter at least one recipient email address');
        return;
      }
      config.recipients = emailList;
    } else {
      if (!url.trim()) {
        setFormError('Webhook URL is required');
        return;
      }
      config.url = url.trim();
    }

    try {
      if (editingChannel) {
        await updateChannelMutation.mutateAsync({
          id: editingChannel.id,
          data: { name: name.trim(), type, config, isActive },
        });
      } else {
        await createChannelMutation.mutateAsync({
          name: name.trim(),
          type,
          config,
          isActive,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      setFormError(e.error?.message || 'Failed to save channel');
    }
  };

  const handleTest = (channelId: string) => {
    testChannelMutation.mutate(channelId);
  };

  const handleDelete = async (channelId: string) => {
    if (window.confirm('Are you sure you want to delete this notification channel?')) {
      await deleteChannelMutation.mutateAsync(channelId);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
        <p>Loading notification channels...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load notification channels"
        message={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Notification Channels</h2>
          <p className={styles.sectionSubtitle}>
            Configure destinations (Slack, Webhooks, Email) where alert rules send notifications.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={openCreateModal}>
            Add Channel
          </Button>
        )}
      </div>

      {channels.length === 0 ? (
        <EmptyState
          title="No notification channels"
          description="Create a notification channel to connect your Slack workspace, webhook endpoint, or email list."
          action={
            canManage ? (
              <Button variant="primary" onClick={openCreateModal}>
                Add Channel
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.tableWrapper}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell as="th">Name</TableCell>
                <TableCell as="th">Type</TableCell>
                <TableCell as="th">Destination / Configuration</TableCell>
                <TableCell as="th">Status</TableCell>
                <TableCell as="th">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                    <span className={styles.channelName}>{channel.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className={styles.channelTypeBadge}>{channel.type.toUpperCase()}</span>
                  </TableCell>
                  <TableCell>
                    <code className={styles.maskedCode}>
                      {channel.type === 'email'
                        ? Array.isArray(channel.config?.recipients)
                          ? channel.config.recipients.join(', ')
                          : String(channel.config?.recipients || '—')
                        : String(channel.config?.url || '—')}
                    </code>
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={channel.isActive ? 'up' : 'down'}
                      label={channel.isActive ? 'Active' : 'Disabled'}
                    />
                  </TableCell>
                  <TableCell>
                    <div className={styles.actionButtons}>
                      {canManage && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={testChannelMutation.isPending}
                          onClick={() => handleTest(channel.id)}
                        >
                          Send Test
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(channel)}
                        >
                          Edit
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={styles.deleteBtn}
                          disabled={deleteChannelMutation.isPending}
                          onClick={() => handleDelete(channel.id)}
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
        </div>
      )}

      {/* Add / Edit Channel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChannel ? 'Edit Notification Channel' : 'Add Notification Channel'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          {formError && <div className={styles.formError}>{formError}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Channel Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SRE Slack Alerts"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Channel Type</label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationChannelType)}
              options={[
                { value: 'slack', label: 'Slack (Incoming Webhook)' },
                { value: 'webhook', label: 'Custom HTTP Webhook' },
                { value: 'email', label: 'Email Recipients' },
                { value: 'discord', label: 'Discord Webhook' },
              ]}
            />
          </div>

          {type === 'email' ? (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Recipient Emails (comma-separated) *</label>
              <Input
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="devops@example.com, oncall@example.com"
                required
              />
              <span className={styles.fieldHint}>
                Notifications will be emailed to each address in this list.
              </span>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Target Webhook URL *</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                required
              />
              <span className={styles.fieldHint}>
                Secret webhook URLs are masked after saving and never returned in plain text.
              </span>
            </div>
          )}

          <div className={styles.formCheckboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Channel is active</span>
            </label>
          </div>

          <div className={styles.modalActions}>
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createChannelMutation.isPending || updateChannelMutation.isPending}
            >
              {editingChannel ? 'Save Changes' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
