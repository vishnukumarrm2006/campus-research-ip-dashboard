const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
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
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
  }, postData);
  return res.body.token;
}

async function testPhase4() {
  console.log('==================================================');
  console.log('🏷️  PHASE 4 DOMAIN & FACULTY MANAGEMENT TEST SUITE');
  console.log('==================================================');

  // Authenticate Admin & Student
  const adminToken = await loginUser('admin@campus.edu', 'Password123!');
  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  console.log('✅ Admin & Student authentication tokens obtained.');

  // 1. GET /api/domains
  console.log('\n--- 1. Testing GET /api/domains ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/domains', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} domains.`);

  // 2. POST /api/domains (Create Domain as Admin)
  console.log('\n--- 2. Testing POST /api/domains (Create Domain as Admin) ---');
  const newDomainData = JSON.stringify({ name: 'Quantum Computing', description: 'Quantum Algorithms, Qubits & Error Correction' });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/domains', method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(newDomainData) }
  }, newDomainData);
  console.log(`HTTP ${res.status}: Created Domain ID #${res.body.domain?.id} ("${res.body.domain?.name}")`);

  // 3. Security Boundary Test: Create Domain as STUDENT (Should fail with 403)
  console.log('\n--- 3. Security Test: POST /api/domains as STUDENT ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/domains', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(newDomainData) }
  }, newDomainData);
  if (res.status === 403) {
    console.log('✅ CORRECTLY BLOCKED (HTTP 403 Forbidden): Student cannot create domains.');
  } else {
    console.error(`❌ Security Violation! Expected 403, got ${res.status}`);
  }

  // 4. GET /api/faculty (Fetch Faculty Members)
  console.log('\n--- 4. Testing GET /api/faculty ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/faculty', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} faculty members with mapped domains & workload capacity.`);

  // 5. POST /api/faculty/:id/domains (Update Domain Expertise Mapping)
  console.log('\n--- 5. Testing POST /api/faculty/4/domains (Map Domains to Faculty #4) ---');
  const domainMappingData = JSON.stringify({ domain_ids: [1, 5, 11] });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/faculty/4/domains', method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(domainMappingData) }
  }, domainMappingData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 6. POST /api/faculty/assign-project (Assign Faculty Mentor to Project)
  console.log('\n--- 6. Testing POST /api/faculty/assign-project ---');
  const assignData = JSON.stringify({ project_id: 2, faculty_id: 7 });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/faculty/assign-project', method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(assignData) }
  }, assignData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  console.log('\n==================================================');
  console.log('🎉 Phase 4 Domain & Faculty Management Verification Complete!');
  console.log('==================================================\n');
}

testPhase4().catch(console.error);
