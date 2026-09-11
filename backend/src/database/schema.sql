-- =============================================================================
-- AUTOMATED CAMPUS RESEARCH PROJECT LIFECYCLE MANAGEMENT AND COLLABORATIVE IP FILING DASHBOARD
-- PostgreSQL Relational Schema DDL
-- =============================================================================

-- Drop tables in reverse order of dependencies to allow clean re-runs
DROP TABLE IF EXISTS ip_awareness_content CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ip_status_history CASCADE;
DROP TABLE IF EXISTS ip_reviews CASCADE;
DROP TABLE IF EXISTS similarity_results CASCADE;
DROP TABLE IF EXISTS ai_screening_reports CASCADE;
DROP TABLE IF EXISTS project_documents CASCADE;
DROP TABLE IF EXISTS faculty_feedback CASCADE;
DROP TABLE IF EXISTS milestone_submissions CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS faculty_domains CASCADE;
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS ip_coordinators CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. ROLES TABLE
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS TABLE
CREATE TABLE students (
    id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    batch_year INT NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. FACULTY TABLE
CREATE TABLE faculty (
    id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    max_projects INT DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. IP COORDINATORS TABLE
CREATE TABLE ip_coordinators (
    id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    office_location VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DOMAINS TABLE
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. FACULTY_DOMAINS (Junction Table)
CREATE TABLE faculty_domains (
    id SERIAL PRIMARY KEY,
    faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    domain_id INT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_faculty_domain UNIQUE (faculty_id, domain_id)
);

-- 8. PROJECTS TABLE
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    abstract TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    objectives TEXT NOT NULL,
    methodology TEXT NOT NULL,
    technologies TEXT NOT NULL,
    features TEXT NOT NULL,
    innovation_description TEXT NOT NULL,
    domain_id INT NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
    created_by_student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    assigned_faculty_id INT REFERENCES faculty(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (
        status IN (
            'DRAFT',
            'SUBMITTED',
            'UNDER_FACULTY_REVIEW',
            'REVISION_REQUESTED',
            'FACULTY_APPROVED',
            'RECOMMENDED_FOR_AI_SCREENING',
            'AI_SCREENED',
            'RECOMMENDED_FOR_IP_REVIEW',
            'IP_UNDER_REVIEW',
            'REJECTED',
            'COMPLETED'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PROJECT_MEMBERS TABLE
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role_in_project VARCHAR(50) DEFAULT 'MEMBER' CHECK (role_in_project IN ('LEAD', 'MEMBER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_student UNIQUE (project_id, student_id)
);

-- 10. PROJECT_MILESTONES TABLE
CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. MILESTONE_SUBMISSIONS TABLE
CREATE TABLE milestone_submissions (
    id SERIAL PRIMARY KEY,
    milestone_id INT NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    submitted_by_student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    submission_text TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. FACULTY_FEEDBACK TABLE
CREATE TABLE faculty_feedback (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id INT REFERENCES project_milestones(id) ON DELETE CASCADE,
    faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    feedback_text TEXT NOT NULL,
    status_action VARCHAR(50) NOT NULL CHECK (
        status_action IN ('APPROVE', 'REJECT', 'REQUEST_IMPROVEMENT', 'COMMENT')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. PROJECT_DOCUMENTS TABLE
CREATE TABLE project_documents (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by_user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN (
            'PROPOSAL',
            'LITERATURE_SURVEY',
            'DESIGN_DOCUMENT',
            'PROGRESS_REPORT',
            'FINAL_REPORT',
            'SUPPORTING_DOCUMENT',
            'INVENTION_DISCLOSURE'
        )
    ),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. AI_SCREENING_REPORTS TABLE
CREATE TABLE ai_screening_reports (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5,2) NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL,
    recommendation VARCHAR(100) NOT NULL,
    similar_concepts_summary TEXT NOT NULL,
    overlapping_features_summary TEXT NOT NULL,
    potentially_novel_features_summary TEXT NOT NULL,
    disclaimer TEXT NOT NULL DEFAULT 'IMPORTANT DISCLAIMER: This AI screening report is a preliminary decision-support analysis only. It does not constitute a formal legal opinion, guarantee absolute uniqueness, or declare official patentability. Final IP evaluations are determined solely by the Institutional IP Coordinator.',
    raw_analysis_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. SIMILARITY_RESULTS TABLE
CREATE TABLE similarity_results (
    id SERIAL PRIMARY KEY,
    ai_report_id INT NOT NULL REFERENCES ai_screening_reports(id) ON DELETE CASCADE,
    matched_source_title VARCHAR(255) NOT NULL,
    matched_source_url VARCHAR(512),
    similarity_percentage NUMERIC(5,2) NOT NULL,
    matched_segment_description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. IP_REVIEWS TABLE
CREATE TABLE ip_reviews (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ip_coordinator_id INT NOT NULL REFERENCES ip_coordinators(id) ON DELETE RESTRICT,
    novelty_assessment TEXT NOT NULL,
    commercial_potential TEXT NOT NULL,
    patentability_notes TEXT NOT NULL,
    recommended_action VARCHAR(100) NOT NULL,
    final_evaluation_status VARCHAR(50) NOT NULL CHECK (
        final_evaluation_status IN (
            'NOT_EVALUATED',
            'UNDER_REVIEW',
            'REQUIRES_MODIFICATION',
            'POTENTIAL_IP',
            'APPROVED_FOR_IP_PROCESSING',
            'IP_PROCESSING',
            'FILED',
            'GRANTED',
            'REJECTED',
            'CLOSED'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. IP_STATUS_HISTORY TABLE
CREATE TABLE ip_status_history (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    changed_by_user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (
        type IN (
            'PROJECT_SUBMISSION',
            'FACULTY_ASSIGNMENT',
            'FACULTY_FEEDBACK',
            'IMPROVEMENT_REQUEST',
            'MILESTONE_APPROVAL',
            'AI_SCREENING_COMPLETED',
            'IP_REVIEW_REQUESTED',
            'IP_STATUS_UPDATE',
            'SYSTEM_ANNOUNCEMENT'
        )
    ),
    entity_type VARCHAR(50),
    entity_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. AUDIT_LOGS TABLE
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    role_name VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id INT,
    previous_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. IP_AWARENESS_CONTENT TABLE
CREATE TABLE ip_awareness_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN (
            'IP_BASICS',
            'PATENT_WORKFLOW',
            'PRIOR_ART_SEARCH',
            'DISCLOSURE_GUIDE',
            'COMMON_MISTAKES',
            'FAQ'
        )
    ),
    content_markdown TEXT NOT NULL,
    author_admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_projects_domain ON projects(domain_id);
CREATE INDEX idx_projects_student ON projects(created_by_student_id);
CREATE INDEX idx_projects_faculty ON projects(assigned_faculty_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_documents_project ON project_documents(project_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_ip_reviews_project ON ip_reviews(project_id);
