import React from 'react';
import { 
  Minimize2, 
  Crop, 
  Sliders, 
  Eraser, 
  Pencil, 
  Stamp, 
  LayoutGrid, 
  QrCode, 
  Pipette, 
  Info,
  X,
  Sparkles
} from 'lucide-react';
import { ToolDefinition, ToolId } from '../types';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'resize-shrink',
    name: 'Resize & Shrink',
    category: 'edit',
    description: 'Change dimensions, compress to target KB, convert format',
    iconName: 'Minimize2',
    badge: 'Popular'
  },
  {
    id: 'crop-transform',
    name: 'Crop & Rotate',
    category: 'edit',
    description: 'Preset aspect ratios, free angle rotate, flip',
    iconName: 'Crop',
  },
  {
    id: 'filters',
    name: 'Filters & Adjust',
    category: 'adjust',
    description: 'Vibrant presets, custom adjustments, dithering, vignette',
    iconName: 'Sliders',
    badge: '500+ filters'
  },
  {
    id: 'background-eraser',
    name: 'Background Eraser',
    category: 'edit',
    description: 'Magic wand color cutout & brush eraser to transparent PNG',
    iconName: 'Eraser',
  },
  {
    id: 'draw-markup',
    name: 'Draw & Annotate',
    category: 'create',
    description: 'Pencil, neon brush, shapes, arrows & text stamps',
    iconName: 'Pencil',
  },
  {
    id: 'watermark',
    name: 'Watermark',
    category: 'edit',
    description: 'Repeated pattern watermark or custom anchored logo',
    iconName: 'Stamp',
  },
  {
    id: 'collage',
    name: 'Collage Maker',
    category: 'create',
    description: 'Combine multiple photos with custom grids and borders',
    iconName: 'LayoutGrid',
  },
  {
    id: 'qr-barcode',
    name: 'QR & Barcode',
    category: 'utilities',
    description: 'Generate customized QR codes or scan from images',
    iconName: 'QrCode',
  },
  {
    id: 'palette-picker',
    name: 'Palette & Loupe',
    category: 'utilities',
    description: 'Extract dominant color palettes & pixel color loupe',
    iconName: 'Pipette',
  },
  {
    id: 'metadata-info',
    name: 'EXIF & Inspector',
    category: 'utilities',
    description: 'View technical image properties & strip metadata',
    iconName: 'Info',
  },
];

interface SidebarProps {
  currentToolId: ToolId;
  onSelectTool: (id: ToolId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentToolId,
  onSelectTool,
  isOpen,
  onClose,
}) => {
  const renderIcon = (name: string, className = 'w-5 h-5') => {
    switch (name) {
      case 'Minimize2': return <Minimize2 className={className} />;
      case 'Crop': return <Crop className={className} />;
      case 'Sliders': return <Sliders className={className} />;
      case 'Eraser': return <Eraser className={className} />;
      case 'Pencil': return <Pencil className={className} />;
      case 'Stamp': return <Stamp className={className} />;
      case 'LayoutGrid': return <LayoutGrid className={className} />;
      case 'QrCode': return <QrCode className={className} />;
      case 'Pipette': return <Pipette className={className} />;
      case 'Info': return <Info className={className} />;
      default: return <Sliders className={className} />;
    }
  };

  const categories = [
    { id: 'edit', label: 'Transform & Size' },
    { id: 'adjust', label: 'Color & Effects' },
    { id: 'create', label: 'Draw & Composition' },
    { id: 'utilities', label: 'Utilities & Info' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar-navigation"
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 lg:z-20 w-72 h-screen lg:h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 p-4 overflow-y-auto flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Mobile close button */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Tools Menu
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-5">
            {categories.map((cat) => {
              const catTools = TOOLS.filter((t) => t.category === cat.id);
              return (
                <div key={cat.id} className="space-y-1">
                  <h4 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {cat.label}
                  </h4>
                  <div className="space-y-1 mt-1.5">
                    {catTools.map((tool) => {
                      const isActive = tool.id === currentToolId;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            onSelectTool(tool.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`p-1.5 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50'
                              }`}
                            >
                              {renderIcon(tool.iconName, 'w-4 h-4')}
                            </span>
                            <span className="truncate">{tool.name}</span>
                          </div>

                          {tool.badge && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                              }`}
                            >
                              {tool.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>100% Client-Side</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Your images are processed locally in your browser. No files are uploaded to any server.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
