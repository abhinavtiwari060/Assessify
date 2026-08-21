import React from 'react';
import { SlidersHorizontal, Server, Database, Cloud, ShieldCheck } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Platform Architecture & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Free-tier hosting compatibility settings and system configuration.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-500" />
          Free-Tier Hosting Targets
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Frontend Hosting</div>
            <div className="text-indigo-600 dark:text-indigo-400">Vercel / Netlify</div>
            <div className="text-slate-400">Build: Vite + React SPA</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Backend Hosting</div>
            <div className="text-purple-600 dark:text-purple-400">Render / Railway / Fly.io</div>
            <div className="text-slate-400">Runtime: Node.js Express</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Database</div>
            <div className="text-emerald-600 dark:text-emerald-400">MongoDB Atlas Free Tier</div>
            <div className="text-slate-400">Memory fallback active</div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 inline mr-1" />
          <strong>Zero External Paid Dependencies: </strong> All PDF parsing, score evaluation, timer engines, and teacher isolation rules run locally on standard Node.js Express.
        </div>
      </div>
    </div>
  );
};

export default Settings;
