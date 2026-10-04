import crypto from 'crypto';
import ApiKeyRepository from '../repositories/apiKey.repository.js';
import ApiResponse from '../utils/apiResponse.js';

// In-memory cache for throttling lastUsedAt updates: keyId -> timestampMs
const lastUsedThrottleMap = new Map();

/**
 * Middleware to authenticate ingest requests via the x-sentraops-key header.
 */
export async function apiKeyAuth(req, res, next) {
  const rawKey = req.headers['x-sentraops-key'];

  if (!rawKey || typeof rawKey !== 'string') {
    return ApiResponse.error(res, 'MISSING_API_KEY', 'Missing x-sentraops-key header', 401);
  }

  const trimmedKey = rawKey.trim();
  const keyHash = crypto.createHash('sha256').update(trimmedKey).digest('hex');

  try {
    const apiKey = await ApiKeyRepository.findByHash(keyHash);

    if (!apiKey || apiKey.revokedAt) {
      return ApiResponse.error(res, 'INVALID_API_KEY', 'Invalid or revoked API key', 401);
    }

    if (!apiKey.project) {
      return ApiResponse.error(res, 'PROJECT_NOT_FOUND', 'Associated project not found', 401);
    }

    // Attach project and org context to request
    req.apiKey = apiKey;
    req.projectId = apiKey.projectId || apiKey.project?.id;
    req.organizationId = apiKey.project?.organizationId;
    req.project = apiKey.project;

    // Throttle lastUsedAt updates to at most once per 60 seconds per key
    const now = Date.now();
    const lastUpdated = lastUsedThrottleMap.get(apiKey.id) || 0;
    if (now - lastUpdated >= 60000) {
      lastUsedThrottleMap.set(apiKey.id, now);
      ApiKeyRepository.updateLastUsedAt(apiKey.id).catch(() => {});
    }

    next();
  } catch (err) {
    return ApiResponse.error(res, 'INTERNAL_SERVER_ERROR', 'Failed to authenticate API key', 500);
  }
}

export default apiKeyAuth;
