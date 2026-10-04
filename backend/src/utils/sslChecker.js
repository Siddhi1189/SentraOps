import tls from 'tls';
import { URL } from 'url';

/**
 * Check SSL certificate expiration days remaining for an HTTPS URL.
 * @param {string} urlString
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<number|null>}
 */
export async function getSslDaysRemaining(urlString, timeoutMs = 5000) {
  if (!urlString || typeof urlString !== 'string') return null;

  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') return null;

    const host = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port, 10) : 443;

    return new Promise((resolve) => {
      let resolved = false;

      const finish = (result) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      const socket = tls.connect(
        {
          host,
          port,
          servername: host,
          rejectUnauthorized: false, // Extract certificate even if self-signed or staging
          timeout: timeoutMs,
        },
        () => {
          try {
            const cert = socket.getPeerCertificate();
            socket.end();

            if (!cert || !cert.valid_to) {
              return finish(null);
            }

            const validTo = new Date(cert.valid_to);
            const diffMs = validTo.getTime() - Date.now();
            const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            finish(daysRemaining);
          } catch {
            finish(null);
          }
        }
      );

      socket.on('error', () => {
        socket.destroy();
        finish(null);
      });

      socket.on('timeout', () => {
        socket.destroy();
        finish(null);
      });
    });
  } catch {
    return null;
  }
}

export default { getSslDaysRemaining };
