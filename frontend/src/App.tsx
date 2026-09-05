import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CitizenChat } from './components/CitizenChat';
import { SchemeEligibility } from './components/SchemeEligibility';
import { GrievancePortal } from './components/GrievancePortal';
import { GovernanceRecords } from './components/GovernanceRecords';
import { OfficialDashboard } from './components/OfficialDashboard';
import { AuthModal } from './components/AuthModal';
import { ShieldAlert, PhoneCall } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { t } = useLanguage();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('chat');
  const [navContext, setNavContext] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const handleNavigateTab = (tab: string, contextData?: any) => {
    setNavContext(contextData);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-emerald-200">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setNavContext(null);
          setActiveTab(tab);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && (
          <CitizenChat onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'schemes' && (
          <SchemeEligibility />
        )}

        {activeTab === 'grievances' && (
          <GrievancePortal initialTrackingId={navContext?.trackingId} />
        )}

        {activeTab === 'governance' && (
          <GovernanceRecords />
        )}

        {activeTab === 'dashboard' && (
          role === 'official' ? (
            <OfficialDashboard />
          ) : (
            <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Panchayat Official Access Required
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                The administrative dashboard is reserved for Gram Sevak, Sarpanch, and Block Development Officers to monitor SLA breaches and systemic civic issues.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow transition"
              >
                Login as Official (Demo: 9822001122)
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              GS
            </div>
            <span className="font-bold text-slate-200">{t.appName}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Digital Gram Panchayat Initiative</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center space-x-1 text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Panchayat Helpline: 1800-120-2255</span>
            </span>
            <span>•</span>
            <span>Jal Jeevan Mission: 1916</span>
            <span>•</span>
            <span>MSEDCL Electricity: 1912</span>
          </div>

          <p className="text-[11px] text-slate-500">
            © 2026 GramSetu. Built for Rural Transparency & Citizen Entitlement.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessRole={(userRole) => {
          if (userRole === 'official') {
            setActiveTab('dashboard');
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainAppContent />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
