import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { Award, Search, Trophy, Plus, Trash2, ShieldAlert, CheckCircle, Loader } from 'lucide-react';
import GlassCard from './GlassCard';
import confetti from 'canvas-confetti';

export default function WinnersHub() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [awardsData, setAwardsData] = useState({}); // { year: [awards] }
  const [loading, setLoading] = useState(false);
  const [queryVal, setQueryVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    loadAwards();
  }, []);

  // Listen for clicks outside search dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAwards = async () => {
    setLoading(true);
    try {
      const data = await api.getTwoKAwards();
      setAwardsData(data);
    } catch (err) {
      console.error('Failed to load awards data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (val) => {
    setQueryVal(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await api.searchTracks(val);
      setSearchResults(results);
      setShowResults(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNominate = async (trackId) => {
    try {
      await api.nominateFinalist(selectedYear, trackId);
      setQueryVal('');
      setSearchResults([]);
      setShowResults(false);
      await loadAwards();
    } catch (err) {
      alert(err.message || 'Failed to nominate song');
    }
  };

  const handleCrownWinner = async (awardId, trackTitle) => {
    try {
      await api.crownWinner(awardId);
      
      // Trigger canvas-confetti animation
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      await loadAwards();
    } catch (err) {
      alert('Failed to crown winner');
    }
  };

  const handleRemoveNomination = async (awardId) => {
    if (!window.confirm('Remove this track from the finalists list?')) return;
    try {
      await api.removeFinalist(awardId);
      await loadAwards();
    } catch (err) {
      alert('Failed to remove nomination');
    }
  };

  const currentFinalists = awardsData[selectedYear] || [];
  const winner = currentFinalists.find(f => f.is_winner);

  // Group historical years (all years except selectedYear)
  const pastYears = Object.keys(awardsData)
    .map(Number)
    .filter(y => y !== selectedYear)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">2K Song of the Year</h2>
        <p className="text-gray-400 text-sm font-medium">
          Nominate progressive-metal and ambient masterpieces for the current calendar year and crown a single winner.
        </p>
      </div>

      {/* Year Selection Selector */}
      <div className="flex gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl w-fit">
        {[2026, 2025, 2024, 2023, 2022, 2021].map((yr) => (
          <button
            key={yr}
            onClick={() => setSelectedYear(yr)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              selectedYear === yr
                ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {yr}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 parts): Nominate Form + Past Winners Archives */}
        <div className="lg:col-span-1 space-y-6">
          {/* Nomination Search */}
          <div ref={searchContainerRef} className="glass-panel p-6 rounded-2xl border-white/10 space-y-4 relative">
            <div className="flex items-center gap-2.5">
              <Plus className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-base">Nominate Candidate</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={queryVal}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowResults(true)}
                placeholder="Search Artist, Song or Release..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-gray-500 font-semibold"
              />

              {/* Search Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0b13] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 max-h-[220px] overflow-y-auto">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleNominate(track.id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                    >
                      <img
                        src={track.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                        alt={track.track_title}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{track.track_title}</div>
                        <div className="text-[10px] text-gray-400 truncate font-semibold uppercase">
                          {track.artist_name} &bull; {track.release_title}
                        </div>
                      </div>
                      {track.avg_score && (
                        <span className="text-[10px] bg-white/5 border border-white/10 text-sky-400 font-black px-1.5 py-0.5 rounded">
                          ★ {track.avg_score}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Winners Archives */}
          <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Past Archives</h3>
            </div>
            
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {pastYears.map((yr) => {
                const yrWinner = awardsData[yr]?.find(f => f.is_winner);
                if (!yrWinner) return null;
                return (
                  <div key={yr} className="flex items-center gap-3.5 bg-white/5 border border-white/5 p-3 rounded-xl">
                    <div className="text-center font-extrabold text-sm text-indigo-400 shrink-0 min-w-[36px]">
                      {yr}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{yrWinner.track_title}</div>
                      <div className="text-[10px] text-gray-400 truncate font-semibold uppercase">{yrWinner.artist_name}</div>
                    </div>
                    {yrWinner.avg_score && (
                      <span className="text-[10px] text-amber-400 font-black px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                        ★ {yrWinner.avg_score}
                      </span>
                    )}
                  </div>
                );
              })}
              {pastYears.length === 0 && (
                <p className="text-gray-500 text-xs italic">No historical winners registered.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Finalists Grid & Winner Showcase */}
        <div className="lg:col-span-2 space-y-6">
          {/* Winner Banner */}
          {winner && (
            <div className="relative overflow-hidden rounded-3xl p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-yellow-500/5 to-transparent shadow-[0_4px_30px_rgba(245,158,11,0.15)] flex items-center gap-6">
              <div className="p-3.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <Trophy className="w-8 h-8 filter drop-shadow-[0_0_8px_#f59e0b]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
                  Crowned {selectedYear} Winner
                </span>
                <h3 className="text-2xl font-black text-white truncate mt-1">{winner.track_title}</h3>
                <p className="text-sm font-semibold text-gray-300 uppercase mt-0.5">
                  {winner.artist_name} &bull; <span className="text-gray-500">{winner.release_title}</span>
                </p>
              </div>
            </div>
          )}

          {/* Finalists Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-white">Finalists Pool ({currentFinalists.length})</h3>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-sky-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentFinalists.map((nom) => (
                  <GlassCard
                    key={nom.id}
                    className={`relative p-4 flex flex-col justify-between h-[190px] border ${
                      nom.is_winner ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img
                          src={nom.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                          alt={nom.track_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-white truncate leading-tight">{nom.track_title}</h4>
                        <p className="text-xs font-semibold text-gray-400 truncate mt-0.5">{nom.artist_name}</p>
                        {nom.avg_score !== null && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-black text-sky-400">
                            <span>★ {nom.avg_score.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                      <button
                        onClick={() => handleRemoveNomination(nom.id)}
                        className="text-xs text-gray-500 hover:text-red-400 font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Withdraw</span>
                      </button>

                      {nom.is_winner ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400 font-extrabold px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Winner</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCrownWinner(nom.id, nom.track_title)}
                          className="text-xs bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white font-extrabold px-3 py-1.5 rounded-xl transition-all"
                        >
                          Crown Winner
                        </button>
                      )}
                    </div>
                  </GlassCard>
                ))}

                {currentFinalists.length === 0 && (
                  <div className="col-span-2 bg-white/5 border border-white/5 p-8 rounded-2xl text-center text-xs text-gray-500 italic">
                    No nominated finalists for {selectedYear}. Find and nominate a track in the search panel.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
