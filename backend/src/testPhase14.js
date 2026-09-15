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

async function testPhase14() {
  console.log('==================================================');
  console.log('🔔 PHASE 14 AUTOMATED NOTIFICATION CENTER & AUDIT LOGGER TEST SUITE');
  console.log('==================================================');

  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  const adminToken = await loginUser('admin@campus.edu', 'Password123!');
  console.log('✅ Student & Admin authentication tokens obtained.');

  // 1. Fetch User Notifications (GET /api/notifications)
  console.log('\n--- 1. Testing GET /api/notifications (Fetch Student Notifications) ---');
  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/notifications', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} notification(s) (${res.body.unread_count} unread).`);
  if (res.body.notifications?.length > 0) {
    console.log(`Latest Alert: "${res.body.notifications[0].title}" - ${res.body.notifications[0].message}`);
  }

  // 2. Mark Single Notification as Read (PUT /api/notifications/1/read)
  console.log('\n--- 2. Testing PUT /api/notifications/1/read (Mark Notification #1 Read) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/notifications/1/read', method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 3. Mark All Notifications as Read (POST /api/notifications/mark-all-read)
  console.log('\n--- 3. Testing POST /api/notifications/mark-all-read (Mark All Read) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/notifications/mark-all-read', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 4. Fetch System Audit Logs as Admin (GET /api/audit-logs)
  console.log('\n--- 4. Testing GET /api/audit-logs (Fetch System Audit Trail) ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/audit-logs', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`HTTP ${res.status}: Retrieved ${res.body.count} system audit log entry/entries.`);
  if (res.body.logs?.length > 0) {
    console.log(`Latest Audit Event: [${res.body.logs[0].action}] by ${res.body.logs[0].user_full_name} (${res.body.logs[0].role_name})`);
  }

  // 5. Security Test: GET /api/audit-logs as STUDENT (Should fail with 403)
  console.log('\n--- 5. Security Test: GET /api/audit-logs as STUDENT ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/audit-logs', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (res.status === 403) {
    console.log('✅ CORRECTLY BLOCKED (HTTP 403 Forbidden): Student cannot access system audit logs.');
  } else {
    console.error(`❌ Security Violation! Expected 403, got ${res.status}`);
  }

  console.log('\n==================================================');
  console.log('🎉 Phase 14 Automated Notification Center & Audit Logger Verification Complete!');
  console.log('==================================================\n');
}

testPhase14().catch(console.error);
