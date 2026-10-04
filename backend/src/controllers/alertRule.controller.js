import AlertRuleRepository from '../repositories/alertRule.repository.js';
import { maskChannels } from '../utils/maskSecret.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

function formatRuleResponse(rule) {
  if (!rule) return rule;
  const copy = { ...rule };
  if (copy.channels) {
    copy.channels = maskChannels(copy.channels);
  }
  if (copy.fires && copy.fires.length > 0) {
    copy.lastFiredAt = copy.fires[0].firedAt;
  } else {
    copy.lastFiredAt = null;
  }
  return copy;
}

export async function listAlertRules(req, res, next) {
  try {
    const { organizationId } = req.user;
    const rules = await AlertRuleRepository.findMany(organizationId);

    return res.json({
      success: true,
      data: rules.map(formatRuleResponse),
    });
  } catch (err) {
    next(err);
  }
}

export async function getAlertRule(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const rule = await AlertRuleRepository.findById(id, organizationId);
    if (!rule) {
      throw new AppError('Alert rule not found', 404);
    }

    return res.json({
      success: true,
      data: formatRuleResponse(rule),
    });
  } catch (err) {
    next(err);
  }
}

export async function createAlertRule(req, res, next) {
  try {
    const { organizationId } = req.user;
    const {
      name,
      trigger,
      conditions,
      serviceId,
      projectId,
      channelIds,
      cooldownSeconds,
      isActive,
    } = req.body;

    logger.info(`Creating alert rule "${name}" (${trigger}) for org ${organizationId}`);

    const rule = await AlertRuleRepository.create(organizationId, {
      name,
      trigger,
      conditions,
      serviceId,
      projectId,
      channelIds,
      cooldownSeconds,
      isActive,
    });

    return res.status(201).json({
      success: true,
      data: formatRuleResponse(rule),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAlertRule(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const existing = await AlertRuleRepository.findById(id, organizationId);
    if (!existing) {
      throw new AppError('Alert rule not found', 404);
    }

    const updated = await AlertRuleRepository.update(id, organizationId, req.body);

    return res.json({
      success: true,
      data: formatRuleResponse(updated),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAlertRule(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const existing = await AlertRuleRepository.findById(id, organizationId);
    if (!existing) {
      throw new AppError('Alert rule not found', 404);
    }

    await AlertRuleRepository.delete(id, organizationId);

    return res.json({
      success: true,
      message: 'Alert rule deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function snoozeAlertRule(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { until } = req.body;

    const existing = await AlertRuleRepository.findById(id, organizationId);
    if (!existing) {
      throw new AppError('Alert rule not found', 404);
    }

    const untilDate = new Date(until);
    if (isNaN(untilDate.getTime())) {
      throw new AppError('Invalid snooze until date', 400);
    }

    const updated = await AlertRuleRepository.snooze(id, organizationId, untilDate);

    return res.json({
      success: true,
      data: formatRuleResponse(updated),
      message: `Alert rule snoozed until ${untilDate.toISOString()}`,
    });
  } catch (err) {
    next(err);
  }
}

export async function unsnoozeAlertRule(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const existing = await AlertRuleRepository.findById(id, organizationId);
    if (!existing) {
      throw new AppError('Alert rule not found', 404);
    }

    const updated = await AlertRuleRepository.unsnooze(id, organizationId);

    return res.json({
      success: true,
      data: formatRuleResponse(updated),
      message: 'Alert rule snooze removed',
    });
  } catch (err) {
    next(err);
  }
}

export default {
  listAlertRules,
  getAlertRule,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  snoozeAlertRule,
  unsnoozeAlertRule,
};
