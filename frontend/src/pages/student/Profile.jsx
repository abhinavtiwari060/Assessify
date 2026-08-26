import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/PasswordInput';
import { Save } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, bio };
      if (password) payload.password = password;

      const res = await api.put('/auth/profile', payload);
      updateUser(res.data);
      addToast('Profile updated successfully!', 'success');
      setPassword('');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-[var(--text-main)]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
          Profile & Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-sub)] mt-1">
          Manage your account details and security.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[var(--border)]">
          <div className="w-14 h-14 rounded-2xl bg-[#FA8128] text-white flex items-center justify-center font-black text-2xl shadow-xs">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)]">{user?.name}</h3>
            <p className="text-xs text-[var(--text-sub)]">{user?.email}</p>
            <span className="inline-block mt-1 text-[11px] font-bold text-[#FA8128] uppercase">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Address (Read only)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-[var(--bg-sub)] opacity-70 border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-muted)] cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Bio / Notes</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Computer science undergrad or course instructor..."
              className="w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl p-3 text-xs sm:text-sm font-medium text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#FA8128]"
            />
          </div>

          <div className="space-y-1 pt-2 border-t border-[var(--border)]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">New Password (Optional)</label>
            <PasswordInput
              placeholder="Leave blank to keep current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

