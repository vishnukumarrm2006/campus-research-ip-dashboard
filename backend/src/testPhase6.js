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

async function testPhase6() {
  console.log('==================================================');
  console.log('🎓 PHASE 6 FACULTY REVIEW & MILESTONES TEST SUITE');
  console.log('==================================================');

  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  const facultyToken = await loginUser('prof.sharma@campus.edu', 'Password123!');
  console.log('✅ Student & Faculty authentication tokens obtained.');

  // 1. Fetch Milestones for Project 1 (GET /api/projects/1/milestones)
  console.log('\n--- 1. Testing GET /api/projects/1/milestones ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1/milestones', method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} milestone(s) for Project #1.`);

  // 2. Student Submits Progress for Milestone 3 (POST /api/milestones/3/submit)
  console.log('\n--- 2. Testing POST /api/milestones/3/submit (Student Submits Progress) ---');
  const subData = JSON.stringify({ submission_text: 'Assembled IP67 optical spectrographic probe and deployed LoRa mesh node. Uploaded initial design schematics.' });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/milestones/3/submit', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(subData) }
  }, subData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 3. Faculty Requests Revisions (POST /api/milestones/3/feedback with REQUEST_IMPROVEMENT)
  console.log('\n--- 3. Testing POST /api/milestones/3/feedback (Faculty Requests Revisions) ---');
  let fbData = JSON.stringify({ feedback_text: 'Please include optical LED wavelength calibration curves across high-salinity soil samples.', status_action: 'REQUEST_IMPROVEMENT' });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/milestones/3/feedback', method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(fbData) }
  }, fbData);
  console.log(`HTTP ${res.status}: ${res.body.message} Project Status: "${res.body.project_status}"`);

  // 4. Student Resubmits Revised Progress (POST /api/milestones/3/submit)
  console.log('\n--- 4. Testing POST /api/milestones/3/submit (Student Resubmits Revised Progress) ---');
  const revSubData = JSON.stringify({ submission_text: 'Revised spectrographic LED calibration curves included for 450nm, 520nm, and 660nm wavelengths across saline soil samples.' });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/milestones/3/submit', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(revSubData) }
  }, revSubData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 5. Faculty Approves Milestone (POST /api/milestones/3/feedback with APPROVE)
  console.log('\n--- 5. Testing POST /api/milestones/3/feedback (Faculty Approves Milestone) ---');
  fbData = JSON.stringify({ feedback_text: 'Excellent revision! Spectrographic calibration curves meet research standards. Milestone approved.', status_action: 'APPROVE' });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/milestones/3/feedback', method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(fbData) }
  }, fbData);
  console.log(`HTTP ${res.status}: ${res.body.message} Project Status: "${res.body.project_status}"`);

  // 6. Faculty Recommends Project for AI Screening (POST /api/projects/1/recommend-ai)
  console.log('\n--- 6. Testing POST /api/projects/1/recommend-ai ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1/recommend-ai', method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message} Status: "${res.body.project?.status}"`);

  // 7. Security Test: Student attempts to approve milestone (Should fail with 403)
  console.log('\n--- 7. Security Test: POST /api/milestones/3/feedback as STUDENT ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/milestones/3/feedback', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(fbData) }
  }, fbData);
  if (res.status === 403) {
    console.log('✅ CORRECTLY BLOCKED (HTTP 403 Forbidden): Students cannot approve milestones.');
  } else {
    console.error(`❌ Security Violation! Expected 403, got ${res.status}`);
  }

  console.log('\n==================================================');
  console.log('🎉 Phase 6 Faculty Review & Milestones Verification Complete!');
  console.log('==================================================\n');
}

testPhase6().catch(console.error);
