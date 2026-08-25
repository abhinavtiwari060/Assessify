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
  FileCheck2,
  HelpCircle,
  Scan,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const PdfToMcq = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [extractionMeta, setExtractionMeta] = useState(null);
  const [testTitle, setTestTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
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

  const handleExtracted = (resultData) => {
    setExtractionMeta(resultData);

    if (resultData.success && resultData.questions) {
      setExtractedQuestions(resultData.questions);
      setTestTitle(
        (resultData.fileName ? resultData.fileName.replace('.pdf', '') : 'PDF') +
          ' MCQ Assessment'
      );
    } else {
      setExtractedQuestions([]);
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
    const missingAnswerCount = extractedQuestions.filter(
      (q) => q.correctAnswerIndex === null || q.correctAnswerIndex === undefined
    ).length;

    if (missingAnswerCount > 0) {
      addToast(
        `${missingAnswerCount} question(s) require a correct answer selection before publishing.`,
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-[#F0F6FC]">
      {/* Page Header */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262D] border border-[#30363D] text-xs font-bold text-[#58A6FF]">
          <Sparkles className="w-3.5 h-3.5" /> Automatic PDF-to-MCQ Parsing Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          PDF → MCQ Extraction Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-[#8B949E] max-w-2xl leading-relaxed">
          Upload any text-based question paper PDF to auto-extract structured MCQs. Review confidence scores, warnings, and options before publishing.
        </p>
      </div>

      {/* Upload Component */}
      <PDFUploader onExtracted={handleExtracted} />

      {/* Scanned PDF Warning Banner */}
      {extractionMeta && extractionMeta.requiresOCR && (
        <div className="bg-[#F85149]/15 border border-[#F85149]/30 rounded-2xl p-5 flex items-start gap-3 text-[#F85149] animate-in fade-in duration-300">
          <Scan className="w-6 h-6 text-[#F85149] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-base font-extrabold">Scanned / Image-Based PDF Detected</h4>
            <p className="text-xs text-[#8B949E] leading-relaxed">
              This PDF contains image scans or non-extractable text ({extractionMeta.textLength || 0} characters found). No fake questions were generated. OCR pre-processing is required for image-based PDFs.
            </p>
          </div>
        </div>
      )}

      {/* Failed Extraction Banner */}
      {extractionMeta && !extractionMeta.success && !extractionMeta.requiresOCR && (
        <div className="bg-[#D29922]/15 border border-[#D29922]/30 rounded-2xl p-5 flex items-start gap-3 text-[#D29922] animate-in fade-in duration-300">
          <AlertTriangle className="w-6 h-6 text-[#D29922] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-base font-extrabold">Extraction Failed</h4>
            <p className="text-xs text-[#8B949E] leading-relaxed">
              {extractionMeta.error || 'No valid MCQs could be detected from the extracted PDF text.'}
            </p>
          </div>
        </div>
      )}

      {/* Extracted Review Editor Section */}
      {extractedQuestions.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Metadata Statistics Bar */}
          {extractionMeta?.statistics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Total Parsed</span>
                <div className="text-2xl font-extrabold text-[#F0F6FC]">{extractedQuestions.length}</div>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">High Confidence</span>
                <div className="text-2xl font-extrabold text-[#3FB950]">
                  {extractionMeta.statistics.highConfidence || 0}
                </div>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Medium / Low</span>
                <div className="text-2xl font-extrabold text-[#D29922]">
                  {(extractionMeta.statistics.mediumConfidence || 0) + (extractionMeta.statistics.lowConfidence || 0)}
                </div>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Missing Answer</span>
                <div className="text-2xl font-extrabold text-[#F85149]">
                  {extractedQuestions.filter((q) => q.correctAnswerIndex === null).length}
                </div>
              </div>
            </div>
          )}

          {/* Test Configuration */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-[#F0F6FC]">Save Test Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-[#21262D] border border-[#30363D] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Target Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-[#21262D] border border-[#30363D] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
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
            <h3 className="text-xl font-extrabold text-[#F0F6FC]">
              Extracted Questions Editor ({extractedQuestions.length})
            </h3>

            {extractedQuestions.map((q, qIdx) => {
              const confidenceColor =
                q.confidence === 'high'
                  ? 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30'
                  : q.confidence === 'medium'
                  ? 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30'
                  : 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30';

              const missingAns = q.correctAnswerIndex === null || q.correctAnswerIndex === undefined;

              return (
                <div
                  key={qIdx}
                  className="bg-[#161B22] rounded-2xl p-6 border border-[#30363D] shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#F0F6FC]">Question #{qIdx + 1}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${confidenceColor}`}>
                        Confidence: {q.confidence || 'Medium'}
                      </span>
                      {q.answerSource && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/30">
                          Source: {q.answerSource}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1.5 text-[#F85149] hover:bg-[#21262D] rounded-xl transition-colors cursor-pointer"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Warnings List */}
                  {q.warnings && q.warnings.length > 0 && (
                    <div className="p-3 bg-[#D29922]/10 border border-[#D29922]/30 rounded-xl space-y-1 text-xs text-[#D29922]">
                      <div className="font-bold text-[#F0F6FC] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D29922]" /> Review Warnings:
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#8B949E]">
                        {q.warnings.map((w, wIdx) => (
                          <li key={wIdx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Question Text</label>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                      className="w-full bg-[#21262D] border border-[#30363D] rounded-xl p-3 text-xs sm:text-sm font-medium text-[#F0F6FC] focus:outline-none focus:ring-2 focus:ring-[#58A6FF]"
                    />
                  </div>

                  {/* Missing Answer Alert */}
                  {missingAns && (
                    <div className="p-2.5 bg-[#F85149]/10 border border-[#F85149]/30 rounded-xl text-xs text-[#F85149] font-bold flex items-center gap-2">
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
                              ? 'border-[#3FB950] bg-[#3FB950]/10'
                              : 'border-[#30363D] bg-[#21262D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pdf-ans-${qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectAnsChange(qIdx, optIdx)}
                            className="w-4 h-4 text-[#3FB950] cursor-pointer"
                          />
                          <span className="w-6 h-6 rounded-lg bg-[#161B22] border border-[#30363D] text-xs font-bold text-[#F0F6FC] flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium text-[#F0F6FC] focus:outline-none"
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
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#58A6FF] hover:bg-[#388BFD] disabled:opacity-50 text-[#0D1117] font-extrabold text-base shadow-md transition-all cursor-pointer"
            >
              <Save className="w-5 h-5 text-[#0D1117]" />
              <span>{saving ? 'Publishing Test...' : 'Publish Verified Test'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToMcq;
