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
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runPhase15Tests() {
  console.log('================================================================');
  console.log('🧪 PHASE 15 AUTOMATED VERIFICATION: ADMIN USER & ROLE GOVERNANCE');
  console.log('================================================================');

  try {
    // 1. Login as Admin
    console.log('\n[TEST 1] Logging in as ADMIN (admin@campus.edu)...');
    const adminLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@campus.edu', password: 'Password123!' }
    );

    if (adminLogin.status !== 200 || !adminLogin.body.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.body)}`);
    }
    const adminToken = adminLogin.body.token;
    console.log('✅ Admin login successful. Token acquired.');

    // 2. Login as Student (for RBAC test)
    console.log('\n[TEST 2] Logging in as STUDENT (student1@campus.edu)...');
    const studentLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'student1@campus.edu', password: 'Password123!' }
    );
    const studentToken = studentLogin.body.token;
    console.log('✅ Student login successful.');

    // 3. Test GET /api/admin/system-stats
    console.log('\n[TEST 3] Fetching System Health & Database Diagnostics (GET /api/admin/system-stats)...');
    const statsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/system-stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Response Status: ${statsRes.status}`);
    console.log('Stats Output:', JSON.stringify(statsRes.body.system_health, null, 2));
    if (statsRes.status !== 200 || !statsRes.body.success) {
      throw new Error('Failed to fetch system stats');
    }
    console.log('✅ System health & stats API verified.');

    // 4. Test GET /api/admin/users
    console.log('\n[TEST 4] Fetching Master User Directory (GET /api/admin/users)...');
    const usersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Response Status: ${usersRes.status}, Total Users Found: ${usersRes.body.count}`);
    if (usersRes.status !== 200 || !usersRes.body.success) {
      throw new Error('Failed to fetch master user directory');
    }
    console.log('✅ Master user directory API verified.');

    // 5. Test POST /api/admin/users (Provision new user)
    console.log('\n[TEST 5] Provisioning new Faculty user (Dr. Anand Verma)...');
    const newUserEmail = `dr.anand.${Date.now()}@campus.edu`;
    const createRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        email: newUserEmail,
        password: 'Password123!',
        full_name: 'Dr. Anand Verma',
        role_id: 2, // FACULTY
        department: 'Biotechnology & Bioengineering',
        employee_id: 'EMP-FAC-9988',
        designation: 'Professor',
      }
    );
    console.log(`Response Status: ${createRes.status}`);
    console.log('Created User Payload:', JSON.stringify(createRes.body.user, null, 2));
    if (createRes.status !== 201 || !createRes.body.success) {
      throw new Error(`Failed to create user: ${JSON.stringify(createRes.body)}`);
    }
    const createdUserId = createRes.body.user.id;
    console.log(`✅ Provisioned user successfully with ID #${createdUserId}.`);

    // 6. Test PUT /api/admin/users/:id/role (Reassign role from FACULTY to IP_COORDINATOR)
    console.log(`\n[TEST 6] Reassigning user #${createdUserId} role from FACULTY (2) to IP_COORDINATOR (3)...`);
    const reassignRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/users/${createdUserId}/role`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { role_id: 3 }
    );
    console.log(`Response Status: ${reassignRes.status}, Message: ${reassignRes.body.message}`);
    if (reassignRes.status !== 200 || !reassignRes.body.success) {
      throw new Error(`Failed to reassign role: ${JSON.stringify(reassignRes.body)}`);
    }
    console.log('✅ Role reassignment verified.');

    // 7. Test PUT /api/admin/users/:id/status (Deactivate then Reactivate user)
    console.log(`\n[TEST 7] Toggling account status for user #${createdUserId} to Deactivated (false)...`);
    const deactivateRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/users/${createdUserId}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { is_active: false }
    );
    console.log(`Deactivate Status: ${deactivateRes.status}, Message: ${deactivateRes.body.message}`);
    if (deactivateRes.status !== 200 || deactivateRes.body.user.is_active !== false) {
      throw new Error('Failed to deactivate user account');
    }

    console.log(`Reactivating account for user #${createdUserId} (is_active: true)...`);
    const reactivateRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/users/${createdUserId}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { is_active: true }
    );
    console.log(`Reactivate Status: ${reactivateRes.status}, Message: ${reactivateRes.body.message}`);
    if (reactivateRes.status !== 200 || reactivateRes.body.user.is_active !== true) {
      throw new Error('Failed to reactivate user account');
    }
    console.log('✅ Account activation/deactivation status toggle verified.');

    // 8. Test RBAC Security Authorization (Student attempting ADMIN API access)
    console.log('\n[TEST 8] RBAC Security Check: Student calling GET /api/admin/users (Expect 403 Forbidden)...');
    const rbacRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`Response Status: ${rbacRes.status} (Expected 403)`);
    console.log('RBAC Error Response:', JSON.stringify(rbacRes.body, null, 2));
    if (rbacRes.status !== 403) {
      throw new Error(`RBAC Security Failed! Student was NOT blocked. HTTP status was ${rbacRes.status}`);
    }
    console.log('✅ RBAC Security Gatekeeper correctly blocked unauthorized student access.');

    console.log('\n================================================================');
    console.log('🎉 PHASE 15 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100% PASS)');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 15 VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

runPhase15Tests();
