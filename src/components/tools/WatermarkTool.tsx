import React, { useState, useEffect, useRef } from 'react';
import { 
  Stamp, 
  Download, 
  RotateCcw, 
  Grid, 
  Move, 
  Sliders, 
  Type, 
  Image as ImageIcon 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { loadImage, downloadDataUrl } from '../../utils/imageProcessors';

export const WatermarkTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState('watermarked_image');

  const [watermarkMode, setWatermarkMode] = useState<'repeated' | 'single'>('repeated');
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL · PREVIEW');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  const [fontSize, setFontSize] = useState(36);
  const [opacity, setOpacity] = useState(40); // 5 to 100
  const [rotation, setRotation] = useState(-30); // in degrees
  const [textColor, setTextColor] = useState('#ffffff');
  const [anchorPosition, setAnchorPosition] = useState<'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [spacing, setSpacing] = useState(160); // gap for repeated mode

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleImageLoaded = (dataUrl: string, file?: File) => {
    setImageSrc(dataUrl);
    setImageName(file ? file.name.replace(/\.[^/.]+$/, '') : 'watermarked');
  };

  const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setLogoSrc(ev.target.result as string);
        setWatermarkType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  // Render watermarked image
  useEffect(() => {
    if (!imageSrc) return;

    let isMounted = true;
    const render = async () => {
      try {
        const img = await loadImage(imageSrc);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw original
        ctx.drawImage(img, 0, 0);

        ctx.save();
        ctx.globalAlpha = opacity / 100;

        if (watermarkType === 'text') {
          ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = textColor;
          ctx.textBaseline = 'middle';

          if (watermarkMode === 'repeated') {
            const angleRad = (rotation * Math.PI) / 180;
            // Draw grid of repeated text
            const stepX = spacing * 2;
            const stepY = spacing;

            for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
              for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angleRad);
                ctx.fillText(text, 0, 0);
                ctx.restore();
              }
            }
          } else {
            // Single anchored watermark
            let x = 40;
            let y = 40;
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;

            if (anchorPosition === 'top-right') {
              x = canvas.width - textWidth - 40;
              y = 50;
            } else if (anchorPosition === 'center') {
              x = (canvas.width - textWidth) / 2;
              y = canvas.height / 2;
            } else if (anchorPosition === 'bottom-left') {
              x = 40;
              y = canvas.height - 50;
            } else if (anchorPosition === 'bottom-right') {
              x = canvas.width - textWidth - 40;
              y = canvas.height - 50;
            }

            ctx.save();
            ctx.translate(x + textWidth / 2, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillText(text, -textWidth / 2, 0);
            ctx.restore();
          }
        } else if (watermarkType === 'image' && logoSrc) {
          const logo = await loadImage(logoSrc);
          const targetW = fontSize * 4;
          const targetH = (targetW * (logo.naturalHeight || logo.height)) / (logo.naturalWidth || logo.width);

          let lx = canvas.width - targetW - 40;
          let ly = canvas.height - targetH - 40;

          if (anchorPosition === 'top-left') {
            lx = 40; ly = 40;
          } else if (anchorPosition === 'top-right') {
            lx = canvas.width - targetW - 40; ly = 40;
          } else if (anchorPosition === 'center') {
            lx = (canvas.width - targetW) / 2; ly = (canvas.height - targetH) / 2;
          } else if (anchorPosition === 'bottom-left') {
            lx = 40; ly = canvas.height - targetH - 40;
          }

          ctx.drawImage(logo, lx, ly, targetW, targetH);
        }

        ctx.restore();

        if (isMounted) {
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        console.error(e);
      }
    };

    const timer = setTimeout(render, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    imageSrc,
    watermarkMode,
    watermarkType,
    text,
    logoSrc,
    fontSize,
    opacity,
    rotation,
    textColor,
    anchorPosition,
    spacing,
  ]);

  const handleDownload = () => {
    if (!previewUrl) return;
    downloadDataUrl(previewUrl, `${imageName}_watermark.png`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Watermark
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Diagonal repeat protection patterns or corner stamp logo overlays
          </p>
        </div>
      </div>

      {!imageSrc ? (
        <DropZone onImageSelected={handleImageLoaded} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Stage */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[460px]">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Watermark Preview"
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              {/* Pattern Mode */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Distribution Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWatermarkMode('repeated')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                      watermarkMode === 'repeated'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>Repeated Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWatermarkMode('single')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                      watermarkMode === 'single'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Move className="w-4 h-4" />
                    <span>Single Anchor</span>
                  </button>
                </div>
              </div>

              {/* Watermark text */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {watermarkMode === 'single' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Anchor Position
                  </label>
                  <select
                    value={anchorPosition}
                    onChange={(e) => setAnchorPosition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="center">Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              )}

              {/* Text formatting & opacity */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Opacity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Opacity</span>
                    <span className="font-mono text-indigo-600 font-bold">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Size */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Font Size</span>
                    <span className="font-mono text-indigo-600 font-bold">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={90}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Angle Tilt</span>
                    <span className="font-mono text-indigo-600 font-bold">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Color */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Text Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['#ffffff', '#000000', '#ef4444', '#f59e0b', '#3b82f6'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 ${
                          textColor === c ? 'border-indigo-600 scale-110' : 'border-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermarked Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
