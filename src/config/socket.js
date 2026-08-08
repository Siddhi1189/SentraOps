import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import env from './env.js';

let io = null;

/**
 * Initialize Socket.IO on the HTTP server
 * @param {http.Server} httpServer
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT authentication middleware for socket connections
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('Invalid or expired access token'));
    }

    socket.user = {
      id: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
    };
    next();
  });

  io.on('connection', (socket) => {
    const { organizationId, id: userId } = socket.user;

    // Join the organization's private room
    const room = `org_${organizationId}`;
    socket.join(room);
    logger.info(`Socket connected: user=${userId} org=${organizationId} room=${room}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user=${userId}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

/**
 * Emit an event to all sockets in an organization's room
 * @param {string} organizationId
 * @param {string} event
 * @param {Object} data
 */
function emitToOrg(organizationId, event, data) {
  if (!io) return;
  io.to(`org_${organizationId}`).emit(event, data);
}

/**
 * Get the Socket.IO server instance
 */
function getIO() {
  return io;
}

export { initSocket, emitToOrg, getIO };
export default { initSocket, emitToOrg, getIO };
