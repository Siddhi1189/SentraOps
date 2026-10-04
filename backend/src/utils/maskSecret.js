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

export default {
  maskSecretUrl,
  isMaskedUrl,
  maskChannelConfig,
  maskChannels,
};
