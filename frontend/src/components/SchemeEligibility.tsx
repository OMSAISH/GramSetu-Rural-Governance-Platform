import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CheckCircle, XCircle, Download, FileCheck, UserCheck, Sparkles } from 'lucide-react';

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
  const [results, setResults] = useState<SchemeResultItem[] | null>(null);
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

  // Initial evaluation if profile exists
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
      setResults(response.results);
      setEligibleCount(response.eligible_count);

      // Save to local profile context
      if (user) {
        updateUser(formData);
      }
    } catch (err) {
      console.error('Error evaluating scheme eligibility:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async (schemeId: number, schemeName: string) => {
    setDownloadingId(schemeId);
    try {
      const url = api.getSchemeApplicationPdfUrl(schemeId, {
        name: formData.name,
        phone: formData.phone_number,
        age: formData.age,
        annual_income: formData.annual_income,
        category: formData.category,
        occupation: formData.occupation,
      });

      // Trigger browser direct download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Application_${schemeName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to download PDF application.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <FileCheck className="w-8 h-8 text-emerald-300" />
          <h1 className="text-xl sm:text-2xl font-black">{t.schemes.title}</h1>
        </div>
        <p className="text-emerald-100 text-sm sm:text-base max-w-3xl">
          {t.schemes.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Citizen Socioeconomic Profile Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-3">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="font-bold text-slate-900 text-base">
              {t.schemes.profileHeading}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            {t.schemes.profileNotice}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEvaluate();
            }}
            className="space-y-4 text-xs font-medium"
          >
            <div>
              <label className="block text-slate-700 mb-1">{t.auth.nameLabel}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">{t.schemes.age}</label>
              <input
                type="number"
                min="10"
                max="110"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">{t.schemes.annualIncome}</label>
              <input
                type="number"
                step="1000"
                value={formData.annual_income}
                onChange={(e) => setFormData({ ...formData, annual_income: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">{t.schemes.category}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none bg-white"
              >
                <option value="general">General</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">{t.schemes.occupation}</label>
              <select
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none bg-white"
              >
                <option value="farmer">Farmer (शेतकरी / किसान)</option>
                <option value="daily_wage">Daily Wage Laborer (मजूर / दैनिक वेतनभोगी)</option>
                <option value="widow">Widow (विधवा)</option>
                <option value="student">Student (विद्यार्थी / छात्र)</option>
                <option value="artisan">Artisan / Small Business (कारागीर / कारीगर)</option>
                <option value="unemployed">Unemployed (बेरोजगार)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1">{t.schemes.landAcres}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.land_owned_acres}
                  onChange={(e) => setFormData({ ...formData, land_owned_acres: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">{t.schemes.gender}</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none bg-white"
                >
                  <option value="female">Female (महिला)</option>
                  <option value="male">Male (पुरुष)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">{t.schemes.disability}</label>
              <select
                value={formData.has_disability}
                onChange={(e) => setFormData({ ...formData, has_disability: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none bg-white"
              >
                <option value="no">No (नाही / नहीं)</option>
                <option value="yes">Yes (होय / हाँ)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>{t.schemes.checking}</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{t.schemes.checkButton}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Evaluated Welfare Schemes Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Summary Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {eligibleCount}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {t.schemes.resultsTitle}
                </h3>
                <p className="text-xs text-emerald-800">
                  {t.schemes.eligibleNotice.replace('{count}', String(eligibleCount))}
                </p>
              </div>
            </div>
          </div>

          {/* Scheme Cards */}
          {results && results.length > 0 ? (
            <div className="space-y-4">
              {results.map((scheme) => (
                <div
                  key={scheme.scheme_id}
                  className={`p-5 rounded-2xl border transition-all ${
                    scheme.is_eligible
                      ? 'bg-white border-emerald-300 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center ${
                            scheme.is_eligible
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {scheme.is_eligible ? (
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                          )}
                          {scheme.is_eligible ? t.schemes.statusEligible : t.schemes.statusNotEligible}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {scheme.department}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {scheme.scheme_name}
                      </h3>
                    </div>

                    {/* Pre-filled PDF Download Action */}
                    {scheme.is_eligible && (
                      <button
                        onClick={() => handleDownloadPdf(scheme.scheme_id, scheme.scheme_name)}
                        disabled={downloadingId === scheme.scheme_id}
                        className="self-start px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          {downloadingId === scheme.scheme_id
                            ? t.schemes.generatingPdf
                            : t.schemes.downloadPdf}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Plain Language Rule Explanation */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-1">
                      {t.schemes.qualificationReason}
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {scheme.reason}
                    </p>
                  </div>

                  {/* Required Documents Checklist */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">
                      {t.schemes.requiredDocs}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scheme.required_documents.map((doc, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading schemes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
