import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * K6 Stress Test
 *
 * Gradually increases load to find breaking point of the system.
 * Tests how the system degrades under extreme load.
 *
 * Run with:
 * k6 run tests/load/stress-test.js
 */

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Warm up
    { duration: '5m', target: 10 },    // Stay at normal load
    { duration: '2m', target: 20 },    // Increase load
    { duration: '5m', target: 20 },    // Stay at higher load
    { duration: '2m', target: 50 },    // Spike to stress level
    { duration: '5m', target: 50 },    // Maintain stress
    { duration: '2m', target: 100 },   // Beyond normal capacity
    { duration: '5m', target: 100 },   // See how system handles
    { duration: '5m', target: 0 },     // Recovery
  ],

  thresholds: {
    'http_req_duration': ['p(99)<10000'], // 99% under 10s
    'http_req_failed': ['rate<0.5'],      // Less than 50% failure
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  console.log('⚠️  Starting STRESS test - This will push the system to its limits');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  // Mix of different endpoints
  const endpoints = [
    { method: 'GET', url: `${data.baseUrl}/api/health` },
    { method: 'GET', url: `${data.baseUrl}/` },
    { method: 'GET', url: `${data.baseUrl}/pricing` },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const startTime = Date.now();
  const response = http.get(endpoint.url, {
    timeout: '30s',
  });
  const duration = Date.now() - startTime;

  responseTime.add(duration);

  const success = check(response, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time acceptable': (r) => r.timings.duration < 10000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(0.5); // Minimal think time for stress test
}

export function teardown(data) {
  console.log('🏁 Stress test complete');
  console.log('Review metrics to identify breaking point and degradation patterns');
}
