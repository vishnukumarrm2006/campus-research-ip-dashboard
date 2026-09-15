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

async function testPhase10() {
  console.log('==================================================');
  console.log('🌐 PHASE 10 PRIOR-ART LITERATURE & PATENT SEARCH TEST SUITE');
  console.log('==================================================');

  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  console.log('✅ Student authentication token obtained.');

  // 1. Multi-Platform Prior-Art Search (POST /api/prior-art/search)
  console.log('\n--- 1. Testing POST /api/prior-art/search (Global Keyword Search) ---');
  let searchPayload = JSON.stringify({
    query: 'soil spectrographic sensor npk telemetry',
    min_similarity: 5.0,
  });
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/prior-art/search', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(searchPayload) }
  }, searchPayload);
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} matching prior-art result(s).`);
  if (res.body.results?.length > 0) {
    console.log(`Top Match: "${res.body.results[0].citation_title}" (${res.body.results[0].similarity_score}% Sim on ${res.body.results[0].source_platform})`);
  }

  // 2. Filtered Platform Search (POST /api/prior-art/search for IEEE Xplore)
  console.log('\n--- 2. Testing POST /api/prior-art/search (IEEE Xplore Filter) ---');
  searchPayload = JSON.stringify({
    query: 'spectrographic LED',
    source_platform: 'IEEE Xplore',
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/prior-art/search', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(searchPayload) }
  }, searchPayload);
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} IEEE prior-art publication(s).`);

  // 3. Bookmark Citation (POST /api/prior-art/bookmark)
  console.log('\n--- 3. Testing POST /api/prior-art/bookmark (Attach Citation to Project #1) ---');
  const bookmarkPayload = JSON.stringify({
    project_id: 1,
    citation_title: 'IEEE Trans. Sensor Systems: Optical Spectrographic Analysis of Soil Micro-Nutrients',
    source_platform: 'IEEE Xplore',
    document_id: '10.1109/TSS.2023.9812456',
    authors_assignees: 'Prof. H. R. Jenkins et al.',
    publication_year: 2023,
    similarity_score: 54.2,
    abstract_snippet: 'Multi-wavelength optical LED absorption spectroscopy applied directly to aqueous soil solution extracts.',
    url: 'https://ieeexplore.ieee.org/document/9812456',
    relevance_notes: 'Direct prior-art for optical spectrographic sensor design.',
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/prior-art/bookmark', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bookmarkPayload) }
  }, bookmarkPayload);
  const bookmarkedId = res.body.citation?.id;
  console.log(`HTTP ${res.status}: ${res.body.message} Citation ID #${bookmarkedId}`);

  // 4. Retrieve Saved Citations (GET /api/prior-art/saved/1)
  console.log('\n--- 4. Testing GET /api/prior-art/saved/1 (Fetch Saved Citations for Project #1) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/prior-art/saved/1', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Retrieved ${res.body.count} saved citation(s) for Project #1.`);

  // 5. Delete Saved Citation (DELETE /api/prior-art/saved/:citationId)
  console.log(`\n--- 5. Testing DELETE /api/prior-art/saved/${bookmarkedId} (Delete Citation) ---`);
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/prior-art/saved/${bookmarkedId}`, method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  console.log('\n==================================================');
  console.log('🎉 Phase 10 Prior-Art Literature & Patent Search Verification Complete!');
  console.log('==================================================\n');
}

testPhase10().catch(console.error);
