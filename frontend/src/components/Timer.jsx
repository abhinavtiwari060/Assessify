import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const Timer = ({ initialSeconds, onTimeUp, label = 'Time Remaining' }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    hasTriggeredRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        if (onTimeUp) onTimeUp();
      }
      return;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            if (onTimeUp) onTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsLeft, onTimeUp]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = secondsLeft < 60;
  const isWarning = secondsLeft < 300 && !isUrgent;

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-mono font-bold transition-all duration-300 border shadow-xs ${
        isUrgent
          ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30 animate-pulse'
          : isWarning
          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
          : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
      }`}
    >
      {isUrgent ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : <Clock className="w-4 h-4" />}
      <div className="flex flex-col">
        <span className="text-[10px] font-sans font-extrabold tracking-wider uppercase opacity-80 leading-none">
          {label}
        </span>
        <span className="text-base leading-tight mt-0.5">{formatTime(secondsLeft)}</span>
      </div>
    </div>
  );
};

export default Timer;
