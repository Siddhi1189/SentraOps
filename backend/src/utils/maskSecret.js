/**
 * Mask secret URLs (e.g. Slack Webhooks, Webhooks) so credentials are never returned in full
 * e.g. https://hooks.slack.com/services/T00/B00/XXXXX -> https://hooks.slack.com/...****
 * @param {string} url
 * @returns {string}
 */
export function maskSecretUrl(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/...****`;
  } catch {
    if (url.length <= 8) return '****';
    return `${url.slice(0, 8)}...****`;
  }
}

/**
 * Check if a URL has already been masked
 * @param {string} url
 * @returns {boolean}
 */
export function isMaskedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('...****') || url === '****';
}

/**
 * Mask channel config object so webhook/slack URLs are safe for client responses
 * @param {Object} channel
 * @returns {Object}
 */
export function maskChannelConfig(channel) {
  if (!channel) return channel;
  const copy = { ...channel };
  if (copy.config && typeof copy.config === 'object') {
    copy.config = { ...copy.config };
    if (copy.config.url) {
      copy.config.url = maskSecretUrl(copy.config.url);
    }
  }
  return copy;
}

/**
 * Mask multiple channels
 * @param {Array} channels
 * @returns {Array}
 */
export function maskChannels(channels) {
  if (!Array.isArray(channels)) return channels;
  return channels.map((c) => maskChannelConfig(c));
}

const SECRET_HEADER_KEYWORDS = [
  'authorization',
  'x-api-key',
  'api-key',
  'x-auth-token',
  'x-secret',
  'proxy-authorization',
  'cookie',
  'token',
  'secret',
  'password',
];

/**
 * Check if a header name is sensitive
 * @param {string} name
 * @returns {boolean}
 */
export function isSensitiveHeader(name) {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase();
  return SECRET_HEADER_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Mask a secret header value
 * @param {string} val
 * @returns {string}
 */
export function maskSecretHeaderValue(val) {
  if (!val || typeof val !== 'string') return '****';
  if (val.length <= 6) return '****';
  return `${val.slice(0, 4)}...****`;
}

/**
 * Check if a header value is already masked
 * @param {string} val
 * @returns {boolean}
 */
export function isMaskedHeaderValue(val) {
  if (!val || typeof val !== 'string') return false;
  return val.endsWith('...****') || val === '****';
}

/**
 * Mask secret headers in a request headers object
 * @param {Object} headers
 * @returns {Object}
 */
export function maskRequestHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers;
  const masked = {};
  for (const [key, value] of Object.entries(headers)) {
    if (isSensitiveHeader(key) && typeof value === 'string') {
      masked[key] = maskSecretHeaderValue(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

/**
 * Merge updated request headers preserving unmasked secret values if client submitted masked value
 * @param {Object} existingHeaders
 * @param {Object} incomingHeaders
 * @returns {Object}
 */
export function mergeRequestHeaders(existingHeaders, incomingHeaders) {
  if (!incomingHeaders || typeof incomingHeaders !== 'object') return incomingHeaders;
  if (!existingHeaders || typeof existingHeaders !== 'object') return incomingHeaders;

  const merged = { ...incomingHeaders };
  for (const [key, val] of Object.entries(merged)) {
    if (isMaskedHeaderValue(val) && existingHeaders[key]) {
      merged[key] = existingHeaders[key];
    }
  }
  return merged;
}

/**
 * Mask sensitive fields on a service object (such as requestHeaders)
 * @param {Object} service
 * @returns {Object}
 */
export function maskServiceSecrets(service) {
  if (!service) return service;
  const copy = { ...service };
  if (copy.requestHeaders && typeof copy.requestHeaders === 'object') {
    copy.requestHeaders = maskRequestHeaders(copy.requestHeaders);
  }
  return copy;
}

/**
 * Mask sensitive fields across an array of services
 * @param {Array} services
 * @returns {Array}
 */
export function maskServicesSecrets(services) {
  if (!Array.isArray(services)) return services;
  return services.map((s) => maskServiceSecrets(s));
}

export default {
  maskSecretUrl,
  isMaskedUrl,
  maskChannelConfig,
  maskChannels,
  isSensitiveHeader,
  maskSecretHeaderValue,
  isMaskedHeaderValue,
  maskRequestHeaders,
  mergeRequestHeaders,
  maskServiceSecrets,
  maskServicesSecrets,
};
