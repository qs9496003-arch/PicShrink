import React from 'react';
import { 
  Wrench, 
  Sun, 
  Moon, 
  Menu, 
  RefreshCw, 
  Download, 
  Sparkles,
  Code2,
  Layers
} from 'lucide-react';
import { ToolDefinition } from '../types';

interface HeaderProps {
  currentTool: ToolDefinition;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
  onResetTool?: () => void;
  hasActiveImage?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTool,
  darkMode,
  onToggleDarkMode,
  onToggleSidebar,
  onResetTool,
  hasActiveImage,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg tracking-tight text-slate-900 dark:text-white">
                Image Toolbox
              </h1>
              <span className="hidden sm:inline-flex text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                Web Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {currentTool.name}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasActiveImage && onResetTool && (
          <button
            type="button"
            onClick={onResetTool}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Reset or choose a new image"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Change Image</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        <a
          href="https://github.com/T8RIN/ImageToolbox"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Original Android Project by T8RIN"
        >
          <Code2 className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
};
