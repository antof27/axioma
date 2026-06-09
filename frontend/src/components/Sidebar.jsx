import React from 'react';
import { Music, BarChart2, Award, Settings, User, Sun, Moon } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, users, currentUser, setCurrentUser, theme, toggleTheme }) {
  const navItems = [
    { id: 'artists', label: 'Artist Explorer', icon: Music },
    { id: 'insights', label: 'User Insights', icon: BarChart2 },
    { id: 'awards', label: '2K Awards Hub', icon: Award },
    { id: 'settings', label: 'Judges Manager', icon: Settings },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-50 md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-64 glass-panel md:rounded-2xl p-4 md:p-6 flex md:flex-col justify-between items-center md:items-stretch border-t md:border-t-0 md:border-r border-white/10 select-none shadow-2xl transition-all duration-300">
      <div className="flex md:flex-col items-center md:items-stretch w-full justify-between md:justify-start gap-8">
        {/* Brand/Logo */}
        <div className="hidden md:flex items-center gap-3 px-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-pink-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">MUSIC HUB</h1>
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest">Self-Hosted</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex md:flex-col w-full justify-around md:justify-start gap-1 md:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-sky-400 scale-110' : 'text-gray-400'}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Switcher & Theme Toggle */}
      <div className="md:border-t md:border-white/10 md:pt-4 md:mt-4 w-auto md:w-full flex md:flex-col items-center justify-between gap-3">
        <div className="relative flex-1 flex items-center gap-3">
          <div className="hidden md:flex p-2 rounded-xl bg-white/5 border border-white/10 text-sky-400">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <label className="hidden md:block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Active Judge</label>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const found = users.find(u => u.id === parseInt(e.target.value));
                if (found) setCurrentUser(found);
              }}
              className="bg-transparent md:bg-white/5 border border-white/10 md:border-white/10 rounded-xl px-2.5 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-[130px] md:max-w-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0f0e1a] text-white">
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sky-400 transition-all duration-300 flex items-center justify-center shrink-0"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
        </button>
      </div>
    </aside>
  );
}
