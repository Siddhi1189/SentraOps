import { JSONPath } from 'jsonpath-plus';

/**
 * Evaluates an array of assertions against HTTP response details.
 * Exactly 5 kinds supported:
 * 1. status_code_equals: { kind: 'status_code_equals', value: number }
 * 2. body_contains: { kind: 'body_contains', value: string }
 * 3. body_does_not_contain: { kind: 'body_does_not_contain', value: string }
 * 4. json_path_equals: { kind: 'json_path_equals', path: string, value: any }
 * 5. response_time_less_than: { kind: 'response_time_less_than', value: number }
 *
 * @param {Array<Object>} assertions
 * @param {Object} context
 * @param {number} context.httpStatusCode
 * @param {number} context.responseTimeMs
 * @param {string} context.bodyString
 * @returns {{ passed: boolean, failedAssertion: Object|null, errorMessage: string|null }}
 */
export function evaluateAssertions(assertions, { httpStatusCode, responseTimeMs, bodyString = '' }) {
  if (!Array.isArray(assertions) || assertions.length === 0) {
    return { passed: true, failedAssertion: null, errorMessage: null };
  }

  for (const assertion of assertions) {
    if (!assertion || !assertion.kind) continue;

    switch (assertion.kind) {
      case 'status_code_equals': {
        const expected = Number(assertion.value);
        if (httpStatusCode !== expected) {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `Status code ${httpStatusCode} did not match expected ${expected}`,
          };
        }
        break;
      }

      case 'body_contains': {
        const needle = String(assertion.value ?? '');
        if (!bodyString.includes(needle)) {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `Response body does not contain keyword "${needle}"`,
          };
        }
        break;
      }

      case 'body_does_not_contain': {
        const needle = String(assertion.value ?? '');
        if (bodyString.includes(needle)) {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `Response body contains forbidden keyword "${needle}"`,
          };
        }
        break;
      }

      case 'json_path_equals': {
        let json;
        try {
          json = typeof bodyString === 'object' && bodyString !== null
            ? bodyString
            : JSON.parse(bodyString);
        } catch {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `Response body is not valid JSON for JSONPath "${assertion.path}"`,
          };
        }

        let results;
        try {
          results = JSONPath({ path: assertion.path, json });
        } catch (err) {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `Failed evaluating JSONPath "${assertion.path}": ${err.message}`,
          };
        }

        if (!Array.isArray(results) || results.length === 0) {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `JSONPath "${assertion.path}" returned no matching elements`,
          };
        }

        const actual = results[0];
        const expected = assertion.value;
        const matches = actual === expected || JSON.stringify(actual) === JSON.stringify(expected);

        if (!matches) {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `JSONPath "${assertion.path}" value ${JSON.stringify(actual)} did not match expected ${JSON.stringify(expected)}`,
          };
        }
        break;
      }

      case 'response_time_less_than': {
        const maxMs = Number(assertion.value);
        if (responseTimeMs >= maxMs) {
          return {
            passed: false,
            failedAssertion: assertion,
            errorMessage: `Response time ${responseTimeMs}ms exceeded threshold ${maxMs}ms`,
          };
        }
        break;
      }

      default:
        break;
    }
  }

  return { passed: true, failedAssertion: null, errorMessage: null };
}

export default { evaluateAssertions };
