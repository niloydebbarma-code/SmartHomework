import React from 'react';
import { AccessibilitySettings } from '../types';
import { Home, Video, Calculator, GraduationCap, Upload, Mic, Download, Search, CheckCircle2, Eye, Sun, Volume2, AlertOctagon, Lightbulb, PenTool, BookOpen } from 'lucide-react';

interface Props {
  settings: AccessibilitySettings;
}

export const UserGuide: React.FC<Props> = ({ settings }) => {
  const textColor = settings.highContrast ? 'text-white' : 'text-slate-800';
  const subTextColor = settings.highContrast ? 'text-slate-300' : 'text-slate-600';
  const cardBg = settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const codeBg = settings.highContrast ? 'bg-black' : 'bg-slate-100';

  const GuideSection = ({ title, icon: Icon, children, isWarning = false }: React.PropsWithChildren<{ title: string, icon: any, isWarning?: boolean }>) => (
    <section className={`p-6 rounded-2xl border mb-8 ${isWarning ? (settings.highContrast ? 'bg-red-900/10 border-red-500' : 'bg-red-50 border-red-200') : cardBg}`}>
      <div className="flex items-center gap-3 mb-6 border-b pb-4 border-opacity-20 border-gray-500">
        <div className={`p-2 rounded-lg ${isWarning ? 'bg-red-100 text-red-600' : (settings.highContrast ? 'bg-slate-800 text-yellow-400' : 'bg-blue-50 text-blue-600')}`}>
           <Icon size={24} />
        </div>
        <h2 className={`text-2xl font-bold ${isWarning ? 'text-red-600 dark:text-red-400' : textColor}`}>{title}</h2>
      </div>
      <div className={`space-y-4 ${subTextColor} leading-relaxed`}>
        {children}
      </div>
    </section>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 pt-4">
        <h1 className={`text-4xl font-bold mb-4 ${textColor}`}>User Guide & Best Practices</h1>
        <p className={`text-lg ${subTextColor}`}>
          A comprehensive manual to mastering your AI Tutor. Learn how to handle exams, debug math, and verify results.
        </p>
      </div>

      {/* Safety & Disclaimer - Moved to top for visibility */}
      <GuideSection title="Safety & Verification (The 'Golden Rules')" icon={AlertOctagon} isWarning={true}>
        <p className="font-bold text-lg mb-2">
           Treat this AI as a "Smart Study Buddy", not a "Professor".
        </p>
        <p>
            This is a <strong>Demo / Prototype</strong> version. It is designed to show the <em>concept</em> of AI tutoring. In a production environment, there would be many more guardrails. Currently, you must be the pilot.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-black' : 'bg-white/50'}`}>
                <h4 className="font-bold mb-2 text-red-500">When NOT to use it:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>For critical exams where 1 point matters.</li>
                    <li>For medical, legal, or financial calculations.</li>
                    <li>To solve unsolved mathematical theorems.</li>
                    <li>With blurry, dark, or extremely messy photos.</li>
                </ul>
            </div>
            <div className={`p-4 rounded-xl ${settings.highContrast ? 'bg-black' : 'bg-white/50'}`}>
                <h4 className="font-bold mb-2 text-green-600">When TO use it:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>To find where you made a mistake in a long calculation.</li>
                    <li>To summarize long YouTube lectures.</li>
                    <li>To create mock quizzes for self-testing.</li>
                    <li>To get a "hint" when you are totally stuck.</li>
                </ul>
            </div>
        </div>
      </GuideSection>

      {/* Module 1: Homework Helper */}
      <GuideSection title="Homework Helper & Error Detection" icon={Home}>
        <p>
          The <strong>Homework Helper</strong> is not just for grading. It's a debugging tool for your thought process.
        </p>

        <h3 className={`text-lg font-bold mt-4 mb-2 ${textColor}`}>Pro Tip: The "2-Hour Problem" Scenario</h3>
        <div className={`p-4 rounded-xl mb-4 ${codeBg}`}>
            <p className="text-sm italic mb-2">"I solved a long Physics/Chemistry problem. The answer is wrong, but I can't find the error."</p>
            <p className="text-sm font-semibold">How to solve this:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm mt-1">
                <li>Upload a clear photo of your <strong>entire</strong> handwritten derivation.</li>
                <li>Wait for the analysis.</li>
                <li>The AI will likely mark the final answer "Needs Work".</li>
                <li><strong>Click on the Red Box.</strong> The AI usually highlights the <em>specific row</em> where the logic diverged from the correct path (e.g., "In Step 3, you forgot to square the velocity").</li>
                <li>Use this to correct your work, rather than just copying the final answer.</li>
            </ol>
        </div>

        <h3 className={`text-lg font-bold mt-4 mb-2 ${textColor}`}>Standard Workflow</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Uploading:</strong> Drag and drop images (JPG, PNG) or PDFs. High contrast and good lighting improve accuracy by 50%.
          </li>
          <li>
            <strong>Chat Context:</strong> After analysis, you can chat with the AI. It "remembers" the image you uploaded. You can ask "Why did you say step 2 is wrong?" and it will explain.
          </li>
        </ul>
      </GuideSection>

      {/* Module 2: Video Tutor */}
      <GuideSection title="Video Tutor (Multimodal)" icon={Video}>
        <p>
          The <strong>Video Tutor</strong> helps you understand educational videos, even those without subtitles.
        </p>

        <h3 className={`text-lg font-bold mt-4 mb-2 ${textColor}`}>Pro Tip: No Transcripts? No Problem.</h3>
        <div className={`p-4 rounded-xl mb-4 ${codeBg}`}>
            <p className="text-sm italic mb-2">"I'm watching an old lecture. There are no captions. I'm confused at the 10-minute mark."</p>
            <p className="text-sm font-semibold">How to solve this:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm mt-1">
                <li>If using a file, upload the video. If YouTube, paste the link.</li>
                <li>Go to the timestamp (e.g., 10:00).</li>
                <li>Type a specific question: "Explain the graph he is drawing right now."</li>
                <li><strong>Click "Analyze Context".</strong></li>
                <li>The AI will look at the <em>pixels</em> of the video frame to see the graph and listen to the audio waveform to understand the explanation, synthesizing both.</li>
            </ol>
        </div>
        
        <p className="mt-4">
            <strong>Fact Check Toggle:</strong> Use this if the video is old (e.g., a 2010 tutorial on coding). The AI will search Google to see if the information is still valid in 2025.
        </p>
      </GuideSection>

      {/* Module 3: Math Lab */}
      <GuideSection title="Math Lab (Code Engine)" icon={Calculator}>
        <p>
          The <strong>Math Lab</strong> uses two different brains: "Smart Mode" (LLM) and "Code Mode" (Python).
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <div>
                 <h4 className={`font-bold ${textColor}`}>Smart Converter Mode</h4>
                 <p className="text-sm opacity-80">Best for: Converting word problems or messy text into math.</p>
                 <ul className="list-disc pl-5 text-xs mt-2">
                     <li>Example: "Integral of sin x from 0 to pi"</li>
                     <li>The AI interprets the language -> writes LaTeX -> verifies -> solves.</li>
                 </ul>
             </div>
             <div>
                 <h4 className={`font-bold ${textColor}`}>Code Engine Mode</h4>
                 <p className="text-sm opacity-80">Best for: Heavy arithmetic or data processing.</p>
                 <ul className="list-disc pl-5 text-xs mt-2">
                     <li>Example: "Calculate standard deviation of [1,5,2,9...]"</li>
                     <li>The AI writes and runs Python code. This is 100% accurate for arithmetic (unlike standard AI chat).</li>
                 </ul>
             </div>
        </div>

        <p className="mt-4 text-sm">
             <strong>Real-World Data:</strong> Click the Globe icon to enable search. This lets you solve problems like "Calculate the GDP of Japan divided by the population of Tokyo". The AI will fetch the 2024 numbers from Google first, then solve.
        </p>
      </GuideSection>

      {/* Module 4: Exam Prep */}
      <GuideSection title="Exam Prep (Simulator Mode)" icon={GraduationCap}>
        <p>
          The <strong>Exam Prep</strong> tool has been upgraded with two distinct modes:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className={`p-4 rounded-xl border ${settings.highContrast ? 'border-slate-700' : 'border-slate-200'}`}>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Lightbulb size={18} /> Study Mode (Tutor)</h4>
                <p className="text-sm">
                    <strong>Goal:</strong> Learning & Understanding.
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm opacity-80">
                    <li>The AI acts like a friendly tutor.</li>
                    <li>If you answer incorrectly, it gives hints.</li>
                    <li>It explains concepts immediately.</li>
                    <li>Best for: Revision and concept clearing.</li>
                </ul>
            </div>
            <div className={`p-4 rounded-xl border ${settings.highContrast ? 'border-red-500 bg-red-900/10' : 'border-red-200 bg-red-50'}`}>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-red-600"><AlertOctagon size={18} /> Simulator Mode (Strict)</h4>
                <p className="text-sm">
                    <strong>Goal:</strong> Testing & Speed.
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm opacity-80">
                    <li>The AI acts like a strict invigilator.</li>
                    <li>There is a <strong>Countdown Timer</strong>.</li>
                    <li>It asks questions one by one.</li>
                    <li><strong>No Feedback:</strong> It will not tell you if you are right or wrong until the exam is over.</li>
                    <li>At the end, it generates a full Grading Report with marks.</li>
                </ul>
            </div>
        </div>

        <h3 className={`text-lg font-bold mt-6 mb-2 ${textColor}`}>Pro Tip: The "Internal Exam" Hack</h3>
        <div className={`p-4 rounded-xl mb-4 ${codeBg}`}>
            <p className="text-sm italic mb-2">"My teacher asks very specific questions based on her slides, not the textbook. Past papers don't exist."</p>
            <p className="text-sm font-semibold">How to solve this:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm mt-1">
                <li>Export your teacher's slides or your class notes to a PDF.</li>
                <li>Go to Exam Prep.</li>
                <li><strong>Upload Context Material:</strong> Select that PDF.</li>
                <li>Set Subject to "Class Unit 1".</li>
                <li>Enable <strong>Strict Simulator Mode</strong>.</li>
                <li>The AI will now generate a mock test based <em>strictly</em> on your teacher's slides.</li>
            </ol>
        </div>
      </GuideSection>

      {/* Accessibility */}
      <GuideSection title="Accessibility Controls" icon={Eye}>
        <p>
          SmartHomework is built for everyone.
        </p>
        <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded border ${settings.highContrast ? 'border-yellow-400 text-yellow-400' : 'border-slate-300'}`}>A</div>
                <span><strong>Font Size:</strong> Cycles between Normal, Large, and Extra Large text for low-vision users.</span>
            </div>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded border ${settings.highContrast ? 'border-yellow-400 text-yellow-400' : 'border-slate-300'}`}><Sun size={16}/></div>
                <span><strong>High Contrast Mode:</strong> Switches to a high-fidelity black-and-yellow theme (WCAG AAA compliant colors) for maximum visibility.</span>
            </div>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded border ${settings.highContrast ? 'border-yellow-400 text-yellow-400' : 'border-slate-300'}`}><Mic size={16}/></div>
                <span><strong>Voice Input:</strong> Every text box supports voice dictation.</span>
            </div>
        </div>
      </GuideSection>

    </div>
  );
};