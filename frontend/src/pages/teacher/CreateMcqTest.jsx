import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  PlusCircle,
  Trash2,
  Save,
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12 text-[var(--text-main)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
            {isEditMode ? 'Edit MCQ Test' : 'Create New MCQ Test'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
            Configure test parameters, timers, negative marking, and question options.
          </p>
        </div>
      </div>

      {/* Test Metadata Card */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-xs space-y-6">
        <h3 className="text-base font-extrabold text-[var(--text-main)] border-b border-[var(--border)] pb-3">
          1. Basic Test Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Test Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Core Java OOPs Mastery Assessment"
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Subject</label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Description & Instructions</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or instructions for students..."
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
            />
          </div>
        </div>

        {/* Timer & Grading Rules */}
        <h3 className="text-base font-extrabold text-[var(--text-main)] border-b border-[var(--border)] pb-3 pt-4">
          2. Timer & Negative Marking Options
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Timer Mode</label>
            <select
              value={timerMode}
              onChange={(e) => setTimerMode(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)]"
            >
              <option value="none">No Timer (Self-Paced)</option>
              <option value="full">Full Test Timer (Total Minutes)</option>
              <option value="question">Per Question Timer (Seconds)</option>
            </select>
          </div>

          {timerMode === 'full' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)]"
              />
            </div>
          )}

          {timerMode === 'question' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Per-Question Seconds</label>
              <input
                type="number"
                min={5}
                value={perQuestionSeconds}
                onChange={(e) => setPerQuestionSeconds(e.target.value)}
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Negative Marking</label>
            <select
              value={negativeMarkingRate}
              onChange={(e) => setNegativeMarkingRate(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)]"
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
          <h3 className="text-lg font-extrabold text-[var(--text-main)]">
            3. Questions & Answer Choices ({questions.length})
          </h3>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[#F59E0B] font-bold text-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#F59E0B]" /> Add Question
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <div
            key={qIdx}
            className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-xs space-y-6 relative"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="font-extrabold text-sm text-[var(--text-main)]">Question #{qIdx + 1}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-sub)]">
                  <span>Marks:</span>
                  <input
                    type="number"
                    min={1}
                    value={q.marks}
                    onChange={(e) => handleMarksChange(qIdx, e.target.value)}
                    className="w-16 bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-2 py-1 text-center font-bold text-[var(--text-main)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="p-1.5 text-[#EF4444] hover:bg-[var(--bg-sub)] rounded-xl transition-colors cursor-pointer"
                  title="Remove Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Question Statement</label>
              <textarea
                rows={2}
                required
                value={q.questionText}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                placeholder="Enter question text here..."
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              />
            </div>

            {/* Options grid */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Options & Correct Answer Radio
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correctAnswerIndex === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isCorrect
                          ? 'border-[#22C55E] bg-[#22C55E]/10'
                          : 'border-[var(--border)] bg-[var(--bg-sub)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-ans-${qIdx}`}
                        checked={isCorrect}
                        onChange={() => handleCorrectAnsChange(qIdx, optIdx)}
                        className="w-4 h-4 text-[#22C55E] focus:ring-[#22C55E] cursor-pointer"
                      />
                      <span className="w-6 h-6 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-xs font-extrabold flex items-center justify-center text-[var(--text-main)]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Explanation for Answer (Optional)</label>
              <input
                type="text"
                value={q.explanation}
                onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                placeholder="Explain why the correct answer is right..."
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs text-[var(--text-main)]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-extrabold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-[#0A0A0A]" />
          <span>{saving ? 'Saving Test...' : isEditMode ? 'Update Test' : 'Publish MCQ Test'}</span>
        </button>
      </div>
    </form>
  );
};

export default CreateMcqTest;

