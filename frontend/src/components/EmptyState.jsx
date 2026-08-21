import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data found', description = 'There are no items to display at this time.', icon: Icon = Inbox, actionButton }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700/80 my-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
