import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Sidebar, TOOLS } from './components/Sidebar';
import { ToolId } from './types';

// Tools
import { ResizeConvertTool } from './components/tools/ResizeConvertTool';
import { CropTransformTool } from './components/tools/CropTransformTool';
import { FiltersTool } from './components/tools/FiltersTool';
import { BackgroundEraserTool } from './components/tools/BackgroundEraserTool';
import { DrawMarkupTool } from './components/tools/DrawMarkupTool';
import { WatermarkTool } from './components/tools/WatermarkTool';
import { CollageTool } from './components/tools/CollageTool';
import { QrTool } from './components/tools/QrTool';
import { PaletteTool } from './components/tools/PaletteTool';
import { MetadataTool } from './components/tools/MetadataTool';

export const App: React.FC = () => {
  const [currentToolId, setCurrentToolId] = useState<ToolId>('resize-shrink');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('it_theme') === 'dark' ||
        (!('it_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  // Keep dark class on html element in sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('it_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('it_theme', 'light');
    }
  }, [darkMode]);

  const currentTool = TOOLS.find((t) => t.id === currentToolId) || TOOLS[0];

  const renderTool = () => {
    switch (currentToolId) {
      case 'resize-shrink':
        return <ResizeConvertTool />;
      case 'crop-transform':
        return <CropTransformTool />;
      case 'filters':
        return <FiltersTool />;
      case 'background-eraser':
        return <BackgroundEraserTool />;
      case 'draw-markup':
        return <DrawMarkupTool />;
      case 'watermark':
        return <WatermarkTool />;
      case 'collage':
        return <CollageTool />;
      case 'qr-barcode':
        return <QrTool />;
      case 'palette-picker':
        return <PaletteTool />;
      case 'metadata-info':
        return <MetadataTool />;
      default:
        return <ResizeConvertTool />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        currentTool={currentTool}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentToolId={currentToolId}
          onSelectTool={(id) => setCurrentToolId(id)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentToolId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderTool()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
