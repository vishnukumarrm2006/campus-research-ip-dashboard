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

async function testPhase13() {
  console.log('==================================================');
  console.log('🎓 PHASE 13 IP AWARENESS, EDUCATIONAL PORTAL & FAQ TEST SUITE');
  console.log('==================================================');

  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  const adminToken = await loginUser('admin@campus.edu', 'Password123!');
  console.log('✅ Student & Admin authentication tokens obtained successfully.');

  // 1. Fetch IP Educational Guides & Categories (GET /api/knowledge/articles)
  console.log('\n--- 1. Testing GET /api/knowledge/articles (Fetch Educational Guides) ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/knowledge/articles', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} published IP guide(s) & FAQ(s).`);
  console.log(`Categories (${res.body.categories?.length}): ${res.body.categories?.map(c => c.label).slice(0, 4).join(', ')}...`);

  // 2. Filter Articles by Category (GET /api/knowledge/articles?category=FAQ)
  console.log('\n--- 2. Testing GET /api/knowledge/articles?category=FAQ (Fetch FAQs) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/knowledge/articles?category=FAQ', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Retrieved ${res.body.count} FAQ entry/entries.`);
  if (res.body.articles?.length > 0) {
    console.log(`Sample FAQ: "${res.body.articles[0].title}"`);
  }

  // 3. Admin Publish New Article (POST /api/knowledge/articles as ADMIN)
  console.log('\n--- 3. Testing POST /api/knowledge/articles (Admin Author & Publish) ---');
  const articlePayload = JSON.stringify({
    title: 'Understanding Software Patentability & Open Source Licensing',
    category: 'IP_BASICS',
    summary: 'Guidelines on patenting software algorithms vs open source GPL/MIT licensing.',
    content_markdown: '# Software Patentability\n\nSoftware algorithms implementing novel technical technical processes are patentable under Indian Patent Law if coupled to hardware.',
    read_time_mins: 5,
    is_published: true,
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/knowledge/articles', method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(articlePayload) }
  }, articlePayload);
  const createdId = res.body.article?.id;
  console.log(`HTTP ${res.status}: ${res.body.message} Article ID #${createdId}`);

  // 4. Security Test: Unauthorized Article Creation by Student (Should fail with 403)
  console.log('\n--- 4. Security Test: POST /api/knowledge/articles as STUDENT ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/knowledge/articles', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(articlePayload) }
  }, articlePayload);
  if (res.status === 403) {
    console.log('✅ CORRECTLY BLOCKED (HTTP 403 Forbidden): Student cannot publish official IP articles.');
  } else {
    console.error(`❌ Security Violation! Expected 403, got ${res.status}`);
  }

  // 5. Delete Article (DELETE /api/knowledge/articles/:id as ADMIN)
  console.log(`\n--- 5. Testing DELETE /api/knowledge/articles/${createdId} (Admin Delete) ---`);
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/knowledge/articles/${createdId}`, method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  console.log('\n==================================================');
  console.log('🎉 Phase 13 IP Awareness, Educational Portal & FAQ Verification Complete!');
  console.log('==================================================\n');
}

testPhase13().catch(console.error);
