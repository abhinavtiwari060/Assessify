import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PDFUploader from '../../components/PDFUploader';
import {
  BookOpen,
  PlusCircle,
  Trash2,
  Save,
  FileCheck,
  AlertTriangle,
  FileUp,
  Sparkles,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

const CreateReadingComprehension = ({ isEditMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Form Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [negativeMarkingRate, setNegativeMarkingRate] = useState(0);
  const [instructions, setInstructions] = useState('Read the passage(s) carefully before answering questions.');
  const [isPublished, setIsPublished] = useState(true);

  // Comprehension Passages & Questions State
  // Array of passage groups: { id, passage, questions: [{ questionText, options: ['', '', '', ''], correctAnswerIndex: 0, marks: 1, explanation: '' }] }
  const [passageGroups, setPassageGroups] = useState([
    {
      id: `pass_${Date.now()}_1`,
      passage: '',
      questions: [
        {
          questionText: '',
          options: ['', '', '', ''],
          correctAnswerIndex: 0,
          marks: 1,
          explanation: '',
        },
      ],
    },
  ]);

  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjects(res.data || []);
        if (res.data && res.data.length > 0 && !subjectId) {
          setSubjectId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    fetchSubjects();

    if (isEditMode && id) {
      const fetchTest = async () => {
        try {
          const res = await api.get(`/tests/${id}`);
          const test = res.data;
          setTitle(test.title || '');
          setDescription(test.description || '');
          setSubjectId(test.subjectId?._id || test.subjectId || '');
          setDurationMinutes(test.durationMinutes || 30);
          setPassingPercentage(test.passingPercentage || 40);
          setNegativeMarkingRate(test.negativeMarkingRate || 0);
          setInstructions(test.instructions || '');
          setIsPublished(Boolean(test.isPublished));

          // Group flat questions by passageId
          if (test.questions && test.questions.length > 0) {
            const groupsMap = new Map();
            test.questions.forEach((q) => {
              const pId = q.passageId || 'pass_default';
              if (!groupsMap.has(pId)) {
                groupsMap.set(pId, {
                  id: pId,
                  passage: q.passage || '',
                  questions: [],
                });
              }
              const group = groupsMap.get(pId);
              if (!group.passage && q.passage) group.passage = q.passage;
              group.questions.push({
                questionText: q.questionText || '',
                options: q.options || ['', '', '', ''],
                correctAnswerIndex: q.correctAnswerIndex || 0,
                marks: q.marks || 1,
                explanation: q.explanation || '',
              });
            });
            setPassageGroups(Array.from(groupsMap.values()));
          }
        } catch (err) {
          console.error('Failed to fetch test for edit:', err);
          addToast('Failed to load test details', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchTest();
    }
  }, [id, isEditMode]);

  // PDF RC Import Handler
  const handlePdfExtracted = (data) => {
    if (!data) return;

    const extractedPassages = data.passages || [];
    const pdfWarnings = data.warnings || [];

    if (extractedPassages.length === 0 && data.questions && data.questions.length > 0) {
      // Create single group from questions
      const firstPassage = data.questions.find((q) => q.passage)?.passage || '';
      setPassageGroups([
        {
          id: `pass_${Date.now()}_1`,
          passage: firstPassage,
          questions: data.questions.map((q) => ({
            questionText: q.questionText || '',
            options: q.options || ['', '', '', ''],
            correctAnswerIndex: q.correctAnswerIndex !== null ? q.correctAnswerIndex : 0,
            marks: q.marks || 1,
            explanation: q.explanation || '',
          })),
        },
      ]);
    } else if (extractedPassages.length > 0) {
      setPassageGroups(
        extractedPassages.map((pGroup, pIdx) => ({
          id: pGroup.passageId || `pass_${Date.now()}_${pIdx + 1}`,
          passage: pGroup.passage || '',
          questions: (pGroup.questions || []).map((q) => ({
            questionText: q.questionText || '',
            options: q.options || ['', '', '', ''],
            correctAnswerIndex: q.correctAnswerIndex !== null ? q.correctAnswerIndex : 0,
            marks: q.marks || 1,
            explanation: q.explanation || '',
          })),
        }))
      );
    }

    setWarnings(pdfWarnings);

    if (data.fileName) {
      setTitle(data.fileName.replace(/\.pdf$/i, '') + ' Reading Comprehension');
    }

    addToast(`Extracted ${extractedPassages.length || 1} reading passage group(s)`, 'success');
  };

  // Passage Group Operations
  const handleAddPassageGroup = () => {
    setPassageGroups([
      ...passageGroups,
      {
        id: `pass_${Date.now()}_${passageGroups.length + 1}`,
        passage: '',
        questions: [
          {
            questionText: '',
            options: ['', '', '', ''],
            correctAnswerIndex: 0,
            marks: 1,
            explanation: '',
          },
        ],
      },
    ]);
  };

  const handleRemovePassageGroup = (gIdx) => {
    if (passageGroups.length === 1) {
      addToast('At least one reading passage group is required', 'error');
      return;
    }
    setPassageGroups(passageGroups.filter((_, idx) => idx !== gIdx));
  };

  const handlePassageTextChange = (gIdx, text) => {
    const updated = [...passageGroups];
    updated[gIdx].passage = text;
    setPassageGroups(updated);
  };

  // Question Operations within a Group
  const handleAddQuestionToGroup = (gIdx) => {
    const updated = [...passageGroups];
    updated[gIdx].questions.push({
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      marks: 1,
      explanation: '',
    });
    setPassageGroups(updated);
  };

  const handleRemoveQuestionFromGroup = (gIdx, qIdx) => {
    const updated = [...passageGroups];
    if (updated[gIdx].questions.length === 1) {
      addToast('Passage group must have at least 1 question', 'error');
      return;
    }
    updated[gIdx].questions = updated[gIdx].questions.filter((_, idx) => idx !== qIdx);
    setPassageGroups(updated);
  };

  const handleQuestionTextChange = (gIdx, qIdx, text) => {
    const updated = [...passageGroups];
    updated[gIdx].questions[qIdx].questionText = text;
    setPassageGroups(updated);
  };

  const handleOptionChange = (gIdx, qIdx, optIdx, text) => {
    const updated = [...passageGroups];
    updated[gIdx].questions[qIdx].options[optIdx] = text;
    setPassageGroups(updated);
  };

  const handleCorrectAnsChange = (gIdx, qIdx, optIdx) => {
    const updated = [...passageGroups];
    updated[gIdx].questions[qIdx].correctAnswerIndex = optIdx;
    setPassageGroups(updated);
  };

  const handleMarksChange = (gIdx, qIdx, val) => {
    const updated = [...passageGroups];
    updated[gIdx].questions[qIdx].marks = Math.max(1, parseInt(val, 10) || 1);
    setPassageGroups(updated);
  };

  // Save / Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) {
      addToast('Please enter test title and select subject', 'error');
      return;
    }

    // Validation
    for (let gIdx = 0; gIdx < passageGroups.length; gIdx++) {
      const group = passageGroups[gIdx];
      if (!group.passage.trim()) {
        addToast(`Passage #${gIdx + 1} text is empty`, 'error');
        return;
      }
      if (group.questions.length === 0) {
        addToast(`Passage #${gIdx + 1} has no questions`, 'error');
        return;
      }
      for (let qIdx = 0; qIdx < group.questions.length; qIdx++) {
        const q = group.questions[qIdx];
        if (!q.questionText.trim()) {
          addToast(`Passage #${gIdx + 1} Question #${qIdx + 1} text is required`, 'error');
          return;
        }
        if (q.options.some((opt) => !opt.trim())) {
          addToast(`Passage #${gIdx + 1} Question #${qIdx + 1} has empty options`, 'error');
          return;
        }
      }
    }

    // Flatten passage groups into flat question schema
    const flatQuestions = [];
    passageGroups.forEach((group) => {
      group.questions.forEach((q, subIdx) => {
        flatQuestions.push({
          type: 'comprehension',
          passage: subIdx === 0 ? group.passage : '',
          passageId: group.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          marks: q.marks || 1,
          explanation: q.explanation || '',
        });
      });
    });

    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        subjectId,
        testType: 'reading_comprehension',
        type: 'reading_comprehension',
        durationMinutes: parseInt(durationMinutes, 10) || 30,
        passingPercentage: parseInt(passingPercentage, 10) || 40,
        negativeMarkingRate: parseFloat(negativeMarkingRate) || 0,
        instructions,
        isPublished,
        questions: flatQuestions,
      };

      if (isEditMode && id) {
        await api.put(`/tests/${id}`, payload);
        addToast('Reading Comprehension updated successfully!', 'success');
      } else {
        await api.post('/tests', payload);
        addToast('Reading Comprehension published successfully!', 'success');
      }
      navigate('/teacher/tests');
    } catch (err) {
      console.error('Failed to save reading comprehension:', err);
      addToast(err.response?.data?.message || 'Failed to save test', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 font-bold text-[var(--text-main)]">Loading...</div>;
  }

  const totalQuestions = passageGroups.reduce((acc, g) => acc + g.questions.length, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 text-[var(--text-main)]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/teacher/tests')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-sub)] hover:text-[#FA8128] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Tests
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30 flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
              {isEditMode ? 'Edit Reading Comprehension' : 'Create Reading Comprehension'}
            </h1>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-extrabold text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving...' : isEditMode ? 'Update Test' : 'Publish Test'}</span>
        </button>
      </div>

      {/* Basic Test Metadata */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-extrabold text-[var(--text-main)] border-b border-[var(--border)] pb-3">
          1. Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Test Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AMCAT English Reading Comprehension"
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Passing Percentage (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={passingPercentage}
              onChange={(e) => setPassingPercentage(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Status
            </label>
            <select
              value={isPublished ? 'published' : 'draft'}
              onChange={(e) => setIsPublished(e.target.value === 'published')}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Description / Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief instructions for students..."
            className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
          />
        </div>
      </div>

      {/* PDF Import Section */}
      <div className="bg-[var(--bg-card)] border-2 border-[#FA8128]/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileUp className="w-5 h-5 text-[#FA8128]" />
          <h3 className="text-lg font-extrabold text-[var(--text-main)]">
            2. Import Reading Comprehension PDF
          </h3>
        </div>
        <p className="text-xs text-[var(--text-sub)]">
          Upload a Reading Comprehension PDF (such as AMCAT English). The system will automatically extract passages and bound sub-questions into editable sections below.
        </p>

        <PDFUploader endpoint="/pdf/extract-rc" onExtracted={handlePdfExtracted} />

        {warnings.length > 0 && (
          <div className="p-4 bg-[#FA8128]/10 border border-[#FA8128]/30 rounded-xl space-y-1 text-xs text-[#FA8128]">
            <div className="font-extrabold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#FA8128]" /> Extractor Warnings:
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[var(--text-sub)]">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reading Passages & Questions Editor */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-[var(--text-main)]">
            3. Reading Passages & Sub-Questions ({passageGroups.length} Passages, {totalQuestions} Questions)
          </h3>

          <button
            type="button"
            onClick={handleAddPassageGroup}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FA8128]/10 hover:bg-[#FA8128]/20 text-[#FA8128] border border-[#FA8128]/30 font-extrabold text-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Add Passage Section
          </button>
        </div>

        {passageGroups.map((group, gIdx) => (
          <div
            key={group.id || gIdx}
            className="bg-[var(--bg-card)] rounded-2xl p-6 border-2 border-[#FA8128]/40 shadow-md space-y-6"
          >
            {/* Passage Header */}
            <div className="flex items-center justify-between border-b border-[#FA8128]/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FA8128]/15 text-[#FA8128] border border-[#FA8128]/30 flex items-center justify-center font-black">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-main)]">
                    Passage Section #{gIdx + 1}
                  </h4>
                  <p className="text-xs text-[var(--text-sub)]">
                    {group.questions.length} question(s) bound to this passage
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemovePassageGroup(gIdx)}
                className="p-2 text-[#EF4444] hover:bg-[var(--bg-sub)] rounded-xl transition-colors cursor-pointer"
                title="Remove Passage Section"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Passage Editor */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#FA8128]">
                Reading Passage Text *
              </label>
              <textarea
                rows={6}
                value={group.passage}
                onChange={(e) => handlePassageTextChange(gIdx, e.target.value)}
                placeholder="Enter or paste reading passage text..."
                className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-4 text-xs sm:text-sm font-serif leading-relaxed text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
              />
            </div>

            {/* Sub-Questions Container */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                  Questions for Passage #{gIdx + 1} ({group.questions.length})
                </h5>
                <button
                  type="button"
                  onClick={() => handleAddQuestionToGroup(gIdx)}
                  className="flex items-center gap-1 text-xs font-bold text-[#FA8128] hover:underline cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Question to Passage
                </button>
              </div>

              {group.questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="bg-[var(--bg-sub)] rounded-xl p-5 border border-[var(--border)] space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <span className="font-extrabold text-sm text-[var(--text-main)]">
                      Passage #{gIdx + 1} — Question #{qIdx + 1}
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)]">
                        <span>Marks:</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={q.marks}
                          onChange={(e) => handleMarksChange(gIdx, qIdx, e.target.value)}
                          className="w-14 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs font-bold text-center text-[var(--text-main)]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionFromGroup(gIdx, qIdx)}
                        className="p-1.5 text-[#EF4444] hover:bg-[var(--bg-card)] rounded-lg transition-colors cursor-pointer"
                        title="Remove Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Question Text *
                    </label>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => handleQuestionTextChange(gIdx, qIdx, e.target.value)}
                      placeholder="Enter question statement..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
                    />
                  </div>

                  {/* Options Grid */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Options & Correct Answer Radio *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswerIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              isCorrect
                                ? 'border-[#22C55E] bg-[#22C55E]/10'
                                : 'border-[var(--border)] bg-[var(--bg-card)]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`pass-${gIdx}-q-${qIdx}-ans`}
                              checked={isCorrect}
                              onChange={() => handleCorrectAnsChange(gIdx, qIdx, optIdx)}
                              className="w-4 h-4 text-[#22C55E] cursor-pointer"
                            />
                            <span className="w-6 h-6 rounded-lg bg-[var(--bg-sub)] border border-[var(--border)] text-xs font-bold text-[var(--text-main)] flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                handleOptionChange(gIdx, qIdx, optIdx, e.target.value)
                              }
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Floating Submit Bar */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => navigate('/teacher/tests')}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] font-bold text-xs text-[var(--text-main)] bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white font-black text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving...' : isEditMode ? 'Update Test' : 'Publish Test'}</span>
        </button>
      </div>
    </div>
  );
};

export default CreateReadingComprehension;
