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

async function runPhase16MasterIntegrationTest() {
  console.log('================================================================================');
  console.log('🏆 PHASE 16 MASTER END-TO-END SYSTEM INTEGRATION & PRODUCTION VERIFICATION');
  console.log('================================================================================');

  try {
    // STAGE 1: Authentication & RBAC Token Acquisition
    console.log('\n[STAGE 1] Authenticating all 4 Campus Roles...');
    
    // Login Student
    const studentLogin = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'student1@campus.edu', password: 'Password123!' }
    );
    if (studentLogin.status !== 200 || !studentLogin.body.token) throw new Error('Student login failed');
    const studentToken = studentLogin.body.token;
    console.log('  ✅ Student Authentication Verified (student1@campus.edu)');

    // Login Faculty
    const facultyLogin = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'prof.sharma@campus.edu', password: 'Password123!' }
    );
    if (facultyLogin.status !== 200 || !facultyLogin.body.token) throw new Error('Faculty login failed');
    const facultyToken = facultyLogin.body.token;
    console.log('  ✅ Faculty Authentication Verified (prof.sharma@campus.edu)');

    // Login IP Coordinator
    const ipLogin = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'ip.coordinator@campus.edu', password: 'Password123!' }
    );
    if (ipLogin.status !== 200 || !ipLogin.body.token) throw new Error('IP Coordinator login failed');
    const ipToken = ipLogin.body.token;
    console.log('  ✅ IP Coordinator Authentication Verified (ip.coordinator@campus.edu)');

    // Login Admin
    const adminLogin = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@campus.edu', password: 'Password123!' }
    );
    if (adminLogin.status !== 200 || !adminLogin.body.token) throw new Error('Admin login failed');
    const adminToken = adminLogin.body.token;
    console.log('  ✅ Admin Authentication Verified (admin@campus.edu)');


    // STAGE 2: Domain & Faculty Workload Discovery
    console.log('\n[STAGE 2] Domain & Faculty Capacity Discovery...');
    const domainsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/domains',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (domainsRes.status !== 200 || !domainsRes.body.domains) throw new Error('Failed to fetch research domains');
    console.log(`  ✅ Retrieved ${domainsRes.body.domains.length} Research Domains.`);

    let selectedFacultyId = 4;
    const facultyRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (facultyRes.status !== 200 || !facultyRes.body.faculty) throw new Error('Failed to fetch faculty workload');
    const availableFac = facultyRes.body.faculty.find(f => f.available_capacity > 0);
    if (availableFac) selectedFacultyId = availableFac.id;
    console.log(`  ✅ Faculty Workload Matrix fetched (${facultyRes.body.faculty.length} faculty mentors). Selected mentor ID #${selectedFacultyId}.`);


    // STAGE 3: Student Proposal Submission
    console.log('\n[STAGE 3] Student Proposal Submission & Domain Assignment...');
    const timestamp = Date.now();
    const proposalRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/projects',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      },
      {
        title: `Autonomous Quantum Encryption Mesh #${timestamp}`,
        abstract: 'An advanced quantum-safe cryptographic network protocol for secure campus edge node communications.',
        problem_statement: 'Traditional encryption models are vulnerable to post-quantum computing attacks on distributed campus edge sensors.',
        objectives: 'Design a post-quantum lattice-based encryption algorithm with zero-trust key exchange for edge nodes.',
        methodology: 'Simulate lattice-based cryptography using Kyber algorithm variants integrated into campus IoT testbeds.',
        technologies: 'C++, Rust, Python, PyCryptodome, Docker, Qiskit',
        domain_id: 1, // AI/ML / Security
        faculty_id: selectedFacultyId,
        co_authors: 'Aarav Patel, Ananya Sen',
      }
    );
    if (proposalRes.status !== 201 || !proposalRes.body.project) throw new Error('Failed to submit proposal');
    const projectId = proposalRes.body.project.id;
    console.log(`  ✅ Student Project Proposal Created Successfully! (ID #${projectId})`);


    // STAGE 4: Student Proposal Submission & Faculty Assignment
    console.log('\n[STAGE 4] Student Proposal Submission & Faculty Mentorship Assignment...');
    const submitPropRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/projects/${projectId}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    if (submitPropRes.status !== 200) throw new Error('Student failed to submit project for review');

    const assignFacRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/faculty/assign-project',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      },
      { project_id: projectId, faculty_id: selectedFacultyId }
    );
    if (assignFacRes.status !== 200) throw new Error('Failed to assign faculty mentor to project');
    console.log(`  ✅ Faculty Mentor Assigned to Project #${projectId}.`);

    const milestoneRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/projects/${projectId}/milestones`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      },
      { title: 'Quantum Encryption Benchmark Report', description: 'Submit prototype source code and performance benchmarks.', due_date: '2026-10-30' }
    );
    if (milestoneRes.status !== 201) throw new Error('Faculty milestone creation failed');
    const milestoneId = milestoneRes.body.milestone.id;
    console.log(`  ✅ Milestone #${milestoneId} Assigned to Project.`);


    // STAGE 5: Student Milestone Submission & Faculty Approval
    console.log('\n[STAGE 5] Student Milestone Progress Submission & Faculty Approval...');
    const submitMsRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/milestones/${milestoneId}/submit`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      },
      { submission_text: 'Quantum lattice encryption algorithm implemented with 99.8% throughput efficiency.' }
    );
    if (submitMsRes.status !== 201) throw new Error('Student milestone submission failed');

    const approveMsRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/milestones/${milestoneId}/feedback`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      },
      { feedback_text: 'Benchmark metrics verified and approved.', status_action: 'APPROVE' }
    );
    if (approveMsRes.status !== 200) throw new Error('Faculty milestone approval failed');
    console.log(`  ✅ Milestone #${milestoneId} Approved by Faculty.`);

    const recommendAiRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/projects/${projectId}/recommend-ai`,
        method: 'POST',
        headers: { Authorization: `Bearer ${facultyToken}` },
      }
    );
    if (recommendAiRes.status !== 200) throw new Error('Faculty recommend for AI screening failed');
    console.log(`  ✅ Project Recommended for AI Originality Screening.`);


    // STAGE 6: Document Upload & AI Originality Screening
    console.log('\n[STAGE 6] Document Management & AI Originality Screening Engine...');
    const docRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/projects/${projectId}/documents`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      },
      { file_name: 'quantum_mesh_spec.pdf', document_type: 'PROPOSAL', file_size: 2048500 }
    );
    if (docRes.status !== 201) throw new Error('Document upload failed');
    console.log(`  ✅ Project Document Uploaded.`);

    const aiRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/projects/${projectId}/ai-screening`,
        method: 'POST',
        headers: { Authorization: `Bearer ${facultyToken}` },
      }
    );
    if (aiRes.status !== 201 || !aiRes.body.report.disclaimer) throw new Error('AI screening failed or missing disclaimer');
    console.log(`  ✅ AI Screening Engine Executed: Originality Score = ${aiRes.body.report.originality_score || aiRes.body.report.similarity_score}%`);
    console.log(`  ✅ Mandatory Non-Legal Disclaimer Present: "${aiRes.body.report.disclaimer.slice(0, 60)}..."`);


    // STAGE 7: Invention Disclosure Form (IDF) Drafting & Revenue Split Enforcement
    console.log('\n[STAGE 7] Collaborative Invention Disclosure Drafting (100% Revenue Split Enforcement)...');
    
    // Initial fetch of disclosure draft
    const getDisclRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/disclosures/project/${projectId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (getDisclRes.status !== 200 || !getDisclRes.body.disclosure) throw new Error('Failed to fetch IDF draft');

    // Save disclosure with 100% revenue split
    const saveDisclRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/disclosures/project/${projectId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      },
      {
        title_field: `Quantum Edge Mesh Patent Disclosure #${timestamp}`,
        technical_problem: 'Traditional encryption models are vulnerable to post-quantum computing attacks.',
        detailed_description: 'An advanced quantum-safe cryptographic network protocol for secure campus edge nodes.',
        novelty_inventive_step: 'Post-quantum lattice-based encryption algorithm with zero-trust key exchange.',
        commercial_utility: 'Enterprise cloud security & defense communications.',
        prior_art_differences: 'Demonstrates clear non-obviousness over standard existing solutions.',
        inventor_splits: [
          { student_id: 8, name: 'Aarav Kumar (Student)', role: 'Lead Inventor', percentage: 60 },
          { faculty_id: selectedFacultyId, name: 'Prof. Sharma (Faculty)', role: 'Co-Inventor', percentage: 40 },
        ],
      }
    );
    if (saveDisclRes.status !== 200 || !saveDisclRes.body.disclosure) throw new Error('Failed to save IDF draft');
    console.log(`  ✅ Invention Disclosure Form Saved (v${saveDisclRes.body.disclosure.version}) with 100% Revenue Split.`);

    // Export dossier
    const exportDisclRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/disclosures/project/${projectId}/export`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    if (exportDisclRes.status !== 200 || !exportDisclRes.body.dossier_markdown) throw new Error('IDF export dossier failed');
    console.log(`  ✅ Exported Formal Invention Disclosure Dossier (${exportDisclRes.body.filename}).`);


    // STAGE 8: Prior-Art Search & Candidate Patent Lookup
    console.log('\n[STAGE 8] Prior-Art Search & Patent Lookup Engine...');
    const searchRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/prior-art/search',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      },
      { query: 'quantum mesh encryption', sources: ['GOOGLE_PATENTS', 'IEEE'] }
    );
    if (searchRes.status !== 200 || !searchRes.body.results) throw new Error('Prior-art search failed');
    console.log(`  ✅ Prior-Art Search Query Returned ${searchRes.body.results.length} Literature & Patent Matches.`);

    const bookmarkRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/prior-art/bookmark',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      },
      {
        project_id: projectId,
        citation_title: 'Lattice Cryptography for Distributed Sensor Edge Mesh',
        document_id: 'US2025098765A1',
        source_platform: 'GOOGLE_PATENTS',
        publication_year: 2025,
        similarity_score: 84.5,
        relevance_notes: 'Primary prior-art reference evaluated during IDF drafting.',
      }
    );
    if (bookmarkRes.status !== 201) throw new Error('Prior-art bookmarking failed');
    console.log(`  ✅ Candidate Patent Reference Bookmarked to Project.`);


    // STAGE 9: IP Coordinator 10-Stage Patent Lifecycle Management
    console.log('\n[STAGE 9] IP Coordinator 10-Stage Patent Filing Lifecycle...');
    
    // Fetch IP Queue
    const ipQueueRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/ip/projects',
      method: 'GET',
      headers: { Authorization: `Bearer ${ipToken}` },
    });
    if (ipQueueRes.status !== 200) throw new Error('Failed to fetch IP project queue');
    console.log(`  ✅ IP Coordinator Project Queue Inspected (${ipQueueRes.body.count} Queue Items).`);

    // Advance 10-Stage Lifecycle Stage 1 -> UNDER_IP_EVALUATION
    const stageRes1 = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/ip/projects/${projectId}/status`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ipToken}` },
      },
      { status: 'UNDER_IP_EVALUATION', evaluation_notes: 'Commenced formal institutional IP evaluation.' }
    );
    if (stageRes1.status !== 200) throw new Error('Failed to update IP stage to UNDER_IP_EVALUATION');

    // Advance 10-Stage Lifecycle Stage 2 -> PATENT_DRAFTING_IN_PROGRESS
    const stageRes2 = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/ip/projects/${projectId}/status`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ipToken}` },
      },
      { status: 'PATENT_DRAFTING_IN_PROGRESS', evaluation_notes: 'Provisional patent specification drafting assigned to patent attorney.' }
    );
    if (stageRes2.status !== 200) throw new Error('Failed to update IP stage to PATENT_DRAFTING_IN_PROGRESS');
    console.log(`  ✅ IP Application Advanced through 10-Stage Lifecycle (Current Stage: ${stageRes2.body.project_status}).`);


    // STAGE 10: Notification Subsystem & System Audit Logger
    console.log('\n[STAGE 10] Notification Subsystem & System Audit Logger...');
    const notifRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (notifRes.status !== 200) throw new Error('Failed to fetch notifications');
    console.log(`  ✅ Student Notification Inbox Verified (${notifRes.body.unread_count} Unread Alerts).`);

    const markAllRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notifications/mark-all-read',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (markAllRes.status !== 200) throw new Error('Failed to mark notifications as read');
    console.log(`  ✅ Marked All Notifications as Read.`);

    const auditRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/audit-logs',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (auditRes.status !== 200) throw new Error('Failed to fetch audit logs');
    console.log(`  ✅ System Security Audit Trail Inspected (${auditRes.body.count} System Events Recorded).`);


    // STAGE 11: Institutional Analytics & Admin User Governance
    console.log('\n[STAGE 11] Institutional Analytics & Admin Role Governance...');
    const analyticsSummaryRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (analyticsSummaryRes.status !== 200) throw new Error('Analytics summary failed');

    const analyticsExportRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/export?format=csv',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (analyticsExportRes.status !== 200) throw new Error('Analytics export failed');
    console.log(`  ✅ Institutional Analytics KPI Dashboard & Executive CSV Exporter Verified.`);

    const adminStatsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/system-stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminStatsRes.status !== 200) throw new Error('Admin system stats failed');
    console.log(`  ✅ Admin Governance & System Health Engine Verified (${adminStatsRes.body.system_health.database_mode}).`);

    const adminUsersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminUsersRes.status !== 200) throw new Error('Admin user directory failed');
    console.log(`  ✅ Master User Directory Verified (${adminUsersRes.body.count} Registered Users).`);


    console.log('\n================================================================================');
    console.log('🎉 PHASE 16 MASTER END-TO-END INTEGRATION TEST COMPLETED SUCCESSFULLY! (100% PASS)');
    console.log('================================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 16 MASTER INTEGRATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runPhase16MasterIntegrationTest();
