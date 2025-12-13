import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AccessibilitySettings } from '../types';
import { Send, User, Bot, Loader2, Mic, MicOff, Globe, Zap, BrainCircuit, BookOpenCheck } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  settings: AccessibilitySettings;
}

export const ChatPanel: React.FC<Props> = ({ messages, setMessages, settings }) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [useSearch, setUseSearch] = useState(false); // Toggle for search intent (UI only, model has tool enabled)
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { highContrast, fontSize } = settings;

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, []);

  const toggleListening = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Voice input is not supported in this browser.");
          return;
      }

      if (!recognitionRef.current) {
         // Lazy Init
         const SpeechRecognition = (window as any).webkitSpeechRecognition;
         recognitionRef.current = new SpeechRecognition();
         recognitionRef.current.continuous = false;
         recognitionRef.current.interimResults = false;
         recognitionRef.current.lang = 'en-US';

         recognitionRef.current.onresult = (event: any) => {
             const transcript = event.results[0][0].transcript;
             setInput(prev => prev ? `${prev} ${transcript}` : transcript);
             setIsListening(false);
         };

         recognitionRef.current.onerror = (event: any) => {
             console.error("Speech recognition error", event.error);
             setIsListening(false);
         };
         
         recognitionRef.current.onend = () => {
             setIsListening(false);
         };
      }

      try {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
      } catch (error) {
         console.error("Failed to toggle speech recognition:", error);
         setIsListening(false);
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    // Prepend search prompt if toggle is on to encourage model to use the tool
    const textToSend = useSearch ? `Using Google Search, find authoritative sources and cite them: ${input}` : input;
    const displayText = input; // Display original text to user

    const userMsg: ChatMessage = { role: 'user', text: displayText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendChatMessage(textToSend, useSearch);
      if (result.text) {
        setMessages(prev => [...prev, { 
            role: 'model', 
            text: result.text,
            sources: result.sources,
            modelUsed: result.modelUsed // TRACK MODEL
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  // Styles
  const bgClass = highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const textClass = highContrast ? 'text-white' : 'text-slate-800';
  const mutedTextClass = highContrast ? 'text-slate-400' : 'text-slate-500';
  const inputBg = highContrast ? 'bg-black border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900';
  
  const textSizeClass = fontSize === 'normal' ? 'text-sm' 
    : fontSize === 'large' ? 'text-base' 
    : 'text-lg';

  const ModelBadge = ({ model }: { model: string }) => {
    const isPro = model.includes('pro') || model.includes('3');
    return (
        <span className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider mt-1 opacity-75
            ${isPro ? 'text-purple-500' : 'text-blue-500'}`}>
            {isPro ? <BrainCircuit size={10} /> : <Zap size={10} />} {model}
        </span>
    );
  };

  return (
    <div className={`flex flex-col h-full ${bgClass} rounded-xl border overflow-hidden`}>
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${textSizeClass}`}>
        {messages.length === 0 && (
          <div className={`text-center mt-10 ${mutedTextClass} flex flex-col items-center`}>
            <div className={`p-4 rounded-full mb-4 ${highContrast ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Bot size={32} />
            </div>
            <p className="font-semibold mb-2">I am your AI Tutor.</p>
            <p className="text-sm max-w-xs">
                Ask me follow-up questions. Toggle <span className="font-bold inline-flex items-center gap-1"><BookOpenCheck size={12}/> Cite Sources</span> to find facts on the web.
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'model' 
                    ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-100 text-blue-600')
                    : (highContrast ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600')
                }`}>
                    {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
                </div>
                
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl ${
                    msg.role === 'user' 
                        ? (highContrast ? 'bg-yellow-900 text-yellow-100 rounded-tr-none' : 'bg-blue-600 text-white rounded-tr-none')
                        : (highContrast ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-slate-100 text-slate-800 rounded-tl-none')
                    }`}>
                        <MarkdownRenderer content={msg.text} highContrast={highContrast} />
                        
                        {/* Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                            <div className={`mt-3 pt-2 border-t text-xs ${highContrast ? 'border-slate-700' : 'border-slate-200/20'}`}>
                                <p className="font-bold mb-1 flex items-center gap-1 opacity-80"><Globe size={10} /> Sources:</p>
                                <ul className="space-y-1">
                                    {msg.sources.map((src, i) => (
                                        <li key={i}>
                                            <a 
                                                href={src.uri} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className={`hover:underline truncate block ${highContrast ? 'text-blue-300' : 'text-blue-200'}`}
                                            >
                                                {src.title || src.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    {msg.role === 'model' && msg.modelUsed && <ModelBadge model={msg.modelUsed} />}
                </div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-3 justify-start">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-100 text-blue-600'}`}>
                <Bot size={18} />
              </div>
              <div className={`p-3 rounded-2xl rounded-tl-none flex items-center ${highContrast ? 'bg-slate-800' : 'bg-slate-100'}`}>
                 <Loader2 className="animate-spin" size={18} />
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 border-t ${highContrast ? 'border-slate-800' : 'border-slate-100'}`}>
        {/* Toggle Bar */}
        <div className="flex items-center gap-2 mb-2">
            <button
                onClick={() => setUseSearch(!useSearch)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                    ${useSearch 
                        ? (highContrast ? 'bg-blue-900 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200') 
                        : (highContrast ? 'text-slate-500 border border-slate-700 hover:border-slate-500' : 'text-slate-500 border border-slate-200 hover:border-slate-300')}`}
            >
                <BookOpenCheck size={14} />
                {useSearch ? "Citing Sources Enabled" : "Cite Sources"}
            </button>
            <span className={`text-[10px] ${highContrast ? 'text-slate-500' : 'text-slate-400'}`}>
                {useSearch ? "AI will search the web for facts." : "Standard AI response."}
            </span>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-2">
             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${inputBg} focus-within:ring-2 focus-within:ring-blue-500`}>
                 <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={useSearch ? "Ask for facts, dates, or papers..." : "Ask a follow-up question..."}
                    className="flex-1 bg-transparent border-none outline-none"
                />
                <button
                    onClick={toggleListening}
                    className={`p-1.5 rounded-full transition-all ${isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : (highContrast ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600')}`}
                    title="Voice Input"
                >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
             </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={`p-3 rounded-lg transition-colors h-[46px] w-[46px] flex items-center justify-center
              ${highContrast 
                ? 'bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50' 
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400'}`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};