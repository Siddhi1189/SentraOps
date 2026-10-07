import env from './env.js';

/**
 * Normalizes an origin string by trimming whitespace and removing trailing slashes.
 * @param {string} origin
 * @returns {string}
 */
export function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  return origin.trim().replace(/\/+$/, '');
}

/**
 * Checks whether an origin is allowed by CORS.
 * Returns true if origin is falsy/undefined (requests with no Origin header).
 * Otherwise true only if the normalized origin is in the allowed CLIENT_ORIGIN list.
 * @param {string|undefined|null} origin
 * @returns {boolean}
 */
export function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  return env.CLIENT_ORIGIN.includes(normalized);
}

/**
 * Standard CORS origin callback function for Express cors middleware and Socket.IO.
 * @param {string|undefined|null} origin
 * @param {function} callback
 */
export function corsOriginCallback(origin, callback) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
