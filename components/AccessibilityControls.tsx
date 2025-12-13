import React from 'react';
import { AccessibilitySettings } from '../types';
import { Type, Eye, Volume2, VolumeX, Moon, Sun } from 'lucide-react';

interface Props {
  settings: AccessibilitySettings;
  onUpdate: (settings: AccessibilitySettings) => void;
}

export const AccessibilityControls: React.FC<Props> = ({ settings, onUpdate }) => {
  const toggleContrast = () => onUpdate({ ...settings, highContrast: !settings.highContrast });
  const toggleAudio = () => onUpdate({ ...settings, audioEnabled: !settings.audioEnabled });
  
  const cycleFontSize = () => {
    const sizes: AccessibilitySettings['fontSize'][] = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    onUpdate({ ...settings, fontSize: sizes[nextIndex] });
  };

  const btnClass = settings.highContrast 
    ? "p-2 rounded border border-yellow-400 text-yellow-400 hover:bg-slate-800 transition-colors"
    : "p-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors";

  return (
    <div className={`flex items-center gap-2 ${settings.highContrast ? 'text-yellow-300' : 'text-slate-600'}`}>
      <span className="text-xs font-semibold uppercase tracking-wider mr-2 hidden sm:inline">Accessibility</span>
      
      <button 
        onClick={cycleFontSize}
        className={btnClass}
        title="Toggle Text Size"
        aria-label="Toggle Text Size"
      >
        <Type size={20} />
        <span className="sr-only">Change Font Size (Current: {settings.fontSize})</span>
      </button>

      <button 
        onClick={toggleContrast}
        className={btnClass}
        title="Toggle High Contrast"
        aria-label="Toggle High Contrast"
      >
        {settings.highContrast ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <button 
        onClick={toggleAudio}
        className={btnClass}
        title={settings.audioEnabled ? "Mute Audio" : "Enable Audio"}
        aria-label={settings.audioEnabled ? "Mute Audio" : "Enable Audio"}
      >
        {settings.audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  );
};