import crypto from 'crypto';
import { enqueueIngestEvent } from '../config/queue.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const ingestEvent = asyncHandler(async (req, res) => {
  const eventId = crypto.randomUUID();

  await enqueueIngestEvent({
    eventId,
    projectId: req.projectId,
    organizationId: req.organizationId,
    event: {
      ...req.body,
      occurredAt: req.body.occurredAt || new Date().toISOString(),
    },
  });

  return ApiResponse.success(res, { eventId, status: 'queued' }, 202);
});

export default {
  ingestEvent,
};
