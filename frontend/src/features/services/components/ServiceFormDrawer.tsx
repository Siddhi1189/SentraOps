import { useState, useEffect } from 'react';
import type React from 'react';
import type { Service, ServiceGroup, Assertion, AssertionKind, MonitorType } from '../../../types/domain';
import {
  createServiceSchema,
  type CreateServicePayload,
} from '../../../types/services';
import { useGroupsQuery } from '../hooks/useServices';
import { Drawer } from '../../../components/ui/Drawer/Drawer';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import styles from './ServiceFormDrawer.module.css';

export interface ServiceFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServicePayload) => Promise<void>;
  initialService?: Service | null;
  isSubmitting?: boolean;
}

export function ServiceFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialService,
  isSubmitting = false,
}: ServiceFormDrawerProps) {
  const [formData, setFormData] = useState<CreateServicePayload>({
    name: '',
    monitorType: 'http',
    url: '',
    httpMethod: 'GET',
    expectedStatusCode: 200,
    timeoutMs: 5000,
    checkIntervalSeconds: 60,
    environment: 'production',
    priority: 'medium',
    groupId: null,
    isActive: true,
    tags: [],
    requestHeaders: null,
    requestBody: null,
    assertions: [],
    heartbeatIntervalSeconds: 60,
    heartbeatGraceSeconds: 30,
  });

  const [headersText, setHeadersText] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('');
  const [copiedPing, setCopiedPing] = useState<boolean>(false);
  const [groupSearch, setGroupSearch] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Query groups with search-as-you-type pagination discipline
  const groupFilters = groupSearch ? { search: groupSearch, limit: 20 } : { limit: 20 };
  const { data: groupsData } = useGroupsQuery(groupFilters);
  const groupsList = groupsData?.data || [];

  useEffect(() => {
    if (initialService) {
      setFormData({
        name: initialService.name,
        monitorType: initialService.monitorType || 'http',
        url: initialService.url || '',
        httpMethod: initialService.httpMethod,
        expectedStatusCode: initialService.expectedStatusCode,
        timeoutMs: initialService.timeoutMs,
        checkIntervalSeconds: initialService.checkIntervalSeconds,
        environment: initialService.environment,
        priority: initialService.priority,
        groupId: initialService.groupId || null,
        isActive: initialService.isActive,
        tags: initialService.tags || [],
        requestHeaders: initialService.requestHeaders || null,
        requestBody: initialService.requestBody || null,
        assertions: (initialService.assertions as any) || [],
        heartbeatIntervalSeconds: initialService.heartbeatIntervalSeconds || 60,
        heartbeatGraceSeconds: initialService.heartbeatGraceSeconds ?? 30,
        heartbeatToken: initialService.heartbeatToken || null,
      });
      setHeadersText(
        initialService.requestHeaders
          ? JSON.stringify(initialService.requestHeaders, null, 2)
          : ''
      );
      setBodyText(initialService.requestBody || '');
    } else {
      setFormData({
        name: '',
        monitorType: 'http',
        url: '',
        httpMethod: 'GET',
        expectedStatusCode: 200,
        timeoutMs: 5000,
        checkIntervalSeconds: 60,
        environment: 'production',
        priority: 'medium',
        groupId: null,
        isActive: true,
        tags: [],
        requestHeaders: null,
        requestBody: null,
        assertions: [],
        heartbeatIntervalSeconds: 60,
        heartbeatGraceSeconds: 30,
      });
      setHeadersText('');
      setBodyText('');
    }
    setFieldErrors({});
    setGroupSearch('');
    setTagInput('');
    setCopiedPing(false);
  }, [initialService, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (
      name === 'expectedStatusCode' ||
      name === 'timeoutMs' ||
      name === 'checkIntervalSeconds' ||
      name === 'heartbeatIntervalSeconds' ||
      name === 'heartbeatGraceSeconds'
    ) {
      val = Number(value);
    } else if (name === 'groupId') {
      val = value === '' ? null : value;
    }

    setFormData((prev) => ({ ...prev, [name]: val }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined as any }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !formData.tags?.includes(trimmed)) {
        setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), trimmed] }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove),
    }));
  };

  // Assertion management
  const handleAddAssertion = () => {
    const current = formData.assertions || [];
    if (current.length >= 10) return;
    const newAssertion: Assertion = {
      kind: 'status_code_equals',
      value: 200,
    };
    setFormData((prev) => ({
      ...prev,
      assertions: [...(prev.assertions || []), newAssertion],
    }));
  };

  const handleRemoveAssertion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      assertions: (prev.assertions || []).filter((_, i) => i !== index),
    }));
  };

  const handleAssertionChange = (
    index: number,
    field: keyof Assertion,
    val: any
  ) => {
    setFormData((prev) => {
      const updated = [...(prev.assertions || [])];
      const existing = updated[index];
      if (!existing) return prev;

      if (field === 'kind') {
        const nextKind = val as AssertionKind;
        let defaultValue: any = '';
        if (nextKind === 'status_code_equals') defaultValue = 200;
        else if (nextKind === 'response_time_less_than') defaultValue = 1000;
        updated[index] = { kind: nextKind, value: defaultValue, path: nextKind === 'json_path_equals' ? '$.status' : undefined };
      } else {
        updated[index] = { ...existing, [field]: val };
      }
      return { ...prev, assertions: updated };
    });
  };

  const handleCopyPingUrl = () => {
    const token = initialService?.heartbeatToken;
    const url = token
      ? `${window.location.origin}/api/heartbeat/${token}`
      : `${window.location.origin}/api/heartbeat/<auto-generated-token>`;
    navigator.clipboard.writeText(url);
    setCopiedPing(true);
    setTimeout(() => setCopiedPing(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Parse JSON headers if provided
    let parsedHeaders = null;
    if (headersText.trim()) {
      try {
        parsedHeaders = JSON.parse(headersText);
        if (typeof parsedHeaders !== 'object' || Array.isArray(parsedHeaders)) {
          setFieldErrors((prev) => ({ ...prev, requestHeaders: 'Headers must be a valid JSON object' }));
          return;
        }
      } catch {
        setFieldErrors((prev) => ({ ...prev, requestHeaders: 'Invalid JSON format for headers' }));
        return;
      }
    }

    const submissionData: CreateServicePayload = {
      ...formData,
      requestHeaders: parsedHeaders,
      requestBody: bodyText.trim() ? bodyText : null,
      url: formData.monitorType === 'heartbeat' ? (formData.url || null) : formData.url,
    };

    const result = createServiceSchema.safeParse(submissionData);
    if (!result.success) {
      const formatted: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && !formatted[path]) {
          formatted[path] = issue.message;
        }
      });
      setFieldErrors(formatted);
      return;
    }

    await onSubmit(result.data);
  };

  const drawerTitle = initialService ? `Edit Service: ${initialService.name}` : 'Create New Service';
  const isHeartbeat = formData.monitorType === 'heartbeat';

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={drawerTitle}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Monitor Type Selector */}
        <Select
          label="Monitor Type"
          name="monitorType"
          value={formData.monitorType || 'http'}
          onChange={handleChange}
          options={[
            { label: 'HTTP / Web Service (Outbound checks)', value: 'http' },
            { label: 'Heartbeat / Cron Monitor (Inbound pings)', value: 'heartbeat' },
          ]}
        />

        <Input
          label="Service Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
          placeholder="e.g. Authentication API or Nightly Backup Cron"
          required
        />

        {/* ─── HTTP Monitor Specific Section ─────────────────────────────────── */}
        {!isHeartbeat ? (
          <>
            <Input
              label="Target URL"
              name="url"
              value={formData.url || ''}
              onChange={handleChange}
              error={fieldErrors.url}
              placeholder="https://api.example.com/health"
              required
            />

            <div className={styles.row}>
              <Select
                label="HTTP Method"
                name="httpMethod"
                value={formData.httpMethod}
                onChange={handleChange}
                options={[
                  { label: 'GET', value: 'GET' },
                  { label: 'POST', value: 'POST' },
                  { label: 'HEAD', value: 'HEAD' },
                  { label: 'PUT', value: 'PUT' },
                ]}
              />

              <Input
                label="Expected Status Code"
                type="number"
                name="expectedStatusCode"
                value={formData.expectedStatusCode}
                onChange={handleChange}
                error={fieldErrors.expectedStatusCode}
                min={100}
                max={599}
              />
            </div>

            <div className={styles.row}>
              <Input
                label="Timeout (ms)"
                type="number"
                name="timeoutMs"
                value={formData.timeoutMs}
                onChange={handleChange}
                error={fieldErrors.timeoutMs}
                min={1000}
                max={60000}
              />

              <Input
                label="Check Interval (sec)"
                type="number"
                name="checkIntervalSeconds"
                value={formData.checkIntervalSeconds}
                onChange={handleChange}
                error={fieldErrors.checkIntervalSeconds}
                min={30}
                max={3600}
              />
            </div>

            {/* Custom Headers & Body Section */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Request Headers & Body</h4>
              <p className={styles.sectionDescription}>
                Optional custom HTTP request headers (JSON) and body for POST/PUT checks. Sensitive headers like Authorization are automatically masked in API responses.
              </p>

              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                  Custom Headers (JSON Object)
                </label>
                <textarea
                  className={styles.jsonTextarea}
                  value={headersText}
                  onChange={(e) => setHeadersText(e.target.value)}
                  placeholder={`{\n  "Authorization": "Bearer token",\n  "X-Custom-Header": "value"\n}`}
                />
                {fieldErrors.requestHeaders && (
                  <span style={{ color: 'var(--color-status-down)', fontSize: 'var(--font-size-xs)' }}>
                    {fieldErrors.requestHeaders}
                  </span>
                )}
              </div>

              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                  Request Body (Optional payload)
                </label>
                <textarea
                  className={styles.jsonTextarea}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder={`{"check": "health"}`}
                />
              </div>
            </div>

            {/* Assertions Builder Section */}
            <div className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 className={styles.sectionTitle}>Assertions (Max 10)</h4>
                  <p className={styles.sectionDescription}>
                    Enforce strict criteria on responses. If any assertion fails, the monitor reports DOWN.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAssertion}
                  disabled={(formData.assertions || []).length >= 10}
                >
                  + Add Assertion
                </Button>
              </div>

              {formData.assertions && formData.assertions.length > 0 ? (
                formData.assertions.map((assertion, idx) => (
                  <div key={idx} className={styles.assertionItem}>
                    <div className={styles.assertionHeader}>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Assertion #{idx + 1}</span>
                      <button
                        type="button"
                        className={styles.removeTagButton}
                        onClick={() => handleRemoveAssertion(idx)}
                        aria-label="Remove assertion"
                      >
                        Remove
                      </button>
                    </div>

                    <div className={styles.assertionInputs}>
                      <Select
                        label="Kind"
                        value={assertion.kind}
                        onChange={(e) => handleAssertionChange(idx, 'kind', e.target.value)}
                        options={[
                          { label: 'Status Code Equals', value: 'status_code_equals' },
                          { label: 'Body Contains Keyword', value: 'body_contains' },
                          { label: 'Body Does Not Contain', value: 'body_does_not_contain' },
                          { label: 'JSONPath Equals Value', value: 'json_path_equals' },
                          { label: 'Response Time Less Than', value: 'response_time_less_than' },
                        ]}
                      />

                      {assertion.kind === 'status_code_equals' && (
                        <Input
                          label="Expected Status Code"
                          type="number"
                          value={assertion.value ?? 200}
                          onChange={(e) => handleAssertionChange(idx, 'value', Number(e.target.value))}
                        />
                      )}

                      {assertion.kind === 'body_contains' && (
                        <Input
                          label="Required Keyword"
                          type="text"
                          value={assertion.value ?? ''}
                          onChange={(e) => handleAssertionChange(idx, 'value', e.target.value)}
                          placeholder="e.g. healthy, OK"
                        />
                      )}

                      {assertion.kind === 'body_does_not_contain' && (
                        <Input
                          label="Forbidden Keyword"
                          type="text"
                          value={assertion.value ?? ''}
                          onChange={(e) => handleAssertionChange(idx, 'value', e.target.value)}
                          placeholder="e.g. fatal error, Exception"
                        />
                      )}

                      {assertion.kind === 'response_time_less_than' && (
                        <Input
                          label="Max Response Time (ms)"
                          type="number"
                          value={assertion.value ?? 1000}
                          onChange={(e) => handleAssertionChange(idx, 'value', Number(e.target.value))}
                        />
                      )}

                      {assertion.kind === 'json_path_equals' && (
                        <>
                          <Input
                            label="JSONPath"
                            type="text"
                            value={assertion.path ?? '$.status'}
                            onChange={(e) => handleAssertionChange(idx, 'path', e.target.value)}
                            placeholder="$.status"
                          />
                          <Input
                            label="Expected Value"
                            type="text"
                            value={typeof assertion.value === 'object' ? JSON.stringify(assertion.value) : (assertion.value ?? '')}
                            onChange={(e) => handleAssertionChange(idx, 'value', e.target.value)}
                            placeholder="healthy"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  No custom assertions configured (falls back to Expected Status Code).
                </span>
              )}
            </div>
          </>
        ) : (
          /* ─── Heartbeat Monitor Specific Section ───────────────────────────── */
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Heartbeat Ping Configuration</h4>
            <p className={styles.sectionDescription}>
              Inbound cron/worker monitoring. Have your background jobs or cron scripts ping this URL upon task completion. If no ping is received within interval + grace period, an incident is triggered.
            </p>

            <div className={styles.row}>
              <Input
                label="Expected Interval (sec)"
                type="number"
                name="heartbeatIntervalSeconds"
                value={formData.heartbeatIntervalSeconds || 60}
                onChange={handleChange}
                error={fieldErrors.heartbeatIntervalSeconds}
                min={30}
                max={86400}
                required
              />

              <Input
                label="Grace Period (sec)"
                type="number"
                name="heartbeatGraceSeconds"
                value={formData.heartbeatGraceSeconds ?? 30}
                onChange={handleChange}
                error={fieldErrors.heartbeatGraceSeconds}
                min={0}
                max={86400}
              />
            </div>

            <div className={styles.heartbeatBox}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Heartbeat Ping URL:</span>
              <div className={styles.urlDisplayRow}>
                <code className={styles.pingUrlCode}>
                  {initialService?.heartbeatToken
                    ? `${window.location.origin}/api/heartbeat/${initialService.heartbeatToken}`
                    : `${window.location.origin}/api/heartbeat/<generated-on-save>`}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyPingUrl}
                >
                  {copiedPing ? 'Copied!' : 'Copy Ping URL'}
                </Button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Supports both <code>GET</code> and <code>POST</code> requests from curl, crontab, or scheduled workers.
              </span>
            </div>
          </div>
        )}

        <div className={styles.row}>
          <Select
            label="Environment"
            name="environment"
            value={formData.environment}
            onChange={handleChange}
            options={[
              { label: 'Production', value: 'production' },
              { label: 'Staging', value: 'staging' },
            ]}
          />

          <Select
            label="Priority Level"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Critical', value: 'critical' },
            ]}
          />
        </div>

        {/* Group Selector with search-as-you-type pagination discipline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Input
            label="Filter Groups (search-as-you-type)"
            type="text"
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder="Type to search groups..."
          />
          <Select
            label="Select Service Group"
            name="groupId"
            value={formData.groupId || ''}
            onChange={handleChange}
            options={[
              { label: 'None (No Group)', value: '' },
              ...groupsList.map((g: ServiceGroup) => ({ label: g.name, value: g.id })),
            ]}
          />
        </div>

        {/* Tags input (add-on-enter chip input) */}
        <div className={styles.tagsContainer}>
          <Input
            label="Tags (Press Enter to add tag)"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="e.g. core, auth, v1"
          />
          {formData.tags && formData.tags.length > 0 && (
            <div className={styles.tagsList}>
              {formData.tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  {tag}
                  <button
                    type="button"
                    className={styles.removeTagButton}
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />
          Active (Monitored)
        </label>

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : initialService ? 'Save Changes' : 'Create Service'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default ServiceFormDrawer;
