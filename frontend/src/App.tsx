import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GovHeader } from './components/GovHeader';
import { GovNoticeTicker } from './components/GovNoticeTicker';
import { Navbar } from './components/Navbar';
import { CitizenChat } from './components/CitizenChat';
import { SchemeEligibility } from './components/SchemeEligibility';
import { GrievancePortal } from './components/GrievancePortal';
import { GovernanceRecords } from './components/GovernanceRecords';
import { OfficialDashboard } from './components/OfficialDashboard';
import { AuthModal } from './components/AuthModal';
import { ShieldAlert, PhoneCall, ExternalLink, ShieldCheck, Building2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { language } = useLanguage();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('chat');
  const [navContext, setNavContext] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);

  const handleNavigateTab = (tab: string, contextData?: any) => {
    setNavContext(contextData);
    setActiveTab(tab);
  };

  const fontScaleStyle = fontSizeLevel === 1 
    ? { fontSize: '108%' } 
    : fontSizeLevel === -1 
    ? { fontSize: '92%' } 
    : {};

  return (
    <div style={fontScaleStyle} className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-[#FF9933]/30">
      {/* 1. GIGW Indian Government Header Bar */}
      <GovHeader fontSizeLevel={fontSizeLevel} setFontSizeLevel={setFontSizeLevel} />

      {/* 2. Official Public Notice Ticker Marquee */}
      <GovNoticeTicker />

      {/* 3. Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setNavContext(null);
          setActiveTab(tab);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 4. Main Content Area with Skip-Link Anchor for Screen Readers */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 shadow-md border-2 border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-[#133E87] flex items-center justify-center mx-auto border-2 border-blue-200">
                <ShieldAlert className="w-7 h-7 text-[#133E87]" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {language === 'mr' ? 'ग्रामपंचायत अधिकारी प्रवेश आवश्यक' : 'Panchayat Official Access Required'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'mr' 
                  ? 'प्रशासकीय नियंत्रण कक्ष केवळ सरपंच, ग्रामसेवक आणि गटविकास अधिकाऱ्यांसाठी राखीव आहे. नागरिकांच्या तक्रारींचे SLA सनियंत्रण करण्यासाठी कृपया लॉगिन करा.'
                  : 'The administrative dashboard is reserved for Gram Sevak, Sarpanch, and Block Development Officers to monitor SLA breaches and systemic civic issues.'}
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-2.5 bg-[#0A2540] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                {language === 'mr' ? 'अधिकारी म्हणून लॉगिन करा (डेमो: 9822001122)' : 'Login as Official (Demo: 9822001122)'}
              </button>
            </div>
          )
        )}
      </main>

      {/* 5. Authentic GIGW Indian Government Portal Footer */}
      <footer className="bg-[#0A2540] text-slate-300 text-xs border-t-4 border-[#FF9933] mt-auto">
        {/* Top 3-Column Footer Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-blue-950">
          {/* Column 1: About Platform & Ministry */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF9933] to-[#138808] flex items-center justify-center text-white font-black text-xs shadow-xs">
                GS
              </div>
              <div>
                <span className="font-black text-sm text-white tracking-tight">ग्रामसेतू (GramSetu)</span>
                <div className="text-[10px] text-amber-300">डिजिटल ग्रामपंचायत महापोर्टल</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {language === 'mr' 
                ? 'महाराष्ट्र ग्रामपंचायत अधिनियम आणि भारत सरकारच्या पंचायती राज मंत्रालयाच्या मार्गदर्शक तत्त्वांवर आधारित ग्रामीण नागरिक हक्क, कल्याणकारी योजना आणि तक्रार निवारण सहाय्यक.'
                : 'National multilingual rural governance, welfare entitlement verification, and guaranteed citizen services delivery platform.'}
            </p>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GIGW 3.0 Guidelines for Indian Government Websites Compliant</span>
            </div>
          </div>

          {/* Column 2: Official National Portals Directory */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-blue-900 pb-1.5 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>{language === 'mr' ? 'शासकीय महत्त्वाची संकेतस्थळे' : 'National Portal Directory'}</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>
                <a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>National Portal of India (india.gov.in)</span>
                </a>
              </li>
              <li>
                <a href="https://egramswaraj.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>e-GramSwaraj (egramswaraj.gov.in)</span>
                </a>
              </li>
              <li>
                <a href="https://aaplesarkar.mahaonline.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>आपले सरकार महाराष्ट्र (aaplesarkar.mahaonline.gov.in)</span>
                </a>
              </li>
              <li>
                <a href="https://dbtbharat.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>Direct Benefit Transfer (dbtbharat.gov.in)</span>
                </a>
              </li>
              <li>
                <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>CPGRAMS Central Grievance Portal (pgportal.gov.in)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: 24x7 Citizen Helpline Directory */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-blue-900 pb-1.5 flex items-center space-x-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'mr' ? '२४x७ शासकीय मदत कक्ष' : '24x7 Citizen Helplines'}</span>
            </h4>
            <div className="space-y-2 text-[11px]">
              <div className="bg-[#061826] p-2.5 rounded-lg border border-blue-950 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{language === 'mr' ? 'ग्रामपंचायत कोपरगाव मदत कक्ष' : 'Kopargaon Panchayat Helpline'}</div>
                  <div className="text-[10px] text-slate-400">नागरिक हक्क सनद निवारण</div>
                </div>
                <div className="text-amber-400 font-mono font-black text-xs">1800-120-2255</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#061826] p-2 rounded-lg border border-blue-950">
                  <div className="text-[10px] text-slate-400">जल जीवन मिशन</div>
                  <div className="text-sky-300 font-mono font-bold">1916</div>
                </div>
                <div className="bg-[#061826] p-2 rounded-lg border border-blue-950">
                  <div className="text-[10px] text-slate-400">MSEDCL वीज</div>
                  <div className="text-amber-300 font-mono font-bold">1912</div>
                </div>
                <div className="bg-[#061826] p-2 rounded-lg border border-blue-950">
                  <div className="text-[10px] text-slate-400">महिला व बाल हेल्पलाइन</div>
                  <div className="text-pink-300 font-mono font-bold">181 / 1098</div>
                </div>
                <div className="bg-[#061826] p-2 rounded-lg border border-blue-950">
                  <div className="text-[10px] text-slate-400">आपत्कालीन रुग्णवाहिका</div>
                  <div className="text-emerald-300 font-mono font-bold">108</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom GIGW Legal & Copyright Strip */}
        <div className="bg-[#061826] py-4 px-4 sm:px-6 lg:px-8 text-[11px] text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div>
              <p>
                {language === 'mr'
                  ? 'ग्रामसेतू - ग्रामपंचायत कोपरगाव डिजिटल सेवा प्रणाली. माहितीचा अधिकार कायदा कलम ४(१)(ख) व लोकसेवा हक्क अधिनियमांतर्गत सार्वजनिक प्रकटीकरण.'
                  : 'GramSetu - Digital Gram Panchayat Kopargaon Governance Platform. Publicly disclosed under RTI Act Section 4(1)(b).'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Content Owned, Updated and Maintained by Gram Panchayat Administration, Kopargaon (Ahilyanagar).
              </p>
            </div>

            <div className="text-[10px] text-slate-500 shrink-0">
              <span>शेवटचे अद्यतन (Last Updated): <strong>०६ सप्टेंबर २०२६</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. Authentication Modal */}
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
        <Analytics />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;

