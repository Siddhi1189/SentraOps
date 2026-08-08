/**
 * Manual Jest mock for ioredis.
 * Replaces all ioredis connections with a no-op stub.
 * This prevents tests from requiring a real Redis instance.
 */
const mockRedisInstance = {
  connect: jest.fn().mockResolvedValue(undefined),
  ping: jest.fn().mockResolvedValue('PONG'),
  quit: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  subscribe: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(0),
  on: jest.fn().mockReturnThis(),
  once: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  removeListener: jest.fn().mockReturnThis(),
  status: 'ready',
};

const MockRedis = jest.fn().mockImplementation(() => mockRedisInstance);
MockRedis.prototype = mockRedisInstance;

module.exports = MockRedis;
