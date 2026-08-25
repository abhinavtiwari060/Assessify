import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data found', description = 'There are no items to display at this time.', icon: Icon = Inbox, actionButton }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-card)] rounded-2xl border border-dashed border-[var(--border)] my-4">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-sub)] border border-[var(--border)] flex items-center justify-center text-[#F59E0B] mb-4 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-extrabold text-[var(--text-main)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-sub)] max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;

