import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * K6 Load Test: Agent Execution
 *
 * Tests the performance and reliability of the agent execution endpoint
 * under various load conditions.
 *
 * Run with:
 * k6 run tests/load/agent-execution.js
 *
 * Or with custom parameters:
 * k6 run --vus 10 --duration 30s tests/load/agent-execution.js
 */

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  // Load test stages
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Spike to 20 users
    { duration: '1m', target: 10 },   // Scale down to 10
    { duration: '30s', target: 0 },   // Ramp down
  ],

  // Thresholds - Define SLAs
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'errors': ['rate<0.1'],                             // Error rate under 10%
    'http_req_failed': ['rate<0.1'],                    // Request failure rate under 10%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const prompts = [
  'Explain quantum computing in simple terms',
  'Write a function to calculate fibonacci numbers',
  'What is the capital of France?',
  'Translate "Hello World" to Spanish',
  'Summarize the history of the internet',
  'Calculate 123 * 456',
  'What are the benefits of TypeScript?',
  'Explain REST API principles',
  'Generate a random password',
  'What is machine learning?',
];

const models = [
  'gpt-3.5-turbo',
  'gpt-4',
];

export function setup() {
  console.log('🚀 Starting load test...');
  console.log(`Target: ${BASE_URL}`);

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);

  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed with status ${healthCheck.status}`);
  }

  console.log('✅ API is accessible');

  return {
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
  };
}

export default function (data) {
  // Select random prompt and model
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  const model = models[Math.floor(Math.random() * models.length)];

  // Prepare request
  const payload = JSON.stringify({
    prompt,
    model,
    temperature: 0.7,
    maxTokens: 500,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `__session=${data.authToken}`,
    },
    timeout: '30s',
  };

  // Make request
  const startTime = Date.now();
  const response = http.post(
    `${data.baseUrl}/api/agent/execute`,
    payload,
    params
  );
  const duration = Date.now() - startTime;

  // Record metrics
  responseTime.add(duration);

  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has body': (r) => r.body.length > 0,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
    console.error(`Request failed: ${response.status} - ${response.body}`);
  }

  // Think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  console.log('🏁 Load test complete');
  console.log(`Total successful requests: ${successfulRequests.count}`);
  console.log(`Total failed requests: ${failedRequests.count}`);
}
