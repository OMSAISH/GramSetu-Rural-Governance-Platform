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
      initialGreeting = "नमस्ते! मी ग्रामसेतू आहे, तुमचा ग्रामपंचायत डिजिटल सहाय्यक.\n\nतुम्ही मला शासकीय योजना (घरकुल, पेन्शन, मनरेगा), ग्रामसभा बैठका आणि विकासकामांबद्दल विचारू शकता, किंवा पिण्याचे पाणी, रस्ते व वीज यांसारख्या समस्यांची तक्रार नोंदवू शकता.";
    } else {
      initialGreeting = "Namaste! I am GramSetu, your Gram Panchayat digital assistant.\n\nYou can ask about welfare schemes (PMAY, pensions, MGNREGA), Gram Sabha meetings, ongoing development works, or lodge complaints regarding local infrastructure.";
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
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: language === 'mr' 
          ? "क्षमस्व, सर्व्हरशी संपर्क साधताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा."
          : (language === 'hi' ? "क्षमा करें, सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।" : "Sorry, could not reach the server. Please try again."),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice input simulation / Web Speech API
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(language === 'mr' ? "तुमच्या ब्राऊझरमध्ये व्हॉइस इनपुट समर्थित नाही." : "Voice speech recognition is not supported in this browser.");
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
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
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
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Chat Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-700">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-emerald-700/80 border border-emerald-500 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base flex items-center space-x-2">
              <span>{t.chat.title}</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-emerald-200 line-clamp-1">
              {t.chat.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold bg-emerald-900/90 text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-700 hidden sm:inline-block">
            {language === 'mr' ? 'मराठी सहाय्यक' : language === 'hi' ? 'हिंदी सहायक' : 'English Assistant'}
          </span>
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/70">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`flex items-start max-w-[88%] sm:max-w-[80%] space-x-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-800 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 shadow-sm text-sm ${
                  msg.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {/* Intent Tag for Assistant messages */}
                {msg.sender === 'assistant' && msg.intent && msg.intent !== 'general' && (
                  <div className="mb-2 flex items-center space-x-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                      {msg.intent === 'scheme_check' ? 'Welfare Scheme' : (msg.intent === 'grievance' ? 'Grievance Redressal' : 'Governance Record')}
                    </span>
                  </div>
                )}

                {/* Body Text */}
                <div className="whitespace-pre-line leading-relaxed text-sm">
                  {msg.text}
                </div>

                {/* Suggested Action Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(action, msg.metadata)}
                        className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-all flex items-center font-medium"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-3 h-3 ml-1 opacity-70" />
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
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
            <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-white">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-2 rounded-full shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-slate-600 ml-1">GramSetu AI is formulating answer...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts Pills */}
      <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-thin">
        <span className="text-slate-500 font-semibold whitespace-nowrap">
          {t.chat.quickPrompts}
        </span>
        <button
          onClick={() => handleSendMessage(t.chat.promptScheme)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-300 font-medium transition"
        >
          {t.chat.promptScheme}
        </button>
        <button
          onClick={() => handleSendMessage(t.chat.promptWater)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-300 font-medium transition"
        >
          {t.chat.promptWater}
        </button>
        <button
          onClick={() => handleSendMessage(t.chat.promptMeeting)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-300 font-medium transition"
        >
          {t.chat.promptMeeting}
        </button>
        <button
          onClick={() => handleSendMessage(t.chat.promptTrack)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-300 font-medium transition"
        >
          {t.chat.promptTrack}
        </button>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={t.chat.voiceInput}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse border-red-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? t.chat.listening : t.chat.inputPlaceholder}
            className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 rounded-xl text-sm transition"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5 text-sm shadow-sm transition"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t.chat.send}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
