# AUTOMATED CAMPUS RESEARCH PROJECT LIFECYCLE MANAGEMENT AND COLLABORATIVE IP FILING DASHBOARD

> **Production Deployment Package & System Demonstration Guide**  
> A full-stack, enterprise-grade platform designed to streamline academic research project submissions, faculty mentorship reviews, document security, AI originality screening, collaborative invention disclosure drafting, prior-art patent lookups, 10-stage IP filing workflows, institutional analytics, automated notifications, and RBAC user governance.

---

## 🏛️ System Architecture Overview

```
                          ┌──────────────────────────────────────────────┐
                          │   Vite + React (Tailwind CSS Glassmorphism)   │
                          └──────────────────────┬───────────────────────┘
                                                 │ REST API (Bearer JWT)
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │         Node.js / Express API Server         │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                 ┌───────────────────────────────┐ ┌───────────────────────────────┐
                 │ PostgreSQL Database Engine    │ │  In-Memory Mock Database Store │
                 │ (Production Primary Storage)  │ │ (Automatic Zero-Config Failover│
                 └───────────────────────────────┘ └───────────────────────────────┘
```

---

## 🔑 Test Credentials Matrix

You can log in as any of the 4 supported campus roles using the following pre-configured credentials:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **STUDENT** | `student1@campus.edu` | `Password123!` | Proposal submission, team management, milestone progress reports, document upload, Invention Disclosure Drafting. |
| **FACULTY** | `prof.sharma@campus.edu` | `Password123!` | Proposal review & approval, milestone assignment, feedback reviews, AI screening trigger, workload management. |
| **IP COORDINATOR** | `ip.coordinator@campus.edu` | `Password123!` | Invention disclosure reviews, prior-art lookups, 10-stage patent filing lifecycle updates, patent office submissions. |
| **ADMIN** | `admin@campus.edu` | `Password123!` | User account provisioning, RBAC role reassignment, account suspension, audit log inspector, institutional analytics export. |

---

## 📦 16-Phase Implementation Roadmap Summary

- **Phase 1**: Project Architecture & Express API Setup (`/api/health`).
- **Phase 2**: Dual-Mode Database Architecture (PostgreSQL + In-Memory Fallback Engine).
- **Phase 3**: Authentication & RBAC Subsystem (`JWT`, `bcryptjs`, 4 Role Matrix).
- **Phase 4**: Domain & Faculty Workload Management (Faculty project capacity limit enforcement).
- **Phase 5**: Student Proposal Submission & Team Management.
- **Phase 6**: Faculty Review & Milestone Management Engine.
- **Phase 7**: Secure Classified Document Management & Stream Authorization.
- **Phase 8**: AI-Assisted Originality Screening Engine (Mandatory non-legal disclaimer).
- **Phase 9**: IP Coordinator Module & 10-Stage Patent Filing Lifecycle.
- **Phase 10**: Prior-Art Literature & Patent Lookup Engine (Google Patents / IEEE / arXiv / PubMed).
- **Phase 11**: Collaborative Invention Disclosure Drafting Engine (7-section IDF, 100% revenue split validator).
- **Phase 12**: Institutional Analytics & KPI Dashboard Metrics (CSV/JSON exporter).
- **Phase 13**: IP Awareness Portal & Knowledge Base (Educational resources & FAQ authoring).
- **Phase 14**: Automated Notification Center & Audit Trail Inspector.
- **Phase 15**: Admin User Management & Role Governance Console.
- **Phase 16**: Final System Integration, Production Deployment & Demonstration Package.

---

## 🚀 Quick-Start Launch Instructions

### 1. Start Backend API Server
```bash
cd backend
npm install
node src/server.js
```
The API server will listen on `http://localhost:5000`.

### 2. Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Automated Integration Verification
```bash
cd backend
node src/testPhase16.js
```

### 4. Build for Production
```bash
cd frontend
cmd /c npm run build
```

---

## 🛡️ License & Institutional Notice
Developed for Campus Research & Intellectual Property Management. All rights reserved.
