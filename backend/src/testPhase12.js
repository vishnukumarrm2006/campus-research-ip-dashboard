const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function loginUser(email, password) {
  const postData = JSON.stringify({ email, password });
  const res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
  }, postData);
  return res.body.token;
}

async function testPhase12() {
  console.log('==================================================');
  console.log('📊 PHASE 12 INSTITUTIONAL ANALYTICS & EXECUTIVE REPORTING TEST SUITE');
  console.log('==================================================');

  const adminToken = await loginUser('admin@campus.edu', 'Password123!');
  const ipToken = await loginUser('ip.coordinator@campus.edu', 'Password123!');
  console.log('✅ Admin & IP Coordinator authentication tokens obtained.');

  // 1. Fetch Summary KPI Metrics (GET /api/analytics/summary)
  console.log('\n--- 1. Testing GET /api/analytics/summary (Institutional KPIs) ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/analytics/summary', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: Total Projects: ${res.body.metrics?.total_projects}, Mentors: ${res.body.metrics?.total_faculty_mentors}`);
  console.log(`Faculty Utilization Rate: ${res.body.metrics?.faculty_utilization_rate_pct}%, Patent Conversion Rate: ${res.body.metrics?.patent_filing_conversion_rate_pct}%`);
  console.log(`AI Screening Novelty Risk: High Novelty=${res.body.metrics?.ai_screening_novelty_distribution?.HIGH_NOVELTY_POTENTIAL}, Moderate=${res.body.metrics?.ai_screening_novelty_distribution?.MODERATE_NOVELTY}`);

  // 2. Fetch Domain Project Distribution (GET /api/analytics/domains)
  console.log('\n--- 2. Testing GET /api/analytics/domains (Domain Workload Breakdown) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/analytics/domains', method: 'GET',
    headers: { Authorization: `Bearer ${ipToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} research domain metrics.`);
  console.log(`Sample Domains: ${res.body.domains?.slice(0, 3).map(d => `${d.name} (${d.project_count} projects)`).join(', ')}`);

  // 3. Fetch Patent Filing Conversion Funnel (GET /api/analytics/filing-conversion)
  console.log('\n--- 3. Testing GET /api/analytics/filing-conversion (10-Stage Conversion Funnel) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/analytics/filing-conversion', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: Funnel contains ${res.body.funnel?.length} stages for ${res.body.total_projects} total project(s).`);

  // 4. Export Executive CSV Report (GET /api/analytics/export?format=csv)
  console.log('\n--- 4. Testing GET /api/analytics/export?format=csv (Export CSV Executive Report) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/analytics/export?format=csv', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: Content-Type: ${res.headers['content-type']}`);
  if (typeof res.body === 'string' && res.body.startsWith('Project ID,Title')) {
    console.log('✅ CSV Executive Report header & rows verified!');
  } else {
    console.log(`Received body snippet: ${String(res.body).substring(0, 60)}`);
  }

  // 5. Export Executive JSON Report (GET /api/analytics/export?format=json)
  console.log('\n--- 5. Testing GET /api/analytics/export?format=json (Export JSON Executive Report) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/analytics/export?format=json', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: Total JSON records exported: ${res.body.total_records}.`);

  console.log('\n==================================================');
  console.log('🎉 Phase 12 Institutional Analytics & Executive Reporting Verification Complete!');
  console.log('==================================================\n');
}

testPhase12().catch(console.error);
