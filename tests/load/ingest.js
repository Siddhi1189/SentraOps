import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 3),
  duration: __ENV.DURATION || '15s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:4000/api/ingest/events';
const API_KEY = __ENV.API_KEY || 'sops_loadtestkey1234567890abcdefghijklmnopqrst';

export default function () {
  const payload = JSON.stringify({
    type: 'LoadTestError',
    message: `k6 synthetic event ${Date.now()}`,
    stack: 'Error: LoadTestError\n    at test (/tests/load/ingest.js:18:10)',
    level: 'error',
    environment: 'production',
    tags: {
      source: 'k6-load-test',
      vu: String(__VU),
    },
    occurredAt: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-sentraops-key': API_KEY,
    },
  };

  const res = http.post(BASE_URL, payload, params);

  if (res.status !== 202) {
    console.log(`[k6] non-202 response status=${res.status} body=${res.body}`);
  }

  check(res, {
    'status is 202': (r) => r.status === 202,
    'has valid eventId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && !!body.data.eventId;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(Number(__ENV.SLEEP || 1));
}
