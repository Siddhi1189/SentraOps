import { useState, useEffect } from 'react';
import type React from 'react';
import type {
  AlertRule,
  AlertRuleTriggerType,
  AlertChannel,
  CreateAlertRulePayload,
  UpdateAlertRulePayload,
} from '../types/alerts';
import { Drawer } from '../../../components/ui/Drawer/Drawer';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { useServicesQuery } from '../../services/hooks/useServices';
import { useProjectsQuery } from '../../issues/hooks/useProjects';
import styles from './Alerts.module.css';

interface AlertRuleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rule: AlertRule | null;
  channels: AlertChannel[];
  onSubmit: (data: CreateAlertRulePayload | UpdateAlertRulePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function AlertRuleDrawer({
  isOpen,
  onClose,
  rule,
  channels,
  onSubmit,
  isSubmitting,
}: AlertRuleDrawerProps) {
  const { data: servicesResponse } = useServicesQuery();
  const { data: projectsResponse } = useProjectsQuery();

  const services = servicesResponse?.data || [];
  const projects = projectsResponse?.data || [];

  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AlertRuleTriggerType>('service_down_consecutive_failures');
  const [serviceId, setServiceId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [cooldownSeconds, setCooldownSeconds] = useState(300);
  const [isActive, setIsActive] = useState(true);

  // Trigger-specific condition states
  const [consecutiveFailures, setConsecutiveFailures] = useState(3);
  const [environment, setEnvironment] = useState('');
  const [rateThreshold, setRateThreshold] = useState(100);
  const [rateWindowSeconds, setRateWindowSeconds] = useState(60);
  const [thresholdMs, setThresholdMs] = useState(2000);

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setTrigger(rule.trigger);
      setServiceId(rule.serviceId || '');
      setProjectId(rule.projectId || '');
      setSelectedChannelIds(rule.channels?.map((c) => c.id) || []);
      setCooldownSeconds(rule.cooldownSeconds ?? 300);
      setIsActive(rule.isActive ?? true);

      // Populate conditions
      setConsecutiveFailures(Number(rule.conditions?.consecutiveFailures ?? 3));
      setEnvironment(String(rule.conditions?.environment ?? ''));
      setRateThreshold(Number(rule.conditions?.threshold ?? 100));
      setRateWindowSeconds(Number(rule.conditions?.windowSeconds ?? 60));
      setThresholdMs(Number(rule.conditions?.thresholdMs ?? 2000));
    } else {
      setName('');
      setTrigger('service_down_consecutive_failures');
      setServiceId('');
      setProjectId('');
      setSelectedChannelIds(channels.length > 0 ? [channels[0].id] : []);
      setCooldownSeconds(300);
      setIsActive(true);
      setConsecutiveFailures(3);
      setEnvironment('');
      setRateThreshold(100);
      setRateWindowSeconds(60);
      setThresholdMs(2000);
    }
    setFormError('');
  }, [rule, isOpen, channels]);

  const toggleChannel = (channelId: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Rule name is required');
      return;
    }

    if (selectedChannelIds.length === 0) {
      setFormError('Please select at least one notification channel');
      return;
    }

    // Build conditions object per trigger
    const conditions: Record<string, unknown> = {};
    if (trigger === 'service_down_consecutive_failures') {
      conditions.consecutiveFailures = Number(consecutiveFailures);
    } else if (trigger === 'new_issue_in_environment') {
      if (environment.trim()) {
        conditions.environment = environment.trim();
      }
    } else if (trigger === 'event_rate_threshold') {
      conditions.threshold = Number(rateThreshold);
      conditions.windowSeconds = Number(rateWindowSeconds);
    } else if (trigger === 'response_time_threshold') {
      conditions.thresholdMs = Number(thresholdMs);
    }

    const payload: CreateAlertRulePayload = {
      name: name.trim(),
      trigger,
      conditions,
      serviceId: (trigger === 'service_down_consecutive_failures' || trigger === 'response_time_threshold')
        ? (serviceId ? serviceId : null)
        : null,
      projectId: (trigger === 'new_issue_in_environment' || trigger === 'event_rate_threshold')
        ? (projectId ? projectId : null)
        : null,
      channelIds: selectedChannelIds,
      cooldownSeconds: Number(cooldownSeconds),
      isActive,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      setFormError(e.error?.message || 'Failed to save alert rule');
    }
  };

  const isServiceTrigger =
    trigger === 'service_down_consecutive_failures' || trigger === 'response_time_threshold';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? 'Edit Alert Rule' : 'Create Alert Rule'}
    >
      <form onSubmit={handleSubmit} className={styles.drawerForm}>
        {formError && <div className={styles.formError}>{formError}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Rule Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Critical API Downtime Alert"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Trigger Condition *</label>
          <Select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as AlertRuleTriggerType)}
            options={[
              {
                value: 'service_down_consecutive_failures',
                label: 'Service Down: Consecutive Failures',
              },
              {
                value: 'response_time_threshold',
                label: 'Service Degraded: Slow Response Time',
              },
              {
                value: 'new_issue_in_environment',
                label: 'Sentry Core: New Issue or Regression in Environment',
              },
              {
                value: 'event_rate_threshold',
                label: 'Sentry Core: High Error Event Rate Spike',
              },
            ]}
          />
        </div>

        {/* Dynamic Condition Fields */}
        {trigger === 'service_down_consecutive_failures' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Consecutive Health Check Failures</label>
            <Input
              type="number"
              min={1}
              value={consecutiveFailures}
              onChange={(e) => setConsecutiveFailures(Number(e.target.value))}
              required
            />
            <span className={styles.fieldHint}>
              Fires when the monitor detects N consecutive failed checks (e.g. 3).
            </span>
          </div>
        )}

        {trigger === 'response_time_threshold' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Response Time Threshold (ms)</label>
            <Input
              type="number"
              min={50}
              step={50}
              value={thresholdMs}
              onChange={(e) => setThresholdMs(Number(e.target.value))}
              required
            />
            <span className={styles.fieldHint}>
              Fires when a service health check takes longer than this threshold.
            </span>
          </div>
        )}

        {trigger === 'new_issue_in_environment' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Target Environment (Optional)</label>
            <Input
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="e.g. production, staging (leave blank for all)"
            />
            <span className={styles.fieldHint}>
              Triggers when a new issue or regression is detected in this environment.
            </span>
          </div>
        )}

        {trigger === 'event_rate_threshold' && (
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Event Count Threshold</label>
              <Input
                type="number"
                min={1}
                value={rateThreshold}
                onChange={(e) => setRateThreshold(Number(e.target.value))}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Time Window (Seconds)</label>
              <Input
                type="number"
                min={10}
                max={86400}
                value={rateWindowSeconds}
                onChange={(e) => setRateWindowSeconds(Number(e.target.value))}
                required
              />
            </div>
          </div>
        )}

        {/* Target Scope: Service or Project */}
        {isServiceTrigger ? (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Target Service</label>
            <Select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              options={[
                { value: '', label: 'All Monitored Services' },
                ...services.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Target Project</label>
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              options={[
                { value: '', label: 'All Ingest Projects' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
        )}

        {/* Channels Multi-Select */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notification Channels *</label>
          {channels.length === 0 ? (
            <div className={styles.noChannelsWarning}>
              No notification channels configured. Add a channel in the "Channels" tab first.
            </div>
          ) : (
            <div className={styles.channelCheckboxList}>
              {channels.map((chan) => (
                <label key={chan.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedChannelIds.includes(chan.id)}
                    onChange={() => toggleChannel(chan.id)}
                  />
                  <span>
                    <strong>{chan.name}</strong> ({chan.type.toUpperCase()})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Cooldown (Seconds)</label>
          <Input
            type="number"
            min={0}
            max={86400}
            value={cooldownSeconds}
            onChange={(e) => setCooldownSeconds(Number(e.target.value))}
          />
          <span className={styles.fieldHint}>
            Minimum interval between repeat alert notifications (default 300s / 5m).
          </span>
        </div>

        <div className={styles.formCheckboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Rule is active</span>
          </label>
        </div>

        <div className={styles.drawerActions}>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || selectedChannelIds.length === 0}
          >
            {rule ? 'Save Changes' : 'Create Rule'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
