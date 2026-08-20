import { useState, useEffect } from 'react';
import type React from 'react';
import type { ServiceGroup } from '../../../types/domain';
import {
  createGroupSchema,
  type CreateGroupPayload,
} from '../../../types/services';
import { Drawer } from '../../../components/ui/Drawer/Drawer';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import styles from './ServiceFormDrawer.module.css';

export interface GroupFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupPayload) => Promise<void>;
  groups: ServiceGroup[];
  initialGroup?: ServiceGroup | null;
  isSubmitting?: boolean;
}

export function GroupFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  groups,
  initialGroup,
  isSubmitting = false,
}: GroupFormDrawerProps) {
  const [formData, setFormData] = useState<CreateGroupPayload>({
    name: '',
    parentGroupId: null,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialGroup) {
      setFormData({
        name: initialGroup.name,
        parentGroupId: initialGroup.parentGroupId || null,
      });
    } else {
      setFormData({
        name: '',
        parentGroupId: null,
      });
    }
    setFieldErrors({});
  }, [initialGroup, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let val: any = value;
    if (name === 'parentGroupId') {
      val = value === '' ? null : value;
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined as any }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = createGroupSchema.safeParse(formData);
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

  const availableParentGroups = groups.filter((g) => g.id !== initialGroup?.id);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialGroup ? `Edit Group: ${initialGroup.name}` : 'Create Service Group'}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label="Group Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
          placeholder="e.g. Core Infrastructure"
          required
        />

        <Select
          label="Parent Group (Optional)"
          name="parentGroupId"
          value={formData.parentGroupId || ''}
          onChange={handleChange}
          options={[
            { label: 'None (Top Level)', value: '' },
            ...availableParentGroups.map((g) => ({ label: g.name, value: g.id })),
          ]}
        />

        <div className={styles.footer}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : initialGroup ? 'Save Changes' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
