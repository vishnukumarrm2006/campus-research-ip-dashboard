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

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testAuth() {
  console.log('==================================================');
  console.log('🔐 PHASE 3 AUTHENTICATION & RBAC SECURITY SUITE');
  console.log('==================================================');

  const credentials = [
    { role: 'STUDENT', email: 'student1@campus.edu', pass: 'Password123!' },
    { role: 'FACULTY', email: 'prof.sharma@campus.edu', pass: 'Password123!' },
    { role: 'IP_COORDINATOR', email: 'ip.coordinator@campus.edu', pass: 'Password123!' },
    { role: 'ADMIN', email: 'admin@campus.edu', pass: 'Password123!' },
  ];

  const tokens = {};

  // 1. Test Login for all 4 roles
  for (const cred of credentials) {
    const postData = JSON.stringify({ email: cred.email, password: cred.pass });
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, postData);

    if (res.status === 200 && res.body.token) {
      tokens[cred.role] = res.body.token;
      console.log(`✅ Login Success [${cred.role.padEnd(14)}] User: ${res.body.user.full_name}`);
    } else {
      console.error(`❌ Login Failed [${cred.role}]:`, res.body);
    }
  }

  console.log('\n--------------------------------------------------');
  console.log('🛡️  Testing RBAC Authorization Boundaries');
  console.log('--------------------------------------------------');

  const testMatrix = [
    { name: 'Student API (/api/test/student-only)', path: '/api/test/student-only', allowed: ['STUDENT'] },
    { name: 'Faculty API (/api/test/faculty-only)', path: '/api/test/faculty-only', allowed: ['FACULTY'] },
    { name: 'IP Coord API (/api/test/ip-only)', path: '/api/test/ip-only', allowed: ['IP_COORDINATOR'] },
    { name: 'Admin API (/api/test/admin-only)', path: '/api/test/admin-only', allowed: ['ADMIN'] },
  ];

  for (const route of testMatrix) {
    console.log(`\nEndpoint: ${route.name}`);
    for (const role of ['STUDENT', 'FACULTY', 'IP_COORDINATOR', 'ADMIN']) {
      const token = tokens[role];
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: route.path,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const isAllowedRole = route.allowed.includes(role);
      const isOk = isAllowedRole ? res.status === 200 : res.status === 403;

      if (isOk) {
        console.log(`  • Role ${role.padEnd(14)} -> HTTP ${res.status} [${isAllowedRole ? 'ACCESS GRANTED ✅' : 'ACCESS DENIED FORBIDDEN 🔒'}]`);
      } else {
        console.error(`  ❌ RBAC Violation for ${role}: expected ${isAllowedRole ? 200 : 403}, got ${res.status}`);
      }
    }
  }

  console.log('\n==================================================');
  console.log('🎉 Phase 3 Auth & RBAC Security Verification Complete!');
  console.log('==================================================\n');
}

testAuth().catch(console.error);
