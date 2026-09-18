import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FolderOpen } from 'lucide-react';
import { SAMPLE_IMAGES, fetchSampleAsDataUrl } from '../utils/sampleImages';

interface DropZoneProps {
  onImageSelected: (dataUrl: string, file?: File) => void;
  onMultipleImagesSelected?: (files: { dataUrl: string; file: File }[]) => void;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onImageSelected,
  onMultipleImagesSelected,
  multiple = false,
  title = 'Drag & drop images here',
  subtitle = 'Supports PNG, JPG, WebP, AVIF, GIF, SVG, BMP',
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (multiple && onMultipleImagesSelected && files.length > 1) {
      const results: { dataUrl: string; file: File }[] = [];
      let loaded = 0;
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          results.push({ dataUrl: ev.target?.result as string, file });
          loaded++;
          if (loaded === files.length) {
            onMultipleImagesSelected(results);
          }
        };
        reader.readAsDataURL(file);
      });
      return;
    }

    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onImageSelected(ev.target.result as string, file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleSelectSample = async (url: string) => {
    setLoadingSample(true);
    try {
      const dataUrl = await fetchSampleAsDataUrl(url);
      onImageSelected(dataUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        id="dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full cursor-pointer transition-all duration-200 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center select-none ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/70 dark:bg-slate-900/70 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20'
        } ${compact ? 'p-6' : 'p-10 md:p-14'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          {subtitle}
        </p>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm shadow-sm transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Choose {multiple ? 'Files' : 'Image'}
        </button>
      </div>

      {!compact && (
        <div className="mt-8 w-full max-w-xl">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Or try with a sample photo
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={loadingSample}
                onClick={() => handleSelectSample(sample.url)}
                className="group relative h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <img
                  src={sample.thumbnail}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2">
                  <span className="text-xs font-medium text-white truncate">
                    {sample.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
