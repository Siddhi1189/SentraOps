import crypto from 'crypto';

/**
 * Extract up to 3 in-app stack frames formatted as "file:function".
 * In-app frames are defined as frames NOT containing "node_modules" or "node:".
 * @param {string} [stack] Raw stack trace string
 * @returns {string[]} Array of up to 3 "file:function" strings
 */
export function extractInAppFrames(stack) {
  if (!stack || typeof stack !== 'string') {
    return [];
  }

  const lines = stack.split('\n');
  const inAppFrames = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith('at ')) {
      continue;
    }

    // Filter out third-party and runtime frames
    if (line.includes('node_modules') || line.includes('node:') || line.includes('internal/')) {
      continue;
    }

    // Try parsing: "at functionName (/path/to/file.js:12:34)"
    const parenMatch = line.match(/^at\s+(?:async\s+)?([^\s(]+)\s*\((.+?)(?::\d+)?(?::\d+)?\)$/);
    if (parenMatch) {
      const funcName = parenMatch[1];
      const filePath = parenMatch[2];
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      inAppFrames.push(`${fileName}:${funcName}`);
      if (inAppFrames.length >= 3) break;
      continue;
    }

    // Try parsing: "at /path/to/file.js:12:34"
    const directMatch = line.match(/^at\s+(?:async\s+)?(.+?)(?::\d+)?(?::\d+)?$/);
    if (directMatch) {
      const filePath = directMatch[1];
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      inAppFrames.push(`${fileName}:anonymous`);
      if (inAppFrames.length >= 3) break;
    }
  }

  return inAppFrames;
}

/**
 * Compute issue fingerprint: sha1(errorType + "|" + first 3 in-app stack frames as file:function)
 * @param {string} errorType e.g. "TypeError", "Error", "DatabaseError"
 * @param {string} [stack] Stack trace
 * @returns {string} 40-character hex SHA-1 digest
 */
export function computeFingerprint(errorType, stack) {
  const type = (errorType || 'Error').trim();
  const frames = extractInAppFrames(stack);
  const frameStr = frames.length > 0 ? frames.join(',') : 'none';
  const rawFingerprint = `${type}|${frameStr}`;

  return crypto.createHash('sha1').update(rawFingerprint).digest('hex');
}

export default {
  extractInAppFrames,
  computeFingerprint,
};
