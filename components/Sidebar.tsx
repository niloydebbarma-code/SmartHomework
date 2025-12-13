import React from 'react';
import { Home, Video, Calculator, GraduationCap, Info, BookOpen } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  activeView: string;
  onNavigate: (view: string) => void;
  highContrast: boolean;
}

export const Sidebar: React.FC<Props> = ({ activeView, onNavigate, highContrast }) => {
  const tools = [
    { id: 'homework', label: 'Homework Helper', icon: <Home size={20} />, desc: 'Image & Text Analysis' },
    { id: 'video', label: 'Video Tutor', icon: <Video size={20} />, desc: 'YouTube & Lectures' },
    { id: 'math', label: 'Math Lab', icon: <Calculator size={20} />, desc: 'Code-based Solver' },
    { id: 'exam', label: 'Exam Prep', icon: <GraduationCap size={20} />, desc: 'Socratic Reasoning' },
  ];

  const resources = [
    { id: 'guide', label: 'User Guide', icon: <BookOpen size={20} />, desc: 'How to use' },
    { id: 'about', label: 'About SmartHW', icon: <Info size={20} />, desc: 'Mission & Tech' },
  ];

  const baseClass = highContrast 
    ? 'bg-black border-r border-slate-800 text-white' 
    : 'bg-white border-r border-slate-200 text-slate-800';

  const itemClass = (isActive: boolean) => {
    if (highContrast) {
      return isActive 
        ? 'bg-yellow-400 text-black font-bold' 
        : 'text-slate-400 hover:bg-slate-900 hover:text-yellow-200';
    }
    return isActive 
      ? 'bg-blue-50 text-blue-700 font-semibold' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';
  };

  const renderItem = (item: any) => (
    <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group ${itemClass(activeView === item.id)}`}
    >
        <div className={activeView === item.id ? '' : 'opacity-70 group-hover:opacity-100'}>
            {item.icon}
        </div>
        <div>
            <div className="text-sm">{item.label}</div>
            <div className={`text-[10px] opacity-60 font-normal mt-0.5`}>{item.desc}</div>
        </div>
    </button>
  );

  return (
    <div className={`w-64 flex-shrink-0 flex flex-col h-full ${baseClass}`}>
      <div className="p-6 flex items-center gap-3 border-b border-opacity-10 border-slate-500">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-transparent`}>
          <Logo className="w-full h-full" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">SmartHW</h1>
          <p className={`text-xs ${highContrast ? 'text-slate-400' : 'text-slate-500'}`}>AI Suite</p>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className={`text-xs font-bold uppercase tracking-wider mb-2 ml-2 ${highContrast ? 'text-slate-500' : 'text-slate-400'}`}>
            Tools
        </div>
        <div className="space-y-1 mb-6">
            {tools.map(renderItem)}
        </div>

        <div className={`text-xs font-bold uppercase tracking-wider mb-2 ml-2 ${highContrast ? 'text-slate-500' : 'text-slate-400'}`}>
            Resources
        </div>
        <div className="space-y-1">
            {resources.map(renderItem)}
        </div>
      </nav>

      <div className={`p-4 text-xs text-center border-t border-opacity-10 border-slate-500 ${highContrast ? 'text-slate-500' : 'text-slate-400'}`}>
        Powered by Gemini 3 Pro
      </div>
    </div>
  );
};