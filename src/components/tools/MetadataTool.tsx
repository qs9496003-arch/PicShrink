import React, { useState } from 'react';
import { 
  Info, 
  ShieldCheck, 
  Download, 
  FileText, 
  Camera, 
  MapPin, 
  Calendar, 
  Layers, 
  Check 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { formatBytes, loadImage, downloadDataUrl } from '../../utils/imageProcessors';

interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: string;
  colorDepth: string;
  lastModified: string;
}

export const MetadataTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [meta, setMeta] = useState<ImageMetadata | null>(null);
  const [sanitizedUrl, setSanitizedUrl] = useState<string | null>(null);
  const [isSanitizing, setIsSanitizing] = useState(false);

  const handleImageLoaded = async (dataUrl: string, file?: File) => {
    setImageSrc(dataUrl);
    setSanitizedUrl(null);

    const img = await loadImage(dataUrl);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const mp = ((w * h) / 1000000).toFixed(2);

    // Calculate aspect ratio string
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const ratioStr = `${w / divisor}:${h / divisor}`;

    setMeta({
      name: file ? file.name : 'image.png',
      size: file ? file.size : Math.round((dataUrl.length * 3) / 4),
      type: file ? file.type : 'image/png',
      width: w,
      height: h,
      aspectRatio: ratioStr.length > 8 ? `${(w / h).toFixed(2)}:1` : ratioStr,
      megapixels: `${mp} MP`,
      colorDepth: '24-bit TrueColor (sRGB)',
      lastModified: file ? new Date(file.lastModified).toLocaleString() : new Date().toLocaleString(),
    });
  };

  // Sanitize EXIF & Metadata
  const sanitizeImage = async () => {
    if (!imageSrc || !meta) return;
    setIsSanitizing(true);

    try {
      const img = await loadImage(imageSrc);
      const canvas = document.createElement('canvas');
      canvas.width = meta.width;
      canvas.height = meta.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clean redraw removes all EXIF tags, GPS coords, camera info
      ctx.drawImage(img, 0, 0);

      const cleanUrl = canvas.toDataURL('image/jpeg', 0.95);
      setSanitizedUrl(cleanUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSanitizing(false);
    }
  };

  const downloadSanitized = () => {
    if (!sanitizedUrl || !meta) return;
    const base = meta.name.replace(/\.[^/.]+$/, '');
    downloadDataUrl(sanitizedUrl, `${base}_sanitized.jpg`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            EXIF & Inspector
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect technical file metadata and strip tracking tags for privacy
          </p>
        </div>
      </div>

      {!imageSrc ? (
        <DropZone onImageSelected={handleImageLoaded} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Display */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[440px]">
              <img
                src={imageSrc}
                alt="Metadata Inspector Target"
                className="max-h-[480px] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* Properties & Privacy Sanitizer */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Technical Specifications
              </h3>

              {meta && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Dimensions</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {meta.width} × {meta.height} px
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Megapixels</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {meta.megapixels}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">File Size</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatBytes(meta.size)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Aspect Ratio</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {meta.aspectRatio}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">File Format</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 uppercase">
                      {meta.type.replace('image/', '')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400 block mb-0.5">Color Space</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {meta.colorDepth}
                    </span>
                  </div>
                </div>
              )}

              {/* Privacy Strip Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Privacy Sanitizer
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Photos often carry hidden GPS coordinates, camera model serial numbers, and timestamps. Sanitizing redraws the pixel raster to strip all metadata tags cleanly.
                </p>

                {!sanitizedUrl ? (
                  <button
                    type="button"
                    onClick={sanitizeImage}
                    disabled={isSanitizing}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Strip EXIF & Privacy Tags</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-4 h-4" />
                      <span>EXIF metadata and tags successfully stripped!</span>
                    </div>

                    <button
                      type="button"
                      onClick={downloadSanitized}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Cleaned Image</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
