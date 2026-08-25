import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Save } from 'lucide-react';

const CreateEssayTest = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks, setTotalMarks] = useState(20);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !subjectId || !description) {
      addToast('Please fill in title, subject, and essay prompt', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post('/tests', {
        title,
        description,
        subjectId,
        type: 'essay',
        timerMode: 'full',
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        isPublished: true,
      });

      addToast('Essay Test prompt created successfully!', 'success');
      navigate('/teacher/tests');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to create essay test', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-12 text-[var(--text-main)]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          Create Essay Writing Assessment
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
          Set up a timed essay writing prompt for student evaluation.
        </p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-xs space-y-6">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Essay Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Impact of Artificial Intelligence on Software Architecture"
            className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Target Subject</label>
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

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Essay Prompt Topic & Instructions</label>
          <textarea
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail the essay question prompt, word count guidance, and key evaluation criteria..."
            className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm text-[var(--text-main)] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Time Limit (Minutes)</label>
            <input
              type="number"
              min={5}
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Maximum Marks</label>
            <input
              type="number"
              min={1}
              required
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-extrabold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#0A0A0A]" />
            <span>{saving ? 'Publishing...' : 'Publish Essay Test'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreateEssayTest;

