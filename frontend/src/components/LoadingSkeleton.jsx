import React from 'react';

export const CardSkeleton = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3"></div>
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2"></div>
  </div>
);

export const TableSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700/60 rounded-xl w-full"></div>
    ))}
  </div>
);

export const QuestionSkeleton = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 space-y-6">
    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/4"></div>
    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4"></div>
    <div className="space-y-3 pt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700/50 rounded-2xl w-full"></div>
      ))}
    </div>
  </div>
);
