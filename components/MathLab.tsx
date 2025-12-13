
import React, { useState, useRef, useEffect } from 'react';
import { AccessibilitySettings, MathLabResponse } from '../types';
import { Calculator, Code2, Play, Terminal, ArrowRight, Loader2, Sparkles, Sigma, FunctionSquare, Braces, Binary, Laptop2, Check, RefreshCw, X, ArrowDown, Grid3X3, Pi, Divide, BrainCircuit, Zap, Globe, Mic, MicOff, ShieldCheck, Wrench, Trash2, LineChart, Wand2 } from 'lucide-react';
import { solveMathWithCode, convertTextToMath } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Props {
  settings: AccessibilitySettings;
}

interface HistoryItem {
    problem: string;
    solution: MathLabResponse;
    mode: 'smart' | 'code';
}

type SymbolCategory = 'basic' | 'trig' | 'calc' | 'algebra' | 'greek';

export const MathLab: React.FC<Props> = ({ settings }) => {
  const [mode, setMode] = useState<'smart' | 'code'>('smart');
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [codeHistory, setCodeHistory] = useState<string[]>([]); // Stateful Execution
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SymbolCategory>('basic');
  const [useSearch, setUseSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Preview State for Smart Mode
  const [previewLatex, setPreviewLatex] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleConvert = async () => {
      if (!input.trim()) return;
      setConverting(true);
      try {
          const latex = await convertTextToMath(input);
          setPreviewLatex(latex);
      } catch(e) { 
          console.error(e);
      } finally {
          setConverting(false);
      }
  };

  const handleSolve = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
        // Pass codeHistory for stateful execution in Code Mode
        const historyToPass = mode === 'code' ? codeHistory : [];
        const response = await solveMathWithCode(input, previewLatex || undefined, useSearch, historyToPass);
        
        setHistory(prev => [{ problem: input, solution: response, mode }, ...prev]);
        
        // Append successful code to history for next time
        if (mode === 'code' && response.pythonCode) {
            setCodeHistory(prev => [...prev, response.pythonCode]);
        }

        setInput("");
        setPreviewLatex(null); 
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleClearMemory = () => {
      setCodeHistory([]);
      setHistory([]);
  };

  const handleClearPreview = () => {
      setPreviewLatex(null);
  };

  const handleDemo = () => {
      if (mode === 'smart') {
          setInput("Plot the function f(x) = sin(x) * x from -20 to 20. Show the grid.");
      } else {
          setInput(`from sympy import symbols, Eq, solve, N

# Variable
x = symbols('x')

# Equation: x^3 + x^2 + 2x = 8 + 5x
equation = Eq(x**3 + x**2 + 2*x, 8 + 5*x)

# Solve symbolically
solutions = solve(equation)

print("Symbolic roots:")
for s in solutions:
    print(s)

print("\\nNumeric roots:")
for s in solutions:
    print(N(s, 12))`);
      }
  };

  const insertSymbol = (val: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
        setInput(prev => prev + val);
        return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = input;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setInput(before + val + after);
    
    // Restore focus and cursor position
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + val.length, start + val.length);
    }, 0);
  };

  const bgColor = settings.highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900';
  const cardBg = settings.highContrast ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const codeBg = settings.highContrast ? 'bg-black border-slate-700' : 'bg-slate-900 text-slate-50 border-slate-800';
  const accentText = settings.highContrast ? 'text-yellow-400' : 'text-purple-600';
  const accentBg = settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-purple-600 text-white';

  const symbolCategories: Record<SymbolCategory, {label: string, syms: {l: string, v: string}[]}> = {
    basic: {
      label: 'Basic',
      syms: [
        { l: '+', v: '+' }, { l: '-', v: '-' }, { l: '×', v: '×' }, { l: '÷', v: '÷' },
        { l: '=', v: '=' }, { l: '≠', v: '≠' }, { l: '≈', v: '≈' },
        { l: '(', v: '(' }, { l: ')', v: ')' }, { l: '[', v: '[' }, { l: ']', v: ']' },
        { l: '{', v: '{' }, { l: '}', v: '}' }, { l: '^', v: '^' },
      ]
    },
    algebra: {
      label: 'Algebra',
      syms: [
        { l: 'x²', v: '²' }, { l: 'x³', v: '³' }, { l: 'x⁻¹', v: '⁻¹' },
        { l: '√', v: '√' }, { l: '∛', v: '∛' }, { l: '|x|', v: '|' },
        { l: 'log', v: 'log(' }, { l: 'ln', v: 'ln(' }, { l: 'e', v: 'e' },
        { l: '!', v: '!' }, { l: '∞', v: '∞' }, { l: 'mod', v: 'mod' },
      ]
    },
    trig: {
      label: 'Trig',
      syms: [
        { l: 'sin', v: 'sin(' }, { l: 'cos', v: 'cos(' }, { l: 'tan', v: 'tan(' },
        { l: 'sin⁻¹', v: 'sin⁻¹(' }, { l: 'cos⁻¹', v: 'cos⁻¹(' }, { l: 'tan⁻¹', v: 'tan⁻¹(' },
        { l: 'csc', v: 'csc(' }, { l: 'sec', v: 'sec(' }, { l: 'cot', v: 'cot(' },
        { l: 'sinh', v: 'sinh(' }, { l: 'cosh', v: 'cosh(' }, { l: 'deg', v: '°' },
      ]
    },
    calc: {
      label: 'Calculus',
      syms: [
        { l: '∫', v: '∫ ' }, { l: '∫ab', v: '∫_{a}^{b} ' },
        { l: 'd/dx', v: 'd/dx ' }, { l: '∂', v: '∂' },
        { l: 'Σ', v: 'Σ ' }, { l: 'Π', v: 'Π ' },
        { l: 'lim', v: 'lim_{x→0} ' }, { l: '→', v: '→' }, { l: 'Δ', v: 'Δ' },
      ]
    },
    greek: {
      label: 'Symbols',
      syms: [
        { l: 'π', v: 'π' }, { l: 'θ', v: 'θ' }, { l: 'α', v: 'α' }, { l: 'β', v: 'β' },
        { l: 'λ', v: 'λ' }, { l: 'Ω', v: 'Ω' }, { l: 'μ', v: 'μ' },
        { l: '≤', v: '≤' }, { l: '≥', v: '≥' }, { l: '±', v: '±' },
      ]
    }
  };

  const ModelBadge = ({ model }: { model: string }) => {
    const isPro = model.includes('pro') || model.includes('3');
    return (
        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded
            ${isPro ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {isPro ? <BrainCircuit size={12} /> : <Zap size={12} />} {model}
        </span>
    );
  };

  return (
    <div className={`h-full flex flex-col gap-6 ${bgColor}`}>
      
      {/* Mode Switcher */}
      <div className="flex justify-center mt-2">
         <div className={`flex p-1 rounded-xl border ${settings.highContrast ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button
                onClick={() => setMode('smart')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all
                ${mode === 'smart' 
                    ? (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-purple-600 text-white shadow-md') 
                    : 'opacity-60 hover:opacity-100'}`}
            >
                <Sparkles size={16} /> Math Converter
            </button>
            <button
                onClick={() => setMode('code')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all
                ${mode === 'code' 
                    ? (settings.highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white shadow-md') 
                    : 'opacity-60 hover:opacity-100'}`}
            >
                <Terminal size={16} /> Code Engine
            </button>
         </div>
      </div>

      {/* Input Section */}
      <div className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
         {mode === 'smart' ? (
             <>
                 <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${accentBg}`}>
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Math Converter & Solver</h2>
                            <p className={`text-sm ${settings.highContrast ? 'text-slate-400' : 'text-slate-500'}`}>
                                Write messy text or use the keypad. We convert, verify, then solve.
                            </p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        {/* Demo Button for Video Recording */}
                        <button
                            onClick={handleDemo}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                            ${settings.highContrast ? 'border-yellow-400 text-yellow-400' : 'bg-purple-100 text-purple-700 border-purple-200'}`}
                        >
                            <Wand2 size={14} /> Demo
                        </button>

                        {/* Search Toggle */}
                        <button
                            onClick={() => setUseSearch(!useSearch)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                            ${useSearch 
                                ? (settings.highContrast ? 'bg-blue-900 text-blue-300 border-blue-500' : 'bg-blue-100 text-blue-700 border-blue-300') 
                                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
                            title="Search for real-world values (e.g. population, exchange rates)"
                        >
                            <Globe size={16} />
                            {useSearch ? "Real-World Data On" : "Enable Data Search"}
                        </button>
                     </div>
                 </div>
                 
                 {/* Scientific Keypad Tabs */}
                 <div className="flex gap-1 mb-2 border-b border-opacity-10 border-slate-500 pb-1 overflow-x-auto">
                    {(Object.keys(symbolCategories) as SymbolCategory[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors
                                ${activeCategory === cat 
                                    ? (settings.highContrast ? 'bg-slate-800 text-yellow-400 border-b-2 border-yellow-400' : 'bg-purple-50 text-purple-700 border-b-2 border-purple-500')
                                    : 'opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            {symbolCategories[cat].label}
                        </button>
                    ))}
                 </div>

                 {/* Keypad Grid */}
                 <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 mb-4">
                    {symbolCategories[activeCategory].syms.map((sym, idx) => (
                        <button 
                            key={idx}
                            onClick={() => insertSymbol(sym.v)}
                            className={`h-9 rounded-md font-mono font-medium text-sm transition-colors border shadow-sm flex items-center justify-center
                                ${settings.highContrast 
                                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-yellow-300' 
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-purple-600 hover:border-purple-200'}`}
                        >
                            {sym.l}
                        </button>
                    ))}
                 </div>
             </>
         ) : (
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'}`}>
                        <Code2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Python Math Engine</h2>
                        <p className={`text-sm ${settings.highContrast ? 'text-slate-400' : 'text-slate-500'}`}>
                            Stateful Code Execution • Plotting Supported
                        </p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                     <button
                        onClick={handleDemo}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                        ${settings.highContrast ? 'border-yellow-400 text-yellow-400' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                        <Wand2 size={14} /> Demo
                    </button>
                    
                     {codeHistory.length > 0 && (
                         <button 
                            onClick={handleClearMemory}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                            ${settings.highContrast ? 'border-red-500 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                         >
                             <Trash2 size={14} /> Clear Memory
                         </button>
                     )}
                 </div>
             </div>
         )}

         <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <textarea 
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            mode === 'smart' 
                                ? (useSearch ? "e.g., Calculate (GDP of India / Population of USA)" : "e.g., ∫ sin(x) dx from 0 to π")
                                : "e.g., x = [1,2,3] or plot sin(x)..."
                        }
                        className={`w-full p-4 rounded-xl border outline-none font-medium font-mono resize-none h-28
                            ${settings.highContrast 
                                ? 'bg-black border-slate-700 text-white focus:border-yellow-400 placeholder-slate-600' 
                                : 'bg-slate-50 border-slate-300 focus:border-purple-500 focus:bg-white placeholder-slate-400'}`}
                    />
                    
                    {/* Voice Input Button for Math */}
                    <button
                        onClick={toggleListening}
                        className={`absolute bottom-3 right-3 p-2 rounded-full transition-all
                            ${isListening 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : (settings.highContrast ? 'bg-slate-800 text-slate-400 hover:text-yellow-400' : 'bg-slate-100 text-slate-400 hover:text-purple-600')}`}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                </div>
                
                {/* Primary Action Button Logic */}
                {mode === 'code' && (
                    <button 
                        onClick={handleSolve}
                        disabled={loading || !input}
                        className={`w-36 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all
                            ${settings.highContrast 
                                ? 'bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50' 
                                : 'bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Play size={24} />}
                        {loading ? "Running..." : "Run Code"}
                    </button>
                )}
                
                {mode === 'smart' && !previewLatex && (
                     <button 
                        onClick={handleConvert}
                        disabled={converting || !input}
                        className={`w-36 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all
                            ${settings.highContrast 
                                ? 'bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50' 
                                : 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400'}`}
                     >
                         {converting ? <Loader2 className="animate-spin" /> : <RefreshCw size={24} />}
                         {converting ? "Converting..." : "Convert"}
                     </button>
                )}
            </div>

            {/* Verification Bar (Only Smart Mode) */}
            {mode === 'smart' && previewLatex && (
                <div className={`relative p-1 rounded-xl animate-in slide-in-from-top-2 duration-300 border-2 border-dashed
                    ${settings.highContrast ? 'border-slate-700 bg-slate-900' : 'border-purple-200 bg-purple-50'}`}>
                    
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-1 border shadow-sm z-10">
                        <ArrowDown size={16} className={settings.highContrast ? 'text-black' : 'text-slate-400'} />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 p-4">
                        <div className="flex-1 w-full text-center md:text-left">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-2">Verify Conversion</span>
                            <div className={`text-xl font-medium px-4 py-2 rounded-lg inline-block ${settings.highContrast ? 'bg-black' : 'bg-white'}`}>
                                <MarkdownRenderer content={`$${previewLatex}$`} highContrast={settings.highContrast} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleClearPreview}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border transition-all
                                ${settings.highContrast 
                                    ? 'border-slate-600 hover:bg-slate-800 text-slate-300' 
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                            >
                                <X size={16} /> Edit
                            </button>
                            <button
                                onClick={handleSolve}
                                disabled={loading}
                                className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition-all
                                ${settings.highContrast 
                                    ? 'bg-green-500 text-black hover:bg-green-400' 
                                    : 'bg-green-600 text-white hover:bg-green-700'}`}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                {loading ? "Solving..." : "Verify & Solve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
         </div>
      </div>

      {/* History / Output Stream */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {history.map((item, idx) => (
            <div key={idx} className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                {/* Header varies by mode */}
                <div className={`p-3 border-b text-sm font-semibold flex items-center justify-center md:justify-between ${settings.highContrast ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                         {item.mode === 'smart' ? <Sparkles size={14} className="text-purple-500" /> : <Terminal size={14} className="text-slate-500" />}
                         {item.mode === 'smart' ? 'Smart Conversion' : 'Code Execution'} #{history.length - idx}
                    </div>
                    
                    <div className="hidden md:flex items-center gap-2">
                        {/* Auto-Repair Badge */}
                        {item.solution.wasAutoRepaired && (
                            <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded
                                ${settings.highContrast ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                <Wrench size={12} /> Code Auto-Repaired
                            </span>
                        )}
                        {/* Audit Passed Badge (Implied if we have a result) */}
                        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded
                            ${settings.highContrast ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            <ShieldCheck size={12} /> Logic Audit Passed
                        </span>
                        
                        {item.solution.modelUsed && <ModelBadge model={item.solution.modelUsed} />}
                    </div>
                </div>
                
                {item.mode === 'smart' ? (
                    // SMART MODE LAYOUT
                    <div className="p-6 grid grid-cols-1 gap-6">
                        {/* Top Row: Converter Visualization */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                <span className="text-xs uppercase font-bold opacity-50 tracking-wider block mb-1">You Wrote</span>
                                <p className="font-medium font-mono whitespace-pre-wrap">{item.problem}</p>
                            </div>
                            
                            <div className="flex justify-center opacity-50"><ArrowRight /></div>
                            
                            <div className={`p-4 rounded-xl relative overflow-hidden ${settings.highContrast ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-100'}`}>
                                <span className={`text-xs uppercase font-bold tracking-wider block mb-1 ${accentText}`}>AI Converted to Math</span>
                                <div className={`text-lg ${settings.highContrast ? 'text-white' : 'text-slate-900'}`}>
                                    <MarkdownRenderer content={`$${item.solution.latex}$`} highContrast={settings.highContrast} />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: Solution & Logic */}
                        <div className={`rounded-xl p-5 border ${settings.highContrast ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <span className={`text-xs uppercase font-bold tracking-wider mb-2 block ${accentText}`}>
                                        Final Answer
                                    </span>
                                    <div className={`text-3xl font-bold font-mono mb-4 ${settings.highContrast ? 'text-white' : 'text-purple-900'}`}>
                                        {item.solution.result}
                                    </div>
                                    <div className="text-sm leading-relaxed opacity-90">
                                        <MarkdownRenderer content={item.solution.explanation} highContrast={settings.highContrast} />
                                        {/* Show sources if real-world data was used */}
                                        {item.solution.sources && item.solution.sources.length > 0 && (
                                            <div className={`mt-3 pt-2 border-t text-xs ${settings.highContrast ? 'border-slate-700' : 'border-slate-200'}`}>
                                                <p className="font-bold mb-1 flex items-center gap-1 opacity-80"><Globe size={10} /> Data Sources:</p>
                                                <ul className="space-y-1">
                                                    {item.solution.sources.map((src, i) => (
                                                        <li key={i}>
                                                            <a 
                                                                href={src.uri} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className={`hover:underline truncate block ${settings.highContrast ? 'text-blue-300' : 'text-blue-600'}`}
                                                            >
                                                                {src.title || src.uri}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* GENERATED PLOT FOR SMART MODE */}
                                    {item.solution.plotSvg && (
                                        <div className="mt-6 pt-6 border-t border-opacity-10 border-slate-500">
                                            <span className={`text-xs uppercase font-bold tracking-wider mb-4 block flex items-center gap-2 ${accentText}`}>
                                                <LineChart size={14} /> Generated Visual
                                            </span>
                                            <div className="rounded-lg overflow-hidden border bg-white flex justify-center p-4">
                                                <div dangerouslySetInnerHTML={{ __html: item.solution.plotSvg }} className="max-w-full" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Hidden Code Toggle */}
                                <div className="hidden lg:block w-1/3">
                                    <div className={`text-xs uppercase font-bold opacity-50 tracking-wider mb-2 flex items-center gap-1`}>
                                        <Code2 size={12} /> Behind the Scenes
                                    </div>
                                    <div className={`p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto opacity-70 hover:opacity-100 transition-opacity ${codeBg}`}>
                                        <pre>{item.solution.pythonCode}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // CODE MODE LAYOUT (Cleaned Up)
                    <div className="p-6 flex flex-col gap-6">
                        
                        {/* 1. Input Code (Collapsed) */}
                        <div className="opacity-70 hover:opacity-100 transition-opacity">
                            <span className="text-xs uppercase font-bold opacity-50 tracking-wider flex items-center gap-1 mb-2">
                                <Code2 size={12} /> Python Script Executed
                            </span>
                            <div className={`p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-32 ${codeBg}`}>
                                <pre>{item.solution.pythonCode}</pre>
                            </div>
                        </div>

                        {/* 2. Visual Plot Area (If Available) */}
                        {item.solution.plotSvg && (
                            <div className={`rounded-xl border overflow-hidden ${settings.highContrast ? 'border-slate-700 bg-black' : 'border-slate-200 bg-white'}`}>
                                <div className={`p-2 border-b text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${settings.highContrast ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <LineChart size={14} /> Generated Graph
                                </div>
                                <div className="p-4 flex justify-center bg-white">
                                    <div dangerouslySetInnerHTML={{ __html: item.solution.plotSvg }} className="max-w-full" />
                                </div>
                            </div>
                        )}

                        {/* 3. Main Result Display */}
                        <div className={`rounded-xl p-6 ${settings.highContrast ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div className="mb-2">
                                <span className={`text-xs uppercase font-bold tracking-wider mb-2 block ${settings.highContrast ? 'text-green-400' : 'text-slate-600'}`}>
                                    Result
                                </span>
                                <div className={`text-2xl font-bold font-mono whitespace-pre-wrap ${settings.highContrast ? 'text-white' : 'text-slate-900'}`}>
                                    {item.solution.result || "Executed Successfully (No output printed)"}
                                </div>
                            </div>
                            
                            {/* Logic Explanation (Only show if substantially different from result to avoid duplication) */}
                            {item.solution.explanation && item.solution.explanation.length > item.solution.result.length + 10 && (
                                <div className="mt-4 pt-4 border-t border-opacity-10 border-slate-500">
                                    <span className="text-xs uppercase font-bold opacity-50 tracking-wider mb-1 block">Context</span>
                                    <div className="text-sm leading-relaxed opacity-80">
                                        <MarkdownRenderer content={item.solution.explanation} highContrast={settings.highContrast} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        ))}

        {history.length === 0 && (
            <div className={`text-center py-12 opacity-50 ${settings.highContrast ? 'text-slate-500' : 'text-slate-400'}`}>
                <div className="flex justify-center gap-4 mb-4">
                    {mode === 'smart' ? (
                        <>
                            <FunctionSquare size={32} />
                            <Braces size={32} />
                        </>
                    ) : (
                        <>
                             <Terminal size={32} />
                             <Laptop2 size={32} />
                        </>
                    )}
                </div>
                <p>
                    {mode === 'smart' 
                     ? "Paste messy text or use the keypad to build equations."
                     : "Waiting for code input. Try 'plot sin(x)' or define variables."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
