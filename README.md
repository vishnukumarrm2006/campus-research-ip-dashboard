# Automated Campus Research Project Lifecycle Management and Collaborative IP Filing Dashboard

An end-to-end web platform designed for higher education institutions to manage student research projects throughout their lifecycle—from domain selection and faculty mentoring to milestone submission, AI-assisted originality screening, and intellectual property (IP) evaluation & filing tracking.

---

## 🚀 Core Features & Lifecycle Flow

1. **Student Project Portal**: Domain-tagged project submission, team member management, structured milestone tracking, and document uploads.
2. **Faculty Mentoring & Evaluation**: Assigned faculty review project progress, provide structured feedback, approve/reject milestones, and recommend projects for IP evaluation.
3. **AI-Assisted Originality & Novelty Screening**: Automated preliminary screening engine generating decision-support reports on novelty, overlapping concepts, and potential patentable aspects (with explicit non-legal disclaimers).
4. **IP Coordinator & Filing Dashboard**: Complete IP evaluation management, review history, document inspection, and institutional status tracking (from `NOT_EVALUATED` to `FILED` / `GRANTED`).
5. **IP Awareness Center**: Interactive educational hub for students and faculty regarding patents, prior-art search, disclosure, and institutional IP workflows.
6. **Role-Based Access Control (RBAC)**: Strict permission boundaries for `STUDENT`, `FACULTY`, `IP_COORDINATOR`, and `ADMIN`.

---

## 🛠 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, React Router DOM, Axios, Lucide React
- **Backend**: Node.js, Express.js, REST API Architecture
- **Database**: PostgreSQL (Native `pg` Pool driver)
- **Security**: JWT Authentication, bcrypt Password Hashing, RBAC Middleware

---

## 📁 Directory Structure

```text
campus-research-ip-dashboard/
├── backend/                  # Express.js REST API Server
│   ├── src/
│   │   ├── config/           # Database & Environment Configuration
│   │   ├── controllers/      # Route Controllers
│   │   ├── middleware/       # Auth & RBAC Middlewares
│   │   ├── models/           # Data Access Layer
│   │   ├── routes/           # API Routes
│   │   └── server.js         # Entry Point
│   ├── .env.example
│   ├── .env
│   └── package.json
├── frontend/                 # React (Vite) Single Page Application
│   ├── src/
│   │   ├── api/              # Axios instance & API services
│   │   ├── assets/           # Static assets & styles
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Dashboard & Lifecycle pages
│   │   ├── App.jsx           # Application Router & Entry
│   │   └── main.jsx          # DOM rendering entry
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start (Development)

### Prerequisites
- **Node.js**: v18+ 
- **npm**: v9+
- **PostgreSQL**: v14+ (Required starting from Phase 2)

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend will run at `http://localhost:5000` (Health check endpoint: `http://localhost:5000/api/health`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:5173`.

---

## 📌 Development Roadmap

- [x] **Phase 1**: Project Architecture & Setup
- [ ] **Phase 2**: Database Architecture & Migrations
- [ ] **Phase 3**: Authentication & RBAC System
- [ ] **Phase 4**: Domain & Faculty Management
- [ ] **Phase 5**: Student Project Management
- [ ] **Phase 6**: Faculty Review & Milestone Tracking
- [ ] **Phase 7**: Secure Document Management
- [ ] **Phase 8**: AI-Assisted Originality Screening Engine
- [ ] **Phase 9**: IP Coordinator Module & Workflow
- [ ] **Phase 10**: IP Awareness Center
- [ ] **Phase 11**: Real-Time Notification Engine
- [ ] **Phase 12**: Role-Specific Analytics Dashboards
- [ ] **Phase 13**: System Audit Logging
- [ ] **Phase 14**: End-to-End Testing & Security Audit
- [ ] **Phase 15**: Lifecycle Integration & Verification
- [ ] **Phase 16**: Cloud Deployment Preparation
