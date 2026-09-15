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

async function testPhase7() {
  console.log('==================================================');
  console.log('📄 PHASE 7 SECURE DOCUMENT MANAGEMENT TEST SUITE');
  console.log('==================================================');

  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  const facultyToken = await loginUser('prof.sharma@campus.edu', 'Password123!');
  const otherStudentToken = await loginUser('student3@campus.edu', 'Password123!');
  console.log('✅ Student, Faculty, & Unrelated Student authentication tokens obtained.');

  // 1. Fetch Documents for Project 1 (GET /api/projects/1/documents)
  console.log('\n--- 1. Testing GET /api/projects/1/documents ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1/documents', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} document(s) for Project #1.`);

  // 2. Upload Classified Document (POST /api/projects/1/documents)
  console.log('\n--- 2. Testing POST /api/projects/1/documents (Upload Invention Disclosure) ---');
  const docData = JSON.stringify({
    document_type: 'INVENTION_DISCLOSURE',
    file_name: 'Smart_Agri_Invention_Disclosure_v2.pdf',
    file_size: 3450000,
    mime_type: 'application/pdf',
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1/documents', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(docData) }
  }, docData);
  const uploadedDocId = res.body.document?.id;
  console.log(`HTTP ${res.status}: ${res.body.message} Document ID #${uploadedDocId}`);

  // 3. Download Document as Authorized Faculty (GET /api/documents/:id/download)
  console.log(`\n--- 3. Testing GET /api/documents/${uploadedDocId}/download (Authorized Faculty Download) ---`);
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/documents/${uploadedDocId}/download`, method: 'GET',
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message} Download Stream URL: "${res.body.document?.download_url}"`);

  // 4. Security Test: Unauthorized Student Access (Should fail with 403)
  console.log(`\n--- 4. Security Test: GET /api/projects/1/documents as Unrelated Student ---`);
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects/1/documents', method: 'GET',
    headers: { Authorization: `Bearer ${otherStudentToken}` }
  });
  if (res.status === 403) {
    console.log('✅ CORRECTLY BLOCKED (HTTP 403 Forbidden): Unrelated student cannot access project documents.');
  } else {
    console.error(`❌ Security Violation! Expected 403, got ${res.status}`);
  }

  // 5. Delete Document (DELETE /api/documents/:id)
  console.log(`\n--- 5. Testing DELETE /api/documents/${uploadedDocId} (Delete Document) ---`);
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/documents/${uploadedDocId}`, method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  console.log('\n==================================================');
  console.log('🎉 Phase 7 Secure Document Management Verification Complete!');
  console.log('==================================================\n');
}

testPhase7().catch(console.error);
