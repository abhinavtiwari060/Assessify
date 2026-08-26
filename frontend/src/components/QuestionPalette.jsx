import React from 'react';

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
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h3 className="font-extrabold text-[var(--text-main)] text-sm">Question Palette</h3>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--bg-sub)] text-[#FA8128] border border-[var(--border)]">
          {answeredCount} / {totalCount} Answered
        </span>
      </div>

      {/* Grid of Question Numbers */}
      {(() => {
        const hasComprehension = questions.some((q) => q.type === 'comprehension' || q.passageId);

        if (!hasComprehension) {
          return (
            <div className="grid grid-cols-5 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const status = getStatus(q._id, idx);
                const isDisabled = isSequential && idx < currentIndex;

                return (
                  <button
                    key={q._id}
                    onClick={() => !isDisabled && onSelectQuestion(idx)}
                    disabled={isDisabled}
                    className={`relative h-10 w-full rounded-xl font-bold text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                      status === 'current'
                        ? 'bg-[#FA8128] text-white shadow-xs font-black ring-2 ring-[#FA8128]/40'
                        : status === 'answered'
                        ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 hover:bg-[#22C55E]/30'
                        : status === 'flagged'
                        ? 'bg-[#FA8128]/20 text-[#FA8128] border border-[#FA8128]/40 hover:bg-[#FA8128]/30'
                        : 'bg-[var(--bg-sub)] text-[var(--text-sub)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)]'
                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {idx + 1}
                    {status === 'flagged' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FA8128] ring-2 ring-[var(--bg-card)]"></span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        }

        // Split into sections
        const mcqQuestions = [];
        const compQuestions = [];

        questions.forEach((q, idx) => {
          if (q.type === 'comprehension' || q.passageId) {
            compQuestions.push({ q, idx });
          } else {
            mcqQuestions.push({ q, idx });
          }
        });

        return (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {mcqQuestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] block border-b border-[var(--border)] pb-1">
                  Section 1: General MCQs ({mcqQuestions.length})
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {mcqQuestions.map(({ q, idx }) => {
                    const status = getStatus(q._id, idx);
                    const isDisabled = isSequential && idx < currentIndex;
                    return (
                      <button
                        key={q._id}
                        onClick={() => !isDisabled && onSelectQuestion(idx)}
                        disabled={isDisabled}
                        className={`relative h-9 w-full rounded-xl font-bold text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                          status === 'current'
                            ? 'bg-[#FA8128] text-white shadow-xs font-black ring-2 ring-[#FA8128]/40'
                            : status === 'answered'
                            ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 hover:bg-[#22C55E]/30'
                            : status === 'flagged'
                            ? 'bg-[#FA8128]/20 text-[#FA8128] border border-[#FA8128]/40 hover:bg-[#FA8128]/30'
                            : 'bg-[var(--bg-sub)] text-[var(--text-sub)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)]'
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {idx + 1}
                        {status === 'flagged' && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FA8128] ring-2 ring-[var(--bg-card)]"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {compQuestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FA8128] block border-b border-[#FA8128]/30 pb-1">
                  Section 2: Reading Comprehension ({compQuestions.length})
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {compQuestions.map(({ q, idx }) => {
                    const status = getStatus(q._id, idx);
                    const isDisabled = isSequential && idx < currentIndex;
                    return (
                      <button
                        key={q._id}
                        onClick={() => !isDisabled && onSelectQuestion(idx)}
                        disabled={isDisabled}
                        className={`relative h-9 w-full rounded-xl font-bold text-xs transition-all duration-150 flex items-center justify-center cursor-pointer ${
                          status === 'current'
                            ? 'bg-[#FA8128] text-white shadow-xs font-black ring-2 ring-[#FA8128]/40'
                            : status === 'answered'
                            ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 hover:bg-[#22C55E]/30'
                            : status === 'flagged'
                            ? 'bg-[#FA8128]/20 text-[#FA8128] border border-[#FA8128]/40 hover:bg-[#FA8128]/30'
                            : 'bg-[var(--bg-sub)] text-[var(--text-sub)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)]'
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {idx + 1}
                        {status === 'flagged' && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FA8128] ring-2 ring-[var(--bg-card)]"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold pt-2 border-t border-[var(--border)] text-[var(--text-sub)]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-[#22C55E]"></div>
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-[var(--bg-sub)] border border-[var(--border)]"></div>
          <span>Unanswered ({totalCount - answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-[#FA8128]"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-[#FA8128]/40 border border-[#FA8128]"></div>
          <span>Flagged ({flaggedCount})</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;

