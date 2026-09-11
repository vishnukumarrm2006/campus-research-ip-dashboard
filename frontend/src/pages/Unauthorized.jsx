import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized({ requiredRoles = [], userRole = '' }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 selection:bg-rose-500 selection:text-white">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 space-y-6 text-center border border-rose-500/30 shadow-2xl shadow-rose-950/40">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">403 - Access Denied</h2>
          <p className="text-sm text-slate-400">
            Strict Role-Based Access Control (RBAC) active. Your current account role does not have authorization to access this API route or page.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-left">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Your Current Role:</span>
            <span className="font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {userRole || 'UNKNOWN'}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Required Role(s):</span>
            <span className="font-bold text-indigo-400">
              {requiredRoles.join(' OR ') || 'ADMIN'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 font-medium text-xs transition flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Return to Dashboard Overview</span>
          </button>
          
          <button
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 hover:opacity-95 transition flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Switch Demo Account Role</span>
          </button>
        </div>
      </div>
    </div>
  );
}
