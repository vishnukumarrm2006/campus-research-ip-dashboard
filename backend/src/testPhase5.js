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

async function testPhase5() {
  console.log('==================================================');
  console.log('📁 PHASE 5 STUDENT PROJECT MANAGEMENT TEST SUITE');
  console.log('==================================================');

  // Login as Student 1 (Aarav Kumar)
  const studentToken = await loginUser('student1@campus.edu', 'Password123!');
  console.log('✅ Student authentication token obtained.');

  // 1. Create New Project Submission (POST /api/projects)
  console.log('\n--- 1. Testing POST /api/projects (Create Project Submission) ---');
  const newProjectData = JSON.stringify({
    title: 'Autonomous Swarm Drone Navigation & Obstacle Avoidance',
    abstract: 'An autonomous multi-drone swarm coordination system executing decentralized path planning via ultra-wideband (UWB) ranging sensors.',
    problem_statement: 'Single-drone survey missions suffer from single-point failure and constrained battery endurance over large agricultural fields.',
    objectives: '1. Construct UWB ranging mesh. 2. Implement decentralized flocking consensus algorithm. 3. Validate obstacle avoidance at 10m/s.',
    methodology: 'Drones exchange velocity vectors over ROS2 micro-XRCE DDS. Edge obstacle detection executes on onboard Jetson Orin Nano.',
    technologies: 'PX4 Autopilot, ROS2, Jetson Orin Nano, UWB, Python, C++',
    features: 'Decentralized flocking, Real-time UWB mesh localization, Zero single-point failure',
    innovation_description: 'Novel low-latency UWB ranging frame structure providing sub-5cm spatial positioning without GPS dependence.',
    domain_id: 8, // Robotics
  });

  let res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects', method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(newProjectData) }
  }, newProjectData);
  const createdProjectId = res.body.project?.id;
  console.log(`HTTP ${res.status}: Created Project ID #${createdProjectId} ("${res.body.project?.title}")`);

  // 2. Fetch Student Projects (GET /api/projects)
  console.log('\n--- 2. Testing GET /api/projects ---');
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: '/api/projects', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Fetched ${res.body.count} project(s) for logged-in student.`);

  // 3. Add Team Member (POST /api/projects/:id/members)
  console.log(`\n--- 3. Testing POST /api/projects/${createdProjectId}/members (Add Team Member) ---`);
  const memberData = JSON.stringify({ roll_number: '2023AI015' }); // Diya Patel
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/projects/${createdProjectId}/members`, method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(memberData) }
  }, memberData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 4. Update Project Details (PUT /api/projects/:id)
  console.log(`\n--- 4. Testing PUT /api/projects/${createdProjectId} (Update Project Objectives) ---`);
  const updateData = JSON.stringify({
    objectives: '1. Construct UWB ranging mesh. 2. Implement decentralized flocking algorithm. 3. Validate obstacle avoidance at 15m/s in wind tunnel.',
  });
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/projects/${createdProjectId}`, method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(updateData) }
  }, updateData);
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 5. Submit Project for Review (POST /api/projects/:id/submit)
  console.log(`\n--- 5. Testing POST /api/projects/${createdProjectId}/submit (Submit for Faculty Review) ---`);
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/projects/${createdProjectId}/submit`, method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: ${res.body.message}`);

  // 6. Fetch Project Profile Details (GET /api/projects/:id)
  console.log(`\n--- 6. Testing GET /api/projects/${createdProjectId} (Verify Project Profile Details) ---`);
  res = await makeRequest({
    hostname: '127.0.0.1', port: 5000, path: `/api/projects/${createdProjectId}`, method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log(`HTTP ${res.status}: Status is "${res.body.project?.status}". Team Members: ${res.body.project?.team_members?.length}. Faculty Mentor: "${res.body.project?.assigned_faculty?.full_name || 'None'}"`);

  console.log('\n==================================================');
  console.log('🎉 Phase 5 Student Project Management Verification Complete!');
  console.log('==================================================\n');
}

testPhase5().catch(console.error);
