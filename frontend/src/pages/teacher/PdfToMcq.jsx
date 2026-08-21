import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PDFUploader from '../../components/PDFUploader';
import {
  FileText,
  CheckCircle,
  PlusCircle,
  Trash2,
  Save,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

const PdfToMcq = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
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

  const handleExtracted = (questions, fileName) => {
    setExtractedQuestions(questions);
    setTestTitle(fileName.replace('.pdf', '') + ' MCQ Assessment');
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
      addToast('No questions to save', 'error');
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

      addToast(`Test "${testTitle}" created with ${extractedQuestions.length} verified questions!`, 'success');
      navigate('/teacher/tests');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save test', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          PDF → MCQ Automatic Extractor
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload any text-based question paper PDF to auto-generate structured MCQs. Always review extracted content before publishing.
        </p>
      </div>

      {/* Upload Component */}
      <PDFUploader onExtracted={handleExtracted} />

      {/* Extracted Review Editor Section */}
      {extractedQuestions.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <strong>Review Extracted Questions: </strong> PDF extraction heuristic parsed {extractedQuestions.length} questions. Verify options, correct answer keys, and text accuracy below.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Save Test Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white"
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

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Extracted Questions Editor ({extractedQuestions.length})
            </h3>

            {extractedQuestions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">Question #{qIdx + 1}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                      Confidence: {q.confidence || 'Medium'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Text</label>
                  <textarea
                    rows={2}
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctAnswerIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-2xl border ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pdf-ans-${qIdx}`}
                          checked={isCorrect}
                          onChange={() => handleCorrectAnsChange(qIdx, optIdx)}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                          className="flex-1 bg-transparent border-none text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveExtractedTest}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Publishing Test...' : 'Publish Verified Test'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToMcq;
