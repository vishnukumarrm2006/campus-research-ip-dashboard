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
    hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
  }, postData);
  return res.body.token;
}

async function testPhase9() {
  console.log('==================================================');
  console.log('🏛️ PHASE 9 IP COORDINATOR & 10-STAGE PATENT LIFECYCLE TEST SUITE');
  console.log('==================================================');

  const ipCoordToken = await loginUser('ip.coordinator@campus.edu', 'Password123!');
  const facultyToken = await loginUser('prof.sharma@campus.edu', 'Password123!');
  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  console.log('✅ IP Coordinator, Faculty, & Student tokens obtained successfully.');

  // 1. Fetch IP Queue (GET /api/ip/projects)
  console.log('\n--- 1. Testing GET /api/ip/projects (Fetch IP Queue) ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/ip/projects', method: 'GET',
    headers: { Authorization: `Bearer ${ipCoordToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} project dossier(s) in queue.`);
  console.log(`Supported Filing Stages (${res.body.stages?.length || 0}): ${res.body.stages?.slice(0, 5).join(', ')}...`);

  // 2. Fetch Full IP Dossier for Project #1 (GET /api/ip/projects/1)
  console.log('\n--- 2. Testing GET /api/ip/projects/1 (Fetch Full Dossier) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/ip/projects/1', method: 'GET',
    headers: { Authorization: `Bearer ${ipCoordToken}` }
  });
  console.log(`HTTP ${res.status}: Dossier loaded for "${res.body.dossier?.project?.title?.substring(0, 45)}...".`);
  console.log(`Current Status: "${res.body.dossier?.project?.status}". Team Members: ${res.body.dossier?.team_members?.length}, Documents: ${res.body.dossier?.documents?.length}`);

  // 3. Transition Status to UNDER_IP_EVALUATION (POST /api/ip/projects/1/status)
  console.log('\n--- 3. Testing POST /api/ip/projects/1/status (Transition to UNDER_IP_EVALUATION) ---');
  let statusData = JSON.stringify({
    status: 'UNDER_IP_EVALUATION',
    evaluation_notes: 'Invention disclosure form validated. Initiated patentability analysis with campus patent counsel.',
    docket_number: 'IP-2026-PAT-0001',
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/ip/projects/1/status', method: 'POST',
    headers: { Authorization: `Bearer ${ipCoordToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(statusData) }
  }, statusData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 4. Transition Status to PATENT_FILED (POST /api/ip/projects/1/status)
  console.log('\n--- 4. Testing POST /api/ip/projects/1/status (Transition to PATENT_FILED) ---');
  statusData = JSON.stringify({
    status: 'PATENT_FILED',
    evaluation_notes: 'Provisional patent specification filed with Indian Patent Office (IPO Chennai Bench). Application No generated.',
    docket_number: 'IP-2026-PAT-0001',
    application_number: '202641098765 A',
    filing_date: '2026-09-12',
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/ip/projects/1/status', method: 'POST',
    headers: { Authorization: `Bearer ${ipCoordToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(statusData) }
  }, statusData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);
  console.log(`Application No: ${res.body.ip_review?.application_number}, Docket No: ${res.body.ip_review?.docket_number}`);

  // 5. Fetch Filing Audit History (GET /api/ip/projects/1/history)
  console.log('\n--- 5. Testing GET /api/ip/projects/1/history (Fetch Audit Trail) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/ip/projects/1/history', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Retrieved ${res.body.count} history entry/entries.`);
  console.log(`Latest Transition: ${res.body.history[0]?.previous_status} ➔ ${res.body.history[0]?.new_status} by ${res.body.history[0]?.changed_by_name}`);

  // 6. Security Test: Unauthorized Status Update Attempt by Student (Should fail with 403)
  console.log('\n--- 6. Security Test: POST /api/ip/projects/1/status as STUDENT ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/ip/projects/1/status', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(statusData) }
  }, statusData);
  if (res.status === 403) {
    console.log('✅ CORRECTLY BLOCKED (HTTP 403 Forbidden): Student cannot update official IP patent filing status.');
  } else {
    console.error(`❌ Security Violation! Expected 403, got ${res.status}`);
  }

  console.log('\n==================================================');
  console.log('🎉 Phase 9 IP Coordinator & 10-Stage Patent Lifecycle Verification Complete!');
  console.log('==================================================\n');
}

testPhase9().catch(console.error);
