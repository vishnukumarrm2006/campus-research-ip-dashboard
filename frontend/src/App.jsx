import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import apiClient from './api/axios';
import Login from './pages/Login';
import DomainFacultyManagement from './pages/DomainFacultyManagement';
import StudentProjects from './pages/StudentProjects';
import FacultyReview from './pages/FacultyReview';
import {
  Sparkles,
  RefreshCw,
  LogOut,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Award,
  ShieldCheck,
  Cpu,
  Lock,
  Code2,
  Layers,
  LayoutDashboard,
  FileText
} from 'lucide-react';

function MainAppContent() {
  const { user, isAuthenticated, logout, login } = useAuth();
  const [activeView, setActiveView] = useState('projects'); // 'projects' | 'faculty-review' | 'domain-faculty' | 'overview'
  const [healthData, setHealthData] = useState(null);

  // RBAC Test Endpoint State
  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(null);

  const fetchHealthStatus = async () => {
    try {
      const response = await apiClient.get('/health');
      setHealthData(response.data);
    } catch (err) {
      console.error('Health fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const runRbacTest = async (endpoint, label) => {
    setTestingEndpoint(label);
    setTestResult(null);
    try {
      const res = await apiClient.get(`/test/${endpoint}`);
      setTestResult({
        status: res.status,
        statusText: '200 OK (Access Granted)',
        success: true,
        data: res.data,
      });
    } catch (err) {
      const status = err.response?.status || 500;
      setTestResult({
        status,
        statusText: status === 403 ? '403 Forbidden (Access Denied by RBAC)' : `${status} Error`,
        success: false,
        data: err.response?.data || { error: err.message },
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  const roleBadges = {
    STUDENT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    FACULTY: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    IP_COORDINATOR: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    ADMIN: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  Campus Research & IP Filing Dashboard
                </h1>
                <p className="text-xs text-slate-400">Phase 6: Faculty Review & Milestones Active</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveView('projects')}
                className={`px-3.5 py-2 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                  activeView === 'projects' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Student Projects</span>
              </button>

              <button
                onClick={() => setActiveView('faculty-review')}
                className={`px-3.5 py-2 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                  activeView === 'faculty-review' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Faculty Review & Milestones</span>
              </button>
              
              <button
                onClick={() => setActiveView('domain-faculty')}
                className={`px-3.5 py-2 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                  activeView === 'domain-faculty' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Domains & Faculty</span>
              </button>

              <button
                onClick={() => setActiveView('overview')}
                className={`px-3.5 py-2 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                  activeView === 'overview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>RBAC Inspector</span>
              </button>
            </nav>
          </div>

          {/* User Profile Bar */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="font-semibold text-slate-200 block">{user.full_name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${roleBadges[user.role_name] || 'bg-slate-800 text-slate-300'}`}>
                {user.role_name}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition flex items-center space-x-1.5 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {activeView === 'projects' ? (
          <StudentProjects />
        ) : activeView === 'faculty-review' ? (
          <FacultyReview />
        ) : activeView === 'domain-faculty' ? (
          <DomainFacultyManagement />
        ) : (
          <>
            {/* Phase 6 Status Banner */}
            <section className="relative rounded-2xl overflow-hidden glass-panel p-8 indigo-glow border border-indigo-500/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Phase 6 Faculty Review & Milestones Active</span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    Faculty Mentorship & Milestone Review Engine
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Review assigned student projects, evaluate milestone progress text, request revisions, approve milestones, and recommend projects for AI Originality Screening.
                  </p>

                  <button
                    onClick={() => setActiveView('faculty-review')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
                  >
                    <Award className="w-4 h-4" />
                    <span>Open Faculty Review & Milestone Console</span>
                  </button>
                </div>

                {/* Quick Role Switcher */}
                <div className="glass-card rounded-xl p-4 space-y-2 border border-slate-800 w-full md:w-auto">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Role Switcher:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => login('student1@campus.edu', 'Password123!')}
                      className={`px-3 py-1.5 rounded-lg border text-left flex items-center space-x-1.5 transition ${
                        user.role_name === 'STUDENT' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Student</span>
                    </button>
                    <button
                      onClick={() => login('prof.sharma@campus.edu', 'Password123!')}
                      className={`px-3 py-1.5 rounded-lg border text-left flex items-center space-x-1.5 transition ${
                        user.role_name === 'FACULTY' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Faculty</span>
                    </button>
                    <button
                      onClick={() => login('ip.coordinator@campus.edu', 'Password123!')}
                      className={`px-3 py-1.5 rounded-lg border text-left flex items-center space-x-1.5 transition ${
                        user.role_name === 'IP_COORDINATOR' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>IP Coord</span>
                    </button>
                    <button
                      onClick={() => login('admin@campus.edu', 'Password123!')}
                      className={`px-3 py-1.5 rounded-lg border text-left flex items-center space-x-1.5 transition ${
                        user.role_name === 'ADMIN' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* RBAC API Test Bench Section */}
            <section className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-indigo-400" />
                    <span>RBAC API Boundary Inspector</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Click any endpoint button to send a request attached with current JWT bearer token ({user.role_name})
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">Bearer JWT Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => runRbacTest('student-only', 'Student-Only API')}
                  className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-left space-y-2 transition"
                >
                  <div className="flex items-center justify-between text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20">STUDENT</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">GET /api/test/student-only</h4>
                  <p className="text-[11px] text-slate-400">Requires STUDENT role authorization.</p>
                </button>

                <button
                  onClick={() => runRbacTest('faculty-only', 'Faculty-Only API')}
                  className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left space-y-2 transition"
                >
                  <div className="flex items-center justify-between text-emerald-400">
                    <Award className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20">FACULTY</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">GET /api/test/faculty-only</h4>
                  <p className="text-[11px] text-slate-400">Requires FACULTY role authorization.</p>
                </button>

                <button
                  onClick={() => runRbacTest('ip-only', 'IP Coordinator API')}
                  className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-left space-y-2 transition"
                >
                  <div className="flex items-center justify-between text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20">IP_COORDINATOR</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">GET /api/test/ip-only</h4>
                  <p className="text-[11px] text-slate-400">Requires IP_COORDINATOR authorization.</p>
                </button>

                <button
                  onClick={() => runRbacTest('admin-only', 'Admin-Only API')}
                  className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left space-y-2 transition"
                >
                  <div className="flex items-center justify-between text-amber-400">
                    <Cpu className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20">ADMIN</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">GET /api/test/admin-only</h4>
                  <p className="text-[11px] text-slate-400">Requires ADMIN role authorization.</p>
                </button>
              </div>

              {testResult && (
                <div className={`p-5 rounded-xl border ${
                  testResult.success
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                } space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <span className="font-bold text-sm">Test Response: {testResult.statusText}</span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      HTTP {testResult.status}
                    </span>
                  </div>
                  
                  <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs overflow-x-auto border border-slate-800/80 text-slate-300">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </section>
          </>
        )}

      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 glass-panel">
        <p>Campus Research Project Lifecycle & Collaborative IP Dashboard • Phase 6 Faculty Review & Milestones</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
