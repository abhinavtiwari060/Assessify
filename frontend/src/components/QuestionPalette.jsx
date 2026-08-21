import React from 'react';
import { Bookmark, Check, HelpCircle } from 'lucide-react';

const QuestionPalette = ({ questions, answers, currentIndex, onSelectQuestion, isSequential }) => {
  const getStatus = (questionId, index) => {
    const isCurrent = index === currentIndex;
    const ans = answers.find((a) => a.questionId === questionId);

    const isAnswered = ans && ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined;
    const isFlagged = ans && ans.isFlagged;

    if (isCurrent) return 'current';
    if (isFlagged) return 'flagged';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  const answeredCount = answers.filter((a) => a.selectedOptionIndex !== null && a.selectedOptionIndex !== undefined).length;
  const flaggedCount = answers.filter((a) => a.isFlagged).length;
  const totalCount = questions.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Question Palette</h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          {answeredCount} / {totalCount} Answered
        </span>
      </div>

      {/* Grid of Question Numbers */}
      <div className="grid grid-cols-5 gap-2.5 max-h-60 overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const status = getStatus(q._id, idx);
          const isDisabled = isSequential && idx < currentIndex;

          return (
            <button
              key={q._id}
              onClick={() => !isDisabled && onSelectQuestion(idx)}
              disabled={isDisabled}
              className={`relative h-10 w-full rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center ${
                status === 'current'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900'
                  : status === 'answered'
                  ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                  : status === 'flagged'
                  ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
                  : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {idx + 1}
              {status === 'flagged' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 ring-2 ring-white dark:ring-slate-800"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-2 border-t border-slate-100 dark:border-slate-700/80 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-emerald-500"></div>
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700"></div>
          <span>Unanswered ({totalCount - answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-indigo-600"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-amber-500"></div>
          <span>Flagged ({flaggedCount})</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
