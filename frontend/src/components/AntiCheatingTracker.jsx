import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { ShieldAlert, AlertOctagon, Maximize } from 'lucide-react';

const AntiCheatingTracker = ({ attemptId, attemptType = 'mcq', onAutoSubmit, active = true }) => {
  const [violationCount, setViolationCount] = useState(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastViolationTimeRef = useRef(0);

  const handleViolation = useCallback(
    async (type, details) => {
      if (!attemptId || !active) return;

      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1000) {
        // Cooldown 1 second to prevent duplicate event bursts
        return;
      }
      lastViolationTimeRef.current = now;

      const endpoint = attemptType === 'essay'
        ? `/essays/submissions/${attemptId}/violation`
        : `/attempts/${attemptId}/violation`;

      try {
        const res = await api.post(endpoint, { type, details });
        const { violationCount: newCount, isAutoSubmitted, message } = res.data;

        setViolationCount(newCount);

        if (isAutoSubmitted) {
          setWarningMessage('Test automatically submitted due to multiple anti-cheating violations.');
          setWarningModalOpen(true);
          setTimeout(() => {
            if (onAutoSubmit) onAutoSubmit();
          }, 2500);
        } else {
          setWarningMessage(message || `Warning ${newCount}/3: Please stay on the test window.`);
          setWarningModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to log violation:', err);
      }
    },
    [attemptId, attemptType, active, onAutoSubmit]
  );

  // Enter fullscreen request
  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (!active) return;

    // Check Fullscreen state
    const checkFullscreen = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs && active) {
        handleViolation('fullscreenchange', 'Exited fullscreen mode');
      }
    };

    // Tab visibility change listener
    const handleVisibilityChange = () => {
      if (document.hidden && active) {
        handleViolation('visibilitychange', 'Tab switched or window minimized');
      }
    };

    // Window blur listener (focus loss)
    const handleBlur = () => {
      if (active) {
        handleViolation('blur', 'Browser lost focus');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', checkFullscreen);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, [active, handleViolation]);

  return (
    <>
      {/* Top Banner indicating Proctored Anti-Cheating Security */}
      <div className="bg-[var(--bg-card)] text-[var(--text-main)] px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-[var(--border)] rounded-xl mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#22C55E] animate-pulse" />
          <span>Anti-Cheating Monitoring Active</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Violations: <strong className={violationCount > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}>{violationCount}/3</strong></span>
          {!isFullscreen && (
            <button
              onClick={requestFullscreen}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#FA8128] hover:bg-[#E06D1A] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Maximize className="w-3.5 h-3.5 text-white" />
              <span>Enable Fullscreen</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning Dialog Modal */}
      <Modal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        title="Anti-Cheating Security Alert"
        footer={
          <button
            onClick={() => setWarningModalOpen(false)}
            className="px-5 py-2.5 bg-[#FA8128] hover:bg-[#E06D1A] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            I Understand & Resume Test
          </button>
        }
      >
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center animate-bounce">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-[var(--text-main)] mb-2">
              Warning {violationCount}/3
            </h4>
            <p className="text-xs text-[var(--text-sub)] leading-relaxed max-w-sm">
              {warningMessage}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AntiCheatingTracker;

