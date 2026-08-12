/**
 * Utility to compute compact field-level change diffs between two objects
 * @param {Object} oldObj 
 * @param {Object} newObj 
 * @param {Array<string>} [ignoreKeys] 
 * @returns {Object|null} Map of modified fields with { old, new } values
 */
function computeFieldDiff(oldObj = {}, newObj = {}, ignoreKeys = ['updatedAt', 'createdAt', 'id', 'organizationId']) {
  if (!oldObj || !newObj) return null;

  const diff = {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    if (ignoreKeys.includes(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = {
        old: oldVal !== undefined ? oldVal : null,
        new: newVal !== undefined ? newVal : null,
      };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

export { computeFieldDiff };
export default { computeFieldDiff };
