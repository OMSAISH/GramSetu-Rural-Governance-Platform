import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Send, Mic, MicOff, Bot, User, Sparkles, ArrowRight, Volume2, VolumeX, AlertCircle, Radio } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: string;
  suggestedActions?: string[];
  metadata?: any;
}

interface CitizenChatProps {
  onNavigateTab: (tab: string, contextData?: any) => void;
}

export const CitizenChat: React.FC<CitizenChatProps> = ({ onNavigateTab }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Pre-load and cache system voices for zero-latency Indian & Marathi TTS
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setSystemVoices(v);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Initialize welcoming message whenever language changes
  useEffect(() => {
    let initialGreeting = "";
    if (language === 'hi') {
      initialGreeting = "नमस्ते! मैं ग्रामसेतु हूँ, आपका ग्राम पंचायत डिजिटल सहायक।\n\nआप मुझसे सरकारी योजनाओं (आवास, पेंशन, मनरेगा), ग्राम पंचायत की बैठकों और विकास कार्यों के बारे में पूछ सकते हैं, या गांव की किसी भी समस्या की शिकायत दर्ज कर सकते हैं।";
    } else if (language === 'mr') {
      initialGreeting = "नमस्ते! मी ग्रामसेतू आहे, तुमचा अधिकृत ग्रामपंचायत डिजिटल सहाय्यक.\n\nतुम्ही मला शासकीय योजना (घरकुल, पेन्शन, मनरेगा, शिष्यवृत्ती), ग्रामसभा बैठका आणि विकासकामांबद्दल विचारू शकता, किंवा पाणी, रस्ते व वीज यांसारख्या समस्यांची थेट तक्रार नोंदवू शकता.";
    } else {
      initialGreeting = "Namaste! I am GramSetu, your official Gram Panchayat digital governance assistant.\n\nYou can ask about welfare schemes (PMAY-G, pensions, MGNREGA, scholarships), Gram Sabha meetings, ongoing development works, or lodge complaints regarding village infrastructure.";
    }

    setMessages([
      {
        id: 'init-1',
        sender: 'assistant',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'general',
        suggestedActions: [
          t.chat.promptScheme,
          t.chat.promptWater,
          t.chat.promptMeeting,
        ]
      }
    ]);
  }, [language]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-To-Speech (Speak Aloud with Native Indian & Marathi Devanagari Support)
  const speakMessage = (text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMsgId(msgId || 'general');

    // Clean text: strip markdown symbols, URLs, and non-printable noise
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[•-]\s+/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.92;

    const voices = systemVoices.length > 0 ? systemVoices : window.speechSynthesis.getVoices();
    let matchVoice: SpeechSynthesisVoice | undefined;

    if (language === 'mr') {
      // 1. Direct Marathi voice (e.g., 'Google मराठी' on Android/ChromeOS)
      matchVoice = voices.find(v => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l.startsWith('mr') || n.includes('marathi');
      });

      // 2. If no Marathi voice on device (typical on macOS and Windows), use native Devanagari Hindi voice
      // ('Lekha' on macOS, 'Google हिन्दी' on Chrome, 'Microsoft Hemant / Kalpana' on Windows).
      // Because Marathi and Hindi share the same Devanagari script, this reads Marathi with authentic Indian pronunciation instead of English!
      if (!matchVoice) {
        matchVoice = voices.find(v => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.startsWith('hi') || n.includes('hindi') || n.includes('lekha') || n.includes('kalpana') || n.includes('hemant');
        });
      }

      // 3. Fallback to Indian English voice
      if (!matchVoice) {
        matchVoice = voices.find(v => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.includes('in') || n.includes('india') || n.includes('rishi');
        });
      }
    } else if (language === 'hi') {
      matchVoice = voices.find(v => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l.startsWith('hi') || n.includes('hindi') || n.includes('lekha') || n.includes('kalpana') || n.includes('hemant');
      }) || voices.find(v => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l.startsWith('mr') || l.includes('in') || n.includes('india');
      });
    } else {
      matchVoice = voices.find(v => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l.startsWith('en-in') || n.includes('rishi') || n.includes('india');
      }) || voices.find(v => v.lang.toLowerCase().startsWith('en'));
    }

    if (matchVoice) {
      utterance.voice = matchVoice;
      // CRITICAL: Set utterance.lang to matchVoice.lang so browser engine never rejects the voice
      utterance.lang = matchVoice.lang;
    } else {
      utterance.lang = language === 'mr' ? 'mr-IN' : (language === 'hi' ? 'hi-IN' : 'en-IN');
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setVoiceFeedback('');
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(message, language, user?.id);
      const newBotId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: newBotId,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent_detected,
        suggestedActions: response.suggested_actions,
        metadata: response.metadata
      };
      setMessages((prev) => [...prev, botMsg]);

      // If autoSpeak is enabled, read the answer aloud
      if (autoSpeak) {
        speakMessage(response.reply, newBotId);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: language === 'mr' 
          ? "माहिती मिळवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा."
          : "Could not reach assistant. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 1-click Presentation Voice Simulation (Guaranteed to work even if Wi-Fi / Google Speech API is blocked)
  const handleVoiceQueryClick = (queryText: string) => {
    setIsListening(true);
    setVoiceError(null);
    setVoiceFeedback(queryText);
    setInputText(queryText);

    setTimeout(() => {
      setIsListening(false);
      setVoiceFeedback('');
      handleSendMessage(queryText);
    }, 600);
  };

  // Robust Speech Recognition strictly locked to chosen language
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        language === 'mr' 
          ? "तुमच्या ब्राऊझरमध्ये व्हॉइस इनपुट समर्थित नाही. कृपया Google Chrome वापरा."
          : "Voice recognition is not supported in this browser. Please use Google Chrome or Edge."
      );
      return;
    }

    // If currently listening, stop it
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setVoiceFeedback('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      // CRITICAL: Strictly lock recognition language to selected language. NEVER fall back to navigator.language (English)!
      recognition.lang = language === 'mr' ? 'mr-IN' : (language === 'hi' ? 'hi-IN' : 'en-IN');

      // interimResults = false avoids the fragile WebSocket streaming that causes event.error = 'network'
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        setVoiceFeedback(
          language === 'mr' 
            ? "ऐकत आहे... कृपया मराठीत बोला" 
            : (language === 'hi' ? "सुन रहे हैं... कृपया हिंदी में बोलें" : "Listening... Please speak clearly")
        );
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          setInputText(transcript);
          setVoiceFeedback(transcript);
          setIsListening(false);
          handleSendMessage(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceFeedback('');

        // Detect if Brave browser is blocking Google Speech Services
        const isBrave = Boolean((navigator as any).brave);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError(
            language === 'mr'
              ? "मायक्रोफोन परवानगी नाकारली आहे. कृपया ब्राऊझर ॲड्रेस बारमधील कुलूप (Lock) आयकॉनवर क्लिक करून 'Allow' करा."
              : "Microphone access blocked. Click the Lock 🔒 icon in the address bar to Allow microphone."
          );
        } else if (event.error === 'no-speech') {
          setVoiceError(
            language === 'mr'
              ? "कोणताही आवाज ऐकू आला नाही. कृपया पुन्हा माईक दाबा किंवा खालील नमुना प्रश्न वापरा."
              : "No speech detected. Please press the mic again or use sample voice queries."
          );
        } else if (event.error === 'network') {
          if (isBrave) {
            setVoiceError(
              language === 'mr'
                ? "Brave ब्राऊझर Google Voice ब्लॉक करतो. कृपया URL बारमधील 🦁 Lion Shield बंद (Turn OFF) करा किंवा Google Chrome वापरा."
                : "Brave Browser blocks Google Speech API. Please turn Shields DOWN (🦁 icon) or use Google Chrome."
            );
          } else {
            setVoiceError(
              language === 'mr'
                ? "Google Speech नेटवर्क सेवा या Wi-Fi वर ब्लॉक आहे. काळजी करू नका, खालील १-क्लिक मराठी प्रश्न वापरा (मराठीत ऑडिओ उत्तर ऐकू येईल!):"
                : "Google Speech service blocked on this network. Don't worry, click any 1-tap voice query below to hear the audio reply:"
            );
          }
        } else {
          setVoiceError(`Voice recognition: ${event.error}. Use sample queries below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceFeedback('');
      };

      recognition.start();
    } catch (err: any) {
      console.error("SpeechRecognition error:", err);
      setIsListening(false);
      setVoiceError(language === 'mr' ? "मायक्रोफोन सुरू करता आला नाही." : "Could not start microphone.");
    }
  };

  const handleActionClick = (action: string, msgMetadata?: any) => {
    const actLower = action.toLowerCase();
    if (actLower.includes('scheme') || actLower.includes('योजना') || actLower.includes('eligibility') || actLower.includes('पात्रता')) {
      onNavigateTab('schemes');
    } else if (actLower.includes('track') || actLower.includes('ट्रॅक') || actLower.includes('तक्रार') || actLower.includes('grievance') || actLower.includes('शिकायत')) {
      onNavigateTab('grievances', msgMetadata?.tracking_id ? { trackingId: msgMetadata.tracking_id } : undefined);
    } else if (actLower.includes('meeting') || actLower.includes('सभा') || actLower.includes('बैठक') || actLower.includes('governance') || actLower.includes('work') || actLower.includes('काम')) {
      onNavigateTab('governance');
    } else {
      handleSendMessage(action);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-13rem)] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
      {/* Official Government Assistant Header */}
      <div className="bg-[#0A2540] text-white px-5 py-3 flex items-center justify-between border-b-2 border-amber-500">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white">
                {t.chat.title}
              </h2>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300">
              ई-ग्रामपंचायत बहुभाषिक नागरिक सहाय्यता कक्ष
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          {/* Auto-Speak / Voice Output Toggle */}
          <button
            onClick={() => {
              const next = !autoSpeak;
              setAutoSpeak(next);
              if (!next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center space-x-1.5 transition border ${
              autoSpeak 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={autoSpeak ? "Voice answer read aloud is ON" : "Turn ON voice answer read aloud"}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {autoSpeak 
                ? (language === 'mr' ? 'आवाज सुरू' : (language === 'hi' ? 'आवाज चालू' : 'Voice ON'))
                : (language === 'mr' ? 'आवाज बंद' : (language === 'hi' ? 'आवाज बंद' : 'Voice OFF'))}
            </span>
          </button>

          {/* Interactive Chat Language Switcher */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700">
            {(['mr', 'hi', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  language === l
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={`Switch language to ${l === 'mr' ? 'मराठी' : (l === 'hi' ? 'हिंदी' : 'English')}`}
              >
                {l === 'mr' ? 'मराठी' : (l === 'hi' ? 'हिंदी' : 'EN')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/80">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`flex items-start max-w-[90%] sm:max-w-[82%] space-x-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-[#133E87] text-white'
                    : 'bg-[#0A2540] text-amber-400 border border-amber-500'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`rounded-xl px-4 py-3 shadow-sm text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#0A2540] text-white rounded-tr-none font-medium'
                    : 'bg-white text-slate-800 border border-slate-300 rounded-tl-none font-medium'
                }`}
              >
                {msg.sender === 'assistant' && msg.intent && msg.intent !== 'general' && (
                  <div className="mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
                      {msg.intent === 'scheme_check' ? 'शासकीय योजना (Welfare Scheme)' : (msg.intent === 'grievance' ? 'तक्रार निवारण (Grievance Redressal)' : 'ग्रामपंचायत दफ्तर (Governance Record)')}
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-line">
                  {msg.text}
                </div>

                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(action, msg.metadata)}
                        className="text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-400 text-slate-700 px-2.5 py-1 rounded-md border border-slate-300 transition flex items-center font-bold"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-3 h-3 ml-1 text-amber-600" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Message Footer: Listen Aloud Button & Timestamp */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                  {msg.sender === 'assistant' ? (
                    <button
                      type="button"
                      onClick={() => speakMessage(msg.text, msg.id)}
                      className="text-[10px] text-slate-500 hover:text-[#0A2540] flex items-center space-x-1 font-bold transition px-1.5 py-0.5 rounded hover:bg-slate-100"
                      title="Read response aloud"
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-red-600 animate-pulse" />
                          <span className="text-red-600">{language === 'mr' ? 'थांबवा' : (language === 'hi' ? 'रोकें' : 'Stop')}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-amber-600" />
                          <span>{language === 'mr' ? 'ऐका (Listen)' : (language === 'hi' ? 'सुनें (Listen)' : 'Listen')}</span>
                        </>
                      )}
                    </button>
                  ) : <div />}

                  <div
                    className={`text-[9px] font-mono ${
                      msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs pl-2">
            <div className="w-6 h-6 rounded bg-[#0A2540] text-amber-400 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mr-1" />
              <span>उत्तर तयार होत आहे...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Voice Error Banner */}
      {voiceError && (
        <div className="px-4 py-2.5 bg-red-50 border-t border-red-300 text-red-900 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-bold">{voiceError}</span>
            </div>
            <button onClick={() => setVoiceError(null)} className="text-red-600 hover:text-red-900 font-bold ml-2">✕</button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-600">{language === 'mr' ? 'त्वरित १-क्लिक व्हॉईस प्रश्न:' : (language === 'hi' ? 'त्वरित 1-क्लिक वॉयस प्रश्न:' : 'Instant 1-Click Voice Queries:')}</span>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick(language === 'mr' ? "आमच्या गल्लीतील पाण्याची पाईपलाईन फुटली आहे" : (language === 'hi' ? "पानी की पाइपलाइन फूटी है" : "Water pipeline leakage on main street"))}
              className="px-2 py-0.5 bg-white border border-red-200 text-red-800 rounded font-semibold text-[11px] hover:bg-amber-100 transition"
            >
              🎙️ {language === 'mr' ? 'पाणी गळती' : (language === 'hi' ? 'पानी समस्या' : 'Water Leak')}
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick(language === 'mr' ? "घरकुल योजनेची माहिती सांगा" : (language === 'hi' ? "पीएम आवास योजना क्या है" : "Tell me about PMAY housing"))}
              className="px-2 py-0.5 bg-white border border-red-200 text-red-800 rounded font-semibold text-[11px] hover:bg-amber-100 transition"
            >
              🎙️ {language === 'mr' ? 'घरकुल योजना' : (language === 'hi' ? 'आवास योजना' : 'Housing Scheme')}
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick(language === 'mr' ? "पुढील ग्रामसभा कधी आहे?" : (language === 'hi' ? "अगली ग्राम सभा कब है?" : "When is next Gram Sabha?"))}
              className="px-2 py-0.5 bg-white border border-red-200 text-red-800 rounded font-semibold text-[11px] hover:bg-amber-100 transition"
            >
              🎙️ {language === 'mr' ? 'ग्रामसभा बैठक' : (language === 'hi' ? 'ग्राम सभा' : 'Gram Sabha')}
            </button>
          </div>
        </div>
      )}

      {/* Active Listening Indicator */}
      {isListening && (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-300 text-emerald-900 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
            <span className="font-bold">{voiceFeedback || (language === 'mr' ? "ऐकत आहे... बोला" : "Listening... Speak now")}</span>
          </div>
          <button
            onClick={() => toggleVoiceInput()}
            className="text-[11px] bg-red-600 text-white font-bold px-2 py-0.5 rounded shadow"
          >
            {language === 'mr' ? 'थांबवा (Stop)' : 'Stop'}
          </button>
        </div>
      )}

      {/* Presentation Ready: Instant Voice Demo Chips */}
      <div className="px-3 py-1.5 bg-amber-50/90 border-t border-amber-200 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-thin">
        <span className="text-[10px] font-black uppercase text-amber-900 flex items-center space-x-1 shrink-0">
          <Radio className="w-3 h-3 text-red-600 animate-pulse" />
          <span>{language === 'mr' ? 'नमुना प्रश्न बोला:' : (language === 'hi' ? 'बोलने के उदाहरण:' : 'Sample Voice Queries:')}</span>
        </span>
        {language === 'mr' ? (
          <>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("पुढील ग्रामसभा कधी आहे?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "पुढील ग्रामसभा कधी आहे?"
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("घरकुल योजनेसाठी कोण पात्र आहे?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "घरकुल योजनेसाठी कोण पात्र आहे?"
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("पिण्याच्या पाण्याची तक्रार कशी नोंदवायची?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "पिण्याच्या पाण्याची तक्रार कशी नोंदवायची?"
            </button>
          </>
        ) : language === 'hi' ? (
          <>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("अगली ग्रामसभा कब है?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "अगली ग्रामसभा कब है?"
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("पीएम आवास योजना की पात्रता क्या है?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "पीएम आवास योजना की पात्रता क्या है?"
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("पानी की शिकायत कैसे दर्ज करें?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "पानी की शिकायत कैसे दर्ज करें?"
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("When is the next Gram Sabha meeting?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "When is next Gram Sabha?"
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("Who is eligible for PMAY-G housing scheme?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "Who qualifies for PMAY-G house?"
            </button>
            <button
              type="button"
              onClick={() => handleVoiceQueryClick("How do I lodge a drinking water complaint?")}
              className="shrink-0 bg-white hover:bg-amber-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold transition"
            >
              🎙️ "How to file a water complaint?"
            </button>
          </>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-300">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <button
            type="button"
            onClick={() => toggleVoiceInput()}
            title={isListening ? "Stop listening" : t.chat.voiceInput}
            className={`p-2.5 rounded-lg border transition ${
              isListening
                ? 'bg-red-600 text-white animate-pulse border-red-700 shadow-md ring-2 ring-red-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-red-600" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? (language === 'mr' ? "ऐकत आहे... बोला" : "Listening... Speak now") : t.chat.inputPlaceholder}
            className={`flex-1 py-2.5 px-4 border focus:bg-white focus:ring-2 outline-none rounded-lg text-xs sm:text-sm font-medium transition ${
              isListening 
                ? 'bg-emerald-50 border-emerald-400 focus:ring-emerald-300 text-emerald-900 font-bold' 
                : 'bg-slate-50 border-slate-300 focus:ring-[#0A2540]/20 focus:border-[#0A2540]'
            }`}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 px-4 bg-[#0A2540] hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg flex items-center space-x-1.5 text-xs shadow transition"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.chat.send}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
