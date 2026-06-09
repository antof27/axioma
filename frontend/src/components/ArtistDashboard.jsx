import React, { useState, useEffect } from 'react';
import { api, isStaticMode } from '../utils/api';
import { Search, Plus, MapPin, Users, Calendar, FileText, ChevronRight, CornerDownRight, Save, Loader, Trash2 } from 'lucide-react';
import GlassCard from './GlassCard';

export default function ArtistDashboard({ currentUser, users, onSelectAlbum }) {
  const [artists, setArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [newArtistName, setNewArtistName] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistDetails, setArtistDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const data = await api.getArtists();
      setArtists(data);
    } catch (err) {
      console.error('Failed to load artists', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArtist = async (artist) => {
    setLoading(true);
    setSelectedArtist(artist);
    try {
      const details = await api.getArtistDetails(artist.id);
      setArtistDetails(details);
      setNotes(details.personal_notes || '');
    } catch (err) {
      console.error('Failed to load artist details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArtist = async (e) => {
    e.preventDefault();
    if (!newArtistName.trim()) return;
    setAdding(true);
    setStatusMsg('Searching MusicBrainz and Wikipedia for verified bio, members, and discography...');
    try {
      const result = await api.addArtist(newArtistName.trim());
      setNewArtistName('');
      setStatusMsg(`Success! Added ${newArtistName}. Populating discography...`);
      setTimeout(() => setStatusMsg(''), 3000);
      await loadArtists();
      
      // Auto-open the newly added artist
      if (result.id) {
        const data = await api.getArtists();
        const added = data.find(a => a.id === result.id);
        if (added) handleSelectArtist(added);
      }
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`);
      setTimeout(() => setStatusMsg(''), 4000);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteArtist = async () => {
    if (!artistDetails) return;
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${artistDetails.name}" and all associated releases, tracks, and scores? This action is irreversible.`);
    if (!confirmed) return;
    
    try {
      await api.deleteArtist(artistDetails.id);
      setSelectedArtist(null);
      setArtistDetails(null);
      loadArtists();
    } catch (err) {
      alert(`Failed to delete artist: ${err.message}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!artistDetails) return;
    setSavingNotes(true);
    try {
      await api.updateArtistNotes(artistDetails.id, notes);
      setArtistDetails({ ...artistDetails, personal_notes: notes });
    } catch (err) {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Color mapping based on band names to provide custom glow
  const getGlowStyles = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('vildhjarta')) return 'from-emerald-500/20 to-teal-500/5 shadow-emerald-500/10 border-emerald-500/30';
    if (lower.includes('karmanjakah')) return 'from-cyan-500/20 to-indigo-500/5 shadow-cyan-500/10 border-cyan-500/30';
    if (lower.includes('meshuggah')) return 'from-orange-600/20 to-yellow-600/5 shadow-orange-500/10 border-orange-500/30';
    if (lower.includes('periphery')) return 'from-blue-500/20 to-indigo-500/5 shadow-blue-500/10 border-blue-500/30';
    if (lower.includes('tesseract')) return 'from-violet-500/20 to-purple-500/5 shadow-violet-500/10 border-violet-500/30';
    if (lower.includes('sleep token')) return 'from-rose-500/20 to-slate-500/5 shadow-rose-500/10 border-rose-500/30';
    return 'from-sky-500/20 to-indigo-500/5 shadow-indigo-500/10 border-sky-500/20';
  };

  const filteredArtists = artists.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.origin.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedArtist && artistDetails) {
    const isSingle = (rel) => rel.type === 'single';
    const albums = artistDetails.releases.filter(r => !isSingle(r));
    const singles = artistDetails.releases.filter(isSingle);
    const glow = getGlowStyles(artistDetails.name);

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedArtist(null);
            setArtistDetails(null);
            loadArtists();
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/5 px-4 py-2 rounded-xl"
        >
          &larr; Back to Explorer
        </button>

        {/* Hero Section */}
        <div className={`relative overflow-hidden rounded-3xl p-6 md:p-10 border bg-gradient-to-br ${glow} shadow-2xl flex flex-col md:flex-row justify-between gap-6 transition-all duration-500`}>
          <div className="space-y-4 max-w-2xl">
            <div>
              <span className="text-xs font-extrabold uppercase text-sky-400 tracking-widest bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full">
                Artist Profile
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-3 mb-1">
                {artistDetails.name}
              </h2>
              <div className="flex items-center gap-2 text-gray-300 font-semibold text-sm">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>{artistDetails.origin}</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed font-medium">
              {artistDetails.bio}
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-[200px] justify-between items-end">
            {artistDetails.catalog_avg ? (
              <div className="glass-panel p-4 rounded-2xl text-center border-white/10 shadow-lg w-full">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Catalog Rating</span>
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 mt-1">
                  {artistDetails.catalog_avg.toFixed(1)} / 10
                </div>
              </div>
            ) : (
              <div />
            )}
            
            <button
              onClick={handleDeleteArtist}
              disabled={isStaticMode}
              className="flex items-center justify-center gap-2 text-xs bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 font-bold px-4 py-2.5 rounded-xl transition-all duration-300 w-full shadow-md mt-auto disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Artist</span>
            </button>
          </div>
        </div>

        {/* Mid-Row Components: Members, Upcoming releases, Custom Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members */}
          <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-base">Active Lineup</h3>
            </div>
            <ul className="space-y-2.5">
              {artistDetails.members.map((m, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-semibold bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-xl">
                  <CornerDownRight className="w-4 h-4 text-sky-400/80" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming releases */}
          <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Status & Upcoming</h3>
            </div>
            <ul className="space-y-2.5">
              {artistDetails.upcoming_releases.map((up, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-semibold bg-white/5 border border-white/5 px-3.5 py-2.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                  <span>{up}</span>
                </li>
              ))}
              {artistDetails.upcoming_releases.length === 0 && (
                <li className="text-gray-500 text-sm italic">No upcoming projects documented.</li>
              )}
            </ul>
          </div>

          {/* Personal Band Notes */}
          <div className="glass-panel rounded-2xl p-6 border-white/10 space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white text-base">Personal Notes</h3>
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={isStaticMode || savingNotes}
                className="flex items-center gap-1 text-xs bg-pink-500/10 border border-pink-500/20 text-pink-400 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-pink-500 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {savingNotes ? 'Saving...' : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isStaticMode ? "Notes are read-only in Archive Mode." : "Write custom notes, tone details, tuning systems, or review descriptions here..."}
              disabled={isStaticMode}
              className="flex-1 bg-white/5 border border-white/5 focus:border-white/10 rounded-xl p-3.5 text-xs text-gray-300 focus:outline-none placeholder-gray-600 resize-none font-medium h-[150px] leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Discography Grid */}
        <div className="space-y-6">
          {/* Albums */}
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-white tracking-tight">Studio Albums</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((alb) => (
                <GlassCard key={alb.id} onClick={() => onSelectAlbum(alb, artistDetails)}>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-900 border border-white/10">
                    <img
                      src={alb.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500'}
                      alt={alb.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      {alb.avg_score !== null && (
                        <span className="bg-sky-500/90 border border-sky-400/20 backdrop-blur-xs text-white text-xs font-black px-2 py-0.5 rounded-md">
                          ★ {alb.avg_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <h4 className="font-extrabold text-sm text-white group-hover:text-sky-400 transition-colors truncate">
                      {alb.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase">
                      <span>LP</span>
                      <span>{alb.release_year}</span>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {albums.length === 0 && (
                <p className="text-gray-500 text-sm">No studio albums logged.</p>
              )}
            </div>
          </div>

          {/* Singles */}
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-white tracking-tight">Singles & EPs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {singles.map((sin) => (
                <GlassCard key={sin.id} onClick={() => onSelectAlbum(sin, artistDetails)}>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-900 border border-white/10">
                    <img
                      src={sin.artwork_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500'}
                      alt={sin.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      {sin.avg_score !== null && (
                        <span className="bg-indigo-500/90 border border-indigo-400/20 backdrop-blur-xs text-white text-xs font-black px-2 py-0.5 rounded-md">
                          ★ {sin.avg_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors truncate">
                      {sin.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase">
                      <span>Single</span>
                      <span>{sin.release_year}</span>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {singles.length === 0 && (
                <p className="text-gray-500 text-sm">No singles logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Explorer header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">Artist Explorer</h2>
          <p className="text-gray-400 text-sm font-medium">
            Search existing progressive catalog items or add new artists below to run the automated metadata parser.
          </p>
        </div>

        {/* Add Artist Panel */}
        <form onSubmit={handleAddArtist} className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl w-full md:w-auto md:min-w-[350px] disabled:opacity-50">
          <input
            type="text"
            value={newArtistName}
            onChange={(e) => setNewArtistName(e.target.value)}
            placeholder={isStaticMode ? "Scraper disabled in Archive" : "Add new band (e.g. TesseracT)..."}
            disabled={isStaticMode || adding}
            className="bg-transparent text-sm text-white focus:outline-none px-3.5 py-2.5 flex-1 placeholder-gray-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            required={!isStaticMode}
          />
          <button
            type="submit"
            disabled={isStaticMode || adding || !newArtistName.trim()}
            className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold p-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
          >
            {adding ? <Loader className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {statusMsg && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl px-5 py-3.5 text-xs md:text-sm font-semibold text-sky-400 flex items-center gap-2.5 shadow-md">
          <Loader className="w-4 h-4 animate-spin text-sky-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by artist name or origin..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-gray-500 font-semibold"
        />
      </div>

      {/* Grid of Artists */}
      {loading && artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-3">
          <Loader className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-sm font-medium">Fetching catalog database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map((artist) => {
            const glow = getGlowStyles(artist.name);
            return (
              <GlassCard
                key={artist.id}
                onClick={() => handleSelectArtist(artist)}
                className="group relative flex flex-col justify-between h-[210px] overflow-hidden p-6 cursor-pointer"
              >
                {/* Background soft glow decoration */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${glow.split(' ')[0]} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-extrabold text-white group-hover:text-sky-400 transition-colors tracking-tight leading-tight">
                      {artist.name}
                    </h3>
                    {artist.catalog_avg && (
                      <span className="bg-white/5 border border-white/10 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                        ★ {artist.catalog_avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed font-semibold">
                    {artist.bio}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between text-xs font-bold text-gray-500 border-t border-white/5 pt-3.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-600" />
                    <span className="truncate max-w-[150px]">{artist.origin}</span>
                  </div>
                  <div className="flex items-center gap-1 group-hover:text-white transition-colors">
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {filteredArtists.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500 font-semibold">
              No matching artists found. Register one in the search bar above!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
