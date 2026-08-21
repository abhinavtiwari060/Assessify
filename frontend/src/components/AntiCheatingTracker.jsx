import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { ShieldAlert, AlertOctagon, Maximize } from 'lucide-react';

const AntiCheatingTracker = ({ attemptId, onAutoSubmit, active = true }) => {
  const [violationCount, setViolationCount] = useState(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleViolation = useCallback(
    async (type, details) => {
      if (!attemptId || !active) return;

      try {
        const res = await api.post(`/attempts/${attemptId}/violation`, { type, details });
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
    [attemptId, active, onAutoSubmit]
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
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Anti-Cheating Monitoring Active</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Violations: <strong className={violationCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{violationCount}/3</strong></span>
          {!isFullscreen && (
            <button
              onClick={requestFullscreen}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Maximize className="w-3.5 h-3.5" />
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
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            I Understand & Resume Test
          </button>
        }
      >
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-bounce">
            <AlertOctagon className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Warning {violationCount}/3
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
              {warningMessage}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AntiCheatingTracker;
