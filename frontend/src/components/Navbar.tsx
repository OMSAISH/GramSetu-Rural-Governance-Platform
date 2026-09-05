import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  MessageSquare, FileText, AlertCircle, Landmark, 
  LayoutDashboard, LogIn, LogOut, ShieldCheck, Settings, Check, Link2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout, role } = useAuth();
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState(api.getCustomApiUrl());
  const [savedMsg, setSavedMsg] = useState(false);

  const navItems = [
    { id: 'chat', label: t.nav.chat, icon: MessageSquare },
    { id: 'schemes', label: t.nav.schemes, icon: FileText },
    { id: 'grievances', label: t.nav.grievances, icon: AlertCircle },
    { id: 'governance', label: t.nav.governance, icon: Landmark },
  ];

  if (role === 'official') {
    navItems.push({ id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard });
  }

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    api.setCustomApiUrl(backendUrlInput);
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      setShowApiSettings(false);
      window.location.reload();
    }, 800);
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#0A2540] text-white shadow-md border-b-2 border-amber-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Main Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-inner'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Tools: API Setting, User Badge, Login */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Backend URL Settings button */}
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              title="Backend Server Configuration"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Auth State Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 bg-slate-800/90 pl-3 pr-1 py-1 rounded-xl border border-slate-700">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-amber-400 flex items-center justify-end space-x-1">
                    {role === 'official' && <ShieldCheck className="w-3.5 h-3.5 text-blue-400 inline mr-1" />}
                    <span>{user?.name.split(' ')[0]}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">
                    {role === 'official' ? 'Official' : 'Citizen'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title={t.nav.logout}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backend API Settings Modal */}
      {showApiSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#0A2540] flex items-center space-x-2">
                <Link2 className="w-4 h-4 text-emerald-600" />
                <span>Backend Connection Configuration</span>
              </h3>
              <button onClick={() => setShowApiSettings(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              GramSetu includes an automatic zero-downtime offline fallback so all schemes, rules, and grievance workflows run immediately. If you have deployed the FastAPI backend on <b>Render</b> or <b>Railway</b>, you can enter your live URL below:
            </p>

            <form onSubmit={handleSaveApiUrl} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Backend API URL (e.g. https://gramsetu-backend.onrender.com/api):
                </label>
                <input
                  type="url"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  placeholder="Leave empty to use client-side auto-fallback mode"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {savedMsg && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Connection URL saved! Reloading...</span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    api.setCustomApiUrl('');
                    setBackendUrlInput('');
                    setSavedMsg(true);
                    setTimeout(() => window.location.reload(), 600);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Reset to Auto-Fallback
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0A2540] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};
