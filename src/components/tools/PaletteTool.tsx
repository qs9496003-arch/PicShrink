import React, { useState, useEffect, useRef } from 'react';
import { 
  Pipette, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  Code 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { loadImage } from '../../utils/imageProcessors';

interface ColorSwatch {
  hex: string;
  rgb: string;
  count: number;
}

export const PaletteTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorSwatch[]>([]);
  const [hoverColor, setHoverColor] = useState<{ hex: string; rgb: string; x: number; y: number } | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageLoaded = async (dataUrl: string) => {
    setImageSrc(dataUrl);
    const img = await loadImage(dataUrl);

    // Draw on hidden canvas to sample colors
    const canvas = document.createElement('canvas');
    const maxDimension = 300;
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorMap: { [key: string]: number } = {};

    // Sample pixels in 4x4 intervals
    for (let i = 0; i < imgData.length; i += 16) {
      const a = imgData[i + 3];
      if (a < 128) continue; // skip transparent

      // Quantize to 5-bit depth per channel to group similar shades
      const r = Math.round(imgData[i] / 16) * 16;
      const g = Math.round(imgData[i + 1] / 16) * 16;
      const b = Math.round(imgData[i + 2] / 16) * 16;
      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    // Sort by frequency and filter distinct
    const sorted = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        const hex =
          '#' +
          [r, g, b]
            .map((c) => Math.min(255, c).toString(16).padStart(2, '0'))
            .join('');
        return {
          hex,
          rgb: `rgb(${r}, ${g}, ${b})`,
          count,
        };
      });

    setPalette(sorted);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * target.naturalWidth);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * target.naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(target, x, y, 1, 1, 0, 0, 1, 1);
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    const hex =
      '#' +
      [pixel[0], pixel[1], pixel[2]]
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('');
    setHoverColor({
      hex,
      rgb: `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Palette & Loupe
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Extract dominant color schemes and inspect pixel colors with live loupe
          </p>
        </div>
      </div>

      {!imageSrc ? (
        <DropZone onImageSelected={handleImageLoaded} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Stage with Hover Loupe */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[460px]">
              <img
                src={imageSrc}
                alt="Palette Target"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverColor(null)}
                className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm cursor-crosshair select-none"
              />

              {hoverColor && (
                <div
                  className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-16 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 text-white backdrop-blur-md rounded-xl shadow-xl border border-white/20"
                  style={{ left: hoverColor.x, top: hoverColor.y }}
                >
                  <div
                    className="w-5 h-5 rounded-md border border-white/40"
                    style={{ backgroundColor: hoverColor.hex }}
                  />
                  <span className="font-mono text-xs font-semibold">{hoverColor.hex}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center">
              Hover over the image to inspect any pixel with the precision color loupe.
            </p>
          </div>

          {/* Palette Swatches */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Extracted Palette
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {palette.length} Dominant Colors
                </span>
              </div>

              {/* Swatches List */}
              <div className="space-y-2">
                {palette.map((swatch) => (
                  <div
                    key={swatch.hex}
                    onClick={() => copyColor(swatch.hex)}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg border border-black/10 shadow-xs group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {swatch.hex.toUpperCase()}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {swatch.rgb}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors"
                      title="Copy HEX"
                    >
                      {copiedHex === swatch.hex ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Palette Hex Export Code */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const css = `:root {\n${palette
                      .map((s, idx) => `  --color-${idx + 1}: ${s.hex};`)
                      .join('\n')}\n}`;
                    copyColor(css);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Code className="w-4 h-4" />
                  <span>Copy Palette as CSS Variables</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
