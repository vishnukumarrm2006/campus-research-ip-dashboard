import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  GraduationCap,
  Award,
  ShieldCheck,
  Cpu,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail
} from 'lucide-react';

export default function Login() {
  const { login, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSubmitting(true);
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      role: 'STUDENT',
      name: 'Aarav Kumar',
      email: 'student1@campus.edu',
      password: 'Password123!',
      icon: GraduationCap,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400 hover:border-blue-400',
      badge: 'bg-blue-500/20 text-blue-300'
    },
    {
      role: 'FACULTY',
      name: 'Prof. Alok Sharma',
      email: 'prof.sharma@campus.edu',
      password: 'Password123!',
      icon: Award,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400 hover:border-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      role: 'IP_COORDINATOR',
      name: 'Dr. Meera Nambiar',
      email: 'ip.coordinator@campus.edu',
      password: 'Password123!',
      icon: ShieldCheck,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400 hover:border-purple-400',
      badge: 'bg-purple-500/20 text-purple-300'
    },
    {
      role: 'ADMIN',
      name: 'Dr. Rajesh Mehta',
      email: 'admin@campus.edu',
      password: 'Password123!',
      icon: Cpu,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400 hover:border-amber-400',
      badge: 'bg-amber-500/20 text-amber-300'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-xl">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-wide text-sm">Campus Research IP Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Role-Based Authentication Portal
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Select a role demo account or enter your credentials to access your designated institutional workspace.
          </p>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{authError}</div>
          </div>
        )}

        {/* Quick-Login Demo Account Selector Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              One-Click Demo Account Quick Switcher
            </h3>
            <span className="text-[11px] text-indigo-400 font-medium">Phase 3 Verification Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.password)}
                  disabled={submitting}
                  className={`p-4 rounded-xl border bg-gradient-to-b ${acc.color} glass-panel text-left space-y-3 transition-all hover:scale-[1.02] disabled:opacity-50 group`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5" />
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${acc.badge}`}>
                      {acc.role}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition">{acc.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 group-hover:text-white">
                    <span>Click to Sign In</span>
                    <LogIn className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4 max-w-md mx-auto">
          <div className="border-b border-slate-800 pb-3 text-center">
            <h3 className="text-sm font-bold text-white">Manual Credential Login</h3>
            <p className="text-xs text-slate-400">Enter registered email and password</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Institutional Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student1@campus.edu"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Account Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Authenticate & Enter Workspace</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
