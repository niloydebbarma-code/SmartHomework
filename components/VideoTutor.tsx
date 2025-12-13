import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AccessibilitySettings, ChatMessage } from '../types';
import { Video, Upload, MessageSquare, Camera, Play, Pause, Loader2, Youtube, Clock, Link as LinkIcon, Globe, BrainCircuit, Zap, CheckCircle, Mic, MicOff, FileText, AlertTriangle, ShieldCheck, Wand2, Film, Info } from 'lucide-react';
import { analyzeVideoFrame, analyzeYoutubeSegment } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { UploadArea } from './UploadArea';

interface Props {
  settings: AccessibilitySettings;
}

type VideoMode = 'file' | 'youtube';

const YouTubePlayer = React.memo(({ videoId, videoUrl }: { videoId: string, videoUrl: string }) => {
  const src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
  const safeUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
  
  return (
    <div className="w-full h-full flex flex-col bg-black">
        <div className="flex-1 relative min-h-0 bg-black">
            <iframe 
                key={videoId} 
                width="100%" 
                height="100%" 
                src={src}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
            />
        </div>
        
        <div className="flex-shrink-0 bg-slate-900 border-t border-slate-700 p-3 flex flex-col gap-2">
            <a 
                href={safeUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors border border-slate-600"
            >
                <Youtube size={16} className="text-red-500" />
                Open in YouTube
            </a>
            <div className="flex items-center justify-center gap-1.5">
                <LinkIcon size={10} className="text-green-500" />
                <a 
                    href={safeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-center font-mono text-green-500 hover:text-green-400 break-all underline decoration-green-500/30"
                >
                    {safeUrl}
                </a>
            </div>
        </div>
    </div>
  );
});

export const VideoTutor: React.FC<Props> = ({ settings }) => {
  const [mode, setMode] = useState<VideoMode>('file');
  
  // File State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // YouTube State
  const [ytUrl, setYtUrl] = useState("");
  const [ytId, setYtId] = useState<string | null>(null);
  const [manualTime, setManualTime] = useState(""); // MM:SS format
  const [analysisScope, setAnalysisScope] = useState<'timestamp' | 'full'>('timestamp');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [factCheckMode, setFactCheckMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
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
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':').reverse();
    let seconds = 0;
    for(let i=0; i < parts.length; i++) {
        seconds += parseInt(parts[i]) * Math.pow(60, i);
    }
    return isNaN(seconds) ? 0 : seconds;
  };

  // --- Handlers ---
  const handleFileSelect = (file: File) => {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setMessages([{ role: 'model', text: "Video loaded! Play the video to the point you don't understand, then click 'Analyze Frame'." }]);
  };

  const handleDemo = () => {
      const demoUrl = "https://www.youtube.com/watch?v=RbPpV3TuCO8";
      setYtUrl(demoUrl);
      const id = extractYoutubeId(demoUrl);
      if (id) {
          setYtId(id);
          setMessages([{ role: 'model', text: "YouTube video loaded! Enter the timestamp (MM:SS) where you have a doubt, type your question, and click 'Analyze Context'." }]);
      }
  };

  const handleLoadYoutube = () => {
    const id = extractYoutubeId(ytUrl);
    if (id) {
        setYtId(id);
        setMessages([{ role: 'model', text: "YouTube video loaded! Enter the timestamp (MM:SS) where you have a doubt, type your question, and click 'Analyze Context'." }]);
    } else {
        alert("Invalid YouTube URL");
    }
  };

  const handleCaptureAndAsk = async () => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    let timestamp = 0;

    try {
        if (mode === 'file') {
             if (!videoRef.current) return;
             
             timestamp = videoRef.current.currentTime;
             const canvas = document.createElement('canvas');
             canvas.width = videoRef.current.videoWidth;
             canvas.height = videoRef.current.videoHeight;
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(videoRef.current, 0, 0);
             const frameBase64 = canvas.toDataURL('image/jpeg').split(',')[1];

             const userMsg: ChatMessage = { role: 'user', text: input, timestamp };
             setMessages(prev => [...prev, userMsg]);
             setInput("");

             const response = await analyzeVideoFrame(frameBase64, userMsg.text, timestamp, factCheckMode);
             setMessages(prev => [...prev, { 
                 role: 'model', 
                 text: response.text, 
                 modelUsed: response.modelUsed,
                 sources: response.sources,
                 videoAnalysis: response.videoMetadata
            }]);

        } else {
             if (!ytId) return;
             timestamp = parseTime(manualTime);
             
             const userMsg: ChatMessage = { role: 'user', text: input, timestamp: analysisScope === 'full' ? undefined : timestamp };
             setMessages(prev => [...prev, userMsg]);
             setInput("");

             const response = await analyzeYoutubeSegment(ytUrl, userMsg.text, timestamp, factCheckMode, analysisScope);
             setMessages(prev => [...prev, { 
                 role: 'model', 
                 text: response.text,
                 sources: response.sources,
                 modelUsed: response.modelUsed,
                 videoAnalysis: response.videoMetadata
             }]);
        }
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Error analyzing video context. Please try again." }]);
        console.error(error);
    } finally {
        setIsAnalyzing(false);
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    }
  };

  const bgColor = settings.highContrast ? 'bg-black text-white' : 'bg-white text-slate-900';
  const panelBg = settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200';
  const activeTabClass = settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white';
  const inactiveTabClass = settings.highContrast ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';

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
    <div className={`h-full flex flex-col ${bgColor}`}>
      
      {/* Top Bar: Tabs */}
      <div className={`flex items-center gap-4 px-6 py-3 border-b ${settings.highContrast ? 'border-slate-800' : 'border-slate-200'}`}>
         <div className="flex bg-transparent rounded-lg overflow-hidden gap-2">
            <button 
                onClick={() => setMode('file')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'file' ? activeTabClass : inactiveTabClass}`}
            >
                <Upload size={16} /> Upload Video
            </button>
            <button 
                onClick={() => setMode('youtube')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'youtube' ? activeTabClass : inactiveTabClass}`}
            >
                <Youtube size={16} /> YouTube Link
            </button>
         </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden p-6">
        {/* LEFT: Video Player */}
        <div className="flex-[2] flex flex-col min-h-0">
            <div className={`flex-1 rounded-xl overflow-hidden relative bg-black flex flex-col border ${settings.highContrast ? 'border-slate-800' : 'border-slate-300'}`}>
                {mode === 'file' ? (
                    videoSrc ? (
                        <video 
                            ref={videoRef}
                            src={videoSrc}
                            className="max-w-full max-h-full mx-auto"
                            controls={false}
                            onClick={togglePlay}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-8">
                             <UploadArea 
                                onFileSelect={handleFileSelect}
                                onTextSubmit={() => {}}
                                isLoading={false}
                                highContrast={settings.highContrast}
                                accept="video/*"
                                title="Upload Lecture Video"
                                subtitle="Supports MP4, WebM"
                                disableTextMode={true}
                             />
                        </div>
                    )
                ) : (
                    ytId ? (
                        <YouTubePlayer videoId={ytId} videoUrl={ytUrl} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6">
                            <div className="w-full max-w-md">
                                <h3 className="font-bold text-center mb-4 text-white">Load YouTube Lecture</h3>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={ytUrl}
                                        onChange={(e) => setYtUrl(e.target.value)}
                                        placeholder="Paste YouTube Link here..."
                                        className={`flex-1 px-4 py-3 rounded-lg outline-none ${settings.highContrast ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border'}`}
                                    />
                                    <button
                                        onClick={handleDemo}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                        ${settings.highContrast ? 'border-yellow-400 text-yellow-400' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                                    >
                                        <Wand2 size={14} /> Demo
                                    </button>
                                    <button 
                                        onClick={handleLoadYoutube}
                                        className={`px-4 rounded-lg font-bold ${settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white'}`}
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
            
            {/* Controls */}
            {(videoSrc || ytId) && (
                <div className={`mt-4 flex gap-4 p-4 rounded-xl border ${panelBg}`}>
                    {mode === 'file' ? (
                        <button onClick={togglePlay} className={`p-3 rounded-full flex-shrink-0 ${settings.highContrast ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}>
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                    ) : (
                         <div className="flex flex-col justify-center">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${settings.highContrast ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                                <Clock size={16} className="text-slate-500" />
                                <input 
                                    type="text" 
                                    value={manualTime}
                                    onChange={(e) => setManualTime(e.target.value)}
                                    placeholder="MM:SS"
                                    className="w-16 bg-transparent outline-none font-mono text-center"
                                />
                            </div>
                            <span className="text-[10px] text-center mt-1 opacity-50">Timeline</span>
                         </div>
                    )}
                    
                    <div className="flex-1 flex gap-2">
                        {mode === 'youtube' && (
                            <div className="flex flex-col justify-center mr-2">
                                <div className={`flex rounded-lg overflow-hidden border ${settings.highContrast ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <button
                                        onClick={() => setAnalysisScope('timestamp')}
                                        className={`px-3 py-2 text-xs font-bold transition-all flex items-center gap-1
                                        ${analysisScope === 'timestamp' 
                                            ? (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-100 text-blue-700') 
                                            : (settings.highContrast ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 hover:bg-slate-50')}`}
                                        title="Analyze current timestamp"
                                    >
                                        <Clock size={14} /> At Time
                                    </button>
                                    <button
                                        onClick={() => setAnalysisScope('full')}
                                        className={`px-3 py-2 text-xs font-bold transition-all flex items-center gap-1 border-l ${settings.highContrast ? 'border-slate-700' : 'border-slate-200'}
                                        ${analysisScope === 'full' 
                                            ? (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-100 text-blue-700') 
                                            : (settings.highContrast ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 hover:bg-slate-50')}`}
                                        title="Analyze entire video"
                                    >
                                        <Film size={14} /> Full Video
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Fact Check Toggle */}
                        <div className="flex flex-col justify-center mr-2">
                             <button
                                onClick={() => setFactCheckMode(!factCheckMode)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                ${factCheckMode 
                                    ? (settings.highContrast ? 'bg-blue-900 text-blue-300 border border-blue-500' : 'bg-blue-100 text-blue-700 border border-blue-300') 
                                    : (settings.highContrast ? 'text-slate-500 border border-slate-700' : 'text-slate-500 border border-slate-200')}`}
                                title="Check facts online"
                             >
                                 <Globe size={16} />
                                 {factCheckMode ? "Fact Check On" : "Fact Check"}
                             </button>
                        </div>

                         <div className={`flex-1 flex items-center gap-2 px-3 rounded-lg border ${settings.highContrast ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={factCheckMode ? "Verify what is being said..." : "Ask about the video context..."}
                                className="flex-1 bg-transparent outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleCaptureAndAsk()}
                            />
                            <button
                                onClick={toggleListening}
                                className={`p-1.5 rounded-full transition-all ${isListening 
                                    ? 'bg-red-500 text-white animate-pulse' 
                                    : (settings.highContrast ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600')}`}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                         </div>

                        <button 
                            onClick={handleCaptureAndAsk}
                            disabled={isAnalyzing || !input}
                            className={`px-6 rounded-lg font-bold flex items-center gap-2 transition-all flex-shrink-0
                                ${settings.highContrast 
                                    ? 'bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300'}`}
                        >
                            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : (mode === 'file' ? <Camera size={18} /> : <MessageSquare size={18} />)}
                            {mode === 'file' ? "Analyze Frame" : "Analyze Context"}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Disclaimer for YouTube Mode */}
            {mode === 'youtube' && ytId && (
                <div className={`mt-2 flex items-center gap-2 text-[10px] px-2 ${settings.highContrast ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Info size={12} />
                    <span>
                        <strong>Note:</strong> YouTube analysis relies on captions and public metadata. For precise pixel-level analysis of diagrams or handwriting, please <strong>Upload Video</strong> file directly.
                    </span>
                </div>
            )}
        </div>

        {/* RIGHT: Context Chat */}
        <div className={`flex-1 rounded-xl border flex flex-col overflow-hidden max-w-md ${panelBg}`}>
            <div className={`p-4 border-b flex items-center gap-2 font-bold opacity-80 ${settings.highContrast ? 'border-slate-800' : 'border-slate-200'}`}>
                <MessageSquare size={18} /> 
                {mode === 'file' ? "Visual Frame Analysis" : "Video Context Search"}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.timestamp !== undefined && (
                            <span className="text-[10px] opacity-50 mb-1">
                                At {new Date(msg.timestamp * 1000).toISOString().substr(14, 5)}
                            </span>
                        )}
                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[95%] p-3 rounded-lg text-sm ${
                                msg.role === 'user' 
                                ? (settings.highContrast ? 'bg-yellow-900 text-yellow-100' : 'bg-blue-600 text-white')
                                : (settings.highContrast ? 'bg-slate-800 text-slate-200' : 'bg-white shadow-sm text-slate-800')
                            }`}>
                                <MarkdownRenderer content={msg.text} highContrast={settings.highContrast} />
                                
                                {/* DETECTED TEXT OVERLAY */}
                                {msg.videoAnalysis?.ocrText && (
                                    <div className={`mt-3 p-2 rounded text-xs border-l-2 ${settings.highContrast ? 'bg-slate-900 border-slate-500 text-slate-300' : 'bg-slate-50 border-slate-400 text-slate-600'}`}>
                                        <div className="font-bold flex items-center gap-1 mb-1 opacity-80"><FileText size={10}/> AI Read from Screen:</div>
                                        <p className="font-mono">{msg.videoAnalysis.ocrText}</p>
                                    </div>
                                )}

                                {/* FACT CHECK OVERLAY */}
                                {msg.videoAnalysis?.factChecks && msg.videoAnalysis.factChecks.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {msg.videoAnalysis.factChecks.map((fact, i) => (
                                            <div key={i} className={`p-2 rounded text-xs border-l-2 ${
                                                fact.verdict === 'verified' 
                                                    ? (settings.highContrast ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-500')
                                                    : (settings.highContrast ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-500')
                                            }`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold">Claim: "{fact.claim}"</span>
                                                    {fact.verdict === 'verified' 
                                                        ? <ShieldCheck size={12} className="text-green-500" />
                                                        : <AlertTriangle size={12} className="text-red-500" />
                                                    }
                                                </div>
                                                <p className="opacity-90">{fact.verdict === 'verified' ? "✅ Verified" : `⚠️ ${fact.correction}`}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className={`mt-2 pt-2 border-t ${settings.highContrast ? 'border-slate-700' : 'border-blue-400/30'}`}>
                                        <p className="text-[10px] font-bold mb-1 flex items-center gap-1 opacity-80"><Globe size={10} /> Sources:</p>
                                        <ul className="space-y-1">
                                            {msg.sources.map((src, i) => (
                                                <li key={i}>
                                                    <a 
                                                        href={src.uri} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className={`text-[10px] hover:underline truncate block ${settings.highContrast ? 'text-blue-300' : 'text-blue-100'}`}
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
                ))}
                <div ref={chatEndRef} />
            </div>
        </div>
      </div>
    </div>
  );
};