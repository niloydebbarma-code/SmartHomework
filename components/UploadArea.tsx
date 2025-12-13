import React, { useRef, useState, useEffect } from 'react';
import { Upload, FileImage, FileText, Type as TypeIcon, Loader2, Mic, MicOff, Video, File } from 'lucide-react';
import { InputMode } from '../types';

interface Props {
  onFileSelect: (file: File) => void;
  onTextSubmit: (text: string) => void;
  isLoading: boolean;
  highContrast: boolean;
  loadingMessage?: string;
  // New Props for Reusability
  accept?: string;
  title?: string;
  subtitle?: string;
  disableTextMode?: boolean;
}

export const UploadArea: React.FC<Props> = ({ 
    onFileSelect, 
    onTextSubmit, 
    isLoading, 
    highContrast, 
    loadingMessage,
    accept = "image/*,application/pdf",
    title = "Drag & Drop Homework",
    subtitle = "Supports Images and PDFs",
    disableTextMode = false
}) => {
  const [mode, setMode] = useState<InputMode>('file');
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
          alert("Browser does not support voice input.");
          return;
      }

      if (!recognitionRef.current) {
          // Lazy Initialization
          const SpeechRecognition = (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event: any) => {
               let finalTranscript = '';
               for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  }
              }
              if (finalTranscript) {
                  setTextInput(prev => `${prev} ${finalTranscript}`);
              }
          };
          
          recognitionRef.current.onerror = (event: any) => {
              console.error("Speech Recognition Error:", event.error);
              setIsListening(false);
          };

          recognitionRef.current.onend = () => {
               setIsListening(false);
          };
      }

      try {
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
      } catch (error) {
        console.error("Failed to toggle speech recognition:", error);
        setIsListening(false);
      }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleSubmitText = () => {
    if (textInput.trim()) {
      onTextSubmit(textInput);
    }
  };

  const borderColor = highContrast ? 'border-yellow-400' : 'border-blue-500';
  const bgColor = highContrast ? (dragActive ? 'bg-slate-800' : 'bg-black') : (dragActive ? 'bg-blue-50' : 'bg-white');
  const textColor = highContrast ? 'text-yellow-300' : 'text-slate-600';
  const tabActive = highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-100 text-blue-700';
  const tabInactive = highContrast ? 'text-yellow-200 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50';

  // Determine Icon based on accept type
  const MainIcon = accept.includes('video') ? Video : (accept.includes('image') ? Upload : File);

  if (isLoading) {
     return (
        <div className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center ${borderColor} ${highContrast ? 'bg-black' : 'bg-white'}`}>
            <div className={`mb-4 relative`}>
                 <Loader2 className={`w-12 h-12 animate-spin ${highContrast ? 'text-yellow-400' : 'text-blue-500'}`} />
            </div>
            <p className={`text-lg font-medium ${textColor} animate-pulse`}>
                {loadingMessage || 'Analyzing Content...'}
            </p>
            <p className={`text-sm mt-2 ${highContrast ? 'text-yellow-200' : 'text-slate-400'}`}>
                Gemini is acting as a specialized tutor
            </p>
        </div>
     )
  }

  return (
    <div className="w-full">
        {/* Tabs - Only show if text mode is enabled */}
        {!disableTextMode && (
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setMode('file')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'file' ? tabActive : tabInactive}`}
                >
                    <FileImage size={18} /> File Upload
                </button>
                <button 
                    onClick={() => setMode('text')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'text' ? tabActive : tabInactive}`}
                >
                    <TypeIcon size={18} /> Text / Paste
                </button>
            </div>
        )}

        {(mode === 'file' || disableTextMode) ? (
            <div 
            className={`relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer
                ${borderColor} ${bgColor}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            aria-label="Upload file"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                inputRef.current?.click();
                }
            }}
            >
            <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                accept={accept} 
                onChange={handleChange} 
            />
            
            <MainIcon className={`w-12 h-12 mb-4 ${highContrast ? 'text-yellow-400' : 'text-blue-500'}`} />
            <p className={`text-lg font-medium mb-2 ${textColor}`}>
                {title}
            </p>
            <p className={`text-sm ${highContrast ? 'text-yellow-200' : 'text-slate-400'}`}>
                {subtitle}
            </p>
            </div>
        ) : (
            <div className={`relative w-full h-64 border-2 rounded-xl p-4 flex flex-col ${borderColor} ${highContrast ? 'bg-black' : 'bg-white'}`}>
                <textarea 
                    className={`flex-1 w-full resize-none bg-transparent outline-none ${textColor} placeholder-opacity-50 ${highContrast ? 'placeholder-yellow-700' : 'placeholder-slate-400'}`}
                    placeholder="Type, paste, or dictate content here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                />
                
                <div className="flex justify-between items-center mt-2">
                    <button
                        onClick={toggleListening}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                           ${isListening 
                             ? 'bg-red-500 text-white animate-pulse' 
                             : (highContrast ? 'bg-slate-800 text-yellow-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                    >
                         {isListening ? <><MicOff size={14} /> Stop Recording</> : <><Mic size={14} /> Voice Input</>}
                    </button>

                    <button 
                        onClick={handleSubmitText}
                        disabled={!textInput.trim()}
                        className={`px-6 py-2 rounded-lg font-bold transition-colors
                            ${highContrast 
                                ? 'bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400'}`}
                    >
                        Analyze Text
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};