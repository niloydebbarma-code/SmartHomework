import React from 'react';
import { AccessibilitySettings } from '../types';
import { BrainCircuit, Heart, Shield, Zap, Globe, Eye, Volume2, Cpu, AlertTriangle, Fingerprint, FlaskConical, CheckCircle2, XCircle, HelpCircle, ServerCrash, Microscope, FileWarning, Rocket, FileText, Layers, Clock } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  settings: AccessibilitySettings;
}

export const AboutPage: React.FC<Props> = ({ settings }) => {
  const textColor = settings.highContrast ? 'text-white' : 'text-slate-800';
  const subTextColor = settings.highContrast ? 'text-slate-300' : 'text-slate-600';
  const cardBg = settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const warningBg = settings.highContrast ? 'bg-red-900/20 border-red-500' : 'bg-orange-50 border-orange-200';
  
  const tableHeaderClass = settings.highContrast ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200';
  const tableCellClass = settings.highContrast ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600';

  return (
    <div className={`max-w-5xl mx-auto space-y-16 animate-in fade-in duration-500 pb-20`}>
      
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8">
        <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 p-4 ${settings.highContrast ? 'bg-slate-800' : 'bg-white shadow-xl'}`}>
           <Logo className="w-full h-full" />
        </div>
        <div className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-200">
            Proof of Concept • Demo Version
        </div>
        <h1 className={`text-5xl font-bold ${textColor}`}>About SmartHomework</h1>
        <p className={`text-xl max-w-3xl mx-auto ${subTextColor} leading-relaxed`}>
          An experimental AI Tutor built to demonstrate the future of accessible, personalized education using Google's Gemini 3 models.
        </p>
      </div>

      {/* SECTION 1: CRITICAL WARNING - DETAILED */}
      <div className={`p-8 rounded-3xl border-l-8 shadow-sm ${warningBg}`}>
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-opacity-20 border-black pb-4">
                <div className={`p-3 rounded-full ${settings.highContrast ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <h2 className={`text-2xl font-bold ${settings.highContrast ? 'text-red-400' : 'text-red-800'}`}>
                        Crucial Warning: Understanding AI Limitations
                    </h2>
                    <p className={`text-sm font-semibold uppercase tracking-wider ${settings.highContrast ? 'text-red-300' : 'text-red-700'}`}>
                        Read this before using the tool for exams or research
                    </p>
                </div>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${settings.highContrast ? 'text-slate-300' : 'text-slate-800'}`}>
                <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><BrainCircuit size={20}/> 1. The Pattern Matching Trap</h3>
                    <p className="leading-relaxed text-sm">
                        Generative AI models (like Gemini) are <strong>Probabilistic, not Deterministic</strong>. This means they do not "know" math like a calculator does. They predict the next word in a sequence. 
                        <br/><br/>
                        <em>Real-World Consequence:</em> If you ask it to multiply 9283 x 1029, it might give you a number that <em>looks</em> correct (starts with 9) but is mathematically wrong. I use a Python engine to mitigate this, but if the AI writes the wrong Python code, the answer will still be wrong.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Eye size={20}/> 2. The "Blurry Vision" Risk</h3>
                    <p className="leading-relaxed text-sm">
                        The AI tries its best to be helpful. If you upload a blurry image where a number '5' looks like a '6', the AI will often <strong>guess</strong> rather than saying "I don't know".
                        <br/><br/>
                        <em>Real-World Consequence:</em> It will confidently solve the entire problem using the number '6', leading to a perfect method but a completely wrong final answer. Always check the "Problem Statement" text to see what the AI actually read.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><ServerCrash size={20}/> 3. Hallucinations in Facts</h3>
                    <p className="leading-relaxed text-sm">
                        When asked about obscure topics, historical dates, or specific chemical properties, the AI may <strong>invent</strong> facts that sound plausible. 
                        <br/><br/>
                        <em>Real-World Consequence:</em> It might tell you a chemical bond angle is 109.5° (standard tetrahedral) even if the specific molecule has a lone pair that compresses it to 107°, simply because 109.5° is a more common number in its training data.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Shield size={20}/> 4. The "Yes-Man" Syndrome</h3>
                    <p className="leading-relaxed text-sm">
                         The AI is trained to be helpful and polite. Sometimes, if you ask a leading question like "Isn't the answer 5?", it might try to find a way to justify '5' even if the answer is '4'.
                         <br/><br/>
                         <em>Advice:</em> Ask neutral questions. "What is the answer?" is better than "Is the answer 5?".
                    </p>
                </div>
            </div>

            <div className={`mt-4 p-4 rounded-xl text-center font-bold border ${settings.highContrast ? 'bg-black border-red-500 text-red-400' : 'bg-white border-red-200 text-red-700 shadow-sm'}`}>
                CORE RULE: Use SmartHomework as a "Second Opinion" or a "Process Checker", never as the "Source of Truth".
            </div>
        </div>
      </div>

      {/* SECTION 2: REAL-WORLD PERFORMANCE TABLE - DETAILED */}
      <div className="space-y-6">
        <div>
            <h2 className={`text-3xl font-bold ${textColor} mb-2`}>Real-World Performance Scenarios</h2>
            <p className={`text-lg ${subTextColor}`}>
                I have tested the AI against specific student pain points. Here is a transparent breakdown of what works and what doesn't.
            </p>
        </div>
        
        <div className={`overflow-hidden rounded-2xl border shadow-lg ${settings.highContrast ? 'border-slate-700' : 'border-slate-200'}`}>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className={`p-6 text-xs font-extrabold uppercase tracking-wider border-b ${tableHeaderClass} w-[30%]`}>
                            Student Scenario / Pain Point
                        </th>
                        <th className={`p-6 text-xs font-extrabold uppercase tracking-wider border-b ${tableHeaderClass} w-[45%]`}>
                            AI's Strategy & Internal Process
                        </th>
                        <th className={`p-6 text-xs font-extrabold uppercase tracking-wider border-b ${tableHeaderClass} w-[25%]`}>
                            Likely Outcome
                        </th>
                    </tr>
                </thead>
                <tbody className={settings.highContrast ? 'bg-slate-900' : 'bg-white'}>
                    {/* SCENARIO 1 */}
                    <tr className="group hover:bg-opacity-50 transition-colors">
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <strong className="block text-lg mb-1">Long Calculation Debugging</strong>
                            <p className="text-sm opacity-80 leading-relaxed">
                                "I solved a long Physics/Chemistry derivation (2 pages). The final answer doesn't match the textbook. I don't know where I missed a sign or constant."
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <p className="text-sm leading-relaxed">
                                The AI breaks your handwriting into individual logical steps. It then independently solves the problem step-by-step using Python to verify the arithmetic of each line. It compares its "correct" path against your path to isolate the <strong>exact line</strong> where divergence occurred.
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top bg-opacity-50 ${settings.highContrast ? 'bg-green-900/10' : 'bg-green-50'}`}>
                            <div className="flex items-center gap-2 mb-2 text-green-600 font-bold uppercase text-xs">
                                <CheckCircle2 size={16}/> Highly Effective
                            </div>
                            <p className="text-xs">
                                This is one of the AI's strongest use cases. It acts as a line-by-line debugger for math.
                            </p>
                        </td>
                    </tr>

                    {/* SCENARIO 2 */}
                    <tr>
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <strong className="block text-lg mb-1">Videos Without Transcripts</strong>
                            <p className="text-sm opacity-80 leading-relaxed">
                                "The professor posted a 2-hour lecture recording. There are no subtitles/CC. I don't understand the diagram drawn at 45:20."
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <p className="text-sm leading-relaxed">
                                Gemini 3 Pro is "Multimodal Native". It doesn't just read text; it splits the video into image frames (10 per second) and processes the audio waveform directly. It correlates the shapes drawn on the whiteboard with the spoken words at that timestamp to explain the context.
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top bg-opacity-50 ${settings.highContrast ? 'bg-blue-900/10' : 'bg-blue-50'}`}>
                            <div className="flex items-center gap-2 mb-2 text-blue-500 font-bold uppercase text-xs">
                                <CheckCircle2 size={16}/> Good Accuracy
                            </div>
                            <p className="text-xs">
                                Works surprisingly well even with poor audio, relying on visual context cues.
                            </p>
                        </td>
                    </tr>

                    {/* SCENARIO 3 */}
                    <tr>
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <strong className="block text-lg mb-1">Internal / Niche Exams</strong>
                            <p className="text-sm opacity-80 leading-relaxed">
                                "My college professor uses very specific definitions. Generic 'internet' answers are marked wrong. No past papers exist."
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <p className="text-sm leading-relaxed">
                                The AI uses "Context Injection". When you upload your class notes/PDF, it limits its knowledge base to <strong>only</strong> that document + general logic. It generates mock questions that mimic the specific style and vocabulary of your provided notes.
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top bg-opacity-50 ${settings.highContrast ? 'bg-green-900/10' : 'bg-green-50'}`}>
                            <div className="flex items-center gap-2 mb-2 text-green-600 font-bold uppercase text-xs">
                                <CheckCircle2 size={16}/> Highly Effective
                            </div>
                            <p className="text-xs">
                                Excellent for drilling specific definitions or "Professor's Pet Topics".
                            </p>
                        </td>
                    </tr>

                    {/* SCENARIO 4 */}
                    <tr>
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <strong className="block text-lg mb-1">Advanced / Abstract Math</strong>
                            <p className="text-sm opacity-80 leading-relaxed">
                                "I need to prove a new theorem in Topology or solve a Millennium Prize Problem (e.g., Collatz, P vs NP)."
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top`}>
                            <p className="text-sm leading-relaxed">
                                The AI will attempt to generate a "Proof-like" structure based on the thousands of proofs it has read. It mimics the <em>language</em> of a proof (Lemmas, Q.E.D.), but it lacks the genuine logical reasoning to actually solve unsolved problems.
                            </p>
                        </td>
                        <td className={`p-6 border-b ${tableCellClass} align-top bg-opacity-50 ${settings.highContrast ? 'bg-red-900/10' : 'bg-red-50'}`}>
                            <div className="flex items-center gap-2 mb-2 text-red-500 font-bold uppercase text-xs">
                                <AlertTriangle size={16}/> High Failure Rate
                            </div>
                            <p className="text-xs">
                                <strong>DANGER:</strong> It will likely produce a confident, professional-looking, but completely nonsense proof.
                            </p>
                        </td>
                    </tr>

                     {/* SCENARIO 5 */}
                     <tr>
                        <td className={`p-6 ${tableCellClass} align-top`}>
                            <strong className="block text-lg mb-1">Recent News / "Current" Data</strong>
                            <p className="text-sm opacity-80 leading-relaxed">
                                "What is the current stock price of Apple?" or "Who won the game last night?" (without enabling Search)
                            </p>
                        </td>
                        <td className={`p-6 ${tableCellClass} align-top`}>
                            <p className="text-sm leading-relaxed">
                                Without the "Google Search" tool enabled, the AI relies on its "Training Cutoff". It only knows the world as it existed when it was trained (e.g., up to late 2023/early 2024). It does not know what happened today.
                            </p>
                        </td>
                        <td className={`p-6 ${tableCellClass} align-top bg-opacity-50 ${settings.highContrast ? 'bg-orange-900/10' : 'bg-orange-50'}`}>
                            <div className="flex items-center gap-2 mb-2 text-orange-500 font-bold uppercase text-xs">
                                <FileWarning size={16}/> Outdated
                            </div>
                            <p className="text-xs">
                                Always use the "Real-World Data" / "Google Search" toggle for anything involving dates or prices.
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>

      {/* SECTION 3: TECHNICAL ARCHITECTURE */}
      <div className={`p-8 rounded-3xl ${settings.highContrast ? 'bg-slate-800' : 'bg-slate-100'}`}>
         <div className="flex items-center gap-3 mb-6">
             <Microscope size={24} className={settings.highContrast ? 'text-yellow-400' : 'text-blue-600'} />
             <h2 className={`text-2xl font-bold ${textColor}`}>Why Gemini 3 Pro? (Technical Analysis)</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="space-y-3">
                 <h4 className={`font-bold ${textColor}`}>1. Pixel-Precise Vision</h4>
                 <p className={`text-sm ${subTextColor} leading-relaxed`}>
                     Gemini 3 Pro outputs <strong>exact coordinate data</strong> rather than just text descriptions. This unique capability allows SmartHomework to draw red boxes on specific errors in your handwriting, transforming the app from a chatbot into a precise visual grading tool.
                 </p>
             </div>
             <div className="space-y-3">
                 <h4 className={`font-bold ${textColor}`}>2. Academic Reasoning</h4>
                 <p className={`text-sm ${subTextColor} leading-relaxed`}>
                     The model achieves <strong>95% on AIME 2025</strong> (Math) and <strong>91.9% on GPQA Diamond</strong> (Science). This "System 2" thinking capability allows it to verify its own logic step-by-step, significantly reducing hallucinations compared to previous generations.
                 </p>
             </div>
             <div className="space-y-3">
                 <h4 className={`font-bold ${textColor}`}>3. Native Multimodality</h4>
                 <p className={`text-sm ${subTextColor} leading-relaxed`}>
                     With an industry-leading <strong>81.0% on MMMU-Pro</strong>, the model processes text, images, and video in a single neural stream. It can analyze abstract visual reasoning tasks (ARC-AGI-2 score: 31.1%) up to 6.3x better than previous models.
                 </p>
             </div>
         </div>
      </div>

      {/* SECTION 4: FUTURE ROADMAP */}
      <div className={`p-8 rounded-3xl border-2 border-dashed ${settings.highContrast ? 'border-purple-500/50 bg-slate-900' : 'border-purple-200 bg-purple-50'}`}>
         <div className="flex items-center gap-3 mb-6">
             <Rocket size={24} className="text-purple-600" />
             <h2 className={`text-2xl font-bold ${textColor}`}>Future Roadmap & Upcoming Features</h2>
         </div>
         <p className={`mb-6 ${subTextColor}`}>
             SmartHomework is currently in <strong className="text-purple-600">Demo / Proof of Concept</strong> status. While the core AI engine is fully capable, many exciting features are in development to make this the ultimate student time-saver.
         </p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-black' : 'bg-white shadow-sm'}`}>
                 <div className="flex items-center gap-2 font-bold mb-2 text-purple-600">
                     <FileText size={18} /> Research Paper Analysis
                 </div>
                 <p className={`text-sm ${subTextColor}`}>
                     Support for analyzing 50+ page PDFs. "Chat with your Research Paper" to instantly extract methodology, results, and citations for your thesis.
                 </p>
             </div>
             <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-black' : 'bg-white shadow-sm'}`}>
                 <div className="flex items-center gap-2 font-bold mb-2 text-purple-600">
                     <Layers size={18} /> Complex Multi-Part Exams
                 </div>
                 <p className={`text-sm ${subTextColor}`}>
                     Simulating full university-level exams that mix essay writing, multiple-choice, and complex calculation problems in a single session.
                 </p>
             </div>
             <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-black' : 'bg-white shadow-sm'}`}>
                 <div className="flex items-center gap-2 font-bold mb-2 text-purple-600">
                     <Clock size={18} /> Assignment Speed-Run
                 </div>
                 <p className={`text-sm ${subTextColor}`}>
                     Tools specifically designed to accelerate repetitive homework tasks, freeing up time for deep learning and concept mastery.
                 </p>
             </div>
             <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-black' : 'bg-white shadow-sm'}`}>
                 <div className="flex items-center gap-2 font-bold mb-2 text-purple-600">
                     <Globe size={18} /> Universal Grade Support
                 </div>
                 <p className={`text-sm ${subTextColor}`}>
                     Expanding the context libraries to support specific curricula from Kindergarten all the way to PhD-level research topics.
                 </p>
             </div>
         </div>
      </div>

      <div className={`text-center text-sm ${subTextColor} pt-8 border-t ${settings.highContrast ? 'border-slate-800' : 'border-slate-200'}`}>
          <p>© {new Date().getFullYear()} SmartHomework AI Project. Powered by Google Gemini API.</p>
      </div>
    </div>
  );
};