import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  Download, 
  Plus, 
  Trash2, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { loadImage, downloadDataUrl } from '../../utils/imageProcessors';
import { SAMPLE_IMAGES, fetchSampleAsDataUrl } from '../../utils/sampleImages';

type CollageLayout = '2-horizontal' | '2-vertical' | '3-featured' | '4-grid' | '6-mosaic';

export const CollageTool: React.FC = () => {
  const [images, setImages] = useState<{ id: string; dataUrl: string }[]>([]);
  const [layout, setLayout] = useState<CollageLayout>('4-grid');
  const [spacing, setSpacing] = useState(12); // in px
  const [borderRadius, setBorderRadius] = useState(8);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9' | '9:16'>('1:1');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load initial demo photos if none
  const loadDemoPhotos = async () => {
    const loaded: { id: string; dataUrl: string }[] = [];
    for (const sample of SAMPLE_IMAGES.slice(0, 4)) {
      const dataUrl = await fetchSampleAsDataUrl(sample.url);
      loaded.push({ id: Math.random().toString(36).substring(7), dataUrl });
    }
    setImages(loaded);
  };

  const handleAddImage = (dataUrl: string) => {
    if (images.length >= 6) return;
    setImages((prev) => [...prev, { id: Math.random().toString(36).substring(7), dataUrl }]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Render collage to canvas
  useEffect(() => {
    if (images.length === 0) return;

    let isMounted = true;
    const render = async () => {
      const canvas = document.createElement('canvas');
      const baseWidth = 1200;
      let baseHeight = 1200;

      if (aspectRatio === '4:3') baseHeight = 900;
      else if (aspectRatio === '16:9') baseHeight = 675;
      else if (aspectRatio === '9:16') baseHeight = 2133;

      canvas.width = baseWidth;
      canvas.height = baseHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Load all images
      const loadedImgs: HTMLImageElement[] = [];
      for (const item of images) {
        try {
          const img = await loadImage(item.dataUrl);
          loadedImgs.push(img);
        } catch (e) {
          console.error(e);
        }
      }

      if (loadedImgs.length === 0) return;

      // Determine cell rects based on chosen layout
      interface Rect { x: number; y: number; w: number; h: number }
      const rects: Rect[] = [];

      const sp = spacing;
      const w = baseWidth;
      const h = baseHeight;

      if (layout === '2-horizontal') {
        const cellW = (w - sp * 3) / 2;
        const cellH = h - sp * 2;
        rects.push({ x: sp, y: sp, w: cellW, h: cellH });
        rects.push({ x: sp * 2 + cellW, y: sp, w: cellW, h: cellH });
      } else if (layout === '2-vertical') {
        const cellW = w - sp * 2;
        const cellH = (h - sp * 3) / 2;
        rects.push({ x: sp, y: sp, w: cellW, h: cellH });
        rects.push({ x: sp, y: sp * 2 + cellH, w: cellW, h: cellH });
      } else if (layout === '3-featured') {
        // 1 big top, 2 small bottom
        const topH = (h - sp * 3) * 0.6;
        const bottomH = (h - sp * 3) * 0.4;
        const bottomW = (w - sp * 3) / 2;
        rects.push({ x: sp, y: sp, w: w - sp * 2, h: topH });
        rects.push({ x: sp, y: sp * 2 + topH, w: bottomW, h: bottomH });
        rects.push({ x: sp * 2 + bottomW, y: sp * 2 + topH, w: bottomW, h: bottomH });
      } else if (layout === '4-grid') {
        const cellW = (w - sp * 3) / 2;
        const cellH = (h - sp * 3) / 2;
        rects.push({ x: sp, y: sp, w: cellW, h: cellH });
        rects.push({ x: sp * 2 + cellW, y: sp, w: cellW, h: cellH });
        rects.push({ x: sp, y: sp * 2 + cellH, w: cellW, h: cellH });
        rects.push({ x: sp * 2 + cellW, y: sp * 2 + cellH, w: cellW, h: cellH });
      } else if (layout === '6-mosaic') {
        const cellW = (w - sp * 4) / 3;
        const cellH = (h - sp * 3) / 2;
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 3; col++) {
            rects.push({
              x: sp + col * (cellW + sp),
              y: sp + row * (cellH + sp),
              w: cellW,
              h: cellH,
            });
          }
        }
      }

      // Draw each image clipped into rounded cell
      rects.forEach((rect, idx) => {
        const img = loadedImgs[idx % loadedImgs.length];
        if (!img) return;

        ctx.save();
        ctx.beginPath();
        const r = Math.min(borderRadius, rect.w / 2, rect.h / 2);
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, r);
        ctx.clip();

        // Aspect fill inside rect
        const imgRatio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
        const rectRatio = rect.w / rect.h;
        let drawW = rect.w;
        let drawH = rect.h;
        let dx = rect.x;
        let dy = rect.y;

        if (imgRatio > rectRatio) {
          drawW = rect.h * imgRatio;
          dx = rect.x - (drawW - rect.w) / 2;
        } else {
          drawH = rect.w / imgRatio;
          dy = rect.y - (drawH - rect.h) / 2;
        }

        ctx.drawImage(img, dx, dy, drawW, drawH);
        ctx.restore();
      });

      if (isMounted) {
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
      }
    };

    const timer = setTimeout(render, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [images, layout, spacing, borderRadius, backgroundColor, aspectRatio]);

  const handleDownload = () => {
    if (!previewUrl) return;
    downloadDataUrl(previewUrl, 'image_toolbox_collage.jpg');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Collage Maker
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Combine 2 to 6 images into dynamic grid layouts with customizable borders and spacing
          </p>
        </div>

        {images.length === 0 && (
          <button
            type="button"
            onClick={loadDemoPhotos}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Load Demo Set</span>
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <DropZone
          multiple
          onMultipleImagesSelected={(files) => {
            const list = files.slice(0, 6).map((f) => ({
              id: Math.random().toString(36).substring(7),
              dataUrl: f.dataUrl,
            }));
            setImages(list);
          }}
          onImageSelected={(url) => {
            setImages([{ id: '1', dataUrl: url }]);
          }}
          title="Upload 2 or more photos to compose a collage"
          subtitle="Supports up to 6 images. Try our built-in sample set if you don't have images ready."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Stage */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[460px]">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Collage Preview"
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>

            {/* Photos thumbnail bar */}
            <div className="flex items-center gap-2 overflow-x-auto p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {images.map((item, idx) => (
                <div key={item.id} className="relative group w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={item.dataUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(item.id)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              ))}

              {images.length < 6 && (
                <label className="w-16 h-16 shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-500 text-slate-400 hover:text-indigo-500 transition-colors">
                  <Plus className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) handleAddImage(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
              {/* Layout template */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Collage Grid Layout
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '4-grid', label: '2 × 2 Grid' },
                    { id: '2-horizontal', label: 'Side by Side' },
                    { id: '2-vertical', label: 'Top / Bottom' },
                    { id: '3-featured', label: '1 Large + 2 Small' },
                    { id: '6-mosaic', label: '6 Photos Mosaic' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLayout(l.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        layout === l.id
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Canvas Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['1:1', '4:3', '16:9', '9:16'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        aspectRatio === r
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing & Radius */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Border Spacing</span>
                    <span className="font-mono text-indigo-600 font-bold">{spacing}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={spacing}
                    onChange={(e) => setSpacing(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">Corner Rounding</span>
                    <span className="font-mono text-indigo-600 font-bold">{borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Background color */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Background
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['#ffffff', '#f8fafc', '#0f172a', '#1e1b4b', '#fef3c7'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBackgroundColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 ${
                          backgroundColor === c ? 'border-indigo-600 scale-110' : 'border-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Download button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Download className="w-4 h-4" />
                <span>Save Collage Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
