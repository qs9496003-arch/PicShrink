import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Crop as CropIcon, 
  Download, 
  Check, 
  Undo,
  Maximize2
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { loadImage, downloadDataUrl } from '../../utils/imageProcessors';

type AspectRatio = 'free' | '1:1' | '4:3' | '3:2' | '16:9' | '9:16' | '2:3';

export const CropTransformTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState('cropped_image');

  // Transformations
  const [rotation, setRotation] = useState<number>(0); // in degrees: 0, 90, 180, 270
  const [fineAngle, setFineAngle] = useState<number>(0); // -45 to +45
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');

  // Crop box normalized [0, 1] relative to current rendered bounds
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  });

  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null); // 'move', 'nw', 'ne', 'sw', 'se'
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startBox: typeof cropBox }>({
    mouseX: 0,
    mouseY: 0,
    startBox: { x: 0, y: 0, width: 0, height: 0 },
  });

  const handleImageLoaded = async (dataUrl: string, file?: File) => {
    setImageSrc(dataUrl);
    setImageName(file ? file.name.replace(/\.[^/.]+$/, '') : 'image');
    const img = await loadImage(dataUrl);
    setNaturalWidth(img.naturalWidth || img.width);
    setNaturalHeight(img.naturalHeight || img.height);
    setRotation(0);
    setFineAngle(0);
    setFlipH(false);
    setFlipV(false);
    setCropBox({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
  };

  // Adjust crop box when aspect ratio changes
  const applyAspectRatio = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1;
    switch (ratio) {
      case '1:1': targetRatio = 1; break;
      case '4:3': targetRatio = 4 / 3; break;
      case '3:2': targetRatio = 3 / 2; break;
      case '16:9': targetRatio = 16 / 9; break;
      case '9:16': targetRatio = 9 / 16; break;
      case '2:3': targetRatio = 2 / 3; break;
    }

    // Adapt current cropBox to match ratio
    let newWidth = 0.8;
    let newHeight = newWidth / targetRatio;
    if (newHeight > 0.9) {
      newHeight = 0.8;
      newWidth = newHeight * targetRatio;
    }
    const newX = Math.max(0, (1 - newWidth) / 2);
    const newY = Math.max(0, (1 - newHeight) / 2);

    setCropBox({
      x: newX,
      y: newY,
      width: Math.min(newWidth, 0.98),
      height: Math.min(newHeight, 0.98),
    });
  };

  // Drag handles logic
  const handleMouseDown = (mode: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(mode);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startBox: { ...cropBox },
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = (e.clientX - dragStartRef.current.mouseX) / rect.width;
      const dy = (e.clientY - dragStartRef.current.mouseY) / rect.height;
      const start = dragStartRef.current.startBox;

      if (isDragging === 'move') {
        const newX = Math.max(0, Math.min(1 - start.width, start.x + dx));
        const newY = Math.max(0, Math.min(1 - start.height, start.y + dy));
        setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isDragging === 'se') {
        let newW = Math.max(0.1, Math.min(1 - start.x, start.width + dx));
        let newH = Math.max(0.1, Math.min(1 - start.y, start.height + dy));
        setCropBox((prev) => ({ ...prev, width: newW, height: newH }));
      } else if (isDragging === 'nw') {
        const newX = Math.max(0, Math.min(start.x + start.width - 0.1, start.x + dx));
        const newY = Math.max(0, Math.min(start.y + start.height - 0.1, start.y + dy));
        const newW = start.width - (newX - start.x);
        const newH = start.height - (newY - start.y);
        setCropBox({ x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleMouseUp = () => setIsDragging(null);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const executeCrop = async () => {
    if (!imageSrc) return;
    const img = await loadImage(imageSrc);

    const totalRotation = (rotation + fineAngle) * (Math.PI / 180);

    // Canvas for rotation & flipping
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Dimensions after 90 or 270 deg
    const isQuarterTurn = Math.abs(rotation % 180) === 90;
    const baseW = isQuarterTurn ? img.naturalHeight : img.naturalWidth;
    const baseH = isQuarterTurn ? img.naturalWidth : img.naturalHeight;

    tempCanvas.width = baseW;
    tempCanvas.height = baseH;

    ctx.save();
    ctx.translate(baseW / 2, baseH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Now extract cropBox slice
    const cropX = Math.round(cropBox.x * baseW);
    const cropY = Math.round(cropBox.y * baseH);
    const cropW = Math.max(1, Math.round(cropBox.width * baseW));
    const cropH = Math.max(1, Math.round(cropBox.height * baseH));

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = cropW;
    finalCanvas.height = cropH;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return;

    finalCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const croppedUrl = finalCanvas.toDataURL('image/png');
    downloadDataUrl(croppedUrl, `${imageName}_crop.png`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Crop & Rotate
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cut to aspect ratios, rotate 90° increments or free angle, flip axes
          </p>
        </div>
      </div>

      {!imageSrc ? (
        <DropZone onImageSelected={handleImageLoaded} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Stage */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-6 min-h-[460px] select-none">
              <div
                ref={containerRef}
                className="relative inline-block max-h-[500px] max-w-full"
                style={{
                  transform: `rotate(${fineAngle}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                <img
                  src={imageSrc}
                  alt="Crop Target"
                  className="max-h-[480px] w-auto max-w-full object-contain pointer-events-none rounded shadow-md"
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  }}
                />

                {/* Darkened overlay outside crop */}
                <div
                  className="absolute border-2 border-white shadow-2xl cursor-move bg-indigo-500/10 ring-1 ring-black/40"
                  style={{
                    left: `${cropBox.x * 100}%`,
                    top: `${cropBox.y * 100}%`,
                    width: `${cropBox.width * 100}%`,
                    height: `${cropBox.height * 100}%`,
                  }}
                  onMouseDown={(e) => handleMouseDown('move', e)}
                >
                  {/* Grid lines inside crop box */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                    <div></div>
                  </div>

                  {/* Corner handles */}
                  <div
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize"
                    onMouseDown={(e) => handleMouseDown('nw', e)}
                  />
                  <div
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize"
                    onMouseDown={(e) => handleMouseDown('se', e)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
              <span>Original: {naturalWidth} × {naturalHeight} px</span>
              <span>
                Estimated Crop: {Math.round(naturalWidth * cropBox.width)} ×{' '}
                {Math.round(naturalHeight * cropBox.height)} px
              </span>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              {/* Aspect Ratio Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['free', '1:1', '4:3', '16:9', '9:16', '3:2', '2:3'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => applyAspectRatio(ratio)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {ratio === 'free' ? 'Free' : ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotate & Flip toolbar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Rotate & Flip
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1 text-[11px] font-medium transition-colors"
                    title="Rotate -90°"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>-90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1 text-[11px] font-medium transition-colors"
                    title="Rotate +90°"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>+90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipH((f) => !f)}
                    className={`p-2.5 rounded-xl border text-[11px] font-medium flex flex-col items-center gap-1 transition-colors ${
                      flipH
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Flip X</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipV((f) => !f)}
                    className={`p-2.5 rounded-xl border text-[11px] font-medium flex flex-col items-center gap-1 transition-colors ${
                      flipV
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span>Flip Y</span>
                  </button>
                </div>

                {/* Fine Angle Slider */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Fine Angle Straighten</span>
                    <span className="font-mono text-indigo-600 font-bold">{fineAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    value={fineAngle}
                    onChange={(e) => setFineAngle(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <button
                type="button"
                onClick={executeCrop}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Cropped PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
