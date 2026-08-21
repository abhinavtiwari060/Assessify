import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { BookOpen, PlusCircle, Trash2, Edit } from 'lucide-react';

const ManageSubjects = () => {
  const { addToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingId(sub._id);
    setName(sub.name);
    setCode(sub.code);
    setDescription(sub.description || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name || !code) {
      addToast('Subject name and code are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, { name, code, description });
        addToast('Subject updated successfully', 'success');
      } else {
        await api.post('/subjects', { name, code, description });
        addToast('Subject created successfully', 'success');
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to save subject', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, subName) => {
    if (!window.confirm(`Delete subject "${subName}"?`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      addToast('Subject removed', 'success');
      fetchSubjects();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Cannot delete subject', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Subjects & Categories Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage standard subjects (Java, Python, DBMS, DSA, Aptitude, English, GK) and custom subjects.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Custom Subject</span>
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : subjects.length === 0 ? (
        <EmptyState title="No subjects found" description="Create a new subject to categorize assessment tests." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {sub.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub._id, sub.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{sub.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">{sub.description || 'Subject category for assessments.'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Subject' : 'Add New Subject'}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
            >
              {saving ? 'Saving...' : 'Save Subject'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AI501"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-bold uppercase text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of subject syllabus or domain..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageSubjects;
