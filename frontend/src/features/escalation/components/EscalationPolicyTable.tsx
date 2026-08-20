import type { EscalationPolicy } from '../types/escalation';
import type { Service } from '../../../types/domain';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../../../components/ui/Table/Table';
import { Button } from '../../../components/ui/Button/Button';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import styles from './EscalationPolicyTable.module.css';

export interface EscalationPolicyTableProps {
  policies: EscalationPolicy[];
  servicesMap?: Record<string, Service>;
  onEdit: (policy: EscalationPolicy) => void;
  onDelete: (policy: EscalationPolicy) => void;
}

export function EscalationPolicyTable({
  policies,
  servicesMap = {},
  onEdit,
  onDelete,
}: EscalationPolicyTableProps) {
  const { user } = useSession();
  const canManage = can(user, 'escalation:manage');

  return (
    <Table responsive>
      <TableHeader>
        <TableRow>
          <TableCell as="th">Scope / Target</TableCell>
          <TableCell as="th">Warning Threshold</TableCell>
          <TableCell as="th">Incident Threshold</TableCell>
          <TableCell as="th">Critical Threshold</TableCell>
          {canManage && <TableCell as="th">Actions</TableCell>}
        </TableRow>
      </TableHeader>

      <TableBody>
        {policies.map((policy) => {
          const isOrgDefault = policy.serviceId === null;
          const serviceName = policy.serviceId ? servicesMap[policy.serviceId]?.name || 'Service' : null;

          return (
            <TableRow key={policy.id}>
              <TableCell dataLabel="Scope / Target">
                {isOrgDefault ? (
                  <span className={`${styles.scopeBadge} ${styles.defaultScope}`}>
                    Organization-wide Default
                  </span>
                ) : (
                  <div>
                    <span className={`${styles.scopeBadge} ${styles.customScope}`}>
                      Custom Service Override
                    </span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '4px' }}>
                      {serviceName}
                    </div>
                  </div>
                )}
              </TableCell>

              <TableCell dataLabel="Warning Threshold">
                <strong>{policy.warningThreshold}</strong> consecutive failures
              </TableCell>

              <TableCell dataLabel="Incident Threshold">
                <strong>{policy.incidentThreshold}</strong> consecutive failures
              </TableCell>

              <TableCell dataLabel="Critical Threshold">
                <strong>{policy.criticalThreshold}</strong> consecutive failures
              </TableCell>

              {canManage && (
                <TableCell dataLabel="Actions">
                  <div className={styles.actionsCell}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onEdit(policy)}
                    >
                      Edit
                    </Button>
                    {!isOrgDefault && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => onDelete(policy)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
