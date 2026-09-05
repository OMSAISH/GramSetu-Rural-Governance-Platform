import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { AlertCircle, Search, CheckCircle2, ShieldAlert, Copy, Check, Send, Sparkles } from 'lucide-react';

interface GrievancePortalProps {
  initialTrackingId?: string;
}

export const GrievancePortal: React.FC<GrievancePortalProps> = ({ initialTrackingId }) => {
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'submit' | 'track'>(initialTrackingId ? 'track' : 'submit');
  
  // Submit form state
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Live category prediction
  const [predictedCategory, setPredictedCategory] = useState<string>('other');
  const [predictedDept, setPredictedDept] = useState<string>('Panchayat Development Office (PDO)');
  const [predictedSla, setPredictedSla] = useState<number>(10);

  // Track state
  const [trackingIdInput, setTrackingIdInput] = useState(initialTrackingId || '');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Quick category live preview from description
  useEffect(() => {
    const text = description.toLowerCase();
    if (text.includes('water') || text.includes('pipe') || text.includes('pani') || text.includes('paani') || text.includes('नल') || text.includes('पाणी') || text.includes('गळती')) {
      setPredictedCategory('water');
      setPredictedDept('Rural Water Supply & Sanitation Department');
      setPredictedSla(3);
    } else if (text.includes('light') || text.includes('electric') || text.includes('bijli') || text.includes('pole') || text.includes('वीज') || text.includes('लाईट') || text.includes('पथदिवे')) {
      setPredictedCategory('electricity');
      setPredictedDept('Gram Panchayat Energy Cell (MSEDCL/Discom)');
      setPredictedSla(4);
    } else if (text.includes('road') || text.includes('pothole') || text.includes('sadak') || text.includes('rasta') || text.includes('खड्डे') || text.includes('रस्ता')) {
      setPredictedCategory('road');
      setPredictedDept('Public Works Department (PWD Rural Roads)');
      setPredictedSla(15);
    } else if (text.includes('sanitation') || text.includes('garbage') || text.includes('drain') || text.includes('kachra') || text.includes('कचरा') || text.includes('गटार') || text.includes('घाण')) {
      setPredictedCategory('sanitation');
      setPredictedDept('Health & Rural Sanitation Committee');
      setPredictedSla(7);
    } else if (text.includes('pension') || text.includes('widow') || text.includes('old age') || text.includes('पेन्शन') || text.includes('पेंशन') || text.includes('मानधन')) {
      setPredictedCategory('pension');
      setPredictedDept('Social Welfare & Women/Child Development Cell');
      setPredictedSla(15);
    } else {
      setPredictedCategory('other');
      setPredictedDept('Panchayat Development Office (PDO)');
      setPredictedSla(10);
    }
  }, [description]);

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingIdInput(initialTrackingId);
      setActiveTab('track');
      handleTrack(initialTrackingId);
    }
  }, [initialTrackingId]);

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.submitGrievance({
        description,
        language,
        category: predictedCategory !== 'other' ? predictedCategory : undefined
      });
      setSubmittedData(res);
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrack = async (customId?: string) => {
    const idToSearch = (customId || trackingIdInput).trim();
    if (!idToSearch || isTracking) return;

    setIsTracking(true);
    setTrackingError(null);
    try {
      const res = await api.trackGrievance(idToSearch);
      setTrackingResult(res);
    } catch (err: any) {
      setTrackingError(err.message || 'Tracking ID not found');
      setTrackingResult(null);
    } finally {
      setIsTracking(false);
    }
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <AlertCircle className="w-8 h-8 text-teal-300" />
          <h1 className="text-xl sm:text-2xl font-black">{t.grievance.title}</h1>
        </div>
        <p className="text-teal-100 text-sm sm:text-base max-w-2xl">
          {t.grievance.subtitle}
        </p>

        {/* Tab Toggle */}
        <div className="flex space-x-2 mt-6 bg-teal-950/50 p-1.5 rounded-xl max-w-md">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'submit'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            {t.grievance.tabSubmit}
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'track'
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            {t.grievance.tabTrack}
          </button>
        </div>
      </div>

      {/* Tab 1: Submit Grievance */}
      {activeTab === 'submit' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          {submittedData ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t.grievance.successTitle}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your grievance has been auto-classified and routed with guaranteed SLA turnaround.
              </p>

              {/* Tracking ID Badge */}
              <div className="max-w-xs mx-auto bg-white border-2 border-emerald-600 p-4 rounded-xl shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {t.grievance.trackingIdLabel}
                </span>
                <span className="text-2xl font-black text-emerald-900 tracking-wider block font-mono">
                  {submittedData.tracking_id}
                </span>
                <button
                  onClick={() => copyToClipboard(submittedData.tracking_id)}
                  className="w-full py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.grievance.copied : t.grievance.copyId}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setTrackingIdInput(submittedData.tracking_id);
                    setActiveTab('track');
                    handleTrack(submittedData.tracking_id);
                  }}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow hover:bg-emerald-800 transition"
                >
                  {t.grievance.tabTrack} Now
                </button>
                <button
                  onClick={() => setSubmittedData(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300 transition"
                >
                  File Another Grievance
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitGrievance} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.grievance.descLabel}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.grievance.descPlaceholder}
                  className="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none"
                  required
                />
              </div>

              {/* Dynamic Auto-Detection Card */}
              {description.trim().length > 10 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Routing Intelligence & SLA Preview:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                      <span className="font-bold text-slate-800 capitalize">{predictedCategory}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Department</span>
                      <span className="font-bold text-slate-800">{predictedDept}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">SLA Target</span>
                      <span className="font-bold text-emerald-700">{predictedSla} {t.grievance.days} resolution</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-2 text-sm"
              >
                {isSubmitting ? (
                  <span>{t.grievance.submitting}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.grievance.submitBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Track Grievance */}
      {activeTab === 'track' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                placeholder={t.grievance.trackInputPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none uppercase"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isTracking || !trackingIdInput.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
            >
              {isTracking ? 'Searching...' : t.grievance.trackBtn}
            </button>
          </form>

          {trackingError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{trackingError}</span>
            </div>
          )}

          {trackingResult && (
            <div className="space-y-6 pt-2">
              {/* Alert if SLA breached */}
              {trackingResult.is_sla_breached && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl flex items-start space-x-3 text-red-800 text-xs">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-900 block mb-0.5">
                      {t.grievance.slaBreachedBadge}: Priority Escalation Active
                    </span>
                    This grievance has passed its designated SLA deadline and has been auto-escalated to the Block Development Officer (BDO) & Sarpanch for expedited resolution.
                  </div>
                </div>
              )}

              {/* Grievance Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tracking ID</span>
                    <span className="text-base font-black text-slate-900 font-mono">{trackingResult.tracking_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                    <span className="font-bold text-slate-800 capitalize">{trackingResult.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">SLA Target Date</span>
                    <span className="font-bold text-emerald-800">
                      {new Date(trackingResult.sla_deadline).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">Original Grievance Statement:</span>
                  <p className="text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
                    "{trackingResult.description}"
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">Assigned Department:</span>
                  <p className="text-slate-800 font-semibold">{trackingResult.department_assigned}</p>
                </div>

                {trackingResult.resolution_notes && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <span className="font-bold text-blue-900 block mb-1">{t.grievance.notes}</span>
                    <p className="text-blue-800">{trackingResult.resolution_notes}</p>
                  </div>
                )}
              </div>

              {/* Visual 4-Step SLA Progress Timeline */}
              <div>
                <h4 className="font-bold text-xs text-slate-700 mb-4 uppercase tracking-wider">
                  Live Resolution Timeline
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
                  {/* Step 1: Submitted */}
                  <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                      1
                    </div>
                    <span className="font-bold text-slate-900 block">{t.grievance.timeline.submitted}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(trackingResult.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Step 2: In Progress */}
                  <div className={`p-3 rounded-xl border ${
                    ['in_progress', 'escalated', 'resolved'].includes(trackingResult.status)
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xs ${
                      ['in_progress', 'escalated', 'resolved'].includes(trackingResult.status)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      2
                    </div>
                    <span className="font-bold text-slate-900 block">{t.grievance.timeline.inProgress}</span>
                    <span className="text-[10px] text-slate-500">Inspection & Action</span>
                  </div>

                  {/* Step 3: SLA Status / Escalation */}
                  <div className={`p-3 rounded-xl border ${
                    trackingResult.status === 'escalated'
                      ? 'bg-red-50 border-red-300'
                      : (trackingResult.status === 'resolved' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60')
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xs ${
                      trackingResult.status === 'escalated'
                        ? 'bg-red-600 text-white animate-pulse'
                        : (trackingResult.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600')
                    }`}>
                      3
                    </div>
                    <span className="font-bold text-slate-900 block">
                      {trackingResult.status === 'escalated' ? t.grievance.timeline.escalated : 'SLA Compliance'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {trackingResult.status === 'escalated' ? 'Overdue' : 'Within Target'}
                    </span>
                  </div>

                  {/* Step 4: Resolved */}
                  <div className={`p-3 rounded-xl border ${
                    trackingResult.status === 'resolved'
                      ? 'bg-emerald-100 border-emerald-400'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xs ${
                      trackingResult.status === 'resolved'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      4
                    </div>
                    <span className="font-bold text-slate-900 block">{t.grievance.timeline.resolved}</span>
                    <span className="text-[10px] text-slate-500">
                      {trackingResult.resolved_at ? new Date(trackingResult.resolved_at).toLocaleDateString() : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
