import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PDFUploader from '../../components/PDFUploader';
import {
  Sparkles,
  Save,
  Trash2,
  AlertTriangle,
  Scan,
} from 'lucide-react';

const PdfToMcq = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [extractionMeta, setExtractionMeta] = useState(null);
  const [testTitle, setTestTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [extractionStatus, setExtractionStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjects(res.data);
        if (res.data.length > 0) setSubjectId(res.data[0]._id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubjects();
  }, []);

  const handleExtracted = (questionsOrMeta, fileNameParam, metaParam) => {
    let qList = [];
    let meta = null;
    let name = '';

    if (Array.isArray(questionsOrMeta)) {
      qList = questionsOrMeta;
      name = fileNameParam || '';
      meta = metaParam || null;
    } else if (questionsOrMeta && typeof questionsOrMeta === 'object') {
      meta = questionsOrMeta;
      qList = questionsOrMeta.questions || [];
      name = questionsOrMeta.fileName || fileNameParam || '';
    }

    setExtractedQuestions(qList);
    setExtractionMeta(meta);
    setWarnings(meta?.warnings || []);
    setExtractionStatus(meta?.status || null);
    if (name) {
      setTestTitle(name.replace(/\.pdf$/i, '') + ' MCQ Assessment');
    }
  };

  const handleQuestionChange = (qIdx, text) => {
    const updated = [...extractedQuestions];
    updated[qIdx].questionText = text;
    setExtractedQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, text) => {
    const updated = [...extractedQuestions];
    updated[qIdx].options[optIdx] = text;
    setExtractedQuestions(updated);
  };

  const handleCorrectAnsChange = (qIdx, optIdx) => {
    const updated = [...extractedQuestions];
    updated[qIdx].correctAnswerIndex = optIdx;
    updated[qIdx].warnings = (updated[qIdx].warnings || []).filter(
      (w) => !w.includes('not detected')
    );
    setExtractedQuestions(updated);
  };

  const handleRemoveQuestion = (qIdx) => {
    setExtractedQuestions(extractedQuestions.filter((_, i) => i !== qIdx));
  };

  const handleSaveExtractedTest = async () => {
    if (!testTitle || !subjectId) {
      addToast('Please enter test title and select subject', 'error');
      return;
    }

    if (extractedQuestions.length === 0) {
      addToast('No questions available to save', 'error');
      return;
    }

    // Check if any questions have missing answer selection
    const missingAnsIdx = extractedQuestions.findIndex(
      (q) => q.correctAnswerIndex === null || q.correctAnswerIndex === undefined || q.correctAnswerIndex < 0
    );

    if (missingAnsIdx !== -1) {
      addToast(
        `Question #${missingAnsIdx + 1} does not have a correct answer selected. Please select one.`,
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      await api.post('/tests', {
        title: testTitle,
        description: 'Auto-extracted from uploaded PDF paper.',
        subjectId,
        type: 'mcq',
        timerMode: 'full',
        durationMinutes: 30,
        questions: extractedQuestions,
        isPublished: true,
      });

      addToast(
        `Test "${testTitle}" created with ${extractedQuestions.length} verified questions!`,
        'success'
      );
      navigate('/teacher/tests');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save test', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-[var(--text-main)]">
      {/* Page Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-sub)] border border-[var(--border)] text-xs font-bold text-[#F59E0B]">
          <Sparkles className="w-3.5 h-3.5" /> Automatic PDF-to-MCQ Parsing Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
          PDF → MCQ Extraction Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] max-w-2xl leading-relaxed">
          Upload any text-based question paper PDF to auto-extract structured MCQs. Review confidence scores, warnings, and options before publishing.
        </p>
      </div>

      {/* Upload Component */}
      <PDFUploader onExtracted={handleExtracted} />

      {/* Scanned PDF Warning Banner */}
      {extractionMeta && (extractionMeta.requiresOCR || extractionMeta.status === 'no_text') && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-2xl p-5 flex items-start gap-3 text-[#EF4444] animate-in fade-in duration-300">
          <Scan className="w-6 h-6 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-base font-extrabold">Scanned / Image-Based PDF Detected</h4>
            <p className="text-xs text-[var(--text-sub)] leading-relaxed">
              This PDF contains image scans or non-extractable text ({extractionMeta.textLength || 0} characters found). No fake questions were generated. OCR pre-processing is required for image-based PDFs.
            </p>
          </div>
        </div>
      )}

      {/* Global Warnings & Status Banner */}
      {warnings.length > 0 && (
        <div className="bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-2xl p-4 space-y-2 text-[#F59E0B] text-xs animate-in fade-in duration-300">
          <div className="font-bold flex items-center gap-2 text-[var(--text-main)]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#F59E0B]" />
            <span>Extraction Warnings & Status ({extractionStatus || 'Notice'})</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[var(--text-sub)]">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Review Editor Section */}
      {extractedQuestions.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Metadata Statistics Bar */}
          {extractionMeta?.statistics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Parsed</span>
                <div className="text-2xl font-extrabold text-[var(--text-main)]">{extractedQuestions.length}</div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">High Confidence</span>
                <div className="text-2xl font-extrabold text-[#22C55E]">
                  {extractionMeta.statistics.highConfidence || 0}
                </div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Medium / Low</span>
                <div className="text-2xl font-extrabold text-[#F59E0B]">
                  {(extractionMeta.statistics.mediumConfidence || 0) + (extractionMeta.statistics.lowConfidence || 0)}
                </div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Missing Answer</span>
                <div className="text-2xl font-extrabold text-[#EF4444]">
                  {extractedQuestions.filter((q) => q.correctAnswerIndex === null).length}
                </div>
              </div>
            </div>
          )}

          {/* Test Configuration */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-[var(--text-main)]">Save Test Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Target Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                >
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Extracted Questions List */}
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-[var(--text-main)]">
              Extracted Questions Editor ({extractedQuestions.length})
            </h3>

            {extractedQuestions.map((q, qIdx) => {
              const confidenceColor =
                q.confidence === 'high'
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                  : q.confidence === 'medium'
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                  : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';

              const missingAns = q.correctAnswerIndex === null || q.correctAnswerIndex === undefined;

              return (
                <div
                  key={qIdx}
                  className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[var(--text-main)]">Question #{qIdx + 1}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${confidenceColor}`}>
                        Confidence: {q.confidence || 'Medium'}
                      </span>
                      {q.sourcePage && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--bg-sub)] border border-[var(--border)] text-[var(--text-muted)]">
                          Page {q.sourcePage}
                        </span>
                      )}
                      {q.answerSource && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          Source: {q.answerSource}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1.5 text-[#EF4444] hover:bg-[var(--bg-sub)] rounded-xl transition-colors cursor-pointer"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Warnings List */}
                  {q.warnings && q.warnings.length > 0 && (
                    <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl space-y-1 text-xs text-[#F59E0B]">
                      <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" /> Review Warnings:
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[var(--text-sub)]">
                        {q.warnings.map((w, wIdx) => (
                          <li key={wIdx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Question Text</label>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                      className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                    />
                  </div>

                  {/* Missing Answer Alert */}
                  {missingAns && (
                    <div className="p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs text-[#EF4444] font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Select the correct answer option radio button below:</span>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctAnswerIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            isCorrect
                              ? 'border-[#22C55E] bg-[#22C55E]/10'
                              : 'border-[var(--border)] bg-[var(--bg-sub)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pdf-ans-${qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectAnsChange(qIdx, optIdx)}
                            className="w-4 h-4 text-[#22C55E] cursor-pointer"
                          />
                          <span className="w-6 h-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs font-bold text-[var(--text-main)] flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveExtractedTest}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0A0A0A] font-extrabold text-base shadow-md transition-all cursor-pointer"
            >
              <Save className="w-5 h-5 text-[#0A0A0A]" />
              <span>{saving ? 'Publishing Test...' : 'Publish Verified Test'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToMcq;
