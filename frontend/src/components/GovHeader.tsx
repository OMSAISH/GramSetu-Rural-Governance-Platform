import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../i18n/translations';
import { Phone, Globe } from 'lucide-react';

interface GovHeaderProps {
  fontSizeLevel: number;
  setFontSizeLevel: (fn: (prev: number) => number) => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({ fontSizeLevel, setFontSizeLevel }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="w-full bg-white border-b border-slate-300">
      {/* 1. National Tricolor Strip */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-[#FFFFFF] border-y border-slate-200" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* 2. Top GIGW Accessibility & Governance Strip */}
      <div className="bg-[#0f172a] text-slate-200 text-[11px] py-1 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Government of India & State Authority */}
          <div className="flex items-center space-x-3 divide-x divide-slate-700">
            <span className="font-semibold text-slate-100 flex items-center space-x-1.5">
              <span>🇮🇳</span>
              <span>भारत सरकार | Government of India</span>
            </span>
            <span className="pl-3 text-slate-300 hidden md:inline">
              महाराष्ट्र शासन | Government of Maharashtra
            </span>
          </div>

          {/* Right: Accessibility Controls & Language */}
          <div className="flex items-center space-x-4">
            {/* Screen Reader Access */}
            <a
              href="#main-content"
              className="text-slate-400 hover:text-white hidden lg:inline underline decoration-dotted"
            >
              Screen Reader Access
            </a>

            {/* Font Size Adjusters (A-, A, A+) */}
            <div className="flex items-center space-x-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              <button
                onClick={() => setFontSizeLevel(prev => Math.max(-1, prev - 1))}
                className={`px-1.5 text-xs font-bold hover:text-amber-400 ${fontSizeLevel === -1 ? 'text-amber-400 font-black' : ''}`}
                title="Decrease Font Size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeLevel(() => 0)}
                className={`px-1.5 text-xs font-bold hover:text-amber-400 border-x border-slate-700 ${fontSizeLevel === 0 ? 'text-amber-400 font-black' : ''}`}
                title="Reset Font Size"
              >
                A
              </button>
              <button
                onClick={() => setFontSizeLevel(prev => Math.min(2, prev + 1))}
                className={`px-1.5 text-xs font-bold hover:text-amber-400 ${fontSizeLevel > 0 ? 'text-amber-400 font-black' : ''}`}
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center space-x-1 font-bold">
              <Globe className="w-3 h-3 text-amber-400 mr-0.5" />
              {(['mr', 'hi', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 py-0.5 rounded transition ${
                    language === lang
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Indian Government Portal Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Ashoka Emblem & Ministry Titles */}
        <div className="flex items-center space-x-4">
          {/* Official Ashoka Lion Capital Emblem SVG */}
          <div className="shrink-0 flex flex-col items-center">
            <svg
              className="w-12 h-14 text-[#996515]"
              viewBox="0 0 64 80"
              fill="currentColor"
            >
              {/* Pillar Capital Stylized Ashoka Silhouette */}
              <path d="M32 2 C28 2 24 6 24 10 C24 12 25 14 26 15 C22 16 18 20 18 25 C18 30 22 34 26 35 C24 37 23 40 23 43 C23 48 26 52 30 53 L30 58 L20 58 C18 58 16 60 16 62 L16 64 L48 64 L48 62 C48 60 46 58 44 58 L34 58 L34 53 C38 52 41 48 41 43 C41 40 40 37 38 35 C42 34 46 30 46 25 C46 20 42 16 38 15 C39 14 40 12 40 10 C40 6 36 2 32 2 Z" />
              {/* Ashoka Chakra Base */}
              <circle cx="32" cy="46" r="4" fill="#0A2540" />
              {/* Pedestal line */}
              <rect x="12" y="66" width="40" height="4" rx="1" fill="#996515" />
            </svg>
            <span className="text-[8px] font-black tracking-widest text-[#0A2540] uppercase mt-0.5">
              सत्यमेव जयते
            </span>
          </div>

          <div className="border-l border-slate-300 pl-4">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              पंचायती राज मंत्रालय, भारत सरकार | Ministry of Panchayati Raj
            </div>
            <div className="flex items-baseline space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
                ग्रामसेतू <span className="text-xl font-bold text-slate-700">(GramSetu)</span>
              </h1>
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                ई-स्वराज पोर्टल
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              ग्रामपंचायत प्रशासन व नागरिक कल्याण ई-सेवा प्रणाली (Shivajinagar GP, Pune)
            </div>
          </div>
        </div>

        {/* Right: National Badges & 24x7 Helpline */}
        <div className="flex flex-wrap items-center justify-end gap-3 text-right">
          {/* Helpline Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-1.5 flex items-center space-x-2.5 text-left shadow-sm">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase block leading-tight">
                नागरिक टोल-फ्री मदत कक्ष
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                1800-120-2255
              </span>
            </div>
          </div>

          {/* Official Project Seals */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="px-2 py-1 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="text-[9px] font-black text-blue-900 block leading-none">Digital India</span>
              <span className="text-[8px] text-slate-500">डिजिटल भारत</span>
            </div>
            <div className="px-2 py-1 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="text-[9px] font-black text-emerald-800 block leading-none">e-GramSwaraj</span>
              <span className="text-[8px] text-slate-500">ई-ग्रामस्वराज</span>
            </div>
            <div className="px-2 py-1 bg-slate-100 rounded border border-slate-300 text-center">
              <span className="text-[9px] font-black text-orange-800 block leading-none">CPGRAMS</span>
              <span className="text-[8px] text-slate-500">तक्रार निवारण</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
