import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ArtistDashboard from './components/ArtistDashboard';
import AlbumDetail from './components/AlbumDetail';
import StatsDashboard from './components/StatsDashboard';
import WinnersHub from './components/WinnersHub';
import UserManager from './components/UserManager';
import { api, isStaticMode } from './utils/api';
import { Loader } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('artists');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  // Release/Album details routing inside 'artists' tab
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedAlbumArtist, setSelectedAlbumArtist] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
      if (data.length > 0) {
        // Maintain selection or set default
        setCurrentUser((prev) => {
          if (prev && data.some(u => u.id === prev.id)) {
            return data.find(u => u.id === prev.id);
          }
          return data[0];
        });
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to load users list', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Helper to sync track ratings back to current view
  const refreshArtistProfile = async () => {
    if (!selectedAlbumArtist) return;
    try {
      const refreshedDetails = await api.getArtistDetails(selectedAlbumArtist.id);
      setSelectedAlbumArtist(refreshedDetails);
      // Find and update the selected release inside artist
      const updatedRel = refreshedDetails.releases.find(r => r.id === selectedAlbum.id);
      if (updatedRel) {
        setSelectedAlbum(updatedRel);
      }
    } catch (err) {
      console.error('Failed to sync artist profile data', err);
    }
  };

  // Whenever we change tabs, reset the inner album router back to explorer
  useEffect(() => {
    setSelectedAlbum(null);
    setSelectedAlbumArtist(null);
  }, [activeTab]);

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-[#080710] text-gray-100 overflow-x-hidden">
      {/* Background Animated Glow Layers */}
      <div className="orb-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {loadingUsers ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader className="w-10 h-10 animate-spin text-sky-500" />
          <h2 className="font-extrabold text-lg text-white">Loading Music Hub...</h2>
        </div>
      ) : (
        <>
          {/* Global Sticky Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            users={users}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            theme={theme}
            toggleTheme={toggleTheme}
          />

          {/* Core Content Viewport */}
          <main className="flex-1 p-6 md:p-10 pb-28 md:pb-10 max-w-7xl w-full mx-auto overflow-y-auto">
            {isStaticMode && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs md:text-sm font-semibold flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span><strong>Read-Only Mode:</strong> Viewing static backup from GitHub Pages. Run locally to edit.</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">Archive</span>
              </div>
            )}

            {activeTab === 'artists' && (
              selectedAlbum ? (
                <AlbumDetail
                  release={selectedAlbum}
                  artist={selectedAlbumArtist}
                  users={users}
                  onClose={() => setSelectedAlbum(null)}
                  onRefreshArtist={refreshArtistProfile}
                />
              ) : (
                <ArtistDashboard
                  currentUser={currentUser}
                  users={users}
                  onSelectAlbum={(album, artist) => {
                    setSelectedAlbum(album);
                    setSelectedAlbumArtist(artist);
                  }}
                />
              )
            )}

            {activeTab === 'insights' && (
              <StatsDashboard users={users} />
            )}

            {activeTab === 'awards' && (
              <WinnersHub />
            )}

            {activeTab === 'settings' && (
              <UserManager
                users={users}
                reloadUsers={loadUsers}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
