import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Send, Mic, MicOff, Bot, User, Sparkles, ArrowRight } from 'lucide-react';

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
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(message, language, user?.id);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent_detected,
        suggestedActions: response.suggested_actions,
        metadata: response.metadata
      };
      setMessages((prev) => [...prev, botMsg]);
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

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(language === 'mr' ? "तुमच्या ब्राऊझरमध्ये व्हॉइस इनपुट उपलब्ध नाही." : "Voice input not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'mr' ? 'mr-IN' : (language === 'hi' ? 'hi-IN' : 'en-IN');
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
      recognition.stop();
    }
  };

  const handleActionClick = (action: string, msgMetadata?: any) => {
    const actLower = action.toLowerCase();
    if (actLower.includes('scheme') || actLower.includes('योजना') || actLower.includes('eligibility') || actLower.includes('पात्रता')) {
      onNavigateTab('schemes');
    } else if (actLower.includes('track') || actLower.includes('ट्रॅक') || actLower.includes('तक्रार') || actLower.includes('grievance') || actLower.includes('शिकायत')) {
      onNavigateTab('grievances', { trackingId: msgMetadata?.tracking_id });
    } else if (actLower.includes('meeting') || actLower.includes('बैठक') || actLower.includes('work') || actLower.includes('कामे') || actLower.includes('sabha')) {
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
          <span className="bg-slate-800 text-amber-300 px-2.5 py-1 rounded border border-slate-700 hidden sm:inline-block">
            {language === 'mr' ? 'मराठी सहाय्यक' : language === 'hi' ? 'हिंदी सहायक' : 'English Assistant'}
          </span>
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

                <div
                  className={`text-[9px] mt-1.5 text-right font-mono ${
                    msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
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

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-slate-100 border-t border-slate-300 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-thin">
        <span className="text-slate-600 font-bold whitespace-nowrap text-[11px]">
          {t.chat.quickPrompts}
        </span>
        <button
          onClick={() => handleSendMessage(t.chat.promptScheme)}
          className="whitespace-nowrap px-2.5 py-1 rounded-md bg-white hover:bg-amber-50 hover:text-amber-900 text-slate-700 border border-slate-300 font-bold text-[11px] transition"
        >
          {t.chat.promptScheme}
        </button>
        <button
          onClick={() => handleSendMessage(t.chat.promptWater)}
          className="whitespace-nowrap px-2.5 py-1 rounded-md bg-white hover:bg-amber-50 hover:text-amber-900 text-slate-700 border border-slate-300 font-bold text-[11px] transition"
        >
          {t.chat.promptWater}
        </button>
        <button
          onClick={() => handleSendMessage(t.chat.promptMeeting)}
          className="whitespace-nowrap px-2.5 py-1 rounded-md bg-white hover:bg-amber-50 hover:text-amber-900 text-slate-700 border border-slate-300 font-bold text-[11px] transition"
        >
          {t.chat.promptMeeting}
        </button>
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
            onClick={toggleVoiceInput}
            title={t.chat.voiceInput}
            className={`p-2.5 rounded-lg border transition ${
              isListening
                ? 'bg-red-600 text-white animate-pulse border-red-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? t.chat.listening : t.chat.inputPlaceholder}
            className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#0A2540]/20 focus:border-[#0A2540] outline-none rounded-lg text-xs sm:text-sm font-medium"
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
