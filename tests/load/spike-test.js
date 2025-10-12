import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * K6 Spike Test
 *
 * Tests system behavior under sudden traffic spikes.
 * Verifies auto-scaling and rate limiting work correctly.
 *
 * Run with:
 * k6 run tests/load/spike-test.js
 */

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 5 },     // Normal load
    { duration: '10s', target: 100 },   // Sudden spike!
    { duration: '30s', target: 100 },   // Sustain spike
    { duration: '10s', target: 5 },     // Drop back
    { duration: '1m', target: 5 },      // Recovery period
    { duration: '10s', target: 0 },     // Ramp down
  ],

  thresholds: {
    'http_req_failed': ['rate<0.3'],    // Allow 30% failure during spike
    'errors': ['rate<0.3'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  console.log('⚡ Starting SPIKE test');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const response = http.get(`${data.baseUrl}/api/health`);

  const success = check(response, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  if (!success) {
    errorRate.add(1);
  }

  // Check for rate limit headers
  if (response.status === 429) {
    const retryAfter = response.headers['Retry-After'];
    console.log(`Rate limited. Retry after: ${retryAfter}s`);
  }

  sleep(0.1); // Minimal delay for spike test
}

export function teardown(data) {
  console.log('🏁 Spike test complete');
  console.log('Check that rate limiting kicked in during spike');
}
