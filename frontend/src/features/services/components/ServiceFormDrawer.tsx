import { useState, useEffect } from 'react';
import type React from 'react';
import type { Service, ServiceGroup } from '../../../types/domain';
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
  });

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
        url: initialService.url,
        httpMethod: initialService.httpMethod,
        expectedStatusCode: initialService.expectedStatusCode,
        timeoutMs: initialService.timeoutMs,
        checkIntervalSeconds: initialService.checkIntervalSeconds,
        environment: initialService.environment,
        priority: initialService.priority,
        groupId: initialService.groupId || null,
        isActive: initialService.isActive,
        tags: initialService.tags || [],
      });
    } else {
      setFormData({
        name: '',
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
      });
    }
    setFieldErrors({});
    setGroupSearch('');
    setTagInput('');
  }, [initialService, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (name === 'expectedStatusCode' || name === 'timeoutMs' || name === 'checkIntervalSeconds') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = createServiceSchema.safeParse(formData);
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

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={drawerTitle}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label="Service Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
          placeholder="e.g. Authentication Service"
          required
        />

        <Input
          label="Target URL"
          name="url"
          value={formData.url}
          onChange={handleChange}
          error={fieldErrors.url}
          placeholder="https://auth.example.com/health"
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
