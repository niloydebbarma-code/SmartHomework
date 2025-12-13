import React, { useState, useEffect } from 'react';
import { AccessibilityControls } from './components/AccessibilityControls';
import { Sidebar } from './components/Sidebar';
import { HomeworkHelper } from './components/HomeworkHelper';
import { VideoTutor } from './components/VideoTutor';
import { MathLab } from './components/MathLab';
import { ExamPrep } from './components/ExamPrep';
import { AboutPage } from './components/AboutPage';
import { UserGuide } from './components/UserGuide';
import { AccessibilitySettings } from './types';
import { Lock } from 'lucide-react';
import { Logo } from './components/Logo';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [activeView, setActiveView] = useState('homework');
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'normal',
    highContrast: false,
    audioEnabled: false
  });

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore - window.aistudio is available in this environment
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // Fallback for local dev if window.aistudio is missing, assume true if env exists
        setHasKey(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleConnect = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume success to handle race condition
        setHasKey(true);
    }
  };

  const bgClass = settings.highContrast ? 'bg-black min-h-screen text-white' : 'bg-slate-50 min-h-screen text-slate-900';

  if (!hasKey) {
    return (
      <div className={`${bgClass} flex flex-col items-center justify-center font-sans p-4`}>
        <div className={`max-w-md w-full p-8 rounded-2xl border text-center shadow-xl ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className={`w-24 h-24 mx-auto mb-6 p-4 rounded-full flex items-center justify-center ${settings.highContrast ? 'bg-slate-800' : 'bg-slate-50'}`}>
             <Logo className="w-full h-full" />
           </div>
           <h1 className="text-2xl font-bold mb-2">SmartHomework AI</h1>
           <p className={`mb-8 ${settings.highContrast ? 'text-slate-400' : 'text-slate-600'}`}>
             To use advanced visual analysis and image generation features (Gemini 3 Pro), you must connect a valid Google Cloud Project.
           </p>
           
           <button 
             onClick={handleConnect}
             className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105
               ${settings.highContrast ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
           >
             <Lock size={18} /> Connect Google Account
           </button>
           
           <p className="mt-4 text-xs opacity-50">
             Ensure your project has billing enabled. 
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline ml-1">
               Read Billing Documentation
             </a>
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} flex h-screen overflow-hidden font-sans`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeView={activeView} 
        onNavigate={setActiveView} 
        highContrast={settings.highContrast} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Bar */}
        <header className={`flex-shrink-0 h-16 border-b flex items-center justify-end px-8 
          ${settings.highContrast ? 'bg-black border-slate-800' : 'bg-white border-slate-200'}`}>
          <AccessibilityControls settings={settings} onUpdate={setSettings} />
        </header>

        {/* Feature Views */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {activeView === 'homework' && <HomeworkHelper settings={settings} />}
          {activeView === 'video' && <VideoTutor settings={settings} />}
          {activeView === 'math' && <MathLab settings={settings} />}
          {activeView === 'exam' && <ExamPrep settings={settings} />}
          {activeView === 'about' && <AboutPage settings={settings} />}
          {activeView === 'guide' && <UserGuide settings={settings} />}
        </main>
      </div>
    </div>
  );
};

export default App;