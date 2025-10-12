import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

/**
 * K6 Load Test: RAG Operations
 *
 * Tests document upload and search performance under load.
 *
 * Run with:
 * k6 run tests/load/rag-operations.js
 */

// Custom metrics
const errorRate = new Rate('errors');
const uploadTime = new Trend('upload_time');
const searchTime = new Trend('search_time');

export const options = {
  stages: [
    { duration: '30s', target: 3 },   // Ramp up to 3 users
    { duration: '1m', target: 5 },    // Stay at 5 users
    { duration: '30s', target: 0 },   // Ramp down
  ],

  thresholds: {
    'upload_time': ['p(95)<5000'],      // 95% uploads under 5s
    'search_time': ['p(95)<1000'],      // 95% searches under 1s
    'errors': ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Sample documents for upload
const documents = [
  {
    name: 'sample1.txt',
    content: 'This is a sample document about artificial intelligence and machine learning.',
  },
  {
    name: 'sample2.txt',
    content: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
  },
  {
    name: 'sample3.txt',
    content: 'Kubernetes is an open-source container orchestration platform.',
  },
];

// Search queries
const queries = [
  'artificial intelligence',
  'TypeScript programming',
  'container orchestration',
  'machine learning algorithms',
  'software development',
];

export function setup() {
  console.log('🚀 Starting RAG load test...');
  return { baseUrl: BASE_URL, authToken: AUTH_TOKEN };
}

export default function (data) {
  const iteration = Math.random();

  // 30% upload, 70% search
  if (iteration < 0.3) {
    testDocumentUpload(data);
  } else {
    testDocumentSearch(data);
  }

  sleep(Math.random() * 2 + 1);
}

function testDocumentUpload(data) {
  const doc = documents[Math.floor(Math.random() * documents.length)];

  const fd = new FormData();
  fd.append('file', http.file(Buffer.from(doc.content), doc.name, 'text/plain'));

  const startTime = Date.now();
  const response = http.post(
    `${data.baseUrl}/api/rag/upload`,
    fd.body(),
    {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${fd.boundary}`,
        'Cookie': `__session=${data.authToken}`,
      },
      timeout: '30s',
    }
  );
  const duration = Date.now() - startTime;

  uploadTime.add(duration);

  const success = check(response, {
    'upload status is 200': (r) => r.status === 200,
    'upload has documentId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.documentId !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
    console.error(`Upload failed: ${response.status}`);
  }
}

function testDocumentSearch(data) {
  const query = queries[Math.floor(Math.random() * queries.length)];
  const method = Math.random() > 0.5 ? 'vector' : 'hybrid';

  const payload = JSON.stringify({
    query,
    method,
    topK: 5,
  });

  const startTime = Date.now();
  const response = http.post(
    method === 'hybrid'
      ? `${data.baseUrl}/api/rag/hybrid-search`
      : `${data.baseUrl}/api/rag/search`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__session=${data.authToken}`,
      },
      timeout: '10s',
    }
  );
  const duration = Date.now() - startTime;

  searchTime.add(duration);

  const success = check(response, {
    'search status is 200': (r) => r.status === 200,
    'search has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.results);
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
    console.error(`Search failed: ${response.status}`);
  }
}

export function teardown(data) {
  console.log('🏁 RAG load test complete');
}
