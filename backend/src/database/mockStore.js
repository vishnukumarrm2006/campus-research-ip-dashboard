/**
 * Resilient In-Memory Mock/Demo Database Store
 * Serves as an automatic fallback when PostgreSQL is not running locally.
 * Pre-populated with seed data matching schema.sql and seed.sql.
 */

const mockStore = {
  roles: [
    { id: 1, name: 'STUDENT', description: 'Student role eligible to submit projects, manage teams, track milestones & request IP evaluation' },
    { id: 2, name: 'FACULTY', description: 'Faculty mentor role assigned to review projects, provide feedback & approve milestone progress' },
    { id: 3, name: 'IP_COORDINATOR', description: 'Institutional IP Coordinator responsible for AI report review, disclosure evaluation & patent filing status' },
    { id: 4, name: 'ADMIN', description: 'System Administrator with full domain management, user role assignment & audit log oversight' }
  ],

  users: [
    { id: 1, email: 'admin@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'System Admin (Dr. Rajesh Mehta)', role_id: 4, is_active: true, created_at: new Date() },
    { id: 2, email: 'ip.coordinator@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Dr. Meera Nambiar (IP Head)', role_id: 3, is_active: true, created_at: new Date() },
    { id: 3, email: 'ip.assistant@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Prof. Suresh Rao (IP Cell)', role_id: 3, is_active: true, created_at: new Date() },
    { id: 4, email: 'prof.sharma@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Prof. Alok Sharma', role_id: 2, is_active: true, created_at: new Date() },
    { id: 5, email: 'dr.anand@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Dr. Sunita Anand', role_id: 2, is_active: true, created_at: new Date() },
    { id: 6, email: 'prof.priya@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Prof. Priya Sundaram', role_id: 2, is_active: true, created_at: new Date() },
    { id: 7, email: 'dr.karthik@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Dr. Karthik Raman', role_id: 2, is_active: true, created_at: new Date() },
    { id: 8, email: 'student1@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Aarav Kumar', role_id: 1, is_active: true, created_at: new Date() },
    { id: 9, email: 'student2@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Diya Patel', role_id: 1, is_active: true, created_at: new Date() },
    { id: 10, email: 'student3@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Rohan Verma', role_id: 1, is_active: true, created_at: new Date() },
    { id: 11, email: 'student4@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Ananya Sen', role_id: 1, is_active: true, created_at: new Date() },
    { id: 12, email: 'student5@campus.edu', password_hash: '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', full_name: 'Vikram Singh', role_id: 1, is_active: true, created_at: new Date() }
  ],

  students: [
    { id: 8, roll_number: '2023CSE042', department: 'Computer Science & Engineering', batch_year: 2026, phone: '+91-9876543210' },
    { id: 9, roll_number: '2023AI015', department: 'Artificial Intelligence & Data Science', batch_year: 2026, phone: '+91-9876543211' },
    { id: 10, roll_number: '2023ECE088', department: 'Electronics & Communication', batch_year: 2026, phone: '+91-9876543212' },
    { id: 11, roll_number: '2023IT029', department: 'Information Technology', batch_year: 2026, phone: '+91-9876543213' },
    { id: 12, roll_number: '2023CSE104', department: 'Computer Science & Engineering', batch_year: 2026, phone: '+91-9876543214' }
  ],

  faculty: [
    { id: 4, employee_id: 'EMP-FAC-0101', department: 'Computer Science & Engineering', designation: 'Associate Professor', phone: '+91-9988776655', max_projects: 5 },
    { id: 5, employee_id: 'EMP-FAC-0102', department: 'Information Technology', designation: 'Professor', phone: '+91-9988776656', max_projects: 5 },
    { id: 6, employee_id: 'EMP-FAC-0103', department: 'Electronics & Communication', designation: 'Assistant Professor', phone: '+91-9988776657', max_projects: 4 },
    { id: 7, employee_id: 'EMP-FAC-0104', department: 'Artificial Intelligence', designation: 'Associate Professor', phone: '+91-9988776658', max_projects: 5 }
  ],

  ip_coordinators: [
    { id: 2, employee_id: 'EMP-IP-0001', department: 'Deanery of Research & Innovation', office_location: 'Innovation Complex, Room 302', phone: '+91-9123456789' },
    { id: 3, employee_id: 'EMP-IP-0002', department: 'Intellectual Property Cell', office_location: 'Admin Block, Room 108', phone: '+91-9123456790' }
  ],

  domains: [
    { id: 1, name: 'IoT', description: 'Internet of Things, Sensor Networks, Smart Sensors & Edge Gateways', is_active: true },
    { id: 2, name: 'Full Stack Development', description: 'Modern Web Architectures, Microservices, API Platforms & Cloud Native Apps', is_active: true },
    { id: 3, name: 'FinTech', description: 'Financial Engineering, Decentralized Ledger, Algorithmic Trading & Payment Systems', is_active: true },
    { id: 4, name: 'Embedded Systems', description: 'Microcontrollers, RTOS, Firmware Engineering & FPGA System Design', is_active: true },
    { id: 5, name: 'AI/ML', description: 'Deep Learning, Computer Vision, Natural Language Processing & Neural Networks', is_active: true },
    { id: 6, name: 'Cybersecurity', description: 'Network Defense, Cryptography, Vulnerability Assessment & Threat Intelligence', is_active: true },
    { id: 7, name: 'Cloud Computing', description: 'Distributed Systems, Serverless Frameworks, Multi-cloud Infrastructure & DevOps', is_active: true },
    { id: 8, name: 'Robotics', description: 'Autonomous Navigation, Mechatronics, Swarm Robotics & Control Engineering', is_active: true },
    { id: 9, name: 'Data Science', description: 'Big Data Analytics, Predictive Modeling, Data Visualization & Statistical AI', is_active: true },
    { id: 10, name: 'Other', description: 'Interdisciplinary and Emerging Technology Research Areas', is_active: true }
  ],

  faculty_domains: [
    { id: 1, faculty_id: 4, domain_id: 1 },
    { id: 2, faculty_id: 4, domain_id: 5 },
    { id: 3, faculty_id: 5, domain_id: 3 },
    { id: 4, faculty_id: 5, domain_id: 6 },
    { id: 5, faculty_id: 6, domain_id: 4 },
    { id: 6, faculty_id: 6, domain_id: 8 },
    { id: 7, faculty_id: 7, domain_id: 5 },
    { id: 8, faculty_id: 7, domain_id: 7 },
    { id: 9, faculty_id: 7, domain_id: 9 }
  ],

  projects: [
    {
      id: 1,
      title: 'Smart Agricultural Soil Micro-Nutrient Monitoring & Automated Irrigation System using Edge IoT',
      abstract: 'An edge-computing IoT platform that analyzes NPK soil micro-nutrient levels using spectrographic sensors and regulates automated precision irrigation based on localized micro-climate forecasts.',
      problem_statement: 'Traditional soil testing requires manual lab sampling taking 7-14 days. Farmers lack real-time soil chemistry data leading to fertilizer overuse.',
      objectives: '1. Develop optical spectrographic sensor probe. 2. Implement LoRa mesh node. 3. Build edge AI model.',
      methodology: 'Spectrographic LED sensors calibrate light absorption across soil samples.',
      technologies: 'ESP32, LoRaWAN, Python, TensorFlow Lite Micro, Node.js, PostgreSQL',
      features: 'Real-time telemetry, LoRa mesh fallback, Solar relay control',
      innovation_description: 'Integrates optical spectrographic analysis directly into an edge-level sensor probe.',
      domain_id: 1,
      created_by_student_id: 8,
      assigned_faculty_id: 4,
      status: 'RECOMMENDED_FOR_IP_REVIEW',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      title: 'Privacy-Preserving Federated Learning Engine for Healthcare Diagnostics',
      abstract: 'A privacy-first machine learning framework that enables multi-hospital collaborative model training without raw patient diagnostic image transfer.',
      problem_statement: 'Centralizing medical records for AI training violates HIPAA/GDPR privacy regulations.',
      objectives: '1. Federated learning architecture with differential privacy. 2. Secure weight aggregation.',
      methodology: 'Hospitals train local convolutional neural networks on local GPUs. Encrypted weights are aggregated.',
      technologies: 'PyTorch, Federated Learning, Python, FastAPI, React, Docker',
      features: 'Decentralized local model training, Zero raw data egress, Secure weight aggregation',
      innovation_description: 'Novel differential privacy noise distribution scheme preserving 98.4% accuracy.',
      domain_id: 5,
      created_by_student_id: 9,
      assigned_faculty_id: 7,
      status: 'AI_SCREENED',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      title: 'Zero-Knowledge Proof Cross-Border Remittance & Settlement Engine',
      abstract: 'A high-throughput FinTech settlement layer using Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs).',
      problem_statement: 'Cross-border remittances suffer from high intermediary bank fees and multi-day delays.',
      objectives: '1. zk-SNARK circuit for instant settlement. 2. Automated liquidity bridge.',
      methodology: 'Transactions execute off-chain in zk-Rollups with zero-knowledge cryptographic proofs.',
      technologies: 'Solidity, Circom, Rust, React, Node.js, Web3.js',
      features: 'Sub-second settlement finality, Privacy-preserving compliance verification',
      innovation_description: 'Custom zk-SNARK verification circuits allowing AML compliance without exposing identity.',
      domain_id: 3,
      created_by_student_id: 10,
      assigned_faculty_id: 5,
      status: 'SUBMITTED',
      created_at: new Date(),
      updated_at: new Date()
    }
  ],

  project_members: [
    { id: 1, project_id: 1, student_id: 8, role_in_project: 'LEAD' },
    { id: 2, project_id: 1, student_id: 11, role_in_project: 'MEMBER' },
    { id: 3, project_id: 2, student_id: 9, role_in_project: 'LEAD' },
    { id: 4, project_id: 2, student_id: 12, role_in_project: 'MEMBER' },
    { id: 5, project_id: 3, student_id: 10, role_in_project: 'LEAD' }
  ],

  project_milestones: [
    { id: 1, project_id: 1, title: 'Problem Statement & Sensor Prototyping', description: 'Optical spectrographic sensor schematic.', sequence_order: 1, due_date: new Date(), status: 'APPROVED' },
    { id: 2, project_id: 1, title: 'LoRa Mesh & Edge AI Model Integration', description: 'Deploy TensorFlow Lite model on ESP32.', sequence_order: 2, due_date: new Date(), status: 'APPROVED' },
    { id: 3, project_id: 1, title: 'Final Prototype & Invention Disclosure', description: 'Field demonstration and draft disclosure.', sequence_order: 3, due_date: new Date(), status: 'SUBMITTED' },
    { id: 4, project_id: 2, title: 'Federated Learning Architecture Design', description: 'Draft cryptographic weight aggregation.', sequence_order: 1, due_date: new Date(), status: 'APPROVED' },
    { id: 5, project_id: 2, title: 'Hospital Node Simulation & Model Training', description: 'Simulate 5 hospital nodes with PyTorch.', sequence_order: 2, due_date: new Date(), status: 'SUBMITTED' }
  ],

  milestone_submissions: [
    { id: 1, milestone_id: 1, submitted_by_student_id: 8, submission_text: 'Completed spectrographic LED assembly. 94.2% correlation with lab readings.', submitted_at: new Date() },
    { id: 2, milestone_id: 2, submitted_by_student_id: 8, submission_text: 'Deployed LoRaWAN telemetry mesh across 3 field zones.', submitted_at: new Date() },
    { id: 3, milestone_id: 3, submitted_by_student_id: 8, submission_text: 'Uploaded complete Invention Disclosure and Literature Survey.', submitted_at: new Date() }
  ],

  faculty_feedback: [
    { id: 1, project_id: 1, milestone_id: 1, faculty_id: 4, feedback_text: 'Excellent hardware schematic design.', status_action: 'APPROVE', created_at: new Date() },
    { id: 2, project_id: 1, milestone_id: 2, faculty_id: 4, feedback_text: 'LoRa mesh transmission looks solid.', status_action: 'APPROVE', created_at: new Date() },
    { id: 3, project_id: 1, milestone_id: 3, faculty_id: 4, feedback_text: 'Formally recommending for AI Screening & IP Review.', status_action: 'APPROVE', created_at: new Date() }
  ],

  project_documents: [
    { id: 1, project_id: 1, uploaded_by_user_id: 8, document_type: 'PROPOSAL', file_name: 'Smart_Agri_IoT_Project_Proposal.pdf', file_path: '/uploads/projects/1/proposal_v1.pdf', file_size: 2458000, mime_type: 'application/pdf', uploaded_at: new Date() },
    { id: 2, project_id: 1, uploaded_by_user_id: 8, document_type: 'DESIGN_DOCUMENT', file_name: 'Edge_Spectrographic_Hardware_Schematic.pdf', file_path: '/uploads/projects/1/hardware_design.pdf', file_size: 4120000, mime_type: 'application/pdf', uploaded_at: new Date() },
    { id: 3, project_id: 1, uploaded_by_user_id: 8, document_type: 'INVENTION_DISCLOSURE', file_name: 'Invention_Disclosure_Form_AgriIoT.pdf', file_path: '/uploads/projects/1/invention_disclosure.pdf', file_size: 1850000, mime_type: 'application/pdf', uploaded_at: new Date() }
  ],

  ai_screening_reports: [
    {
      id: 1,
      project_id: 1,
      similarity_score: 14.80,
      confidence_score: 93.50,
      recommendation: 'HIGH_NOVELTY_POTENTIAL',
      similar_concepts_summary: 'Found 3 existing published research papers discussing optical soil reflectance.',
      overlapping_features_summary: 'Standard LoRa mesh networking overlaps with open-source IoT designs.',
      potentially_novel_features_summary: '1. Multi-spectral optical LED sensor in direct-insertion soil probe. 2. Edge nutrient decay model.',
      disclaimer: 'IMPORTANT DISCLAIMER: This AI screening report is a preliminary decision-support analysis only. It does not constitute a formal legal opinion, guarantee absolute uniqueness, or declare official patentability. Final IP evaluations are determined solely by the Institutional IP Coordinator.',
      raw_analysis_json: { analyzed_sections: ['title', 'abstract', 'methodology'], vector_matches: 3 },
      created_at: new Date()
    }
  ],

  similarity_results: [
    { id: 1, ai_report_id: 1, matched_source_title: 'IEEE Sensor Journal: IoT-Based LoRaWAN Soil Telemetry', matched_source_url: 'https://ieeexplore.ieee.org/document/8912345', similarity_percentage: 8.20, matched_segment_description: 'Overlap in LoRaWAN packet frame structure.', created_at: new Date() },
    { id: 2, ai_report_id: 1, matched_source_title: 'AgriTech Patent US20210098765A1: Automated Drip Controller', matched_source_url: 'https://patents.google.com/patent/US20210098765A1', similarity_percentage: 6.60, matched_segment_description: 'Overlapping relay valve switching logic.', created_at: new Date() }
  ],

  ip_reviews: [
    {
      id: 1,
      project_id: 1,
      ip_coordinator_id: 2,
      novelty_assessment: 'The integrated multi-spectral optical probe demonstrates genuine non-obviousness.',
      commercial_potential: 'High commercial viability for precision agriculture equipment manufacturers.',
      patentability_notes: 'Strong utility patent prospect under Section 3 of Indian Patents Act.',
      recommended_action: 'PROCEED_TO_PROVISIONAL_PATENT_FILING',
      final_evaluation_status: 'APPROVED_FOR_IP_PROCESSING',
      created_at: new Date(),
      updated_at: new Date()
    }
  ],

  ip_status_history: [
    { id: 1, project_id: 1, changed_by_user_id: 4, previous_status: 'NOT_EVALUATED', new_status: 'UNDER_REVIEW', comments: 'Faculty assigned.', created_at: new Date() },
    { id: 2, project_id: 1, changed_by_user_id: 4, previous_status: 'UNDER_REVIEW', new_status: 'RECOMMENDED_FOR_IP_REVIEW', comments: 'Milestones completed.', created_at: new Date() },
    { id: 3, project_id: 1, changed_by_user_id: 2, previous_status: 'RECOMMENDED_FOR_IP_REVIEW', new_status: 'APPROVED_FOR_IP_PROCESSING', comments: 'Approved for patent application drafting.', created_at: new Date() }
  ],

  notifications: [
    { id: 1, user_id: 8, title: 'Project Milestone Approved', message: 'Faculty Prof. Alok Sharma approved Milestone 3.', type: 'MILESTONE_APPROVAL', entity_type: 'PROJECT', entity_id: 1, is_read: false, created_at: new Date() },
    { id: 2, user_id: 8, title: 'AI Novelty Screening Complete', message: 'AI Screening Report ready. Similarity Score: 14.8%.', type: 'AI_SCREENING_COMPLETED', entity_type: 'AI_REPORT', entity_id: 1, is_read: false, created_at: new Date() },
    { id: 3, user_id: 2, title: 'New IP Review Request', message: 'Project recommended for IP review by faculty.', type: 'IP_REVIEW_REQUESTED', entity_type: 'PROJECT', entity_id: 1, is_read: false, created_at: new Date() },
    { id: 4, user_id: 8, title: 'IP Status Update', message: 'IP status updated to APPROVED_FOR_IP_PROCESSING.', type: 'IP_STATUS_UPDATE', entity_type: 'PROJECT', entity_id: 1, is_read: false, created_at: new Date() }
  ],

  audit_logs: [
    { id: 1, user_id: 8, role_name: 'STUDENT', action: 'CREATE_PROJECT', entity: 'PROJECT', entity_id: 1, previous_value: null, new_value: { title: 'Smart Agricultural Soil Micro-Nutrient Monitoring' }, ip_address: '127.0.0.1', created_at: new Date() },
    { id: 2, user_id: 4, role_name: 'FACULTY', action: 'APPROVE_MILESTONE', entity: 'MILESTONE', entity_id: 3, previous_value: { status: 'SUBMITTED' }, new_value: { status: 'APPROVED' }, ip_address: '127.0.0.1', created_at: new Date() },
    { id: 3, user_id: 2, role_name: 'IP_COORDINATOR', action: 'UPDATE_IP_STATUS', entity: 'PROJECT', entity_id: 1, previous_value: { status: 'UNDER_REVIEW' }, new_value: { status: 'APPROVED_FOR_IP_PROCESSING' }, ip_address: '127.0.0.1', created_at: new Date() }
  ],

  ip_awareness_content: [
    { id: 1, title: 'Understanding Intellectual Property & Patents for College Researchers', category: 'IP_BASICS', content_markdown: '# Intellectual Property Fundamentals...', author_admin_id: 1, is_published: true, created_at: new Date() },
    { id: 2, title: 'Step-by-Step Institutional Patent Workflow: From Project to Patent Filing', category: 'PATENT_WORKFLOW', content_markdown: '# Campus Patent Filing Workflow...', author_admin_id: 1, is_published: true, created_at: new Date() },
    { id: 3, title: 'Conducting Effective Prior-Art Searches Before Project Submission', category: 'PRIOR_ART_SEARCH', content_markdown: '# How to Search Prior Art...', author_admin_id: 1, is_published: true, created_at: new Date() },
    { id: 4, title: 'How to Write a Comprehensive Invention Disclosure Document', category: 'DISCLOSURE_GUIDE', content_markdown: '# Guide to Invention Disclosure...', author_admin_id: 1, is_published: true, created_at: new Date() },
    { id: 5, title: 'Top 5 Common IP Mistakes Student Innovators Must Avoid', category: 'COMMON_MISTAKES', content_markdown: '# Critical IP Pitfalls...', author_admin_id: 1, is_published: true, created_at: new Date() }
  ]
};

module.exports = mockStore;
