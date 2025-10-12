#!/usr/bin/env tsx

/**
 * Test Report Generator
 *
 * Aggregates test results from various test suites and generates
 * a comprehensive HTML report.
 *
 * Usage:
 * npm run test:report
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }>;
}

interface ReportData {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  passRate: number;
  suites: TestResult[];
}

async function main() {
  console.log('📊 Generating test report...\n');

  const reportData: ReportData = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalSkipped: 0,
    totalDuration: 0,
    passRate: 0,
    suites: [],
  };

  // Collect results from various test outputs
  const resultFiles = [
    'test-results/e2e-results.json',
    'test-results/unit-results.json',
    'test-results/integration-results.json',
  ];

  for (const file of resultFiles) {
    const filePath = path.resolve(process.cwd(), file);

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const results = JSON.parse(content);
        processResults(results, reportData);
      } catch (error) {
        console.error(`Failed to process ${file}:`, error);
      }
    }
  }

  // Calculate totals
  reportData.totalTests = reportData.totalPassed + reportData.totalFailed + reportData.totalSkipped;
  reportData.passRate = reportData.totalTests > 0
    ? (reportData.totalPassed / reportData.totalTests) * 100
    : 0;

  // Generate HTML report
  const htmlReport = generateHTMLReport(reportData);

  // Save report
  const reportPath = path.resolve(process.cwd(), 'test-results/report.html');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, htmlReport);

  // Generate JSON summary
  const jsonPath = path.resolve(process.cwd(), 'test-results/summary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

  // Print summary
  printSummary(reportData);

  console.log(`\n✅ Report generated: ${reportPath}`);
  console.log(`📄 JSON summary: ${jsonPath}\n`);
}

function processResults(results: any, reportData: ReportData) {
  // Handle Playwright JSON format
  if (results.suites) {
    results.suites.forEach((suite: any) => {
      const suiteData: TestResult = {
        suite: suite.title || 'Unknown Suite',
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: suite.duration || 0,
        tests: [],
      };

      suite.specs?.forEach((spec: any) => {
        spec.tests?.forEach((test: any) => {
          const status = test.status === 'expected' ? 'passed' :
            test.status === 'skipped' ? 'skipped' : 'failed';

          suiteData.tests.push({
            name: test.title,
            status,
            duration: test.duration || 0,
            error: test.error?.message,
          });

          if (status === 'passed') suiteData.passed++;
          else if (status === 'failed') suiteData.failed++;
          else suiteData.skipped++;
        });
      });

      reportData.suites.push(suiteData);
      reportData.totalPassed += suiteData.passed;
      reportData.totalFailed += suiteData.failed;
      reportData.totalSkipped += suiteData.skipped;
      reportData.totalDuration += suiteData.duration;
    });
  }
}

function generateHTMLReport(data: ReportData): string {
  const statusColor = data.passRate === 100 ? '#10b981' :
    data.passRate >= 80 ? '#f59e0b' : '#ef4444';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - ${new Date(data.timestamp).toLocaleString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .timestamp { opacity: 0.8; font-size: 0.9rem; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: #1e293b;
      padding: 1.5rem;
      border-radius: 0.5rem;
      border-left: 4px solid;
    }
    .stat-card.total { border-color: #3b82f6; }
    .stat-card.passed { border-color: #10b981; }
    .stat-card.failed { border-color: #ef4444; }
    .stat-card.skipped { border-color: #f59e0b; }
    .stat-card.duration { border-color: #8b5cf6; }
    .stat-label { font-size: 0.875rem; opacity: 0.7; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .pass-rate {
      font-size: 3rem;
      font-weight: bold;
      color: ${statusColor};
      text-align: center;
      margin: 2rem 0;
    }
    .suite {
      background: #1e293b;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }
    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .suite-title { font-size: 1.25rem; font-weight: 600; }
    .suite-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
    }
    .test {
      padding: 0.75rem;
      margin: 0.5rem 0;
      border-radius: 0.25rem;
      background: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-name { flex: 1; }
    .test-status {
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }
    .status-passed { background: #10b981; color: white; }
    .status-failed { background: #ef4444; color: white; }
    .status-skipped { background: #f59e0b; color: white; }
    .test-duration { opacity: 0.6; font-size: 0.875rem; }
    .error { color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Test Report</h1>
      <div class="timestamp">${new Date(data.timestamp).toLocaleString()}</div>
    </div>

    <div class="pass-rate">
      ${data.passRate.toFixed(1)}% Pass Rate
    </div>

    <div class="summary">
      <div class="stat-card total">
        <div class="stat-label">Total Tests</div>
        <div class="stat-value">${data.totalTests}</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-label">Passed</div>
        <div class="stat-value">${data.totalPassed}</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-label">Failed</div>
        <div class="stat-value">${data.totalFailed}</div>
      </div>
      <div class="stat-card skipped">
        <div class="stat-label">Skipped</div>
        <div class="stat-value">${data.totalSkipped}</div>
      </div>
      <div class="stat-card duration">
        <div class="stat-label">Duration</div>
        <div class="stat-value">${(data.totalDuration / 1000).toFixed(1)}s</div>
      </div>
    </div>

    ${data.suites.map(suite => `
      <div class="suite">
        <div class="suite-header">
          <div class="suite-title">${suite.suite}</div>
          <div class="suite-stats">
            <span style="color: #10b981">✓ ${suite.passed}</span>
            <span style="color: #ef4444">✗ ${suite.failed}</span>
            <span style="color: #f59e0b">⊘ ${suite.skipped}</span>
          </div>
        </div>
        ${suite.tests.map(test => `
          <div class="test">
            <div class="test-name">
              ${test.name}
              ${test.error ? `<div class="error">${test.error}</div>` : ''}
            </div>
            <span class="test-status status-${test.status}">${test.status.toUpperCase()}</span>
            <span class="test-duration">${(test.duration / 1000).toFixed(2)}s</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
}

function printSummary(data: ReportData) {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║           TEST EXECUTION SUMMARY            ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  console.log(`Total Tests:    ${data.totalTests}`);
  console.log(`Passed:         ${data.totalPassed} ✓`);
  console.log(`Failed:         ${data.totalFailed} ✗`);
  console.log(`Skipped:        ${data.totalSkipped} ⊘`);
  console.log(`Pass Rate:      ${data.passRate.toFixed(1)}%`);
  console.log(`Duration:       ${(data.totalDuration / 1000).toFixed(2)}s`);

  console.log('\nTest Suites:');
  data.suites.forEach((suite) => {
    const status = suite.failed === 0 ? '✓' : '✗';
    console.log(`  ${status} ${suite.suite} (${suite.passed}/${suite.passed + suite.failed})`);
  });
}

// Run the script
main().catch((error) => {
  console.error('Failed to generate report:', error);
  process.exit(1);
});
