import React, { useState } from 'react';
import { UploadArea } from './UploadArea';
import { ImageViewer } from './ImageViewer';
import { ResultsPanel } from './ResultsPanel';
import { AccessibilitySettings, ProblemAnalysis, ChatMessage, AnalysisInput } from '../types';
import { analyzeHomework, initializeChat, generateVerifiedVisualAid } from '../services/geminiService';
import { convertPdfToImage, extractPdfText } from '../utils/pdfHelper';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  settings: AccessibilitySettings;
}

export const HomeworkHelper: React.FC<Props> = ({ settings }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null); 
  const [currentInput, setCurrentInput] = useState<AnalysisInput | null>(null);
  
  const [problems, setProblems] = useState<ProblemAnalysis[]>([]);
  const [modelUsed, setModelUsed] = useState<string | undefined>(undefined); // NEW STATE
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Analyzing...");
  const [error, setError] = useState<string | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleTextSubmit = async (text: string) => {
    setTextContent(text);
    setImageUrl(null); 
    const input: AnalysisInput = { type: 'text', data: text };
    setCurrentInput(input);
    startAnalysis(input);
  };

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage("Processing file...");
    setError(null);
    setProblems([]);
    setModelUsed(undefined);
    setChatMessages([]);
    setTextContent(null);

    try {
      if (file.type === 'application/pdf') {
        try {
          // 1. Convert to Image for Visual UI
          const imageBase64DataUrl = await convertPdfToImage(file);
          
          // 2. Extract Text for Better AI Context
          let extractedText = undefined;
          try {
             extractedText = await extractPdfText(file);
             console.log("PDF text extracted:", extractedText.length, "chars");
          } catch(e) { 
             console.warn("Text extract failed", e); 
          }

          setImageUrl(imageBase64DataUrl);
          const base64Data = imageBase64DataUrl.split(',')[1];
          const input: AnalysisInput = { 
              type: 'image', 
              data: base64Data, 
              mimeType: 'image/jpeg',
              textContext: extractedText // Pass text context
          };
          setCurrentInput(input);
          await startAnalysis(input);
        } catch (pdfError) {
          console.error(pdfError);
          setError("Could not read PDF. Ensure it is a valid PDF file.");
          setIsLoading(false);
        }
      } else {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          const input: AnalysisInput = { type: 'image', data: base64Data, mimeType: file.type };
          setCurrentInput(input);
          await startAnalysis(input);
        };
      }
    } catch (err) {
      console.error(err);
      setError("Error reading file.");
      setIsLoading(false);
    }
  };

  const handleReanalyze = () => {
    if (currentInput) {
        startAnalysis(currentInput);
    }
  };

  const startAnalysis = async (input: AnalysisInput) => {
    setIsLoading(true);
    setLoadingMessage("Starting analysis...");
    setProblems([]);
    setModelUsed(undefined);
    setError(null);
    
    try {
        await initializeChat(input, (msg) => setLoadingMessage(msg));
        const result = await analyzeHomework(input, (msg) => setLoadingMessage(msg));
        setProblems(result.problems);
        setModelUsed(result.modelUsed);
        
        if (settings.audioEnabled) {
          let msg = "";
          if (result.hasStudentSolution) {
             const incorrectCount = result.problems.filter(p => p.isCorrect === false).length;
             msg = `Analysis complete using ${result.modelUsed}. Found ${result.problems.length} problems. ${incorrectCount} need attention.`;
          } else {
             msg = `Analysis complete using ${result.modelUsed}. I found ${result.problems.length} problems and have prepared solutions and teaching materials for them.`;
          }
          const utterance = new SpeechSynthesisUtterance(msg);
          window.speechSynthesis.speak(utterance);
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to analyze content. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateVisual = async (problemId: number, prompt: string) => {
    try {
        const problem = problems.find(p => p.id === problemId);
        const context = problem?.problemStatement || prompt;
        const domainContext = (problem?.subject && problem?.topic) 
            ? { subject: problem.subject, topic: problem.topic } 
            : undefined;

        const result = await generateVerifiedVisualAid(context, prompt, domainContext);
        
        setProblems(prev => prev.map(p => 
            p.id === problemId ? { 
              ...p, 
              visualAidType: result.type,
              generatedVisualContent: result.content,
              visualValidation: result.validation
            } : p
        ));
    } catch (err) {
        console.error("Failed to generate visual", err);
    }
  };

  const resetApp = () => {
    setImageUrl(null);
    setTextContent(null);
    setProblems([]);
    setModelUsed(undefined);
    setChatMessages([]);
    setSelectedProblemId(null);
    setError(null);
    setCurrentInput(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
      {/* Left Column: Image/Upload */}
      <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
        {!imageUrl && !textContent ? (
          <div className="flex-1 flex flex-col justify-center">
            <div className="max-w-xl mx-auto w-full">
              <h2 className={`text-3xl font-bold mb-4 text-center ${settings.highContrast ? 'text-white' : 'text-slate-900'}`}>
                Instant AI Homework Help
              </h2>
              <p className={`text-center mb-8 ${settings.highContrast ? 'text-slate-300' : 'text-slate-600'}`}>
                Upload a photo, PDF, or paste text. 
                Get instant corrections with visual guides.
              </p>
              <UploadArea 
                onFileSelect={handleFileSelect} 
                onTextSubmit={handleTextSubmit}
                isLoading={isLoading} 
                highContrast={settings.highContrast}
                loadingMessage={loadingMessage}
              />
              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={resetApp}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors
                  ${settings.highContrast 
                    ? 'bg-slate-800 text-white hover:bg-slate-700' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                ← Upload New
              </button>
              {isLoading && (
                <span className="flex items-center gap-2 text-sm font-semibold animate-pulse text-blue-500">
                    <Loader2 size={16} className="animate-spin" />
                    {loadingMessage || 'Analyzing...'}
                </span>
              )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            
            <div className={`flex-1 overflow-y-auto min-h-0 rounded-xl ${textContent ? 'p-6 border ' + (settings.highContrast ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white') : ''}`}>
              {imageUrl ? (
                 <ImageViewer 
                    imageUrl={imageUrl} 
                    problems={problems} 
                    selectedProblemId={selectedProblemId}
                    onSelectProblem={setSelectedProblemId}
                    highContrast={settings.highContrast}
                />
              ) : (
                <div className={`whitespace-pre-wrap ${settings.highContrast ? 'text-slate-200' : 'text-slate-700'}`}>
                    <MarkdownRenderer content={textContent || ''} highContrast={settings.highContrast} />
                </div>
              )}
             
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Results */}
      <div className={`lg:col-span-5 h-full rounded-2xl overflow-hidden shadow-sm border
        ${settings.highContrast ? 'bg-black border-slate-800' : 'bg-white border-slate-200'}`}>
        <ResultsPanel 
          problems={problems}
          modelUsed={modelUsed} // PASS MODEL INFO
          selectedProblemId={selectedProblemId}
          onSelectProblem={setSelectedProblemId}
          settings={settings}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          onGenerateVisual={handleGenerateVisual}
          onReanalyze={currentInput ? handleReanalyze : undefined}
        />
      </div>
    </div>
  );
};