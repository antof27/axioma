import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Award, Star, ListCollapse, Play, Sparkles, Loader } from 'lucide-react';
import GlassCard from './GlassCard';

export default function StatsDashboard({ users }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [stats, setStats] = useState(null);
  const [tierList, setTierList] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTiers, setLoadingTiers] = useState(false);

  useEffect(() => {
    if (users && users.length > 0) {
      // Initialize with first user
      setSelectedUserId(users[0].id.toString());
    }
  }, [users]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserStats(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    loadTierList();
  }, []);

  const loadUserStats = async (userId) => {
    setLoadingStats(true);
    try {
      const data = await api.getUserStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load user stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadTierList = async () => {
    setLoadingTiers(true);
    try {
      const data = await api.getArtistTierList();
      setTierList(data);
    } catch (err) {
      console.error('Failed to load tier list', err);
    } finally {
      setLoadingTiers(false);
    }
  };

  const tierColors = {
    S: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-red-500/10',
    A: 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-orange-500/10',
    B: 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10',
    C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 shadow-yellow-500/10',
    D: 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-blue-500/10',
    F: 'bg-zinc-600/20 text-zinc-400 border-zinc-500/40 shadow-zinc-500/10',
    Unrated: 'bg-white/5 text-gray-400 border-white/10'
  };

  const activeUser = users.find(u => u.id === parseInt(selectedUserId));

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">User Insights</h2>
        <p className="text-gray-400 text-sm font-medium">
          Analytics compiled from real-time database entries, including individual ratings and collective artist tiers.
        </p>
      </div>

      {/* Part 1: Personal Best Panel */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Judge Insights</h3>
              <p className="text-xs text-gray-400 font-semibold">Select a judge to review their top rated albums & tracks.</p>
            </div>
          </div>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-[#0f0e1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer min-w-[150px]"
          >
            <option value="" disabled>Select Judge</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-sky-400" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {/* Highest-Rated Album */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-sky-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Highest-Rated Album</span>
              </h4>

              {stats.highestRatedAlbum ? (
                <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                    <img
                      src={stats.highestRatedAlbum.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500'}
                      alt={stats.highestRatedAlbum.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h5 className="font-extrabold text-white text-base truncate leading-tight">
                      {stats.highestRatedAlbum.title}
                    </h5>
                    <p className="text-xs font-bold text-gray-400">{stats.highestRatedAlbum.artist_name}</p>
                    <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 w-fit px-2 py-0.5 rounded-lg">
                      <Star className="w-3 h-3 text-sky-400 fill-sky-400" />
                      <span className="text-xs font-black text-sky-400">
                        {stats.highestRatedAlbum.user_avg.toFixed(1)} / 10
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 p-6 rounded-2xl text-center text-xs text-gray-500 italic">
                  No albums rated by {activeUser?.name} yet.
                </div>
              )}
            </div>

            {/* Highest-Rated Songs */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                <span>Highest-Rated Songs</span>
              </h4>

              <div className="space-y-2.5">
                {stats.highestRatedSongs && stats.highestRatedSongs.length > 0 ? (
                  stats.highestRatedSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/5 rounded-xl gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{song.title}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase truncate">
                          {song.artist_name} &bull; {song.release_title}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg shrink-0">
                        <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                        <span className="text-xs font-black text-indigo-400">{song.score_value.toFixed(1)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl text-center text-xs text-gray-500 italic">
                    No songs rated by {activeUser?.name} yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Part 2: Interactive Artist Tier List */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <ListCollapse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Artist Tier List</h3>
              <p className="text-xs text-gray-400 font-semibold">Artists ranked automatically by their catalog overall average rating.</p>
            </div>
          </div>
          <button
            onClick={loadTierList}
            className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-semibold hover:bg-white/10 transition-all"
          >
            Refresh List
          </button>
        </div>

        {loadingTiers || !tierList ? (
          <div className="flex justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-sky-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {['S', 'A', 'B', 'C', 'D', 'F', 'Unrated'].map((tier) => {
              const bands = tierList[tier] || [];
              const colorClass = tierColors[tier];
              return (
                <div
                  key={tier}
                  className="flex flex-col md:flex-row items-stretch border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]"
                >
                  {/* Tier Label Column */}
                  <div className={`w-full md:w-24 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5 py-4 md:py-0 font-extrabold text-2xl tracking-tighter ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]} shrink-0 shadow-inner select-none`}>
                    {tier}
                  </div>

                  {/* Bands Listing */}
                  <div className="flex-1 p-4 flex flex-wrap gap-3 items-center min-h-[70px]">
                    {bands.map((band) => (
                      <div
                        key={band.id}
                        className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm"
                      >
                        <span className="text-sm font-bold text-white">{band.name}</span>
                        {band.rating !== null && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                            ★ {band.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    ))}
                    {bands.length === 0 && (
                      <span className="text-xs text-gray-600 font-semibold italic select-none">Empty Tier</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
