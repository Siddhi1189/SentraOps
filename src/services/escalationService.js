import EscalationPolicyRepository from '../repositories/escalationPolicy.repository.js';
import AppError from '../utils/AppError.js';

class EscalationService {
  static async list(organizationId) {
    return EscalationPolicyRepository.findMany(organizationId);
  }

  static async get(organizationId, id) {
    const policy = await EscalationPolicyRepository.findById(id, organizationId);
    if (!policy) throw new AppError('Escalation policy not found', 404, 'NOT_FOUND');
    return policy;
  }

  static async upsert(organizationId, data) {
    const { serviceId, warningThreshold, incidentThreshold, criticalThreshold } = data;

    // Enforce threshold ordering
    if (warningThreshold >= incidentThreshold) {
      throw new AppError(
        'warning_threshold must be less than incident_threshold',
        400,
        'INVALID_THRESHOLDS'
      );
    }
    if (incidentThreshold >= criticalThreshold) {
      throw new AppError(
        'incident_threshold must be less than critical_threshold',
        400,
        'INVALID_THRESHOLDS'
      );
    }

    return EscalationPolicyRepository.upsert(organizationId, {
      serviceId: serviceId || null,
      warningThreshold,
      incidentThreshold,
      criticalThreshold,
    });
  }

  static async remove(organizationId, id) {
    const policy = await EscalationPolicyRepository.findById(id, organizationId);
    if (!policy) throw new AppError('Escalation policy not found', 404, 'NOT_FOUND');
    if (!policy.serviceId) {
      throw new AppError(
        'Cannot delete the organization-wide default escalation policy',
        400,
        'CANNOT_DELETE_DEFAULT'
      );
    }
    await EscalationPolicyRepository.delete(id, organizationId);
  }
}

export default EscalationService;
