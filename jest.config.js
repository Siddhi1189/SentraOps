/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  // Automatically apply module mocks for infrastructure adapters
  // so tests don't need real DB/Redis connections
  moduleNameMapper: {
    '^ioredis$': '<rootDir>/tests/__mocks__/ioredis.cjs',
  },
  // Forcibly close any open handles after tests complete
  forceExit: true,
  // Reasonable timeout for integration-style tests
  testTimeout: 15000,
  verbose: true,
};
