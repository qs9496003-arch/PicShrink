import React, { useState, useRef, useEffect } from 'react';
import { 
  Wand2, 
  Eraser, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Undo, 
  Eye,
  Sliders
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { loadImage, downloadDataUrl } from '../../utils/imageProcessors';

export const BackgroundEraserTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState('cutout_image');

  const [mode, setMode] = useState<'magic-wand' | 'brush'>('magic-wand');
  const [tolerance, setTolerance] = useState(30); // 5 to 100
  const [brushSize, setBrushSize] = useState(25);
  const [history, setHistory] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageLoaded = async (dataUrl: string, file?: File) => {
    setImageSrc(dataUrl);
    setImageName(file ? file.name.replace(/\.[^/.]+$/, '') : 'image');
    setHistory([]);

    const img = await loadImage(dataUrl);
    if (canvasRef.current) {
      canvasRef.current.width = img.naturalWidth || img.width;
      canvasRef.current.height = img.naturalHeight || img.height;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        setHistory([canvasRef.current.toDataURL('image/png')]);
      }
    }
  };

  // Canvas click for Magic Wand or Brush
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (mode === 'magic-wand') {
      executeMagicWand(x, y);
    } else {
      setIsDrawing(true);
      eraseBrushAt(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'brush') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    eraseBrushAt(x, y);
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushHistory();
    }
  };

  const eraseBrushAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const executeMagicWand = (targetX: number, targetY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const baseIdx = (targetY * canvas.width + targetX) * 4;
    const targetR = data[baseIdx];
    const targetG = data[baseIdx + 1];
    const targetB = data[baseIdx + 2];

    const tolSq = tolerance * tolerance * 3;

    for (let i = 0; i < data.length; i += 4) {
      // Don't check already transparent pixels
      if (data[i + 3] === 0) continue;

      const dr = data[i] - targetR;
      const dg = data[i + 1] - targetG;
      const db = data[i + 2] - targetB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq <= tolSq) {
        const factor = Math.sqrt(distSq / tolSq);
        if (factor > 0.85) {
          data[i + 3] = Math.round(data[i + 3] * ((factor - 0.85) / 0.15));
        } else {
          data[i + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    pushHistory();
  };

  const pushHistory = () => {
    if (!canvasRef.current) return;
    const current = canvasRef.current.toDataURL('image/png');
    setHistory((prev) => [...prev.slice(-10), current]);
  };

  const handleUndo = async () => {
    if (history.length <= 1) return;
    const previous = history[history.length - 2];
    const newHist = history.slice(0, history.length - 1);
    setHistory(newHist);

    const img = await loadImage(previous);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    }
  };

  const handleReset = async () => {
    if (!imageSrc) return;
    const img = await loadImage(imageSrc);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory([canvas.toDataURL('image/png')]);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    downloadDataUrl(dataUrl, `${imageName}_transparent.png`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Background Eraser
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            One-click Magic Wand color keying and manual brush erasing to transparent PNG
          </p>
        </div>

        {imageSrc && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
              title="Undo last erase"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {!imageSrc ? (
        <DropZone onImageSelected={handleImageLoaded} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Stage */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-checker flex items-center justify-center p-4 min-h-[460px] select-none">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className={`max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm ${
                  mode === 'magic-wand' ? 'cursor-crosshair' : 'cursor-pointer'
                }`}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              {mode === 'magic-wand'
                ? '👆 Click on any background color to automatically erase all connected matching areas.'
                : '🖌️ Click and drag over the image to manually erase unwanted details.'}
            </p>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              {/* Tool Mode Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Eraser Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('magic-wand')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                      mode === 'magic-wand'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Wand2 className="w-5 h-5" />
                    <span>Magic Wand</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('brush')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                      mode === 'brush'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Eraser className="w-5 h-5" />
                    <span>Manual Brush</span>
                  </button>
                </div>
              </div>

              {mode === 'magic-wand' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Color Matching Tolerance</span>
                    <span className="font-mono text-indigo-600 font-bold">{tolerance}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400">
                    Higher values erase wider shades of the sampled color.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Brush Radius</span>
                    <span className="font-mono text-indigo-600 font-bold">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Download className="w-4 h-4" />
                <span>Download Transparent PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
