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

async function testPhase8() {
  console.log('==================================================');
  console.log('🤖 PHASE 8 AI-ASSISTED ORIGINALITY SCREENING TEST SUITE');
  console.log('==================================================');

  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  const facultyToken = await loginUser('prof.sharma@campus.edu', 'Password123!');
  console.log('✅ Student & Faculty authentication tokens obtained.');

  // 1. Trigger AI Screening (POST /api/projects/1/ai-screening)
  console.log('\n--- 1. Testing POST /api/projects/1/ai-screening (Trigger AI Engine) ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1/ai-screening', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' }
  });
  console.log(`HTTP ${res.status}: ${res.body.message}`);
  console.log(`Similarity Score: ${res.body.report?.similarity_score}%`);
  console.log(`Recommendation: ${res.body.report?.recommendation}`);
  
  if (res.body.report?.disclaimer && res.body.report.disclaimer.includes('IMPORTANT DISCLAIMER')) {
    console.log('✅ Mandatory AI Legal Disclaimer verified present in report.');
  } else {
    console.error('❌ Missing required AI Legal Disclaimer!');
  }

  // 2. Retrieve AI Screening Report (GET /api/projects/1/ai-screening)
  console.log('\n--- 2. Testing GET /api/projects/1/ai-screening (Fetch Screening Report) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1/ai-screening', method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched AI report with ${res.body.report?.matched_sources?.length || 0} matched prior-art sources.`);
  console.log(`Novelty Summary: ${res.body.report?.potentially_novel_features_summary?.split('\n')[0]}`);

  // 3. Verify Project Status updated to AI_SCREENED
  console.log('\n--- 3. Testing GET /api/projects/1 (Verify Status Update) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Project #${res.body.project?.id} status is now "${res.body.project?.status}".`);

  if (res.body.project?.status === 'AI_SCREENED') {
    console.log('✅ Project state transition to AI_SCREENED verified!');
  } else {
    console.error(`❌ Expected AI_SCREENED status, but found: ${res.body.project?.status}`);
  }

  console.log('\n==================================================');
  console.log('🎉 Phase 8 AI-Assisted Originality Screening Engine Verification Complete!');
  console.log('==================================================\n');
}

testPhase8().catch(console.error);
