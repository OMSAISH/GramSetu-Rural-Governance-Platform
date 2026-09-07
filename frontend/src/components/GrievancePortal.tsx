import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { 
  AlertCircle, Search, CheckCircle2, ShieldAlert, Copy, 
  Check, Send, Sparkles, Landmark, Mic, MicOff
} from 'lucide-react';

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

  // Voice speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    setVoiceError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        language === 'mr'
          ? 'तुमचा ब्राऊझर व्हॉईस इनपुटला सपोर्ट करत नाही. कृपया Google Chrome किंवा Microsoft Edge वापरा.'
          : language === 'hi'
          ? 'आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता है। कृपया Google Chrome या Edge का उपयोग करें।'
          : 'Voice input is not supported on this browser. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }

        const chunk = finalChunk || interimChunk;
        if (chunk) {
          setDescription((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${chunk}` : chunk;
          });
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError(
            language === 'mr'
              ? 'मायक्रोफोन परवानगी नाकारली आहे. कृपया ॲड्रेस बारमधील कुलूप (Lock) आयकॉनवर क्लिक करून Microphone ला "Allow" करा.'
              : language === 'hi'
              ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया एड्रेस बार में लॉक आइकन पर क्लिक करके Microphone को "Allow" करें।'
              : 'Microphone permission blocked. Please click the Lock icon in your browser address bar and set Microphone to "Allow".'
          );
        } else if (event.error === 'no-speech') {
          setVoiceError(
            language === 'mr'
              ? 'आवाज ऐकू आला नाही. कृपया पुन्हा माइक बटण दाबून स्पष्ट बोला.'
              : 'No speech detected. Please press the mic button again and speak clearly.'
          );
        } else if (event.error !== 'aborted') {
          setVoiceError(`Voice recognition: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setVoiceError(err.message || 'Could not start voice recognition');
    }
  };

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
    if (text.includes('water') || text.includes('pipe') || text.includes('pani') || text.includes('paani') || text.includes('नल') || text.includes('पाणी') || text.includes('गळती') || text.includes('जल')) {
      setPredictedCategory('water');
      setPredictedDept('ग्रामीण पाणी पुरवठा व स्वच्छता विभाग (Rural Water Supply Dept)');
      setPredictedSla(3);
    } else if (text.includes('light') || text.includes('electric') || text.includes('bijli') || text.includes('pole') || text.includes('वीज') || text.includes('लाईट') || text.includes('पथदिवे')) {
      setPredictedCategory('electricity');
      setPredictedDept('ग्रामपंचायत ऊर्जा कक्ष व महावितरण (MSEDCL Energy Cell)');
      setPredictedSla(4);
    } else if (text.includes('road') || text.includes('pothole') || text.includes('sadak') || text.includes('rasta') || text.includes('खड्डे') || text.includes('रस्ता') || text.includes('डामर')) {
      setPredictedCategory('road');
      setPredictedDept('सार्वजनिक बांधकाम विभाग - ग्रामीण रस्ते (PWD Rural Roads)');
      setPredictedSla(15);
    } else if (text.includes('sanitation') || text.includes('garbage') || text.includes('drain') || text.includes('kachra') || text.includes('कचरा') || text.includes('गटार') || text.includes('घाण')) {
      setPredictedCategory('sanitation');
      setPredictedDept('आरोग्य व स्वच्छता समिती (Gram Sanitation Committee)');
      setPredictedSla(7);
    } else if (text.includes('pension') || text.includes('widow') || text.includes('old age') || text.includes('पेन्शन') || text.includes('पेंशन') || text.includes('मानधन')) {
      setPredictedCategory('pension');
      setPredictedDept('समाजकल्याण व महिला-बाल विकास कक्ष (Social Welfare Cell)');
      setPredictedSla(15);
    } else {
      setPredictedCategory('other');
      setPredictedDept('ग्रामपंचायत विकास अधिकारी दफ्तर (PDO Office)');
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
      {/* Official Aaple Sarkar / CPGRAMS Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#133E87] to-[#0A2540] text-white rounded-xl p-5 sm:p-7 shadow-md border-l-4 border-amber-500">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Landmark className="w-4 h-4" />
          <span>आपले सरकार / CPGRAMS लोकशाही दिन प्रणाली</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black">{t.grievance.title}</h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
          {t.grievance.subtitle}
        </p>

        {/* Tab Toggle */}
        <div className="flex space-x-2 mt-5 bg-slate-900/60 p-1.5 rounded-xl max-w-md border border-slate-700">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'submit'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            {t.grievance.tabSubmit}
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'track'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            {t.grievance.tabTrack}
          </button>
        </div>
      </div>

      {/* Tab 1: Submit Grievance */}
      {activeTab === 'submit' && (
        <div className="bg-white rounded-xl p-5 sm:p-7 shadow-sm border border-slate-300 space-y-5">
          {/* Government Jurisdiction Header */}
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 flex flex-wrap items-center justify-between gap-2">
            <span>
              {language === 'mr'
                ? 'जिल्हा: अहिल्यानगर (अहमदनगर) | तालुका: कोपरगाव | ग्रामपंचायत: कोपरगाव ग्रामीण'
                : 'District: Ahilyanagar (Ahmednagar) | Taluka: Kopargaon | Gram Panchayat: Kopargaon Rural'}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-extrabold">
              SLA हमी कक्ष
            </span>
          </div>

          {submittedData ? (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {t.grievance.successTitle}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                आपली तक्रार अधिकृतपणे नोंदवून संबंधित विभागाकडे तात्काळ निवारणासाठी पाठवली आहे.
              </p>

              {/* Official Tracking ID Card */}
              <div className="max-w-xs mx-auto bg-white border-2 border-[#0A2540] p-4 rounded-xl shadow space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                  {t.grievance.trackingIdLabel}
                </span>
                <span className="text-2xl font-black text-[#0A2540] tracking-wider block font-mono">
                  {submittedData.tracking_id}
                </span>
                <button
                  onClick={() => copyToClipboard(submittedData.tracking_id)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition border"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
                  className="px-4 py-2 bg-[#0A2540] text-white text-xs font-bold rounded-lg shadow hover:bg-slate-800 transition"
                >
                  {t.grievance.tabTrack} Now
                </button>
                <button
                  onClick={() => setSubmittedData(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition"
                >
                  File Another Grievance
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitGrievance} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase">
                    {t.grievance.descLabel} <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full font-bold transition-all shadow-sm ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    }`}
                    title="बोलून तक्रार नोंदवा (Speak Grievance)"
                  >
                    {isListening ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>थांबवा (Listening...)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-amber-700" />
                        <span>बोलून नोंदवा (Speak)</span>
                      </>
                    )}
                  </button>
                </div>

                {voiceError && (
                  <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
                    <span>{voiceError}</span>
                    <button type="button" onClick={() => setVoiceError(null)} className="ml-2 text-red-500 hover:text-red-800 font-bold">✕</button>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.grievance.descPlaceholder}
                    className={`w-full p-3.5 bg-slate-50 border rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none font-medium leading-relaxed ${
                      isListening ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'
                    }`}
                    required
                  />
                  {isListening && (
                    <div className="absolute bottom-2.5 right-3 flex items-center space-x-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded-md text-[11px] text-red-700 font-semibold shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                      <span>मायक्रोफोन चालू आहे... (Listening)</span>
                    </div>
                  )}
                </div>

                {/* Quick 1-Click Presentation Demos */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 font-semibold">उदा. (Examples):</span>
                  {[
                    { label: '💧 पाणी गळती', text: language === 'mr' ? 'आमच्या गल्लीतील पाण्याची मुख्य पाईपलाईन फुटली असून २ दिवसांपासून पाणी वाया जात आहे.' : 'Water pipeline leakage on main street since 2 days.' },
                    { label: '💡 पथदिवे बंद', text: language === 'mr' ? 'गावच्या मंदिराजवळील पथदिवे गेल्या आठवड्यापासून बंद आहेत, रात्री अंधार असतो.' : 'Street lights near village temple are not working for a week.' },
                    { label: '🛣️ रस्त्यावरील खड्डे', text: language === 'mr' ? 'शाळेसमोरील मुख्य डांबरी रस्त्यावर मोठे खड्डे पडले असून अपघात होत आहेत.' : 'Large potholes on the main road in front of school.' },
                  ].map((demo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDescription(demo.text)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-md transition text-[11px]"
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Auto-Detection & SLA Guarantee Card */}
              {description.trim().length > 8 && (
                <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-900 font-bold uppercase text-[11px]">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>स्वयंचलित विभाग वाटप व SLA मुदत पूर्वपरीक्षण:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">तक्रार श्रेणी (Category)</span>
                      <span className="font-bold text-slate-900 capitalize">{predictedCategory}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">नियुक्त विभाग (Department)</span>
                      <span className="font-bold text-slate-900 line-clamp-1">{predictedDept}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">निवारण मुदत (SLA Limit)</span>
                      <span className="font-bold text-emerald-700">{predictedSla} {t.grievance.days} (हमी मुदत)</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full py-3 bg-[#0A2540] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold shadow transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <span>{t.grievance.submitting}</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-400" />
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
        <div className="bg-white rounded-xl p-5 sm:p-7 shadow-sm border border-slate-300 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                placeholder={t.grievance.trackInputPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none uppercase font-bold"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isTracking || !trackingIdInput.trim()}
              className="px-5 py-2.5 bg-[#0A2540] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition"
            >
              {isTracking ? 'तपासत आहे...' : t.grievance.trackBtn}
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
                      {t.grievance.slaBreachedBadge}: वरिष्ठ अधिकारी उच्चस्तरावर वर्ग
                    </span>
                    निश्चित SLA मुदत संपल्यामुळे ही तक्रार गट विकास अधिकारी (BDO) व तहसीलदार यांच्या विशेष नियंत्रण कक्षाकडे वर्ग करण्यात आली आहे.
                  </div>
                </div>
              )}

              {/* Grievance Details Card */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">नोंदणी क्र. (Tracking ID)</span>
                    <span className="text-base font-black text-[#0A2540] font-mono">{trackingResult.tracking_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">श्रेणी (Category)</span>
                    <span className="font-bold text-slate-800 capitalize">{trackingResult.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">SLA मुदत तारीख (Deadline)</span>
                    <span className="font-bold text-emerald-800">
                      {new Date(trackingResult.sla_deadline).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">तक्रारीचे मूळ वर्णन:</span>
                  <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 font-medium">
                    "{trackingResult.description}"
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-1">संबंधित विभाग:</span>
                  <p className="text-slate-900 font-bold">{trackingResult.department_assigned}</p>
                </div>

                {trackingResult.resolution_notes && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <span className="font-bold text-blue-900 block mb-1">{t.grievance.notes}</span>
                    <p className="text-blue-800">{trackingResult.resolution_notes}</p>
                  </div>
                )}
              </div>

              {/* Visual 4-Step SLA Progress Timeline with Official Stamps */}
              <div>
                <h4 className="font-bold text-xs text-slate-700 mb-4 uppercase tracking-wider">
                  तक्रार निवारण टप्पे (Official Resolution Milestones)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
                  {/* Step 1: Submitted */}
                  <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                      १
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
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      २
                    </div>
                    <span className="font-bold text-slate-900 block">{t.grievance.timeline.inProgress}</span>
                    <span className="text-[10px] text-slate-500">स्थळ पाहणी व कार्यवाही</span>
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
                        : (trackingResult.status === 'resolved' ? 'bg-emerald-700 text-white' : 'bg-slate-300 text-slate-600')
                    }`}>
                      ३
                    </div>
                    <span className="font-bold text-slate-900 block">
                      {trackingResult.status === 'escalated' ? t.grievance.timeline.escalated : 'मुदत अनुपालन'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {trackingResult.status === 'escalated' ? 'मुदत संपली' : 'वेळेत सुरू'}
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
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      ४
                    </div>
                    <span className="font-bold text-slate-900 block">{t.grievance.timeline.resolved}</span>
                    <span className="text-[10px] text-slate-500">
                      {trackingResult.resolved_at ? new Date(trackingResult.resolved_at).toLocaleDateString() : 'प्रक्रियाधीन'}
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
