import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Download, 
  Eye, 
  Sparkles, 
  SplitSquareVertical, 
  RefreshCw,
  Sun,
  Contrast,
  Palette,
  Flame,
  Zap
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { FilterSettings } from '../../types';
import { loadImage, applyFilterChain, downloadDataUrl } from '../../utils/imageProcessors';

const DEFAULT_FILTERS: FilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  warmth: 0,
  hue: 0,
  blur: 0,
  sharpen: 0,
  vignette: 0,
  activePreset: 'none',
  presetStrength: 100,
};

const PRESETS = [
  { id: 'none', label: 'Normal' },
  { id: 'grayscale', label: 'B&W Classic' },
  { id: 'sepia', label: 'Warm Sepia' },
  { id: 'vintage', label: 'Retro 70s' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'warm-golden', label: 'Golden Hour' },
  { id: 'cold', label: 'Cold Arctic' },
  { id: 'hdr', label: 'HDR Vivid' },
  { id: 'dither', label: 'Floyd Dither' },
  { id: 'pixelate', label: '8-Bit Pixel' },
  { id: 'posterize', label: 'Posterize' },
  { id: 'solarize', label: 'Solarize' },
  { id: 'invert', label: 'Negative' },
];

export const FiltersTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState('filtered_image');
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageLoaded = (dataUrl: string, file?: File) => {
    setImageSrc(dataUrl);
    setImageName(file ? file.name.replace(/\.[^/.]+$/, '') : 'image');
    setFilters(DEFAULT_FILTERS);
  };

  // Recompute filtered canvas on filter changes with debounce
  useEffect(() => {
    if (!imageSrc) return;

    let isMounted = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const img = await loadImage(imageSrc);
        const canvas = applyFilterChain(img, filters);
        if (isMounted) {
          setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    }, 80);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [imageSrc, filters]);

  const updateFilter = (key: keyof FilterSettings, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownload = async () => {
    if (!imageSrc) return;
    const img = await loadImage(imageSrc);
    const canvas = applyFilterChain(img, filters);
    downloadDataUrl(canvas.toDataURL('image/jpeg', 0.95), `${imageName}_filtered.jpg`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Filters & Effects
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time color grading, artistic presets, dithering, and vignette
          </p>
        </div>

        {imageSrc && (
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {!imageSrc ? (
        <DropZone onImageSelected={handleImageLoaded} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Preview Area */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[440px]">
              <img
                src={showOriginal ? imageSrc : previewUrl || imageSrc}
                alt="Filter Result"
                className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm transition-opacity duration-150"
              />

              {/* Compare toggle button */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 shadow-lg select-none"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hold to View Original</span>
                </button>
              </div>

              {isProcessing && (
                <div className="absolute bottom-4 left-4 bg-slate-900/80 text-white backdrop-blur-md text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                  Rendering preview...
                </div>
              )}
            </div>

            {/* Presets Horizontal Strip */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3">
                Signature Presets
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateFilter('activePreset', p.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${
                      filters.activePreset === p.id
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Adjustments Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Precision Adjustments
              </h3>

              {/* Sliders list */}
              <div className="space-y-3.5">
                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5" /> Brightness
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{filters.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={filters.brightness}
                    onChange={(e) => updateFilter('brightness', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Contrast className="w-3.5 h-3.5" /> Contrast
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{filters.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={filters.contrast}
                    onChange={(e) => updateFilter('contrast', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Saturation
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{filters.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={filters.saturation}
                    onChange={(e) => updateFilter('saturation', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Warmth */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Warmth / Temp
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{filters.warmth}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={filters.warmth}
                    onChange={(e) => updateFilter('warmth', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Hue Rotation */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Hue Shift
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{filters.hue}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={filters.hue}
                    onChange={(e) => updateFilter('hue', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Gaussian Blur</span>
                    <span className="font-mono text-indigo-600 font-bold">{filters.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={filters.blur}
                    onChange={(e) => updateFilter('blur', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Vignette */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Vignette Shading</span>
                    <span className="font-mono text-indigo-600 font-bold">{filters.vignette}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.vignette}
                    onChange={(e) => updateFilter('vignette', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Download className="w-4 h-4" />
                <span>Save High-Res Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
