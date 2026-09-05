import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Bell, Pause, Play } from 'lucide-react';

export const GovNoticeTicker: React.FC = () => {
  const { language } = useLanguage();
  const [isPaused, setIsPaused] = useState(false);

  const notices = {
    mr: [
      "📢 महत्त्वाची सूचना: विशेष ग्रामसभा बैठकीत Jal Jeevan Mission नळ जोडणी व विकास आराखड्यास सर्वसंमतीने मंजुरी.",
      "💧 वॉर्ड क्र. २ व ३ मध्ये नवीन भूमिगत गटार व सिमेंट रस्ता बांधकाम प्रगतीपथावर आहे.",
      "🏛️ प्रधानमंत्री आवास योजना (PMAY-G) नवीन पात्र लाभार्थी यादी ग्रामपंचायत कार्यालयाच्या फलकावर प्रसिद्ध.",
      "⚖️ नागरिक तक्रार निवारण हमी: पिण्याचे पाणी (३ दिवस), वीज/पथदिवे (४ दिवस) मुदतीत निवारण बंधनकारक."
    ],
    hi: [
      "📢 महत्वपूर्ण सूचना: विशेष ग्राम सभा बैठक में जल जीवन मिशन नल कनेक्शन व वार्षिक विकास बजट को सर्वसम्मति से मंजूरी।",
      "💧 वार्ड नं 2 और 3 में नई भूमिगत नाली एवं सीसी सड़क निर्माण कार्य प्रगति पर है।",
      "🏛️ प्रधानमंत्री आवास योजना (PMAY-G) नवीन पात्र लाभार्थी सूची ग्राम पंचायत सूचना पटल पर उपलब्ध।",
      "⚖️ नागरिक शिकायत निवारण गारंटी: पेयजल (3 दिन), बिजली (4 दिन) समयसीमा में समाधान अनिवार्य।"
    ],
    en: [
      "📢 Official Public Notice: Special Gram Sabha unanimously approved Jal Jeevan Mission tap connectivity and Monsoon Development Plan.",
      "💧 Construction of CC Road and covered stormwater drainage in Ward 2 & 3 is currently 65% complete.",
      "🏛️ Pradhan Mantri Awas Yojana (PMAY-G) newly verified beneficiary entitlement list published on Panchayat notice board.",
      "⚖️ Guaranteed Citizen Service SLA: Drinking Water (3 days), Streetlights (4 days) mandatory time-bound redressal."
    ]
  };

  const activeNotices = notices[language] || notices.en;

  return (
    <div className="w-full bg-[#133E87] text-white text-xs border-b border-blue-900 shadow-inner flex items-center overflow-hidden">
      {/* Label Badge */}
      <div className="bg-[#E65100] text-white px-3.5 py-2 font-black uppercase text-[10px] sm:text-xs tracking-wider flex items-center space-x-1.5 shrink-0 z-10 shadow-md">
        <Bell className="w-3.5 h-3.5 animate-bounce" />
        <span>
          {language === 'mr' ? 'जनमाहिती फलक' : (language === 'hi' ? 'सूचना पटल' : 'Public Ticker')}
        </span>
      </div>

      {/* Marquee Content */}
      <div 
        className="flex-1 overflow-hidden whitespace-nowrap py-1.5 px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`inline-block font-semibold space-x-8 ${isPaused ? '' : 'animate-marquee'}`}>
          {activeNotices.map((text, idx) => (
            <span key={idx} className="inline-flex items-center space-x-2 text-blue-100 hover:text-white transition">
              <span>{text}</span>
              <span className="text-amber-400 font-bold">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Pause/Play Toggle Button */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        title={isPaused ? "Play marquee" : "Pause marquee"}
        className="px-2.5 py-1 text-blue-300 hover:text-white shrink-0 hidden sm:block"
      >
        {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
      </button>
    </div>
  );
};
