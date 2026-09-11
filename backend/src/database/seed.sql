-- =============================================================================
-- AUTOMATED CAMPUS RESEARCH PROJECT LIFECYCLE MANAGEMENT AND COLLABORATIVE IP FILING DASHBOARD
-- PostgreSQL Demo Seed Data Script
-- =============================================================================

-- Clear existing data
TRUNCATE TABLE ip_awareness_content, audit_logs, notifications, ip_status_history, ip_reviews, 
               similarity_results, ai_screening_reports, project_documents, faculty_feedback, 
               milestone_submissions, project_milestones, project_members, projects, 
               faculty_domains, domains, ip_coordinators, faculty, students, users, roles RESTART IDENTITY CASCADE;

-- 1. SEED ROLES
INSERT INTO roles (id, name, description) VALUES
(1, 'STUDENT', 'Student role eligible to submit projects, manage teams, track milestones & request IP evaluation'),
(2, 'FACULTY', 'Faculty mentor role assigned to review projects, provide feedback & approve milestone progress'),
(3, 'IP_COORDINATOR', 'Institutional IP Coordinator responsible for AI report review, disclosure evaluation & patent filing status'),
(4, 'ADMIN', 'System Administrator with full domain management, user role assignment & audit log oversight');

-- Reset serial sequence for roles
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- 2. SEED USERS (Passwords hashed using bcrypt for "Password123!")
-- Hash: $2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s
INSERT INTO users (id, email, password_hash, full_name, role_id, is_active) VALUES
-- Admin
(1, 'admin@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'System Admin (Dr. Rajesh Mehta)', 4, TRUE),

-- IP Coordinators
(2, 'ip.coordinator@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Dr. Meera Nambiar (IP Head)', 3, TRUE),
(3, 'ip.assistant@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Prof. Suresh Rao (IP Cell)', 3, TRUE),

-- Faculty
(4, 'prof.sharma@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Prof. Alok Sharma', 2, TRUE),
(5, 'dr.anand@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Dr. Sunita Anand', 2, TRUE),
(6, 'prof.priya@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Prof. Priya Sundaram', 2, TRUE),
(7, 'dr.karthik@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Dr. Karthik Raman', 2, TRUE),

-- Students
(8, 'student1@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Aarav Kumar', 1, TRUE),
(9, 'student2@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Diya Patel', 1, TRUE),
(10, 'student3@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Rohan Verma', 1, TRUE),
(11, 'student4@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Ananya Sen', 1, TRUE),
(12, 'student5@campus.edu', '$2a$10$e8W/2sR.a5S6yM1Z7U.3UuC9N8F7G6h5i4j3k2l1m0n9o8p7q6r5s', 'Vikram Singh', 1, TRUE);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 3. SEED STUDENTS
INSERT INTO students (id, roll_number, department, batch_year, phone) VALUES
(8, '2023CSE042', 'Computer Science & Engineering', 2026, '+91-9876543210'),
(9, '2023AI015', 'Artificial Intelligence & Data Science', 2026, '+91-9876543211'),
(10, '2023ECE088', 'Electronics & Communication', 2026, '+91-9876543212'),
(11, '2023IT029', 'Information Technology', 2026, '+91-9876543213'),
(12, '2023CSE104', 'Computer Science & Engineering', 2026, '+91-9876543214');

-- 4. SEED FACULTY
INSERT INTO faculty (id, employee_id, department, designation, phone, max_projects) VALUES
(4, 'EMP-FAC-0101', 'Computer Science & Engineering', 'Associate Professor', '+91-9988776655', 5),
(5, 'EMP-FAC-0102', 'Information Technology', 'Professor', '+91-9988776656', 5),
(6, 'EMP-FAC-0103', 'Electronics & Communication', 'Assistant Professor', '+91-9988776657', 4),
(7, 'EMP-FAC-0104', 'Artificial Intelligence', 'Associate Professor', '+91-9988776658', 5);

-- 5. SEED IP COORDINATORS
INSERT INTO ip_coordinators (id, employee_id, department, office_location, phone) VALUES
(2, 'EMP-IP-0001', 'Deanery of Research & Innovation', 'Innovation Complex, Room 302', '+91-9123456789'),
(3, 'EMP-IP-0002', 'Intellectual Property Cell', 'Admin Block, Room 108', '+91-9123456790');

-- 6. SEED DOMAINS
INSERT INTO domains (id, name, description) VALUES
(1, 'IoT', 'Internet of Things, Sensor Networks, Smart Sensors & Edge Gateways'),
(2, 'Full Stack Development', 'Modern Web Architectures, Microservices, API Platforms & Cloud Native Apps'),
(3, 'FinTech', 'Financial Engineering, Decentralized Ledger, Algorithmic Trading & Payment Systems'),
(4, 'Embedded Systems', 'Microcontrollers, RTOS, Firmware Engineering & FPGA System Design'),
(5, 'AI/ML', 'Deep Learning, Computer Vision, Natural Language Processing & Neural Networks'),
(6, 'Cybersecurity', 'Network Defense, Cryptography, Vulnerability Assessment & Threat Intelligence'),
(7, 'Cloud Computing', 'Distributed Systems, Serverless Frameworks, Multi-cloud Infrastructure & DevOps'),
(8, 'Robotics', 'Autonomous Navigation, Mechatronics, Swarm Robotics & Control Engineering'),
(9, 'Data Science', 'Big Data Analytics, Predictive Modeling, Data Visualization & Statistical AI'),
(10, 'Other', 'Interdisciplinary and Emerging Technology Research Areas');

SELECT setval('domains_id_seq', (SELECT MAX(id) FROM domains));

-- 7. SEED FACULTY_DOMAINS (Skill Mapping)
INSERT INTO faculty_domains (faculty_id, domain_id) VALUES
(4, 1), -- Prof. Sharma -> IoT
(4, 5), -- Prof. Sharma -> AI/ML
(5, 3), -- Dr. Anand -> FinTech
(5, 6), -- Dr. Anand -> Cybersecurity
(6, 4), -- Prof. Priya -> Embedded Systems
(6, 8), -- Prof. Priya -> Robotics
(7, 5), -- Dr. Karthik -> AI/ML
(7, 7), -- Dr. Karthik -> Cloud Computing
(7, 9); -- Dr. Karthik -> Data Science

-- 8. SEED PROJECTS
INSERT INTO projects (
    id, title, abstract, problem_statement, objectives, methodology, technologies, features, 
    innovation_description, domain_id, created_by_student_id, assigned_faculty_id, status
) VALUES
(
    1,
    'Smart Agricultural Soil Micro-Nutrient Monitoring & Automated Irrigation System using Edge IoT',
    'An edge-computing IoT platform that analyzes NPK soil micro-nutrient levels using spectrographic sensors and regulates automated precision irrigation based on localized micro-climate forecasts.',
    'Traditional soil testing requires manual lab sampling taking 7-14 days. Farmers lack real-time soil chemistry data leading to fertilizer overuse and degraded yield.',
    '1. Develop low-cost optical spectrographic sensor module for NPK detection. 2. Implement LoRa mesh node network for remote field telemetry. 3. Build edge AI model to predict crop water requirements.',
    'Spectrographic LED sensors calibrate light absorption across soil samples. Data is processed locally on an ESP32 edge node and transmitted via LoRaWAN to a cloud analytics platform.',
    'ESP32, LoRaWAN, Python, TensorFlow Lite Micro, Node.js, PostgreSQL, MQTT',
    'Real-time soil NPK sensor telemetry, LoRa mesh fallback communication, Predictive water scheduling, Automated solar valve actuation',
    'Integrates optical spectrographic analysis directly into an edge-level sensor probe, eliminating expensive lab reagents and enabling immediate field decisions.',
    1, 8, 4, 'RECOMMENDED_FOR_IP_REVIEW'
),
(
    2,
    'Privacy-Preserving Federated Learning Engine for Healthcare Diagnostics',
    'A privacy-first machine learning framework that enables multi-hospital collaborative model training without raw patient diagnostic image transfer.',
    'Centralizing medical records for AI training violates HIPAA/GDPR privacy regulations and exposes sensitive patient data to security breaches.',
    '1. Construct a federated learning architecture with differential privacy noise addition. 2. Implement secure aggregation protocols over WebSockets. 3. Validate on chest X-ray disease detection.',
    'Hospitals train local convolutional neural networks on local GPUs. Only encrypted weight updates are sent to the central coordinator using homomorphic encryption.',
    'PyTorch, Federated Learning, Python, FastAPI, React, Docker, WebSockets',
    'Decentralized local model training, Zero raw data egress, Secure cryptographic weight aggregation, Real-time global accuracy dashboard',
    'Novel differential privacy noise distribution scheme that preserves 98.4% diagnostic accuracy while guaranteeing zero raw record leakage.',
    5, 9, 7, 'AI_SCREENED'
),
(
    3,
    'Zero-Knowledge Proof Cross-Border Remittance & Settlement Engine',
    'A high-throughput FinTech settlement layer using Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) for instantaneous cross-border fiat settlements.',
    'Cross-border remittances suffer from high intermediary bank fees (5-8%) and multi-day settlement delays.',
    '1. Design zk-SNARK circuit for instant transaction validity without revealing identity. 2. Integrate automated liquidity bridge smart contracts. 3. Provide ISO 20022 compliant reporting.',
    'Transactions execute off-chain in zk-Rollups with zero-knowledge cryptographic proofs submitted to a settlement ledger for instant finality.',
    'Solidity, Circom, Rust, React, Node.js, Web3.js, PostgreSQL',
    'Sub-second settlement finality, Privacy-preserving compliance verification, Low fee footprint (< $0.05 per transfer)',
    'Uses custom zk-SNARK verification circuits that allow regulatory AML compliance checks without exposing sender/receiver identity to third parties.',
    3, 10, 5, 'SUBMITTED'
);

SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

-- 9. SEED PROJECT_MEMBERS
INSERT INTO project_members (project_id, student_id, role_in_project) VALUES
(1, 8, 'LEAD'),   -- Aarav Kumar (Lead for Project 1)
(1, 11, 'MEMBER'), -- Ananya Sen (Member for Project 1)
(2, 9, 'LEAD'),   -- Diya Patel (Lead for Project 2)
(2, 12, 'MEMBER'), -- Vikram Singh (Member for Project 2)
(3, 10, 'LEAD');  -- Rohan Verma (Lead for Project 3)

-- 10. SEED PROJECT_MILESTONES
INSERT INTO project_milestones (id, project_id, title, description, sequence_order, due_date, status) VALUES
(1, 1, 'Problem Statement & Sensor Prototyping', 'Complete optical spectrographic sensor schematic and initial field calibration tests.', 1, CURRENT_TIMESTAMP + INTERVAL '14 days', 'APPROVED'),
(2, 1, 'LoRa Mesh & Edge AI Model Integration', 'Implement LoRaWAN telemetry protocol and deploy TensorFlow Lite model on ESP32.', 2, CURRENT_TIMESTAMP + INTERVAL '30 days', 'APPROVED'),
(3, 1, 'Final Prototype & Invention Disclosure Submission', 'Field demonstration and draft invention disclosure document for IP review.', 3, CURRENT_TIMESTAMP + INTERVAL '45 days', 'SUBMITTED'),

(4, 2, 'Federated Learning Architecture Design', 'Draft cryptographic weight aggregation specification and dataset privacy bounds.', 1, CURRENT_TIMESTAMP + INTERVAL '14 days', 'APPROVED'),
(5, 2, 'Hospital Node Simulation & Model Training', 'Simulate 5 hospital nodes with PyTorch and measure convergence speed.', 2, CURRENT_TIMESTAMP + INTERVAL '30 days', 'SUBMITTED');

SELECT setval('project_milestones_id_seq', (SELECT MAX(id) FROM project_milestones));

-- 11. SEED MILESTONE_SUBMISSIONS
INSERT INTO milestone_submissions (milestone_id, submitted_by_student_id, submission_text) VALUES
(1, 8, 'Completed spectrographic LED sensor assembly. Benchmarking shows 94.2% correlation with lab spectrometer readings for Nitrogen and Potassium.'),
(2, 8, 'Deployed LoRaWAN telemetry mesh across 3 field zones. Edge model running on ESP32 predicts soil moisture decay with under 4% error.'),
(3, 8, 'Final hardware prototype assembled in weatherproof IP67 enclosure. Uploaded complete Invention Disclosure and Literature Survey.');

-- 12. SEED FACULTY_FEEDBACK
INSERT INTO faculty_feedback (project_id, milestone_id, faculty_id, feedback_text, status_action) VALUES
(1, 1, 4, 'Excellent hardware schematic design. Ensure calibration curves account for high organic soil density.', 'APPROVE'),
(1, 2, 4, 'LoRa mesh transmission stability looks solid. The project shows strong potential for patent disclosure.', 'APPROVE'),
(1, 3, 4, 'Project milestones fully met. Formally recommending for AI Originality Screening & IP Cell Review.', 'APPROVE');

-- 13. SEED PROJECT_DOCUMENTS
INSERT INTO project_documents (project_id, uploaded_by_user_id, document_type, file_name, file_path, file_size, mime_type) VALUES
(1, 8, 'PROPOSAL', 'Smart_Agri_IoT_Project_Proposal.pdf', '/uploads/projects/1/proposal_v1.pdf', 2458000, 'application/pdf'),
(1, 8, 'DESIGN_DOCUMENT', 'Edge_Spectrographic_Hardware_Schematic.pdf', '/uploads/projects/1/hardware_design.pdf', 4120000, 'application/pdf'),
(1, 8, 'INVENTION_DISCLOSURE', 'Invention_Disclosure_Form_AgriIoT.pdf', '/uploads/projects/1/invention_disclosure.pdf', 1850000, 'application/pdf');

-- 14. SEED AI_SCREENING_REPORTS
INSERT INTO ai_screening_reports (
    id, project_id, similarity_score, confidence_score, recommendation, 
    similar_concepts_summary, overlapping_features_summary, potentially_novel_features_summary, 
    disclaimer, raw_analysis_json
) VALUES (
    1, 1, 14.80, 93.50, 'HIGH_NOVELTY_POTENTIAL',
    'Found 3 existing published research papers discussing optical soil reflectance and LoRa agricultural telemetry.',
    'Standard LoRa mesh networking and ESP32 solar relay control overlap with existing open-source IoT agricultural designs.',
    '1. Multi-spectral optical LED absorption sensor integrated into direct-insertion soil probe. 2. Dynamic nutrient decay model executed on microcontroller without cloud dependence.',
    'IMPORTANT DISCLAIMER: This AI screening report is a preliminary decision-support analysis only. It does not constitute a formal legal opinion, guarantee absolute uniqueness, or declare official patentability. Final IP evaluations are determined solely by the Institutional IP Coordinator.',
    '{"analyzed_sections": ["title", "abstract", "methodology", "innovation_description"], "vector_matches": 3, "novelty_index": 0.852}'
);

SELECT setval('ai_screening_reports_id_seq', (SELECT MAX(id) FROM ai_screening_reports));

-- 15. SEED SIMILARITY_RESULTS
INSERT INTO similarity_results (ai_report_id, matched_source_title, matched_source_url, similarity_percentage, matched_segment_description) VALUES
(1, 'IEEE Sensor Journal: IoT-Based LoRaWAN Soil Telemetry Systems', 'https://ieeexplore.ieee.org/document/8912345', 8.20, 'Overlap in LoRaWAN packet frame structure and battery power conservation sleep cycles.'),
(1, 'AgriTech Patent US20210098765A1: Automated Drip Irrigation Controller', 'https://patents.google.com/patent/US20210098765A1', 6.60, 'Overlapping relay valve switching logic based on threshold moisture levels.');

-- 16. SEED IP_REVIEWS
INSERT INTO ip_reviews (
    project_id, ip_coordinator_id, novelty_assessment, commercial_potential, 
    patentability_notes, recommended_action, final_evaluation_status
) VALUES (
    1, 2, 
    'The integrated multi-spectral optical probe demonstrates genuine non-obviousness over existing lab-bound optical spectrometers. The edge processing capability provides clear technical advancement.',
    'High commercial viability for precision agriculture equipment manufacturers and farm automation providers.',
    'Strong utility patent prospect under Section 3 of Indian Patents Act. Recommending drafting of Provisional Patent Specification.',
    'PROCEED_TO_PROVISIONAL_PATENT_FILING',
    'APPROVED_FOR_IP_PROCESSING'
);

-- 17. SEED IP_STATUS_HISTORY
INSERT INTO ip_status_history (project_id, changed_by_user_id, previous_status, new_status, comments) VALUES
(1, 4, 'NOT_EVALUATED', 'UNDER_REVIEW', 'Faculty assigned and initial proposal approved.'),
(1, 4, 'UNDER_REVIEW', 'RECOMMENDED_FOR_IP_REVIEW', 'All project milestones completed. AI novelty report generated.'),
(1, 2, 'RECOMMENDED_FOR_IP_REVIEW', 'APPROVED_FOR_IP_PROCESSING', 'IP Coordinator completed evaluation. Approved for provisional patent application drafting.');

-- 18. SEED NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id) VALUES
(8, 'Project Milestone Approved', 'Faculty Prof. Alok Sharma approved Milestone 3 for Smart Agricultural Soil Micro-Nutrient Monitoring.', 'MILESTONE_APPROVAL', 'PROJECT', 1),
(8, 'AI Novelty Screening Complete', 'AI Screening Report is ready. Similarity Score: 14.8%. High Novelty Potential.', 'AI_SCREENING_COMPLETED', 'AI_REPORT', 1),
(2, 'New IP Review Request', 'Project "Smart Agricultural Soil Micro-Nutrient Monitoring" was recommended by faculty for IP review.', 'IP_REVIEW_REQUESTED', 'PROJECT', 1),
(8, 'IP Status Update', 'IP Coordinator updated project IP status to "APPROVED_FOR_IP_PROCESSING".', 'IP_STATUS_UPDATE', 'PROJECT', 1);

-- 19. SEED AUDIT_LOGS
INSERT INTO audit_logs (user_id, role_name, action, entity, entity_id, previous_value, new_value, ip_address) VALUES
(8, 'STUDENT', 'CREATE_PROJECT', 'PROJECT', 1, NULL, '{"title": "Smart Agricultural Soil Micro-Nutrient Monitoring", "status": "DRAFT"}', '127.0.0.1'),
(4, 'FACULTY', 'APPROVE_MILESTONE', 'MILESTONE', 3, '{"status": "SUBMITTED"}', '{"status": "APPROVED"}', '127.0.0.1'),
(2, 'IP_COORDINATOR', 'UPDATE_IP_STATUS', 'PROJECT', 1, '{"status": "UNDER_REVIEW"}', '{"status": "APPROVED_FOR_IP_PROCESSING"}', '127.0.0.1');

-- 20. SEED IP_AWARENESS_CONTENT
INSERT INTO ip_awareness_content (title, category, content_markdown, author_admin_id, is_published) VALUES
(
    'Understanding Intellectual Property & Patents for College Researchers',
    'IP_BASICS',
    '# Intellectual Property Fundamentals for Students\n\nIntellectual Property (IP) refers to creations of the mind—such as inventions, literary and artistic works, designs, symbols, names, and images used in commerce.\n\n## Types of IP Protection\n- **Patents**: Protect technological inventions that are new, non-obvious, and useful.\n- **Copyrights**: Protect original literary, dramatic, musical, and artistic works.\n- **Trademarks**: Protect brand identifiers, logos, and slogans.\n- **Trade Secrets**: Protect confidential proprietary algorithms and business secrets.',
    1, TRUE
),
(
    'Step-by-Step Institutional Patent Workflow: From Project to Patent Filing',
    'PATENT_WORKFLOW',
    '# Campus Patent Filing Workflow\n\n1. **Project Execution & Milestone Completion**: Complete research milestones under faculty guidance.\n2. **Invention Disclosure Submission**: Submit complete technical specs via the Campus Dashboard.\n3. **AI Originality Screening**: Automatic preliminary prior-art search across patents and literature.\n4. **IP Coordinator Evaluation**: Institutional review committee assesses novelty and commercial viability.\n5. **Patent Drafting & Filing**: Official provisional/complete patent filing through institutional IP attorney.',
    1, TRUE
),
(
    'Conducting Effective Prior-Art Searches Before Project Submission',
    'PRIOR_ART_SEARCH',
    '# How to Search Prior Art\n\nPrior art includes any public disclosure (patents, papers, conference proceedings, websites) existing before your invention date.\n\n## Search Databases\n- **Google Patents**: Search global patent disclosures.\n- **IEEE Xplore & ScienceDirect**: Search peer-reviewed engineering literature.\n- **Espacenet & USPTO**: Search European and US patent databases.',
    1, TRUE
),
(
    'How to Write a Comprehensive Invention Disclosure Document',
    'DISCLOSURE_GUIDE',
    '# Guide to Invention Disclosure\n\nA great invention disclosure clearly answers four critical questions:\n1. **What technical problem does it solve?**\n2. **How does your solution work step-by-step?**\n3. **What is the exact novel component that makes it different from existing solutions?**\n4. **What are the potential commercial applications?**',
    1, TRUE
),
(
    'Top 5 Common IP Mistakes Student Innovators Must Avoid',
    'COMMON_MISTAKES',
    '# Critical IP Pitfalls\n\n1. **Public Disclosure Before Filing**: Publishing paper/YouTube video before filing a patent destroys novelty in most jurisdictions.\n2. **Incomplete Prior-Art Search**: Assuming a project is unique without checking patent databases.\n3. **Ignoring Co-Inventor Rights**: Failing to document all student team members and faculty mentors who contributed inventively.',
    1, TRUE
);

SELECT setval('ip_awareness_content_id_seq', (SELECT MAX(id) FROM ip_awareness_content));
