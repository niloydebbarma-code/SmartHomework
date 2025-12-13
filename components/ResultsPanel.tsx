import React, { useState, useEffect } from 'react';
import { ProblemAnalysis, AccessibilitySettings, ChatMessage } from '../types';
import { CheckCircle2, XCircle, ChevronRight, Volume2, MessageSquare, ListChecks, Lightbulb, BookOpen, ShieldCheck, AlertTriangle, Code2, ImagePlus, Loader2, RefreshCw, Tag, Zap, BrainCircuit } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  problems: ProblemAnalysis[];
  modelUsed?: string; // NEW PROP
  selectedProblemId: number | null;
  onSelectProblem: (id: number) => void;
  settings: AccessibilitySettings;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onGenerateVisual?: (problemId: number, prompt: string) => void;
  onReanalyze?: () => void;
}

export const ResultsPanel: React.FC<Props> = ({ 
  problems, 
  modelUsed,
  selectedProblemId, 
  onSelectProblem,
  settings,
  chatMessages,
  setChatMessages,
  onGenerateVisual,
  onReanalyze
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [showRaw, setShowRaw] = useState<Record<number, boolean>>({}); 
  const [loadingVisuals, setLoadingVisuals] = useState<Record<number, boolean>>({});
  const { highContrast, fontSize, audioEnabled } = settings;

  const textSizeClass = fontSize === 'normal' ? 'text-base' 
    : fontSize === 'large' ? 'text-lg' 
    : 'text-xl';
  
  const headerSizeClass = fontSize === 'normal' ? 'text-lg' 
    : fontSize === 'large' ? 'text-xl' 
    : 'text-2xl';

  const speak = (text: string) => {
    if (!audioEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const toggleRaw = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setShowRaw(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVisualClick = async (e: React.MouseEvent, problem: ProblemAnalysis) => {
    e.stopPropagation();
    if (!problem.visualAidPrompt || !onGenerateVisual) return;
    
    setLoadingVisuals(prev => ({ ...prev, [problem.id]: true }));
    await onGenerateVisual(problem.id, problem.visualAidPrompt);
    setLoadingVisuals(prev => ({ ...prev, [problem.id]: false }));
  };

  useEffect(() => {
    if (selectedProblemId && audioEnabled && activeTab === 'analysis') {
      const problem = problems.find(p => p.id === selectedProblemId);
      if (problem) {
        let text = `Problem ${problem.id}. `;
        if (problem.isCorrect === true) text += "Correct. ";
        else if (problem.isCorrect === false) text += "Needs work. ";
        else text += "Here is the solution. ";
        
        text += problem.explanation;
        speak(text);
      }
    }
  }, [selectedProblemId, audioEnabled, problems, activeTab]);

  const textColor = highContrast ? 'text-white' : 'text-slate-800';
  const subTextColor = highContrast ? 'text-slate-300' : 'text-slate-600';
  const cardBg = highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const selectedBorder = highContrast ? 'border-yellow-400' : 'border-blue-500';
  const tabActive = highContrast ? 'bg-yellow-400 text-black shadow-sm' : 'bg-white text-blue-600 shadow-sm';
  const tabInactive = highContrast ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700';

  if (problems.length === 0 && activeTab === 'analysis') {
    return (
      <div className={`h-full flex items-center justify-center p-8 text-center ${subTextColor}`}>
        <p>Upload content to see results or start a chat.</p>
      </div>
    );
  }

  // Model Badge Helper
  const ModelBadge = ({ model }: { model: string }) => {
      const isPro = model.includes('pro') || model.includes('3');
      const badgeClass = isPro 
        ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white')
        : (highContrast ? 'bg-slate-700 text-slate-300' : 'bg-blue-500 text-white');
      
      const icon = isPro ? <BrainCircuit size={12} /> : <Zap size={12} />;
      const label = isPro ? "Gemini 3 Pro" : "Gemini 2.5 Flash";

      return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
              {icon} {label}
          </span>
      );
  };

  return (
    <div className="flex flex-col h-full">
        <div className={`flex p-1 mb-2 rounded-lg mx-2 mt-2 ${highContrast ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button 
                onClick={() => setActiveTab('analysis')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'analysis' ? tabActive : tabInactive}`}
            >
                <ListChecks size={16} /> Analysis
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'chat' ? tabActive : tabInactive}`}
            >
                <MessageSquare size={16} /> Ask AI
            </button>
        </div>

        {activeTab === 'chat' ? (
            <div className="flex-1 overflow-hidden p-2">
                <ChatPanel messages={chatMessages} setMessages={setChatMessages} settings={settings} />
            </div>
        ) : (
            <div className={`space-y-4 ${textSizeClass} flex-1 overflow-y-auto px-4 pb-10`}>
                <div className="flex flex-col gap-2 mb-4 mt-2">
                    <div className="flex items-center justify-between">
                        <h2 className={`${headerSizeClass} font-bold ${textColor} flex items-center gap-2`}>
                            Results
                            <span className={`text-sm font-normal px-2 py-1 rounded-full ${highContrast ? 'bg-slate-800 text-yellow-300' : 'bg-blue-100 text-blue-700'}`}>
                            {problems.length} Problems
                            </span>
                        </h2>
                        
                        {onReanalyze && (
                            <button 
                                onClick={onReanalyze}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all
                                ${highContrast 
                                    ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 border border-slate-700' 
                                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-slate-200 shadow-sm'}`}
                            >
                                <RefreshCw size={14} /> Re-analyze
                            </button>
                        )}
                    </div>
                    {/* Explicitly show model used for analysis */}
                    {modelUsed && (
                        <div className="flex items-center gap-2 text-xs opacity-75">
                            <span className={subTextColor}>Analyzed with:</span>
                            <ModelBadge model={modelUsed} />
                        </div>
                    )}
                </div>

                {problems.map((problem) => {
                    const isSelected = selectedProblemId === problem.id;
                    const isTeachingMode = problem.isCorrect === null || problem.isCorrect === undefined;
                    const showDetails = isTeachingMode || !problem.isCorrect;
                    const isRaw = showRaw[problem.id];
                    const isLoadingImage = loadingVisuals[problem.id];

                    const isVerified = problem.validation?.status === 'verified';
                    const validationColor = isVerified ? 'text-emerald-500' : 'text-amber-500';

                    const visualVerified = problem.visualValidation?.isAccurate === true;
                    const visualCritique = problem.visualValidation?.critique;
                    const visualValidationColor = visualVerified 
                         ? (highContrast ? 'border-slate-800 bg-slate-900 text-emerald-400' : 'border-slate-100 bg-emerald-50 text-emerald-700')
                         : (highContrast ? 'border-amber-900 bg-amber-950 text-amber-500' : 'border-amber-100 bg-amber-50 text-amber-700');

                    return (
                    <div 
                        key={problem.id}
                        id={`problem-${problem.id}`}
                        onClick={() => onSelectProblem(problem.id)}
                        className={`
                        w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative
                        ${cardBg}
                        ${isSelected ? `${selectedBorder} shadow-md` : 'border-transparent hover:border-slate-300'}
                        `}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectProblem(problem.id)}
                    >
                        {/* Domain Badge - Credibility Indicator */}
                        {problem.subject && (
                             <div className="absolute top-0 right-0 p-4">
                                <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-bl-lg rounded-tr-lg
                                   ${highContrast ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                    <Tag size={10} /> {problem.subject} / {problem.topic}
                                </span>
                             </div>
                        )}

                        <div className="flex items-start justify-between mb-2 mt-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold ${headerSizeClass} ${textColor}`}>Problem {problem.id}</span>
                                    
                                    {isTeachingMode ? (
                                        <span className="flex items-center gap-1 text-purple-600 font-medium bg-purple-100 px-2 py-0.5 rounded-full text-xs">
                                            <BookOpen size={14} /> Teaching
                                        </span>
                                    ) : problem.isCorrect ? (
                                        <span className="flex items-center gap-1 text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full text-xs">
                                            <CheckCircle2 size={14} /> Correct
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded-full text-xs">
                                            <XCircle size={14} /> Needs Work
                                        </span>
                                    )}
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-medium ${validationColor}`}>
                                   {isVerified ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                                   {isVerified ? "AI Verified: Structure Safe" : "Review Formatting"}
                                   <span className={`${highContrast ? 'text-slate-500' : 'text-slate-400'}`}>• {problem.validation?.confidenceScore || 0}% Confidence</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-[-1rem]">
                                <button
                                    onClick={(e) => toggleRaw(e, problem.id)}
                                    className={`p-1.5 rounded-full transition-colors 
                                      ${isRaw 
                                        ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-blue-600 text-white') 
                                        : (highContrast ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-200')}`}
                                    title={isRaw ? "Show Rendered View" : "Show Raw Text (Troubleshoot)"}
                                >
                                    <Code2 size={18} />
                                </button>
                                {audioEnabled && (
                                    <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speak(problem.explanation);
                                    }}
                                    className={`p-1.5 rounded-full hover:bg-slate-200 transition-colors ${highContrast ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-400'}`}
                                    aria-label="Read explanation"
                                    >
                                    <Volume2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {isTeachingMode && problem.problemStatement && (
                             <div className={`mb-3 p-3 rounded-lg ${highContrast ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                <span className={`text-xs font-bold uppercase tracking-wider ${highContrast ? 'text-slate-400' : 'text-slate-500'}`}>Problem</span>
                                <div className={textColor}>
                                    {isRaw ? (
                                        <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">{problem.problemStatement}</pre>
                                    ) : (
                                        <MarkdownRenderer content={problem.problemStatement} highContrast={highContrast} />
                                    )}
                                </div>
                             </div>
                        )}

                        <div className={`${subTextColor} mb-3`}>
                           {isRaw ? (
                                <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto p-2 bg-slate-100 dark:bg-slate-800 rounded">{problem.explanation}</pre>
                           ) : (
                                <MarkdownRenderer content={problem.explanation} highContrast={highContrast} />
                           )}
                        </div>
                        
                        {problem.visualAidPrompt && !isRaw && (
                            <div className="mb-4">
                                {problem.generatedVisualContent ? (
                                    <div className={`rounded-lg overflow-hidden border shadow-sm mt-2 group relative ${highContrast ? 'border-slate-700 bg-black' : 'border-slate-200 bg-white'}`}>
                                        <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between ${highContrast ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                            <div className="flex items-center gap-2">
                                                <ImagePlus size={14} /> AI Generated Visual Aid
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Visual Model Badge */}
                                                {problem.visualValidation?.modelUsed && (
                                                    <ModelBadge model={problem.visualValidation.modelUsed} />
                                                )}
                                                <button 
                                                    onClick={(e) => handleVisualClick(e, problem)}
                                                    disabled={isLoadingImage}
                                                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${highContrast ? 'border-slate-600 hover:bg-slate-700 text-yellow-400' : 'border-slate-300 hover:bg-slate-200 text-slate-600'}`}
                                                >
                                                    <RefreshCw size={10} className={isLoadingImage ? 'animate-spin' : ''} /> Regenerate
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative w-full overflow-hidden bg-white p-2">
                                             {isLoadingImage && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                                                    <Loader2 className="animate-spin text-white" size={32} />
                                                </div>
                                             )}
                                             
                                             {problem.visualAidType === 'svg' ? (
                                                 <div 
                                                    className="w-full flex justify-center"
                                                    dangerouslySetInnerHTML={{ __html: problem.generatedVisualContent }} 
                                                 />
                                             ) : (
                                                 <img src={problem.generatedVisualContent} alt="AI Generated Diagram" className="w-full h-auto bg-white" />
                                             )}
                                        </div>
                                        <div className={`px-3 py-2 border-t flex flex-col gap-1 text-xs font-medium ${visualValidationColor}`}>
                                            <div className="flex items-center gap-2">
                                                {visualVerified ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                                                {visualVerified ? "AI Visual Verified: Correct" : "Potential Inaccuracies Detected"}
                                            </div>
                                            {!visualVerified && visualCritique && (
                                                <div className="pl-6 opacity-90 text-[11px] leading-tight">
                                                    AI Note: {visualCritique}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={(e) => handleVisualClick(e, problem)}
                                        disabled={isLoadingImage}
                                        className={`w-full py-2 px-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-all
                                        ${highContrast 
                                            ? 'border-slate-700 text-yellow-300 hover:bg-slate-800' 
                                            : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'}`}
                                    >
                                        {isLoadingImage ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" /> Verifying Visual Aid...
                                            </>
                                        ) : (
                                            <>
                                                <ImagePlus size={16} /> Generate & Verify Visual Aid
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {problem.keyConcepts && problem.keyConcepts.length > 0 && !isRaw && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {problem.keyConcepts.map((concept, idx) => (
                                    <span key={idx} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1
                                        ${highContrast ? 'bg-slate-800 text-yellow-300' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                        <Lightbulb size={12} /> {concept}
                                    </span>
                                ))}
                            </div>
                        )}

                        {showDetails && isSelected && (
                        <div className={`mt-4 pt-4 border-t ${highContrast ? 'border-slate-700' : 'border-slate-100'}`}>
                            <h4 className={`font-semibold mb-3 ${highContrast ? 'text-yellow-300' : 'text-blue-600'}`}>
                                {isTeachingMode ? "Complete Solution:" : "Step-by-Step Correction:"}
                            </h4>
                            <ul className="space-y-3">
                            {problem.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-3">
                                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold 
                                    ${highContrast ? 'bg-slate-700 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                    {idx + 1}
                                </span>
                                <div className={`flex-1 ${textColor}`}>
                                    {isRaw ? (
                                        <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto bg-slate-50 dark:bg-slate-800 p-2 rounded">{step}</pre>
                                    ) : (
                                        <MarkdownRenderer content={step} highContrast={highContrast} />
                                    )}
                                </div>
                                </li>
                            ))}
                            </ul>
                        </div>
                        )}
                        
                        {showDetails && !isSelected && (
                        <div className={`mt-2 text-sm font-medium flex items-center ${highContrast ? 'text-yellow-400' : 'text-blue-500'}`}>
                            Click to see solution <ChevronRight size={16} />
                        </div>
                        )}
                    </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
