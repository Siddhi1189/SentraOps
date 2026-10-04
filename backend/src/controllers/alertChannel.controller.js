import AlertChannelRepository from '../repositories/alertChannel.repository.js';
import AlertRuleService from '../services/alertRuleService.js';
import { maskChannelConfig, maskChannels, isMaskedUrl } from '../utils/maskSecret.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

export async function listAlertChannels(req, res, next) {
  try {
    const { organizationId } = req.user;
    const channels = await AlertChannelRepository.findMany(organizationId);
    return res.json({
      success: true,
      data: maskChannels(channels),
    });
  } catch (err) {
    next(err);
  }
}

export async function getAlertChannel(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const channel = await AlertChannelRepository.findById(id, organizationId);
    if (!channel) {
      throw new AppError('Alert channel not found', 404);
    }

    return res.json({
      success: true,
      data: maskChannelConfig(channel),
    });
  } catch (err) {
    next(err);
  }
}

export async function createAlertChannel(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { name, type, config, isActive } = req.body;

    logger.info(`Creating alert channel "${name}" of type "${type}" for org ${organizationId}`);

    const channel = await AlertChannelRepository.create(organizationId, {
      name,
      type,
      config,
      isActive,
    });

    return res.status(201).json({
      success: true,
      data: maskChannelConfig(channel),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAlertChannel(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const existing = await AlertChannelRepository.findById(id, organizationId);
    if (!existing) {
      throw new AppError('Alert channel not found', 404);
    }

    const updateData = { ...req.body };

    // Prevent overwriting real secret URL with a masked URL
    if (updateData.config) {
      const mergedConfig = { ...(existing.config || {}), ...updateData.config };
      if (updateData.config.url && isMaskedUrl(updateData.config.url)) {
        mergedConfig.url = existing.config?.url;
      }
      updateData.config = mergedConfig;
    }

    const updated = await AlertChannelRepository.update(id, organizationId, updateData);

    return res.json({
      success: true,
      data: maskChannelConfig(updated),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAlertChannel(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const existing = await AlertChannelRepository.findById(id, organizationId);
    if (!existing) {
      throw new AppError('Alert channel not found', 404);
    }

    await AlertChannelRepository.delete(id, organizationId);

    return res.json({
      success: true,
      message: 'Alert channel deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function testAlertChannel(req, res, next) {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const result = await AlertRuleService.sendTestAlert(id, organizationId, req.user);

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export default {
  listAlertChannels,
  getAlertChannel,
  createAlertChannel,
  updateAlertChannel,
  deleteAlertChannel,
  testAlertChannel,
};
