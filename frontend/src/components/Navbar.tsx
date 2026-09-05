import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { Language } from '../i18n/translations';
import { MessageSquare, FileText, AlertCircle, Landmark, LayoutDashboard, Globe, LogIn, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout, role } = useAuth();

  const navItems = [
    { id: 'chat', label: t.nav.chat, icon: MessageSquare },
    { id: 'schemes', label: t.nav.schemes, icon: FileText },
    { id: 'grievances', label: t.nav.grievances, icon: AlertCircle },
    { id: 'governance', label: t.nav.governance, icon: Landmark },
  ];

  if (role === 'official') {
    navItems.push({ id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard });
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
      {/* Tiranga Top Stripe */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Panchayat Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('chat')}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-md">
              GS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  {t.appName}
                </span>
                <span className="text-[11px] font-semibold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Gram Panchayat Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Shivajinagar Gram Panchayat (MH-27042)
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border-b-2 border-emerald-600'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Language Selector & Auth */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-1.5 ml-1 hidden sm:inline" />
              {(['mr', 'hi', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded transition-all ${
                    language === lang
                      ? 'bg-white text-emerald-800 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 flex items-center justify-end space-x-1">
                    {role === 'official' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline" />}
                    <span>{user?.name.split(' ')[0]}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {role === 'official' ? 'Panchayat Official' : 'Citizen'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title={t.nav.logout}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t.nav.login}</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-2 rounded font-medium ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
