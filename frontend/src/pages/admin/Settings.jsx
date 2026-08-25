import React from 'react';
import { SlidersHorizontal, Server, Database, Cloud, ShieldCheck } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          Platform Architecture & Settings
        </h1>
        <p className="text-sm text-[var(--text-sub)] mt-1">
          Free-tier hosting compatibility settings and system configuration.
        </p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-3xl p-8 border border-[var(--border)] shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-[var(--text-main)] border-b border-[var(--border)] pb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-[#FA8128]" />
          Free-Tier Hosting Targets
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className="p-4 rounded-2xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <div className="font-bold text-[var(--text-main)]">Frontend Hosting</div>
            <div className="text-[#FA8128]">Vercel / Netlify</div>
            <div className="text-[var(--text-muted)]">Build: Vite + React SPA</div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <div className="font-bold text-[var(--text-main)]">Backend Hosting</div>
            <div className="text-[#FA8128]">Render / Railway / Fly.io</div>
            <div className="text-[var(--text-muted)]">Runtime: Node.js Express</div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-sub)] border border-[var(--border)] space-y-1">
            <div className="font-bold text-[var(--text-main)]">Database</div>
            <div className="text-emerald-500">MongoDB Atlas Free Tier</div>
            <div className="text-[var(--text-muted)]">Memory fallback active</div>
          </div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4 inline mr-1 text-emerald-500" />
          <strong>Zero External Paid Dependencies: </strong> All PDF parsing, score evaluation, timer engines, and teacher isolation rules run locally on standard Node.js Express.
        </div>
      </div>
    </div>
  );
};

export default Settings;
