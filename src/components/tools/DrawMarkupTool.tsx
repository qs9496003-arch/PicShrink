import React, { useState, useRef, useEffect } from 'react';
import { 
  Pencil, 
  Sparkles, 
  Highlighter, 
  ArrowRight, 
  Square, 
  Circle, 
  Type, 
  Download, 
  Undo, 
  RotateCcw,
  Palette,
  Check
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { loadImage, downloadDataUrl } from '../../utils/imageProcessors';

type DrawTool = 'pencil' | 'neon' | 'highlighter' | 'arrow' | 'rect' | 'circle' | 'text';

const PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#000000', // black
];

export const DrawMarkupTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState('annotated_image');

  const [activeTool, setActiveTool] = useState<DrawTool>('pencil');
  const [strokeColor, setStrokeColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [textInput, setTextInput] = useState('Sample Text');

  const [history, setHistory] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const handleImageLoaded = async (dataUrl: string, file?: File) => {
    setImageSrc(dataUrl);
    setImageName(file ? file.name.replace(/\.[^/.]+$/, '') : 'annotated');
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

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    startPosRef.current = { x, y };
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setIsDrawing(true);

    if (activeTool === 'text') {
      ctx.font = `bold ${strokeWidth * 4}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = strokeColor;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(textInput, x, y);
      ctx.shadowBlur = 0;
      setIsDrawing(false);
      pushHistory();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    if (activeTool === 'pencil' || activeTool === 'neon' || activeTool === 'highlighter') {
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'neon') {
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = strokeWidth * 2;
      } else if (activeTool === 'highlighter') {
        ctx.strokeStyle = strokeColor + '66'; // 40% alpha
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = strokeColor;
        ctx.shadowBlur = 0;
      }

      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Shape tools: restore previous snapshot and draw interactive shape
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }

      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.shadowBlur = 0;

      const sx = startPosRef.current.x;
      const sy = startPosRef.current.y;

      if (activeTool === 'rect') {
        ctx.strokeRect(sx, sy, x - sx, y - sy);
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - sx, 2) + Math.pow(y - sy, 2));
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        drawArrow(ctx, sx, sy, x, y);
      }
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = strokeWidth * 3;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushHistory();
    }
  };

  const pushHistory = () => {
    if (!canvasRef.current) return;
    const current = canvasRef.current.toDataURL('image/png');
    setHistory((prev) => [...prev.slice(-12), current]);
  };

  const handleUndo = async () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory((h) => h.slice(0, h.length - 1));

    const img = await loadImage(prev);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    }
  };

  const handleReset = async () => {
    if (!imageSrc) return;
    const img = await loadImage(imageSrc);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistory([canvas.toDataURL('image/png')]);
      }
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    downloadDataUrl(url, `${imageName}_markup.png`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Draw & Annotate
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Freehand pen, neon glow, highlighters, arrows, shapes, and text stamps
          </p>
        </div>

        {imageSrc && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
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
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {!imageSrc ? (
        <DropZone onImageSelected={handleImageLoaded} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[460px] select-none">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm cursor-crosshair"
              />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              {/* Tool Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Markup Tool
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'pencil', label: 'Pen', icon: Pencil },
                    { id: 'neon', label: 'Neon', icon: Sparkles },
                    { id: 'highlighter', label: 'Highlight', icon: Highlighter },
                    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
                    { id: 'rect', label: 'Box', icon: Square },
                    { id: 'circle', label: 'Circle', icon: Circle },
                    { id: 'text', label: 'Text', icon: Type },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTool(t.id as any)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-medium transition-all ${
                          activeTool === t.id
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTool === 'text' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Text to Stamp (Click canvas to place)
                  </label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Palette */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setStrokeColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center ${
                        strokeColor === col ? 'scale-110 border-indigo-600 shadow-md' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {strokeColor === col && (
                        <Check className={`w-3.5 h-3.5 ${col === '#ffffff' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stroke Width */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600 dark:text-slate-400">
                    {activeTool === 'text' ? 'Font Size' : 'Stroke Thickness'}
                  </span>
                  <span className="font-mono text-indigo-600 font-bold">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={40}
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Download className="w-4 h-4" />
                <span>Download Marked Up Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
