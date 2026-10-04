import { useState } from 'react';
import type React from 'react';
import type {
  AlertRule,
  AlertChannel,
  CreateAlertRulePayload,
  UpdateAlertRulePayload,
} from '../types/alerts';
import {
  useAlertRulesQuery,
  useCreateAlertRuleMutation,
  useUpdateAlertRuleMutation,
  useDeleteAlertRuleMutation,
  useSnoozeAlertRuleMutation,
  useUnsnoozeAlertRuleMutation,
} from '../hooks/useAlerts';
import { Button } from '../../../components/ui/Button/Button';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Input } from '../../../components/ui/Input/Input';
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
import { AlertRuleDrawer } from './AlertRuleDrawer';
import styles from './Alerts.module.css';

interface AlertRulesTabProps {
  channels: AlertChannel[];
  canManage: boolean;
}

export function AlertRulesTab({ channels, canManage }: AlertRulesTabProps) {
  const { data: rulesResponse, isLoading, isError, error, refetch } = useAlertRulesQuery();
  const createRuleMutation = useCreateAlertRuleMutation();
  const updateRuleMutation = useUpdateAlertRuleMutation();
  const deleteRuleMutation = useDeleteAlertRuleMutation();
  const snoozeRuleMutation = useSnoozeAlertRuleMutation();
  const unsnoozeRuleMutation = useUnsnoozeAlertRuleMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  // Snooze modal state
  const [snoozeRule, setSnoozeRule] = useState<AlertRule | null>(null);
  const [customSnoozeDate, setCustomSnoozeDate] = useState('');

  const rules = rulesResponse?.data || [];

  const openCreateDrawer = () => {
    setEditingRule(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (rule: AlertRule) => {
    setEditingRule(rule);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      await deleteRuleMutation.mutateAsync(ruleId);
    }
  };

  const handleDrawerSubmit = async (data: CreateAlertRulePayload | UpdateAlertRulePayload) => {
    if (editingRule) {
      await updateRuleMutation.mutateAsync({ id: editingRule.id, data });
    } else {
      await createRuleMutation.mutateAsync(data as CreateAlertRulePayload);
    }
  };

  const handleSnoozePreset = async (hours: number) => {
    if (!snoozeRule) return;
    const until = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    await snoozeRuleMutation.mutateAsync({ id: snoozeRule.id, until });
    setSnoozeRule(null);
  };

  const handleCustomSnooze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snoozeRule || !customSnoozeDate) return;
    const date = new Date(customSnoozeDate);
    if (isNaN(date.getTime())) return;
    await snoozeRuleMutation.mutateAsync({ id: snoozeRule.id, until: date.toISOString() });
    setSnoozeRule(null);
  };

  const handleUnsnooze = async (ruleId: string) => {
    await unsnoozeRuleMutation.mutateAsync(ruleId);
  };

  const formatTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'service_down_consecutive_failures':
        return 'Consecutive Failures';
      case 'response_time_threshold':
        return 'Slow Response Time';
      case 'new_issue_in_environment':
        return 'New Issue / Regression';
      case 'event_rate_threshold':
        return 'Error Event Spike';
      default:
        return trigger;
    }
  };

  const formatConditionsSummary = (rule: AlertRule) => {
    const c = rule.conditions || {};
    switch (rule.trigger) {
      case 'service_down_consecutive_failures':
        return `Failures ≥ ${c.consecutiveFailures ?? 3}`;
      case 'response_time_threshold':
        return `Latency ≥ ${c.thresholdMs ?? 2000}ms`;
      case 'new_issue_in_environment':
        return c.environment ? `Env: ${c.environment}` : 'All environments';
      case 'event_rate_threshold':
        return `≥ ${c.threshold ?? 100} events / ${c.windowSeconds ?? 60}s`;
      default:
        return JSON.stringify(c);
    }
  };

  const isRuleSnoozed = (rule: AlertRule) => {
    return rule.snoozedUntil && new Date(rule.snoozedUntil).getTime() > Date.now();
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never fired';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
        <p>Loading alert rules...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load alert rules"
        message={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Alert Rules</h2>
          <p className={styles.sectionSubtitle}>
            Define automated conditions that trigger notifications when services fail or error rates spike.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={openCreateDrawer}>
            Create Rule
          </Button>
        )}
      </div>

      {rules.length === 0 ? (
        <EmptyState
          title="No alert rules defined"
          description="Create custom alert rules to monitor consecutive failures, latency spikes, or new error issues."
          action={
            canManage ? (
              <Button variant="primary" onClick={openCreateDrawer}>
                Create Rule
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.tableWrapper}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell as="th">Rule Name</TableCell>
                <TableCell as="th">Trigger Condition</TableCell>
                <TableCell as="th">Target Scope</TableCell>
                <TableCell as="th">Channels</TableCell>
                <TableCell as="th">Last Fired</TableCell>
                <TableCell as="th">Status</TableCell>
                <TableCell as="th">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const snoozed = isRuleSnoozed(rule);
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className={styles.ruleNameCell}>
                        <span className={styles.ruleName}>{rule.name}</span>
                        {snoozed && (
                          <span className={styles.snoozedBadge}>
                            Snoozed until {new Date(rule.snoozedUntil!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={styles.triggerCell}>
                        <span className={styles.triggerBadge}>
                          {formatTriggerLabel(rule.trigger)}
                        </span>
                        <span className={styles.conditionSummary}>
                          {formatConditionsSummary(rule)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={styles.targetScope}>
                        {rule.service?.name
                          ? `Service: ${rule.service.name}`
                          : rule.project?.name
                          ? `Project: ${rule.project.name}`
                          : 'Global / All'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={styles.channelChipsList}>
                        {rule.channels && rule.channels.length > 0 ? (
                          rule.channels.map((chan) => (
                            <span key={chan.id} className={styles.channelChip}>
                              {chan.name}
                            </span>
                          ))
                        ) : (
                          <span className={styles.emptyText}>No channels</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={styles.lastFiredTime}>
                        {formatRelativeTime(rule.lastFiredAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={rule.isActive ? 'up' : 'down'}
                        label={rule.isActive ? 'Active' : 'Disabled'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className={styles.actionButtons}>
                        {canManage && (
                          <>
                            {snoozed ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={unsnoozeRuleMutation.isPending}
                                onClick={() => handleUnsnooze(rule.id)}
                              >
                                Unsnooze
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSnoozeRule(rule)}
                              >
                                Snooze
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDrawer(rule)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={styles.deleteBtn}
                              disabled={deleteRuleMutation.isPending}
                              onClick={() => handleDelete(rule.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Alert Rule Drawer */}
      <AlertRuleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        rule={editingRule}
        channels={channels}
        onSubmit={handleDrawerSubmit}
        isSubmitting={createRuleMutation.isPending || updateRuleMutation.isPending}
      />

      {/* Snooze Presets Modal */}
      {snoozeRule && (
        <Modal
          isOpen={!!snoozeRule}
          onClose={() => setSnoozeRule(null)}
          title={`Snooze Alert Rule: ${snoozeRule.name}`}
        >
          <div className={styles.snoozeModalContent}>
            <p className={styles.snoozeDesc}>
              Temporarily silence notifications for this rule. Choose a duration preset or specify a custom time.
            </p>
            <div className={styles.snoozePresets}>
              <Button
                variant="secondary"
                disabled={snoozeRuleMutation.isPending}
                onClick={() => handleSnoozePreset(1)}
              >
                1 Hour
              </Button>
              <Button
                variant="secondary"
                disabled={snoozeRuleMutation.isPending}
                onClick={() => handleSnoozePreset(8)}
              >
                8 Hours
              </Button>
              <Button
                variant="secondary"
                disabled={snoozeRuleMutation.isPending}
                onClick={() => handleSnoozePreset(24)}
              >
                24 Hours
              </Button>
            </div>

            <form onSubmit={handleCustomSnooze} className={styles.customSnoozeForm}>
              <label className={styles.formLabel}>Or Custom Date & Time:</label>
              <div className={styles.customSnoozeRow}>
                <Input
                  type="datetime-local"
                  value={customSnoozeDate}
                  onChange={(e) => setCustomSnoozeDate(e.target.value)}
                  required
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!customSnoozeDate || snoozeRuleMutation.isPending}
                >
                  Set Snooze
                </Button>
              </div>
            </form>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setSnoozeRule(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
