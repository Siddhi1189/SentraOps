import prisma from '../config/db.js';
import { healthCheckQueue } from '../config/queue.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const recordHeartbeat = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    throw new AppError('Heartbeat token is required', 400, 'BAD_REQUEST');
  }

  const service = await prisma.service.findUnique({
    where: { heartbeatToken: token },
  });

  if (!service) {
    throw new AppError('Heartbeat monitor not found', 404, 'NOT_FOUND');
  }

  const now = new Date();
  await prisma.service.update({
    where: { id: service.id },
    data: { lastHeartbeatAt: now },
  });

  // Trigger worker check so worker evaluates status & handles incident recovery
  if (service.isActive) {
    await healthCheckQueue.add('check', { serviceId: service.id }).catch(() => {});
  }

  return ApiResponse.success(
    res,
    {
      status: 'ok',
      message: 'Heartbeat recorded successfully',
      lastHeartbeatAt: now,
    },
    200
  );
});

export default { recordHeartbeat };
