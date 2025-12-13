import React, { useState, useRef, useEffect } from 'react';
import { AccessibilitySettings, ChatMessage, ExamConfig, WebSource } from '../types';
import { GraduationCap, Brain, Send, ArrowRight, Loader2, RefreshCw, Upload, FileText, CheckCircle2, Settings2, BrainCircuit, Zap, Globe, FileWarning, Download, Timer, StopCircle, PlayCircle, BookOpen, PenTool, Hash, LayoutList, Mic, MicOff, Scale, Gavel, Wand2 } from 'lucide-react';
import { startExamSession, sendExamMessage, auditExamGrading } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { convertPdfToImage, extractPdfText } from '../utils/pdfHelper';

interface Props {
  settings: AccessibilitySettings;
}

export const ExamPrep: React.FC<Props> = ({ settings }) => {
  // Config State
  const [config, setConfig] = useState<ExamConfig>({
    subject: "",
    gradeLevel: "",
    totalMarks: "100",
    numberOfQuestions: 5,
    institutionGuidelines: "",
    questionFormats: ["Short Question"], // Updated default
    realWorldMode: false,
    strictMode: false,
    durationMinutes: 30
  });
  
  // File Context State
  const [contextFile, setContextFile] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Session State
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (!('webkitSpeechRecognition' in window)) return;
      
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
              console.error("Speech Recognition Error:", event.error);
              setIsListening(false);
          };
          recognitionRef.current.onend = () => setIsListening(false);
      }

      try {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
      } catch (error) {
        console.error("Failed to toggle speech recognition:", error);
        setIsListening(false);
      }
  };

  // --- Helpers ---
  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (isStarted && config.strictMode && timeLeft > 0) {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, config.strictMode, timeLeft]);

  // --- Handlers ---

  const handleDemo = () => {
      setConfig(prev => ({
          ...prev,
          subject: "Design Thinking",
          gradeLevel: "University 1st Year",
          numberOfQuestions: 5,
          questionFormats: ["Short Question", "Long Question"],
          institutionGuidelines: ""
      }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    try {
        let data = "";
        let mimeType = file.type;

        if (file.type === 'application/pdf') {
             try {
                data = await extractPdfText(file);
                mimeType = 'text/plain'; 
             } catch (e) {
                const dataUrl = await convertPdfToImage(file);
                data = dataUrl.split(',')[1];
                mimeType = 'image/jpeg';
             }
        } else {
             const reader = new FileReader();
             await new Promise((resolve) => {
                 reader.onload = (ev) => {
                     data = (ev.target?.result as string).split(',')[1];
                     resolve(true);
                 };
                 reader.readAsDataURL(file);
             });
        }
        
        setContextFile({ name: file.name, data, mimeType });
    } catch (err) {
        console.error("File upload failed", err);
        alert("Failed to process file. Please try an image or PDF.");
    } finally {
        setFileLoading(false);
    }
  };

  const toggleFormat = (format: string) => {
      setConfig(prev => {
          const exists = prev.questionFormats.includes(format);
          return {
              ...prev,
              questionFormats: exists 
                 ? prev.questionFormats.filter(f => f !== format)
                 : [...prev.questionFormats, format]
          };
      });
  };

  const startSession = async () => {
    if (!config.subject || !config.gradeLevel) return;
    setLoading(true);
    if (config.strictMode) {
        setTimeLeft((config.durationMinutes || 30) * 60);
    }
    try {
        const fileData = contextFile ? { data: contextFile.data, mimeType: contextFile.mimeType } : undefined;
        const res = await startExamSession(config, fileData);
        setMessages([{ role: 'model', text: res.text, modelUsed: res.modelUsed }]);
        setIsStarted(true);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    
    try {
        const response = await sendExamMessage(userText);
        setMessages(prev => [...prev, { 
            role: 'model', 
            text: response.text, 
            modelUsed: response.modelUsed,
            sources: response.sources 
        }]);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleFinishExam = async () => {
      // Inject magic command
      const cmd = "FINISH_EXAM";
      if (timerRef.current) clearInterval(timerRef.current);
      setMessages(prev => [...prev, { role: 'user', text: "I am finished. Please grade me." }]);
      setLoading(true);
      try {
          // 1. Get Initial Grading from Invigilator Model
          const response = await sendExamMessage(cmd);
          
          // 2. Add to messages immediately
          const gradingMsg: ChatMessage = { 
              role: 'model', 
              text: response.text, 
              modelUsed: response.modelUsed 
          };
          setMessages(prev => [...prev, gradingMsg]);

          // 3. Trigger Independent Audit
          if (config.strictMode) {
              setIsAuditing(true);
              const historyText = [...messages, gradingMsg].map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
              const auditResult = await auditExamGrading(historyText);
              
              setMessages(prev => [...prev, {
                  role: 'model',
                  text: "**Independent Grading Audit Complete**",
                  modelUsed: "Auditor Bot",
                  examAudit: auditResult
              }]);
              setIsAuditing(false);
          }

      } catch(e) { console.error(e); }
      finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (messages.length === 0) return;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.subject} - Exam Transcript</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .markdown-body ul { list-style-type: disc; margin-left: 1.5rem; }
        .markdown-body ol { list-style-type: decimal; margin-left: 1.5rem; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-slate-900 text-white p-8">
            <h1 class="text-2xl font-bold">Exam Transcript</h1>
            <p>Subject: ${config.subject}</p>
        </div>
        <div id="chat-container" class="p-8 space-y-8"></div>
    </div>
    <script>
        const messages = ${JSON.stringify(messages)};
        const container = document.getElementById('chat-container');
        messages.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = \`flex gap-4 \${msg.role === 'model' ? '' : 'flex-row-reverse'}\`;
            const bubble = document.createElement('div');
            bubble.className = \`max-w-[80%] rounded-2xl p-4 \${msg.role === 'model' ? 'bg-white border shadow-sm' : 'bg-emerald-600 text-white'}\`;
            bubble.innerHTML = marked.parse(msg.text);
            wrapper.appendChild(bubble);
            container.appendChild(wrapper);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.subject}_Exam.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAuditing]);

  // Styles
  const bgColor = settings.highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900';
  const cardBg = settings.highContrast ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const inputClass = `w-full p-3 rounded-lg border outline-none focus:ring-2 transition-all ${settings.highContrast ? 'bg-black border-slate-700 focus:ring-yellow-400' : 'bg-white border-slate-300 focus:ring-emerald-500'}`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${settings.highContrast ? 'text-slate-400' : 'text-slate-500'}`;
  const msgUserBg = settings.highContrast ? 'bg-yellow-900 text-yellow-100' : 'bg-emerald-600 text-white';
  const msgAiBg = settings.highContrast ? 'bg-slate-800 text-slate-200' : 'bg-white shadow-sm text-slate-800';

  if (!isStarted) {
      return (
        <div className={`h-full overflow-y-auto p-6 ${bgColor}`}>
            <div className={`max-w-3xl mx-auto rounded-2xl border shadow-xl p-8 ${cardBg}`}>
                <div className="text-center mb-8 relative">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-emerald-100 text-emerald-600'}`}>
                        <GraduationCap size={32} />
                    </div>
                    <h2 className="text-3xl font-bold">Exam Simulator Setup</h2>
                    <p className={`mt-2 ${settings.highContrast ? 'text-slate-400' : 'text-slate-600'}`}>
                        Customize your test environment with precision.
                    </p>
                    
                    {/* DEMO BUTTON */}
                    <button
                        onClick={handleDemo}
                        className={`absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                        ${settings.highContrast ? 'border-yellow-400 text-yellow-400' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                    >
                        <Wand2 size={14} /> Load Demo
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* TOP ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}><BookOpen size={14} className="inline mr-1" /> Subject Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Organic Chemistry"
                                className={inputClass}
                                value={config.subject}
                                onChange={e => setConfig({...config, subject: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className={labelClass}><Hash size={14} className="inline mr-1" /> Grade / Level</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 10th Grade"
                                className={inputClass}
                                value={config.gradeLevel}
                                onChange={e => setConfig({...config, gradeLevel: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* CONTEXT ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                             <label className={labelClass}><Upload size={14} className="inline mr-1" /> Context Material (Optional)</label>
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`cursor-pointer border-2 border-dashed rounded-lg p-2.5 flex items-center justify-center gap-2 transition-colors h-[46px]
                                ${contextFile 
                                    ? (settings.highContrast ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-green-500 text-green-700 bg-green-50')
                                    : (settings.highContrast ? 'border-slate-700 hover:border-yellow-400' : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50')}`}
                             >
                                 <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} />
                                 {fileLoading ? <Loader2 className="animate-spin" size={20} /> : (contextFile ? <CheckCircle2 size={20} /> : <Upload size={20} />)}
                                 <span className="text-sm font-medium truncate max-w-[150px]">
                                     {fileLoading ? "Processing..." : (contextFile ? contextFile.name : "Upload PDF/Image")}
                                 </span>
                             </div>
                        </div>
                        
                        <div>
                             <label className={labelClass}><Settings2 size={14} className="inline mr-1" /> Exam Mode</label>
                             <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 h-[46px]">
                                 <button
                                    onClick={() => setConfig(p => ({...p, strictMode: false}))}
                                    className={`flex-1 rounded-md text-xs font-bold transition-all ${!config.strictMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                 >
                                    Study / Tutor
                                 </button>
                                 <button
                                    onClick={() => setConfig(p => ({...p, strictMode: true}))}
                                    className={`flex-1 rounded-md text-xs font-bold transition-all ${config.strictMode ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}
                                 >
                                    Strict Simulator
                                 </button>
                             </div>
                        </div>
                    </div>

                    {/* FORMAT CONFIGURATION ROW */}
                    <div className={`p-4 rounded-xl border ${settings.highContrast ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                         <label className={labelClass}><LayoutList size={14} className="inline mr-1" /> Question Formats</label>
                         <div className="flex flex-wrap gap-2 mb-4">
                             {["Multiple Choice", "Short Question", "Long Question", "Essay", "Problem Solving"].map(fmt => (
                                 <button
                                    key={fmt}
                                    onClick={() => toggleFormat(fmt)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                        ${config.questionFormats.includes(fmt) 
                                            ? (settings.highContrast ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-emerald-600 text-white border-emerald-600') 
                                            : (settings.highContrast ? 'bg-transparent text-slate-400 border-slate-600 hover:border-slate-400' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-500')}`}
                                 >
                                     {fmt}
                                 </button>
                             ))}
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className={labelClass}>Number of Questions</label>
                                 <input 
                                    type="number"
                                    min="1" max="50"
                                    className={inputClass}
                                    value={config.numberOfQuestions}
                                    onChange={(e) => setConfig(p => ({...p, numberOfQuestions: parseInt(e.target.value)}))}
                                 />
                             </div>
                             
                             <div className="flex items-end">
                                <button
                                    onClick={() => setConfig(p => ({...p, realWorldMode: !p.realWorldMode}))}
                                    className={`w-full h-[46px] rounded-lg border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all
                                    ${config.realWorldMode
                                        ? (settings.highContrast ? 'border-blue-400 text-blue-300 bg-blue-900/30' : 'border-blue-500 text-blue-700 bg-blue-50')
                                        : (settings.highContrast ? 'border-slate-600 text-slate-500' : 'border-slate-300 text-slate-500')}`}
                                >
                                    <Globe size={16} />
                                    {config.realWorldMode ? "Real-World Context: ON" : "Real-World Context: OFF"}
                                </button>
                             </div>
                         </div>
                    </div>
                    
                    {/* GUIDELINES TEXTAREA */}
                    <div>
                         <label className={labelClass}><PenTool size={14} className="inline mr-1" /> Teacher / Institution Guidelines (Optional)</label>
                         <textarea 
                            className={`${inputClass} h-20 resize-none`}
                            placeholder="e.g. 'Answers must be less than 50 words', 'No calculators', 'Use Chicago citation style'."
                            value={config.institutionGuidelines}
                            onChange={(e) => setConfig(p => ({...p, institutionGuidelines: e.target.value}))}
                         />
                    </div>
                    
                    {config.strictMode && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                             <label className={labelClass}><Timer size={14} className="inline mr-1" /> Exam Duration (Minutes)</label>
                             <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="180" 
                                    step="5"
                                    value={config.durationMinutes}
                                    onChange={(e) => setConfig(p => ({...p, durationMinutes: parseInt(e.target.value)}))}
                                    className="flex-1 accent-red-500"
                                />
                                <span className="font-bold w-16 text-right">{config.durationMinutes}m</span>
                             </div>
                        </div>
                    )}

                    <button 
                        onClick={startSession}
                        disabled={loading || !config.subject || !config.gradeLevel}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mt-4
                            ${settings.highContrast 
                                ? 'bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50' 
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (config.strictMode ? "Begin Proctored Exam" : "Start Study Session")} <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className={`h-full flex flex-col ${bgColor}`}>
        <div className={`p-4 border-b flex items-center justify-between ${settings.highContrast ? 'border-slate-800' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-2">
                <Brain className={settings.highContrast ? 'text-yellow-400' : 'text-emerald-600'} />
                <div>
                    <h2 className="font-bold text-sm leading-tight">{config.subject} {config.strictMode ? '(Strict Exam)' : '(Study Mode)'}</h2>
                    <p className="text-[10px] opacity-60">{config.gradeLevel} • {contextFile ? "Context Loaded" : "General"}</p>
                </div>
            </div>
            
            {/* TIMER DISPLAY */}
            {config.strictMode && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-xl
                    ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : (settings.highContrast ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-800')}`}>
                    <Timer size={20} />
                    {formatTime(timeLeft)}
                </div>
            )}

            <div className="flex items-center gap-2">
                {/* Finish Exam Button */}
                {config.strictMode && (
                    <button 
                        onClick={handleFinishExam}
                        disabled={loading || isAuditing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-red-600 text-white hover:bg-red-700 transition-colors mr-2"
                    >
                        {isAuditing ? <Loader2 size={16} className="animate-spin" /> : <StopCircle size={16} />} 
                        {isAuditing ? "Auditing..." : "Finish & Grade"}
                    </button>
                )}

                <button 
                    onClick={handleDownload}
                    disabled={messages.length === 0}
                    className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors
                        ${settings.highContrast 
                            ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Download size={14} /> Save
                </button>
                <button onClick={() => { setIsStarted(false); setMessages([]); }} className="text-sm opacity-60 hover:opacity-100 flex items-center gap-1 ml-2">
                    <RefreshCw size={14} /> Exit
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                         ${msg.role === 'model' 
                            ? (settings.highContrast ? 'bg-slate-700' : 'bg-emerald-100 text-emerald-600') 
                            : (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-200 text-slate-600')}`}>
                        {msg.role === 'model' ? <Brain size={16} /> : <div className="text-xs font-bold">YOU</div>}
                    </div>
                    
                    <div className="flex flex-col max-w-[80%]">
                        <div className={`p-4 rounded-2xl text-lg leading-relaxed ${msg.role === 'user' ? msgUserBg : msgAiBg}`}>
                            {msg.examAudit ? (
                                // AUDIT REPORT UI
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-300 pb-2 mb-2">
                                        <Scale size={24} className="text-blue-500" />
                                        <h3 className="font-bold text-xl">Independent Grading Audit</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                                            <div className="text-xs font-bold uppercase opacity-60">Verified Score</div>
                                            <div className="text-2xl font-bold">{msg.examAudit.auditedScore}</div>
                                        </div>
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                                            <div className="text-xs font-bold uppercase opacity-60">Fairness Rating</div>
                                            <div className={`text-2xl font-bold ${msg.examAudit.fairnessScore > 80 ? 'text-green-500' : 'text-amber-500'}`}>
                                                {msg.examAudit.fairnessScore}%
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold mb-1">Auditor Feedback:</div>
                                        <p className="text-sm">{msg.examAudit.feedback}</p>
                                    </div>
                                    {msg.examAudit.discrepancies.length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900">
                                            <div className="font-bold text-red-600 text-sm flex items-center gap-1 mb-1">
                                                <Gavel size={14} /> Grading Discrepancies Found:
                                            </div>
                                            <ul className="list-disc pl-5 text-xs space-y-1">
                                                {msg.examAudit.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <MarkdownRenderer content={msg.text} highContrast={settings.highContrast} />
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {loading && (
                 <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600`}>
                        <Brain size={16} />
                    </div>
                    <div className={`${msgAiBg} p-4 rounded-2xl flex items-center gap-2`}>
                        <Loader2 className="animate-spin" size={20} /> 
                        {config.strictMode ? "Invigilator is recording..." : "Thinking..."}
                    </div>
                 </div>
            )}
            {isAuditing && (
                <div className="flex gap-4">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600`}>
                        <Scale size={16} />
                    </div>
                    <div className={`${msgAiBg} p-4 rounded-2xl flex items-center gap-2`}>
                        <Loader2 className="animate-spin" size={20} /> 
                        Double-Marking exam with Independent Auditor...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className={`p-4 border-t ${settings.highContrast ? 'border-slate-800 bg-black' : 'border-slate-200 bg-white'}`}>
            <div className={`max-w-4xl mx-auto flex items-center gap-2 p-2 rounded-xl border ${settings.highContrast ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your answer..."
                    className="flex-1 bg-transparent outline-none px-2 py-1 text-lg"
                    autoFocus
                />
                
                {/* Exam Voice Input */}
                <button
                    onClick={toggleListening}
                    className={`p-2 rounded-full transition-all flex items-center justify-center
                        ${isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : (settings.highContrast ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-emerald-600')}`}
                    title="Voice Answer"
                >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button 
                    onClick={handleSend}
                    disabled={!input || loading || isAuditing}
                    className={`p-3 rounded-lg transition-all ${settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-emerald-600 text-white'}`}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    </div>
  );
};