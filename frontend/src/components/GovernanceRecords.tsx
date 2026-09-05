import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { 
  Landmark, Calendar, Hammer, IndianRupee, Search, Clock, 
  FileText, CheckCircle2, Printer, Shield, Award
} from 'lucide-react';

interface GovernanceRecord {
  id: number;
  panchayat_id: string;
  title: string;
  description: string;
  category: 'meeting' | 'work' | 'fund';
  date: string;
  status: string;
  amount?: number;
}

export const GovernanceRecords: React.FC = () => {
  const { language, t } = useLanguage();
  const [records, setRecords] = useState<GovernanceRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecordForPrint, setSelectedRecordForPrint] = useState<GovernanceRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [categoryFilter, language]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGovernanceRecords(
        categoryFilter || undefined,
        searchTerm || undefined,
        language
      );
      setRecords(data);
    } catch (err) {
      console.error('Failed to load governance records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const handlePrint = (rec: GovernanceRecord) => {
    setSelectedRecordForPrint(rec);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Official Government Header Banner */}
      <div className="bg-[#0A2540] text-white rounded-2xl shadow-lg border-t-4 border-[#FF9933] overflow-hidden">
        {/* Top jurisdiction strip */}
        <div className="bg-[#061826] px-6 py-2 border-b border-blue-950 flex flex-wrap items-center justify-between text-xs text-blue-200">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-[#FF9933]" />
            <span className="font-semibold uppercase tracking-wider">
              {language === 'mr' 
                ? 'महाराष्ट्र ग्रामपंचायत अधिनियम | सार्वजनिक दफ्तर प्रकटीकरण'
                : (language === 'hi' ? 'पंचायती राज अधिनियम | सार्वजनिक अभिलेख प्रकटीकरण' : 'Panchayati Raj Act - Public Records Disclosure')}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-300">
            <span>{language === 'mr' ? 'गाव: कोपरगाव | तालुका: कोपरगाव | जि. अहिल्यानगर' : 'GP: Kopargaon | Block: Kopargaon | Dist: Ahilyanagar'}</span>
            <span className="bg-emerald-800 text-emerald-100 font-mono px-2 py-0.5 rounded text-[10px] font-bold">
              LGD: 178450
            </span>
          </div>
        </div>

        {/* Banner Body */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#133E87] to-[#0A2540] border border-blue-400/30 flex items-center justify-center shadow-inner">
                  <Landmark className="w-6 h-6 text-[#FF9933]" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {language === 'mr' ? 'ग्रामपंचायत दफ्तर व सार्वजनिक सूचना फलक' : (language === 'hi' ? 'ग्राम पंचायत कार्यालय व सार्वजनिक सूचना पटल' : t.governance.title)}
                  </h1>
                  <p className="text-xs text-amber-300 font-medium mt-0.5">
                    {language === 'mr' ? 'माहितीचा अधिकार कायदा (RTI) कलम ४(१)(ख) अंतर्गत जाहीर प्रकटीकरण' : (language === 'hi' ? 'सूचना का अधिकार अधिनियम (RTI) धारा 4(1)(b) अंतर्गत स्वैच्छिक प्रकटीकरण' : 'RTI Act 2005 Section 4(1)(b) Proactive Public Governance Disclosure')}
                  </p>
                </div>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed mt-2">
                {language === 'mr' 
                  ? 'ग्रामसभेतील मंजूर ठराव, १५ वा वित्त आयोग निधी विनियोग, आणि वॉर्डानिहाय सुरू असलेल्या सार्वजनिक विकासकामांची अधिकृत प्रमाणित माहिती.'
                  : (language === 'hi' ? 'ग्राम सभा प्रस्ताव, 15वां वित्त आयोग अनुदान आवंटन एवं ग्राम विकास कार्यों की आधिकारिक और पारदर्शी प्रगति रिपोर्ट।' : t.governance.subtitle)}
              </p>
            </div>

            {/* Official Certification Badge */}
            <div className="shrink-0 bg-blue-900/60 border border-blue-700/50 rounded-xl p-3.5 text-center min-w-[200px] shadow-sm">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                {language === 'mr' ? 'डिजिटल ग्राम दफ्तर' : 'Digital Panchayat MIS'}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                {language === 'mr' ? '✓ सर्व नोंदी सामाजिक लेखापरीक्षित' : '✓ 100% Socially Audited'}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-blue-900/80">
            <div className="bg-[#0e2d4e] p-3 rounded-xl border border-blue-800/60">
              <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">
                {language === 'mr' ? 'मंजूर ग्रामसभा ठराव' : 'Gram Sabha Resolutions'}
              </div>
              <div className="text-lg font-black text-white mt-0.5">14 ठराव</div>
              <div className="text-[10px] text-emerald-400 font-medium">✓ सर्वसंमतीने संमत</div>
            </div>

            <div className="bg-[#0e2d4e] p-3 rounded-xl border border-blue-800/60">
              <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">
                {language === 'mr' ? 'सुरू विकासकामे' : 'Active Civil Works'}
              </div>
              <div className="text-lg font-black text-amber-400 mt-0.5">06 कामे</div>
              <div className="text-[10px] text-slate-300 font-medium">६५% सरासरी प्रगती</div>
            </div>

            <div className="bg-[#0e2d4e] p-3 rounded-xl border border-blue-800/60">
              <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">
                {language === 'mr' ? '१५ वा वित्त आयोग निधी' : '15th Finance Grants'}
              </div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">₹१८,५०,०००</div>
              <div className="text-[10px] text-slate-300 font-medium">सन २०२५-२६ मंजूर</div>
            </div>

            <div className="bg-[#0e2d4e] p-3 rounded-xl border border-blue-800/60">
              <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">
                {language === 'mr' ? 'जल जीवन मिशन' : 'Jal Jeevan Mission'}
              </div>
              <div className="text-lg font-black text-sky-400 mt-0.5">१२० नळ जोडण्या</div>
              <div className="text-[10px] text-sky-200 font-medium">१००% उद्दिष्ट पूर्ण</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#081f36] px-6 py-3 border-t border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs py-1">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                categoryFilter === '' 
                  ? 'bg-[#FF9933] text-slate-950 shadow-sm' 
                  : 'bg-blue-900/40 text-blue-200 hover:text-white hover:bg-blue-900'
              }`}
            >
              {language === 'mr' ? 'सर्व नोंदी' : (language === 'hi' ? 'सभी अभिलेख' : t.governance.filterAll)}
            </button>
            <button
              onClick={() => setCategoryFilter('meeting')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                categoryFilter === 'meeting' 
                  ? 'bg-[#FF9933] text-slate-950 shadow-sm' 
                  : 'bg-blue-900/40 text-blue-200 hover:text-white hover:bg-blue-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'ग्रामसभा ठराव' : (language === 'hi' ? 'ग्राम सभा प्रस्ताव' : t.governance.filterMeetings)}</span>
            </button>
            <button
              onClick={() => setCategoryFilter('work')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                categoryFilter === 'work' 
                  ? 'bg-[#FF9933] text-slate-950 shadow-sm' 
                  : 'bg-blue-900/40 text-blue-200 hover:text-white hover:bg-blue-900'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'सार्वजनिक विकासकामे' : (language === 'hi' ? 'विकास कार्य' : t.governance.filterWorks)}</span>
            </button>
            <button
              onClick={() => setCategoryFilter('fund')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                categoryFilter === 'fund' 
                  ? 'bg-[#FF9933] text-slate-950 shadow-sm' 
                  : 'bg-blue-900/40 text-blue-200 hover:text-white hover:bg-blue-900'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'विकास निधी व खर्च' : (language === 'hi' ? 'अनुदान व व्यय' : t.governance.filterFunds)}</span>
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-blue-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'mr' ? 'ठराव, काम किंवा निधी शोधा...' : (language === 'hi' ? 'प्रस्ताव, कार्य या बजट खोजें...' : t.governance.searchPlaceholder)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0e2d4e] text-white placeholder-blue-300/60 border border-blue-700/60 rounded-lg text-xs focus:ring-1 focus:ring-[#FF9933] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#138808] hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              {language === 'mr' ? 'शोधा' : (language === 'hi' ? 'खोजें' : 'Search')}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Records List Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">
            {language === 'mr' ? 'शासकीय दफ्तर नोंदी लोड होत आहेत...' : 'Loading official governance records...'}
          </p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">
            {language === 'mr' ? 'कोणतीही नोंद आढळली नाही' : 'No records found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t.governance.emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {records.map((rec) => {
            const isMeeting = rec.category === 'meeting';
            const isWork = rec.category === 'work';

            // Official resolution/record code
            const docCode = isMeeting 
              ? `ठराव क्र. GS/2025/${String(rec.id).padStart(2, '0')}`
              : isWork 
              ? `प्र.मा. क्र. GP/W/2025/${String(rec.id).padStart(2, '0')}`
              : `लेखा क्र. XV-FC/2025/${String(rec.id).padStart(2, '0')}`;

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm hover:border-[#133E87] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Official Card Top Header Strip */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center space-x-1 ${
                        isMeeting
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : isWork
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {isMeeting ? (
                        <>
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{language === 'mr' ? 'ग्रामसभा ठराव' : 'Gram Sabha Meeting'}</span>
                        </>
                      ) : isWork ? (
                        <>
                          <Hammer className="w-3 h-3 mr-1" />
                          <span>{language === 'mr' ? 'विकासकाम' : 'Civil Work'}</span>
                        </>
                      ) : (
                        <>
                          <IndianRupee className="w-3 h-3 mr-1" />
                          <span>{language === 'mr' ? 'वित्त अनुदान' : 'Finance Grant'}</span>
                        </>
                      )}
                    </span>

                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      {docCode}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      rec.status === 'completed' || rec.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : rec.status === 'ongoing'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                  >
                    {rec.status === 'completed' 
                      ? (language === 'mr' ? '✓ पूर्ण झाले' : 'COMPLETED')
                      : rec.status === 'approved'
                      ? (language === 'mr' ? '✓ मंजूर' : 'APPROVED')
                      : rec.status === 'ongoing'
                      ? (language === 'mr' ? '⏳ प्रगतीपथावर' : 'ONGOING')
                      : (language === 'mr' ? '📅 आगामी' : 'UPCOMING')}
                  </span>
                </div>

                {/* Card Main Body */}
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2 leading-snug">
                    {rec.title}
                  </h3>

                  <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    {rec.description}
                  </p>

                  {/* Project Details Pill Box */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                        {language === 'mr' ? 'नोंद दिनांक' : 'Record Date'}
                      </span>
                      <div className="flex items-center space-x-1 font-semibold text-slate-700 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(rec.date).toLocaleDateString([], {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                        {language === 'mr' ? 'मंजूर अंदाजपत्रक' : 'Sanctioned Amount'}
                      </span>
                      <div className="font-extrabold text-[#0D5C3A] mt-0.5">
                        {rec.amount ? `₹${rec.amount.toLocaleString()}` : (language === 'mr' ? 'प्रशासकीय मंजुरी' : 'Administrative')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Action Strip */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'mr' ? 'ग्रामसेवक स्वाक्षरी प्रमाणित' : 'Certified Record'}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePrint(rec)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 text-[11px] transition shadow-xs flex items-center space-x-1"
                      title="Print Official Order"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>{language === 'mr' ? 'प्रत काढा' : 'Print Order'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Printable Sarkari Resolution Modal (Triggered on Print) */}
      {selectedRecordForPrint && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-[99999]">
          <div className="border-4 border-double border-black p-6 space-y-4 max-w-2xl mx-auto">
            {/* National Emblem & Header */}
            <div className="text-center border-b-2 border-black pb-4 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider">महाराष्ट्र शासन | ग्रामविकास विभाग</div>
              <h1 className="text-xl font-black uppercase">ग्रामपंचायत कार्यालय, कोपरगाव</h1>
              <div className="text-xs font-semibold">तालुका: कोपरगाव, जिल्हा: अहिल्यानगर | पिनकोड: ४२३६०१ | LGD कोड: १७८४५०</div>
              <div className="inline-block border border-black px-4 py-1 text-xs font-bold uppercase mt-2">
                सार्वजनिक शासन निर्णय / ग्रामसभा ठराव अधिकृत प्रत
              </div>
            </div>

            {/* Document Meta */}
            <div className="flex justify-between text-xs font-semibold py-2 border-b border-black">
              <div>
                <span>दस्तऐवज संदर्भ क्र: </span>
                <span className="font-mono font-bold">GP-KOPARGAON/{selectedRecordForPrint.category.toUpperCase()}/2026</span>
              </div>
              <div>
                <span>दिनांक: </span>
                <span>{new Date(selectedRecordForPrint.date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 text-sm py-2">
              <div>
                <span className="font-bold text-xs uppercase block text-slate-700">विषय / कार्य शीर्षक:</span>
                <p className="font-bold text-base mt-1">{selectedRecordForPrint.title}</p>
              </div>

              <div>
                <span className="font-bold text-xs uppercase block text-slate-700">तपशीलवार ठराव व कार्य माहिती:</span>
                <p className="leading-relaxed mt-1 text-xs text-justify">{selectedRecordForPrint.description}</p>
              </div>

              {selectedRecordForPrint.amount && (
                <div className="bg-slate-100 p-2.5 border border-black text-xs">
                  <span className="font-bold">मंजूर आर्थिक तरतूद (१५ वा केंद्रीय वित्त आयोग / व्ही.पी.एफ.): </span>
                  <span className="font-black text-sm">₹{selectedRecordForPrint.amount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Official Stamp & Signatures */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs font-bold">
              <div>
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-700 text-red-700 flex items-center justify-center mx-auto text-[10px] uppercase font-black rotate-[-12deg] p-1">
                  ग्रामपंचायत कोपरगाव<br />सिक्का व मोहर<br />★ AHILYANAGAR ★
                </div>
                <div className="mt-2 text-slate-800">ग्रामसेवक / ग्रामविकास अधिकारी</div>
                <div className="text-[10px] text-slate-600 font-normal">ग्रामपंचायत कोपरगाव, ता. कोपरगाव</div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="text-slate-900 border-b border-black pb-1 mb-1 font-serif italic text-base">
                  श्रीमती सुमित्रा गायकवाड
                </div>
                <div className="text-slate-800">सरपंच</div>
                <div className="text-[10px] text-slate-600 font-normal">ग्रामपंचायत कोपरगाव, ता. कोपरगाव (जि. अहिल्यानगर)</div>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="border-t border-black pt-3 text-center text-[10px] text-slate-600">
              हे दस्तऐवज ग्रामसेतू डिजिटल पोर्टलवरून (Digital Panchayat MIS) अधिकृतरीत्या संकलित केले आहे.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
