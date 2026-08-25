import React from 'react';

export const CardSkeleton = () => (
  <div className="animate-pulse bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] space-y-4">
    <div className="h-4 bg-[var(--bg-sub)] rounded-lg w-1/3 border border-[var(--border)]"></div>
    <div className="h-7 bg-[var(--bg-sub)] rounded-lg w-2/3 border border-[var(--border)]"></div>
    <div className="h-4 bg-[var(--bg-sub)] rounded-lg w-1/2 border border-[var(--border)]"></div>
  </div>
);

export const TableSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl w-full"></div>
    ))}
  </div>
);

export const QuestionSkeleton = () => (
  <div className="animate-pulse bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] space-y-6">
    <div className="h-5 bg-[var(--bg-sub)] border border-[var(--border)] rounded-lg w-1/4"></div>
    <div className="h-8 bg-[var(--bg-sub)] border border-[var(--border)] rounded-lg w-3/4"></div>
    <div className="space-y-3 pt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl w-full"></div>
      ))}
    </div>
  </div>
);

