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

async function testPhase11() {
  console.log('==================================================');
  console.log('📄 PHASE 11 COLLABORATIVE INVENTION DISCLOSURE ENGINE TEST SUITE');
  console.log('==================================================');

  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  console.log('✅ Student authentication token obtained.');

  // 1. Retrieve Invention Disclosure Form (GET /api/disclosures/project/1)
  console.log('\n--- 1. Testing GET /api/disclosures/project/1 (Fetch IDF Draft) ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/disclosures/project/1', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Disclosure loaded for Project #1 (Version v${res.body.disclosure?.version}).`);
  console.log(`Co-Inventors (${res.body.disclosure?.inventor_splits?.length}): ${res.body.disclosure?.inventor_splits?.map(s => `${s.name} (${s.percentage}%)`).join(', ')}`);

  // 2. Save Invention Disclosure Form Edits (PUT /api/disclosures/project/1)
  console.log('\n--- 2. Testing PUT /api/disclosures/project/1 (Update IDF Draft & Revenue Splits) ---');
  let savePayload = JSON.stringify({
    title_field: 'Smart Agricultural Soil Micro-Nutrient Monitoring & Automated Irrigation System using Edge IoT (v2)',
    novelty_inventive_step: '1. Direct-insertion optical spectrographic sensor probe operating without chemical reagents. 2. LoRa mesh node with edge AI prediction.',
    inventor_splits: [
      { student_id: 8, name: 'Aarav Kumar', role: 'Lead Student Inventor', percentage: 60 },
      { student_id: 11, name: 'Ananya Sen', role: 'Co-Student Inventor', percentage: 20 },
      { faculty_id: 4, name: 'Prof. Alok Sharma', role: 'Faculty Advisor', percentage: 20 }
    ]
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/disclosures/project/1', method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(savePayload) }
  }, savePayload);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 3. Validation Test: Invalid Inventor Split Sum (PUT /api/disclosures/project/1 with 80% total)
  console.log('\n--- 3. Validation Test: PUT /api/disclosures/project/1 with Invalid 80% Split Total ---');
  const invalidPayload = JSON.stringify({
    inventor_splits: [
      { student_id: 8, name: 'Aarav Kumar', role: 'Lead Student Inventor', percentage: 50 },
      { student_id: 11, name: 'Ananya Sen', role: 'Co-Student Inventor', percentage: 30 }
    ]
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/disclosures/project/1', method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(invalidPayload) }
  }, invalidPayload);
  if (res.status === 400) {
    console.log(`✅ CORRECTLY BLOCKED (HTTP 400 Bad Request): ${res.body.error}`);
  } else {
    console.error(`❌ Validation Failure! Expected 400, got ${res.status}`);
  }

  // 4. Export Formal Disclosure Dossier (POST /api/disclosures/project/1/export)
  console.log('\n--- 4. Testing POST /api/disclosures/project/1/export (Export IDF Markdown Dossier) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/disclosures/project/1/export', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Exported dossier "${res.body.filename}" (${res.body.dossier_markdown?.length || 0} bytes).`);
  if (res.body.dossier_markdown && res.body.dossier_markdown.includes('FORMAL CAMPUS INVENTION DISCLOSURE DOSSIER')) {
    console.log('✅ Formatted Markdown IDF Dossier compilation verified!');
  } else {
    console.error('❌ Failed to verify exported dossier markdown!');
  }

  console.log('\n==================================================');
  console.log('🎉 Phase 11 Collaborative Invention Disclosure Engine Verification Complete!');
  console.log('==================================================\n');
}

testPhase11().catch(console.error);
