import React, { useState, useEffect } from 'react';
import { api, isStaticMode } from '../utils/api';
import { Clock, Play, ChevronDown, ChevronUp, Star, Trash2 } from 'lucide-react';

export default function AlbumDetail({ release, artist, users, onClose, onRefreshArtist }) {
  const [tracks, setTracks] = useState([]);
  const [expandedTrackId, setExpandedTrackId] = useState(null);
  const [localScores, setLocalScores] = useState({}); // { trackId: { userId: score } }

  useEffect(() => {
    if (release && release.tracks) {
      setTracks(release.tracks);
      
      // Initialize local scores state
      const scoresObj = {};
      release.tracks.forEach(track => {
        scoresObj[track.id] = { ...(track.userScores || {}) };
      });
      setLocalScores(scoresObj);
    }
  }, [release]);

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleScoreChange = (trackId, userId, val) => {
    const numericVal = val === '' ? '' : parseFloat(val);
    setLocalScores(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [userId]: numericVal
      }
    }));
  };

  const handleSaveScore = async (trackId, userId, val) => {
    const sendVal = val === '' || isNaN(val) ? null : parseFloat(val);
    try {
      const res = await api.saveScore(trackId, userId, sendVal);
      
      // Update local track average and database cache
      setTracks(prev => prev.map(t => {
        if (t.id === trackId) {
          const updatedUserScores = { ...t.userScores };
          if (sendVal === null) {
            delete updatedUserScores[userId];
          } else {
            updatedUserScores[userId] = sendVal;
          }
          return {
            ...t,
            avg_score: res.avg_score,
            userScores: updatedUserScores
          };
        }
        return t;
      }));

      // Trigger parents update to recalculate artist catalog average
      if (onRefreshArtist) onRefreshArtist();
    } catch (err) {
      console.error('Failed to save score', err);
    }
  };

  const calculateAverage = (trackId) => {
    const scores = localScores[trackId] || {};
    const values = Object.values(scores).filter(v => v !== '' && v !== null && !isNaN(v));
    if (values.length === 0) return 'Unrated';
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/5 px-4 py-2 rounded-xl"
      >
        &larr; Back to Artist Profile
      </button>

      {/* Album Header Info */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={release.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500'}
            alt={release.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-2 text-center md:text-left flex-1">
          <span className="text-xs font-extrabold uppercase text-indigo-400 tracking-wider">
            {release.type === 'album' ? 'Studio Album' : 'Single'}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            {release.title}
          </h2>
          <p className="text-gray-400 font-semibold text-sm">
            by <span className="text-gray-200">{artist.name}</span> &bull; {release.release_year} &bull; {tracks.length} Tracks
          </p>
        </div>
      </div>

      {/* Tracks Section */}
      <div className="glass-panel rounded-3xl overflow-hidden border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-extrabold text-white">Tracklist & Scoring</h3>
        </div>

        <div className="divide-y divide-white/5">
          {tracks.map((track, index) => {
            const isExpanded = expandedTrackId === track.id;
            const avg = calculateAverage(track.id);
            return (
              <div key={track.id} className="transition-colors hover:bg-white/[0.01]">
                {/* Track Row Header */}
                <div
                  onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
                  className="flex items-center justify-between p-4 md:p-6 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-gray-600 font-bold text-sm min-w-[20px] text-right">
                      {index + 1}
                    </span>
                    <button className="p-2 rounded-full bg-white/5 text-sky-400 hover:bg-white/10 transition-colors">
                      <Play className="w-3.5 h-3.5 fill-sky-400" />
                    </button>
                    <span className="font-bold text-sm md:text-base text-white truncate">
                      {track.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-bold text-gray-400">{formatDuration(track.duration)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Star className={`w-4 h-4 ${avg === 'Unrated' ? 'text-gray-600' : 'text-amber-400 fill-amber-400'}`} />
                      <span className={`text-xs md:text-sm font-black ${avg === 'Unrated' ? 'text-gray-500' : 'text-white'}`}>
                        {avg}
                      </span>
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Track Expanded Section */}
                {isExpanded && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-8 bg-white/[0.02] border-t border-white/5">
                    {/* Left: Lyrics */}
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase font-extrabold text-sky-400 tracking-wider">Lyrics</h4>
                      <div className="bg-[#0b0a13] border border-white/5 rounded-2xl p-4 max-h-[200px] overflow-y-auto">
                        <pre className="text-xs md:text-sm text-gray-300 font-medium whitespace-pre-wrap leading-relaxed font-sans">
                          {track.lyrics || 'No lyrics available.'}
                        </pre>
                      </div>
                    </div>

                    {/* Right: Dynamic Multi-User Scoring Component */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">Judges Scorecards</h4>
                      
                      {users.length === 0 ? (
                        <p className="text-gray-500 text-xs italic">No registered judges. Add judges in the settings to start rating tracks.</p>
                      ) : (
                        <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                          {users.map((user) => {
                            const scoreVal = localScores[track.id]?.[user.id] ?? '';
                            return (
                              <div key={user.id} className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 px-4 py-3 rounded-xl">
                                <span className="text-xs md:text-sm font-bold text-gray-300 truncate w-24">
                                  {user.name}
                                </span>

                                {/* Slider and input */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={scoreVal === '' ? '5.0' : scoreVal}
                                    onChange={(e) => handleScoreChange(track.id, user.id, e.target.value)}
                                    onMouseUp={() => handleSaveScore(track.id, user.id, scoreVal)}
                                    onTouchEnd={() => handleSaveScore(track.id, user.id, scoreVal)}
                                    disabled={isStaticMode}
                                    className="w-full accent-sky-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={scoreVal}
                                    placeholder="-"
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      handleScoreChange(track.id, user.id, v);
                                    }}
                                    onBlur={() => handleSaveScore(track.id, user.id, scoreVal)}
                                    disabled={isStaticMode}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-xs text-white w-12 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>

                                <button
                                  onClick={() => {
                                    handleScoreChange(track.id, user.id, '');
                                    handleSaveScore(track.id, user.id, '');
                                  }}
                                  disabled={isStaticMode || scoreVal === ''}
                                  className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                  title={isStaticMode ? "Disabled in Archive Mode" : "Clear Score"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
