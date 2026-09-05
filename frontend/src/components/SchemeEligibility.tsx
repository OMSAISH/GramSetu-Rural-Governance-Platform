import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  CheckCircle, XCircle, Sparkles, Printer, FileText, Landmark
} from 'lucide-react';

interface SchemeResultItem {
  scheme_id: number;
  scheme_name: string;
  department: string;
  is_eligible: boolean;
  reason: string;
  required_documents: string[];
  application_download_url: string;
}

export const SchemeEligibility: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, updateUser } = useAuth();

  // Profile Form state
  const [formData, setFormData] = useState({
    name: user?.name || 'Sunita Devi Shinde',
    phone_number: user?.phone_number || '9876543210',
    age: user?.age || 44,
    annual_income: user?.annual_income || 75000,
    category: user?.category || 'OBC',
    land_owned_acres: user?.land_owned_acres || 0.5,
    occupation: user?.occupation || 'widow',
    gender: user?.gender || 'female',
    has_disability: user?.has_disability || 'no',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SchemeResultItem[]>([]);
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Sync profile when user changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone_number: user.phone_number || prev.phone_number,
        age: user.age !== undefined ? user.age : prev.age,
        annual_income: user.annual_income !== undefined ? user.annual_income : prev.annual_income,
        category: user.category || prev.category,
        land_owned_acres: user.land_owned_acres !== undefined ? user.land_owned_acres : prev.land_owned_acres,
        occupation: user.occupation || prev.occupation,
        gender: user.gender || prev.gender,
        has_disability: user.has_disability || prev.has_disability,
      }));
    }
  }, [user]);

  // Immediately evaluate on mount and language change
  useEffect(() => {
    handleEvaluate();
  }, [language]);

  const handleEvaluate = async () => {
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        preferred_language: language,
      };
      const response = await api.checkEligibility(payload);
      setResults(response.results || []);
      setEligibleCount(response.eligible_count || 0);

      if (user) {
        updateUser(formData);
      }
    } catch (err) {
      console.error('Error evaluating scheme eligibility:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadApplication = (schemeId: number, schemeName: string) => {
    setDownloadingId(schemeId);

    // Try opening backend PDF endpoint; if not on backend, generate printable official application
    const targetScheme = results.find(s => s.scheme_id === schemeId);
    const docs = targetScheme?.required_documents || ["Aadhaar Card", "Income Certificate", "Bank Passbook"];

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Application Form - ${schemeName}</title>
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px double #0A2540; padding-bottom: 15px; margin-bottom: 25px; }
            .emblem-title { font-size: 14px; font-weight: bold; color: #475569; text-transform: uppercase; }
            .main-title { font-size: 22px; font-weight: 900; color: #0A2540; margin: 6px 0; }
            .sub-title { font-size: 12px; color: #64748b; font-weight: bold; }
            .badge-box { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: bold; background: #0A2540; color: white; padding: 6px 12px; margin-top: 20px; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; width: 28%; font-weight: bold; }
            .doc-list { list-style-type: square; padding-left: 20px; font-size: 12px; }
            .declaration { font-size: 11px; font-style: italic; color: #475569; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            .sign-table { width: 100%; margin-top: 40px; border: none; }
            .sign-table td { border: none; padding-top: 40px; text-align: center; font-size: 12px; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background: #0A2540; color: white; padding: 8px 16px; border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">🖨️ Print / Save as PDF</button>
          </div>
          <div class="header">
            <div class="emblem-title">भारत सरकार | GOVERNMENT OF MAHARASHTRA | ग्रामपंचायत प्रशासन</div>
            <div class="main-title">कल्याणकारी योजना अधिकृत अर्ज नमुना (FORM NO. 1)</div>
            <div class="sub-title">Scheme: ${schemeName} | Gram Panchayat: Shivajinagar (MH-27042)</div>
          </div>
          <div class="badge-box">
            <div><b>Application Ref ID:</b> GS-APP-${schemeId}-2026-${Math.floor(10000 + Math.random() * 90000)}</div>
            <div><b>Verification Date:</b> ${new Date().toLocaleDateString()}</div>
            <div><b>Status:</b> PRE-QUALIFIED (VERIFIED)</div>
          </div>
          <div class="section-title">१. अर्जदाराचा वैयक्तिक व सामाजिक तपशील (Applicant Profile Details)</div>
          <table>
            <tr><th>पूर्ण नाव (Full Legal Name)</th><td>${formData.name}</td><th>मोबाईल क्र. (Phone)</th><td>${formData.phone_number}</td></tr>
            <tr><th>वय / लिंग (Age & Gender)</th><td>${formData.age} वर्षे / ${formData.gender}</td><th>जात प्रवर्ग (Social Category)</th><td>${formData.category.toUpperCase()}</td></tr>
            <tr><th>वार्षिक उत्पन्न (Annual Income)</th><td>₹${Number(formData.annual_income).toLocaleString()}</td><th>मुख्य व्यवसाय (Occupation)</th><td>${formData.occupation}</td></tr>
            <tr><th>शेती जमीन (Agricultural Land)</th><td>${formData.land_owned_acres} एकर</td><th>दिव्यांग व्यक्ती (Divyang)</th><td>${formData.has_disability === 'yes' ? 'होय (Yes)' : 'नाही (No)'}</td></tr>
          </table>
          <div class="section-title">२. जोडलेली आवश्यक कागदपत्रे (Mandatory Supporting Documents Checklist)</div>
          <ul class="doc-list">
            ${docs.map(d => `<li>[ ✓ ] ${d} (मूळ प्रत व २ साक्षांकित छायाप्रती जोडल्या आहेत)</li>`).join('')}
          </ul>
          <div class="declaration">
            <b>हमीपत्र (Undertaking):</b> मी याद्वारे घोषित करतो/करते की वर दिलेली सर्व माहिती माझ्या व्यक्तिगत माहितीनुसार सत्य व अचूक आहे. यामध्ये कोणतीही असत्य माहिती आढळल्यास माझी निवड रद्द करण्याचे अधिकार प्रशासनास असतील.
          </div>
          <table class="sign-table">
            <tr>
              <td>_______________________________<br/>अर्जदाराची स्वाक्षरी / अंगठ्याचा ठसा<br/>(Applicant Signature / Thumb)</td>
              <td>_______________________________<br/>ग्रामसेवक / सरपंच स्वाक्षरी व शिक्का<br/>(Gram Sevak / Official Seal)</td>
            </tr>
          </table>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    setDownloadingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Official Government Portal Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#133E87] to-[#0A2540] text-white rounded-xl p-5 sm:p-7 shadow-md border-l-4 border-amber-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Landmark className="w-4 h-4" />
              <span>कल्याणकारी योजना व थेट लाभ हस्तांतरण कक्ष (DBT Entitlement Portal)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {t.schemes.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              {t.schemes.subtitle}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-xl flex items-center space-x-3 self-start md:self-auto">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow">
              {eligibleCount}
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase block">
                पात्र शासकीय योजना
              </span>
              <span className="text-xs font-black text-white">
                {eligibleCount} / {results.length || 5} योजनांसाठी पात्र
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Sarkari Application Form (प्रपत्र क्र. १) */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          {/* Government Form Header */}
          <div className="bg-slate-100 border-b border-slate-300 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#0A2540]" />
              <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                प्रपत्र क्र. १ : नागरिक कौटुंबिक तपशील
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border">
              SEC-2026
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[11px] text-slate-600 mb-4 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              📌 {t.schemes.profileNotice}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEvaluate();
              }}
              className="space-y-3.5 text-xs font-semibold text-slate-700"
            >
              <div>
                <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                  १.१ {t.auth.nameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                    १.२ {t.schemes.age} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="110"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                    १.३ {t.schemes.gender}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                  >
                    <option value="female">महिला (Female)</option>
                    <option value="male">पुरुष (Male)</option>
                    <option value="other">इतर</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                  १.४ {t.schemes.annualIncome} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1000"
                    value={formData.annual_income}
                    onChange={(e) => setFormData({ ...formData, annual_income: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                  १.५ {t.schemes.category} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                >
                  <option value="general">खुला प्रवर्ग (General)</option>
                  <option value="OBC">इतर मागासवर्ग (OBC)</option>
                  <option value="SC">अनुसूचित जाती (SC)</option>
                  <option value="ST">अनुसूचित जमाती (ST)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                  १.६ {t.schemes.occupation} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                >
                  <option value="farmer">शेतकरी / अल्पभूधारक (Farmer)</option>
                  <option value="daily_wage">दैनिक शेतमजूर (Agricultural Laborer)</option>
                  <option value="widow">विधवा महिला (Widow)</option>
                  <option value="student">विद्यार्थी (Student)</option>
                  <option value="artisan">ग्रामीण कारागीर (Rural Artisan)</option>
                  <option value="unemployed">बेरोजगार (Unemployed)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                    १.७ {t.schemes.landAcres}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.land_owned_acres}
                    onChange={(e) => setFormData({ ...formData, land_owned_acres: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-bold uppercase text-slate-600">
                    १.८ {t.schemes.disability}
                  </label>
                  <select
                    value={formData.has_disability}
                    onChange={(e) => setFormData({ ...formData, has_disability: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium"
                  >
                    <option value="no">नाही (No)</option>
                    <option value="yes">होय (Yes)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 bg-[#0A2540] hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isLoading ? t.schemes.checking : t.schemes.checkButton}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Evaluated Welfare Schemes Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Government Official Status Strip */}
          <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0A2540]">
                  शासकीय निकष पडताळणी निकाल (Official Verification Summary)
                </h3>
                <p className="text-xs text-emerald-800 font-semibold">
                  {t.schemes.eligibleNotice.replace('{count}', String(eligibleCount))}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 self-start sm:self-auto">
              GP-VERIFIED-2026
            </div>
          </div>

          {/* Scheme Cards */}
          <div className="space-y-4">
            {results.map((scheme) => (
              <div
                key={scheme.scheme_id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  scheme.is_eligible
                    ? 'bg-white border-emerald-400 shadow-sm'
                    : 'bg-slate-50 border-slate-300 opacity-85'
                }`}
              >
                {/* Top Status Bar of Card */}
                <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b ${
                  scheme.is_eligible 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase inline-flex items-center space-x-1 ${
                      scheme.is_eligible
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-400 text-white'
                    }`}>
                      {scheme.is_eligible ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      <span>{scheme.is_eligible ? t.schemes.statusEligible : t.schemes.statusNotEligible}</span>
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {scheme.department}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    ID: SCH-0{scheme.scheme_id}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-extrabold text-[#0A2540]">
                      {scheme.scheme_name}
                    </h3>

                    {/* Pre-filled PDF / Print Application Action */}
                    {scheme.is_eligible && (
                      <button
                        onClick={() => handleDownloadApplication(scheme.scheme_id, scheme.scheme_name)}
                        disabled={downloadingId === scheme.scheme_id}
                        className="px-4 py-2 bg-[#0A2540] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition flex items-center space-x-1.5 shrink-0 self-start"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>{t.schemes.downloadPdf}</span>
                      </button>
                    )}
                  </div>

                  {/* Plain Language Rule Explanation */}
                  <div className="bg-slate-50 border-l-4 border-emerald-600 p-3 rounded-r-lg mb-3 text-xs">
                    <span className="font-bold text-slate-800 block mb-0.5">
                      {t.schemes.qualificationReason}
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {scheme.reason}
                    </p>
                  </div>

                  {/* Required Documents Checklist */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-800 block mb-2 uppercase tracking-wide">
                      {t.schemes.requiredDocs}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {scheme.required_documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded border border-slate-200 flex items-center space-x-2 text-slate-700"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            ✓
                          </span>
                          <span className="line-clamp-1">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
