import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { UploadCloud, FileText, CheckCircle, Loader2, Check } from 'lucide-react';

const EXTRACTION_STEPS = [
  'Uploading PDF file',
  'Extracting document text',
  'Detecting question statements',
  'Detecting option choices',
  'Detecting correct answers',
  'Validating MCQ structures',
];

const PDFUploader = ({ onExtracted }) => {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else {
      addToast('Please select a valid PDF file', 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
    } else {
      addToast('Please drop a valid PDF file', 'error');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < EXTRACTION_STEPS.length - 1 ? prev + 1 : prev));
    }, 600);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await api.post('/pdf/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(stepInterval);
      setCurrentStep(EXTRACTION_STEPS.length - 1);

      const data = res.data;
      const count = data.questionCount || data.totalExtracted || (data.questions ? data.questions.length : 0);

      if (data.success && count > 0) {
        addToast(`Successfully extracted ${count} question(s) from PDF!`, 'success');
      } else if (data.requiresOCR || data.status === 'no_text') {
        addToast('This PDF appears to be scanned/image-based. OCR is required.', 'warning');
      } else {
        addToast(data.error || data.message || 'No valid MCQs could be detected from PDF', 'error');
      }

      if (onExtracted) {
        onExtracted(data.questions || [], data.fileName || file.name, data);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      addToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to extract questions from PDF',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-xs space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-[#FA8128] bg-[var(--bg-sub)] scale-[1.01]'
            : 'border-[var(--border)] hover:border-[#FA8128] bg-[var(--bg-sub)]'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload-input"
        />
        <label htmlFor="pdf-upload-input" className="cursor-pointer flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[#FA8128] flex items-center justify-center mb-3 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h4 className="text-base font-extrabold text-[var(--text-main)] mb-1">
            Upload Question Paper PDF
          </h4>
          <p className="text-xs text-[var(--text-sub)] max-w-sm mb-4 leading-relaxed">
            Drag and drop your PDF question paper here, or click to browse. Max size: 10MB • Text-based PDF required.
          </p>
        </label>

        {file && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] text-xs text-[#FA8128] font-bold">
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-xs">{file.name}</span>
            <span className="text-[11px] text-[var(--text-muted)]">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Progress Steps Section */}
      {loading && (
        <div className="bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#FA8128]" />
              Parsing PDF Question Paper...
            </span>
            <span className="text-xs font-mono font-bold text-[#FA8128]">
              Step {currentStep + 1} of {EXTRACTION_STEPS.length}
            </span>
          </div>

          <div className="w-full bg-[var(--bg-card)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="bg-[#FA8128] h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / EXTRACTION_STEPS.length) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            {EXTRACTION_STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 text-[11px] font-semibold p-2 rounded-lg border ${
                    isDone
                      ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                      : isCurrent
                      ? 'bg-[#FA8128]/10 border-[#FA8128]/30 text-[#FA8128] font-bold'
                      : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-[var(--border)] shrink-0 flex items-center justify-center text-[9px]">
                      {idx + 1}
                    </div>
                  )}
                  <span className="truncate">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs shadow-xs transition-all ${
            !file || loading
              ? 'bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-[#FA8128] hover:bg-[#E06D1A] text-white cursor-pointer'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Parsing PDF...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Extract Questions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PDFUploader;

