import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  PlusCircle,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react';

const CreateMcqTest = ({ isEditMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [timerMode, setTimerMode] = useState('full');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [perQuestionSeconds, setPerQuestionSeconds] = useState(60);
  const [isSequential, setIsSequential] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [negativeMarkingRate, setNegativeMarkingRate] = useState(0);
  const [isPublished, setIsPublished] = useState(true);

  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      marks: 1,
      explanation: '',
    },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjects(res.data);
        if (res.data.length > 0 && !subjectId) {
          setSubjectId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubjects();

    if (isEditMode && id) {
      const fetchTestData = async () => {
        try {
          const res = await api.get(`/tests/${id}`);
          const data = res.data;
          setTitle(data.title);
          setDescription(data.description || '');
          setSubjectId(data.subjectId?._id || data.subjectId);
          setTimerMode(data.timerMode || 'full');
          setDurationMinutes(data.durationMinutes || 30);
          setPerQuestionSeconds(data.perQuestionSeconds || 60);
          setIsSequential(data.isSequential || false);
          setMaxAttempts(data.maxAttempts || 1);
          setNegativeMarkingRate(data.negativeMarkingRate || 0);
          setIsPublished(data.isPublished);
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
          }
        } catch (err) {
          console.error(err);
          addToast('Failed to load test details', 'error');
        }
      };
      fetchTestData();
    }
  }, [id, isEditMode, addToast]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        marks: 1,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      addToast('Test must contain at least 1 question', 'warning');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx, text) => {
    const updated = [...questions];
    updated[idx].questionText = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectAnsChange = (qIdx, optIdx) => {
    const updated = [...questions];
    updated[qIdx].correctAnswerIndex = optIdx;
    setQuestions(updated);
  };

  const handleMarksChange = (qIdx, val) => {
    const updated = [...questions];
    updated[qIdx].marks = Number(val) || 1;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIdx, text) => {
    const updated = [...questions];
    updated[qIdx].explanation = text;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !subjectId) {
      addToast('Title and Subject are required', 'error');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        addToast(`Question #${i + 1} has empty text`, 'error');
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        addToast(`Question #${i + 1} has blank options`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        subjectId,
        type: 'mcq',
        timerMode,
        durationMinutes: Number(durationMinutes),
        perQuestionSeconds: Number(perQuestionSeconds),
        isSequential,
        maxAttempts: Number(maxAttempts),
        negativeMarkingRate: Number(negativeMarkingRate),
        isPublished,
        questions,
      };

      if (isEditMode && id) {
        await api.put(`/tests/${id}`, payload);
        addToast('Test updated successfully!', 'success');
      } else {
        await api.post('/tests', payload);
        addToast('MCQ Test created successfully!', 'success');
      }

      navigate('/teacher/tests');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save test', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isEditMode ? 'Edit MCQ Test' : 'Create New MCQ Test'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure test parameters, timers, negative marking, and question options.
          </p>
        </div>
      </div>

      {/* Test Metadata Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
          1. Basic Test Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Test Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Core Java OOPs Mastery Assessment"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject</label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description & Instructions</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or instructions for students..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Timer & Grading Rules */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3 pt-4">
          2. Timer & Negative Marking Options
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Timer Mode</label>
            <select
              value={timerMode}
              onChange={(e) => setTimerMode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            >
              <option value="none">No Timer (Self-Paced)</option>
              <option value="full">Full Test Timer (Total Minutes)</option>
              <option value="question">Per Question Timer (Seconds)</option>
            </select>
          </div>

          {timerMode === 'full' && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              />
            </div>
          )}

          {timerMode === 'question' && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Per-Question Seconds</label>
              <input
                type="number"
                min={5}
                value={perQuestionSeconds}
                onChange={(e) => setPerQuestionSeconds(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Negative Marking</label>
            <select
              value={negativeMarkingRate}
              onChange={(e) => setNegativeMarkingRate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white"
            >
              <option value={0}>No Negative Marking</option>
              <option value={0.25}>0.25 Marks (25% Deduction)</option>
              <option value={0.5}>0.50 Marks (50% Deduction)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Builder */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            3. Questions & Answer Choices ({questions.length})
          </h3>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100"
          >
            <PlusCircle className="w-4 h-4" /> Add Question
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <div
            key={qIdx}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-6 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="font-bold text-base text-slate-900 dark:text-white">Question #{qIdx + 1}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span>Marks:</span>
                  <input
                    type="number"
                    min={1}
                    value={q.marks}
                    onChange={(e) => handleMarksChange(qIdx, e.target.value)}
                    className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-center font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  title="Remove Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Statement</label>
              <textarea
                rows={2}
                required
                value={q.questionText}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                placeholder="Enter question text here..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Options grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Options & Correct Answer Radio
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correctAnswerIndex === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-ans-${qIdx}`}
                        checked={isCorrect}
                        onChange={() => handleCorrectAnsChange(qIdx, optIdx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="flex-1 bg-transparent border-none text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Explanation for Answer (Optional)</label>
              <input
                type="text"
                value={q.explanation}
                onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                placeholder="Explain why the correct answer is right..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving Test...' : isEditMode ? 'Update Test' : 'Publish MCQ Test'}</span>
        </button>
      </div>
    </form>
  );
};

export default CreateMcqTest;
