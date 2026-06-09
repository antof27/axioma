import React, { useState } from 'react';
import { api } from '../utils/api';
import { UserPlus, Trash2, Shield, Users, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserManager({ users, reloadUsers }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null); // { id, name }
  const [addConfirmName, setAddConfirmName] = useState(null); // string name

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAddConfirmName(name.trim());
  };

  const confirmAdd = async () => {
    if (!addConfirmName) return;
    setLoading(true);
    setError('');
    try {
      await api.addUser(addConfirmName);
      setName('');
      setAddConfirmName(null);
      await reloadUsers();
    } catch (err) {
      setError(err.message || 'Failed to add user');
      setAddConfirmName(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, userName) => {
    setDeleteConfirmUser({ id, name: userName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmUser) return;
    setLoading(true);
    setError('');
    try {
      await api.deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      await reloadUsers();
    } catch (err) {
      setError('Failed to delete user');
      setDeleteConfirmUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Judges Settings</h2>
        <p className="text-gray-400 text-sm">
          Manage the global panel of judges. Adding or removing judges dynamically configures the scoring components, track metrics, and personal analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Add Judge */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Add New Judge</h3>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-gray-400 mb-1.5">Judge Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-gray-500 transition-colors"
                maxLength={30}
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none"
            >
              Register Judge
            </button>
          </form>
        </div>

        {/* Right Side: Active Judges Panel */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10 shadow-lg flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Active Panel</h3>
            </div>
            <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs px-2.5 py-1 rounded-full font-bold">
              {users.length} Registered
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[250px] pr-1">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-sky-400/80" />
                  <span className="text-sm font-semibold text-white">{u.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteClick(u.id, u.name)}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-60 hover:opacity-100"
                  title="Remove Judge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No active judges. Add one above to begin scoring.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {/* ADD CONFIRMATION MODAL */}
        {addConfirmName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setAddConfirmName(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="glass-panel max-w-md w-full rounded-2xl p-6 border border-white/10 shadow-2xl space-y-5 relative z-10"
            >
              <button
                onClick={() => setAddConfirmName(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 text-sky-400">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-sans">Add Judge Confirmation</h3>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed font-sans">
                Are you sure you want to register <strong className="text-white">"{addConfirmName}"</strong> as a judge? This will add them to the global scoring panel.
              </p>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  onClick={() => setAddConfirmName(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdd}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold text-sm transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                >
                  Confirm Registration
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setDeleteConfirmUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="glass-panel max-w-md w-full rounded-2xl p-6 border border-white/10 shadow-2xl space-y-5 relative z-10"
            >
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-sans">Irreversible Action</h3>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed font-sans">
                Are you absolutely sure you want to remove judge <strong className="text-white">"{deleteConfirmUser.name}"</strong>? This will <span className="text-red-400 font-bold">permanently delete</span> all their scores. This action is irreversible.
              </p>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  onClick={() => setDeleteConfirmUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-500/20"
                >
                  Yes, Remove Judge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
