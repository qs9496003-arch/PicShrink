import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Lock, 
  Unlock, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  FileArchive, 
  Check, 
  RefreshCw,
  Sliders,
  Maximize2
} from 'lucide-react';
import JSZip from 'jszip';
import { DropZone } from '../DropZone';
import { 
  formatBytes, 
  loadImage, 
  processResize, 
  shrinkToTargetWeight, 
  downloadBlob, 
  dataUrlToBlob 
} from '../../utils/imageProcessors';

interface BatchItem {
  id: string;
  file: File;
  originalDataUrl: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  processedBlob?: Blob;
  processedDataUrl?: string;
  processedSize?: number;
  processedWidth?: number;
  processedHeight?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export const ResizeConvertTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  // Single mode state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [imageName, setImageName] = useState('image');

  const [resizeMode, setResizeMode] = useState<'dimensions' | 'percentage' | 'target-weight'>('dimensions');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [percentage, setPercentage] = useState(75);
  const [targetKb, setTargetKb] = useState(250);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(85);

  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedSize, setProcessedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Batch mode state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Single mode initial load
  const handleSingleImageSelected = async (dataUrl: string, file?: File) => {
    setImageDataUrl(dataUrl);
    setImageName(file ? file.name.replace(/\.[^/.]+$/, '') : 'image');
    const blob = dataUrlToBlob(dataUrl);
    setOriginalSize(file ? file.size : blob.size);

    const img = await loadImage(dataUrl);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    setOriginalWidth(w);
    setOriginalHeight(h);
    setWidth(w);
    setHeight(h);
  };

  // Compute processed image
  useEffect(() => {
    if (!imageDataUrl || originalWidth === 0 || originalHeight === 0) return;

    let isMounted = true;
    const updateResult = async () => {
      setIsProcessing(true);
      try {
        const img = await loadImage(imageDataUrl);

        if (resizeMode === 'target-weight') {
          const res = await shrinkToTargetWeight(img, targetKb, format === 'image/png' ? 'image/jpeg' : format);
          if (isMounted) {
            setProcessedDataUrl(res.dataUrl);
            setProcessedBlob(res.blob);
            setProcessedSize(res.size);
          }
        } else {
          let targetW = width;
          let targetH = height;

          if (resizeMode === 'percentage') {
            targetW = Math.max(1, Math.round((originalWidth * percentage) / 100));
            targetH = Math.max(1, Math.round((originalHeight * percentage) / 100));
          }

          const res = await processResize({
            img,
            width: targetW,
            height: targetH,
            format,
            quality: quality / 100,
          });

          if (isMounted) {
            setProcessedDataUrl(res.dataUrl);
            setProcessedBlob(res.blob);
            setProcessedSize(res.size);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    const timer = setTimeout(updateResult, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [imageDataUrl, width, height, resizeMode, percentage, targetKb, format, quality, originalWidth, originalHeight]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (lockAspectRatio && originalWidth > 0) {
      setHeight(Math.max(1, Math.round((newWidth * originalHeight) / originalWidth)));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (lockAspectRatio && originalHeight > 0) {
      setWidth(Math.max(1, Math.round((newHeight * originalWidth) / originalHeight)));
    }
  };

  const handleDownloadSingle = () => {
    if (!processedBlob) return;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    downloadBlob(processedBlob, `${imageName}_resized.${ext}`);
  };

  // Batch files handler
  const handleBatchSelected = async (files: { dataUrl: string; file: File }[]) => {
    const items: BatchItem[] = [];
    for (const item of files) {
      try {
        const img = await loadImage(item.dataUrl);
        items.push({
          id: Math.random().toString(36).substring(7),
          file: item.file,
          originalDataUrl: item.dataUrl,
          originalSize: item.file.size,
          originalWidth: img.naturalWidth || img.width,
          originalHeight: img.naturalHeight || img.height,
          status: 'pending',
        });
      } catch (e) {
        console.error(e);
      }
    }
    setBatchItems(items);
  };

  const processAllBatch = async () => {
    setIsBatchProcessing(true);
    const updated = [...batchItems];

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'processing';
      setBatchItems([...updated]);

      try {
        const img = await loadImage(updated[i].originalDataUrl);
        let targetW = updated[i].originalWidth;
        let targetH = updated[i].originalHeight;

        if (resizeMode === 'percentage') {
          targetW = Math.max(1, Math.round((targetW * percentage) / 100));
          targetH = Math.max(1, Math.round((targetH * percentage) / 100));
        }

        const res = await processResize({
          img,
          width: targetW,
          height: targetH,
          format,
          quality: quality / 100,
        });

        updated[i].processedBlob = res.blob;
        updated[i].processedDataUrl = res.dataUrl;
        updated[i].processedSize = res.size;
        updated[i].processedWidth = targetW;
        updated[i].processedHeight = targetH;
        updated[i].status = 'done';
      } catch (e) {
        updated[i].status = 'error';
      }
      setBatchItems([...updated]);
    }
    setIsBatchProcessing(false);
  };

  const downloadBatchZip = async () => {
    const zip = new JSZip();
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';

    batchItems.forEach((item, index) => {
      if (item.processedBlob) {
        const base = item.file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${base}_resized_${index + 1}.${ext}`, item.processedBlob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, 'image_toolbox_batch.zip');
  };

  return (
    <div className="space-y-6">
      {/* Mode switcher (Single vs Batch) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Resize & Shrink
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scale dimensions, convert format, and compress to exact KB limits
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'single'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Single Photo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'batch'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Batch Mode
          </button>
        </div>
      </div>

      {activeTab === 'single' ? (
        !imageDataUrl ? (
          <DropZone onImageSelected={handleSingleImageSelected} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Preview Panel */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[360px]">
                {processedDataUrl ? (
                  <img
                    src={processedDataUrl}
                    alt="Processed Preview"
                    className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                    <span>Processing image...</span>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Updating...
                  </div>
                )}
              </div>

              {/* Statistics pill comparison */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                    Original
                  </span>
                  <div className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {originalWidth} × {originalHeight} px
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {formatBytes(originalSize)}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <span className="text-[11px] font-semibold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block mb-1">
                    Processed Output
                  </span>
                  <div className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {resizeMode === 'percentage'
                      ? `${Math.round((originalWidth * percentage) / 100)} × ${Math.round(
                          (originalHeight * percentage) / 100
                        )}`
                      : `${width} × ${height}`}{' '}
                    px
                  </div>
                  <div className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <span>{formatBytes(processedSize)}</span>
                    {originalSize > 0 && processedSize > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {Math.round(((processedSize - originalSize) / originalSize) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Settings Controls */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
                {/* Method selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    Shrink Strategy
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setResizeMode('dimensions')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        resizeMode === 'dimensions'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Dimensions
                    </button>
                    <button
                      type="button"
                      onClick={() => setResizeMode('percentage')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        resizeMode === 'percentage'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Preset %
                    </button>
                    <button
                      type="button"
                      onClick={() => setResizeMode('target-weight')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                        resizeMode === 'target-weight'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Target KB
                    </button>
                  </div>
                </div>

                {/* Strategy Inputs */}
                {resizeMode === 'dimensions' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-xs text-slate-500 font-medium mb-1 block">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={width}
                          min={1}
                          onChange={(e) => handleWidthChange(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium mb-1 block">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={height}
                          min={1}
                          onChange={(e) => handleHeightChange(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                        lockAspectRatio
                          ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{lockAspectRatio ? 'Aspect Ratio Locked' : 'Free Dimensions'}</span>
                    </button>
                  </div>
                )}

                {resizeMode === 'percentage' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-slate-400">Scale Factor</span>
                      <span className="font-mono text-indigo-600 font-bold">{percentage}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      value={percentage}
                      onChange={(e) => setPercentage(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex gap-1.5">
                      {[25, 50, 75, 100, 150].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPercentage(val)}
                          className={`flex-1 py-1 rounded-lg text-xs font-mono font-medium ${
                            percentage === val
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {resizeMode === 'target-weight' && (
                  <div className="space-y-3">
                    <label className="text-xs text-slate-500 font-medium mb-1 block">
                      Target File Weight Limit
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={10000}
                        value={targetKb}
                        onChange={(e) => setTargetKb(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-slate-500">KB</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[100, 250, 500, 1000].map((kb) => (
                        <button
                          key={kb}
                          type="button"
                          onClick={() => setTargetKb(kb)}
                          className={`flex-1 py-1 rounded-lg text-xs font-mono font-medium ${
                            targetKb === kb
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {kb} KB
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      The compressor binary-searches the highest possible quality that remains under this size.
                    </p>
                  </div>
                )}

                {/* Output Format */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Export Format & Quality
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'image/jpeg', label: 'JPG' },
                      { id: 'image/png', label: 'PNG' },
                      { id: 'image/webp', label: 'WebP' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormat(fmt.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                          format === fmt.id
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {format !== 'image/png' && resizeMode !== 'target-weight' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-600 dark:text-slate-400">Quality Compression</span>
                        <span className="font-mono text-indigo-600 font-bold">{quality}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  disabled={!processedBlob}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Processed Image</span>
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Batch mode */
        <div className="space-y-6">
          {batchItems.length === 0 ? (
            <DropZone
              multiple
              onMultipleImagesSelected={handleBatchSelected}
              onImageSelected={(url, file) => {
                if (file) handleBatchSelected([{ dataUrl: url, file }]);
              }}
              title="Upload multiple images for batch resizing"
              subtitle="Batch convert to WebP/JPG/PNG, scale percentage, and download as ZIP"
            />
          ) : (
            <div className="space-y-6">
              {/* Batch configuration toolbar */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Scale:</span>
                    <select
                      value={percentage}
                      onChange={(e) => setPercentage(Number(e.target.value))}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      <option value={25}>25%</option>
                      <option value={50}>50%</option>
                      <option value={75}>75%</option>
                      <option value={100}>100% (Original Dimensions)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Format:</span>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      <option value="image/jpeg">JPG</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WebP</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={processAllBatch}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isBatchProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Process All ({batchItems.length})
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={downloadBatchZip}
                    disabled={!batchItems.some((b) => b.status === 'done')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    Download ZIP
                  </button>
                </div>
              </div>

              {/* Batch list items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batchItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3"
                  >
                    <img
                      src={item.originalDataUrl}
                      alt={item.file.name}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-100 dark:border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {item.originalWidth} × {item.originalHeight} · {formatBytes(item.originalSize)}
                      </p>
                      {item.status === 'done' && (
                        <p className="text-[11px] text-emerald-600 font-mono font-medium mt-0.5">
                          → {item.processedWidth} × {item.processedHeight} · {formatBytes(item.processedSize || 0)}
                        </p>
                      )}
                    </div>

                    <div>
                      {item.status === 'done' ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : item.status === 'processing' ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          #{index + 1}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
