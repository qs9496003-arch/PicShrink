import { FilterSettings } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Resizes and converts image to chosen format & quality
 */
export async function processResize({
  img,
  width,
  height,
  format,
  quality,
}: {
  img: HTMLImageElement;
  width: number;
  height: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
}): Promise<{ dataUrl: string; blob: Blob; size: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL(format, quality);
  const blob = dataUrlToBlob(dataUrl);

  return {
    dataUrl,
    blob,
    size: blob.size,
  };
}

/**
 * Binary search to compress image to reach a target weight in KB
 */
export async function shrinkToTargetWeight(
  img: HTMLImageElement,
  targetWeightKb: number,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): Promise<{ dataUrl: string; blob: Blob; size: number; qualityUsed: number }> {
  const targetBytes = targetWeightKb * 1024;
  let minQuality = 0.05;
  let maxQuality = 0.98;
  let bestQuality = 0.8;
  let bestBlob: Blob | null = null;
  let bestDataUrl = '';

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(img, 0, 0);

  // 6 iterations of binary search
  for (let i = 0; i < 7; i++) {
    const testQuality = (minQuality + maxQuality) / 2;
    const testUrl = canvas.toDataURL(format, testQuality);
    const testBlob = dataUrlToBlob(testUrl);

    bestQuality = testQuality;
    bestBlob = testBlob;
    bestDataUrl = testUrl;

    if (testBlob.size > targetBytes) {
      maxQuality = testQuality;
    } else {
      minQuality = testQuality;
    }
  }

  // If even lowest quality is larger, downscale dimensions
  if (bestBlob && bestBlob.size > targetBytes) {
    let scale = Math.sqrt(targetBytes / bestBlob.size);
    if (scale < 0.95) {
      canvas.width = Math.max(32, Math.round(img.width * scale));
      canvas.height = Math.max(32, Math.round(img.height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      bestDataUrl = canvas.toDataURL(format, 0.75);
      bestBlob = dataUrlToBlob(bestDataUrl);
    }
  }

  return {
    dataUrl: bestDataUrl,
    blob: bestBlob!,
    size: bestBlob!.size,
    qualityUsed: Math.round(bestQuality * 100),
  };
}

/**
 * Applies full filter chain & custom effects to image
 */
export function applyFilterChain(
  img: HTMLImageElement,
  filters: FilterSettings
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Build standard CSS filter string
  const brightness = 100 + filters.brightness + filters.exposure;
  const contrast = 100 + filters.contrast;
  const saturate = 100 + filters.saturation;
  const hue = filters.hue;
  const blur = filters.blur;

  let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg)`;
  if (blur > 0) {
    filterStr += ` blur(${blur}px)`;
  }

  ctx.filter = filterStr;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none'; // reset

  // Pixel-level custom processing for presets & algorithms
  if (filters.activePreset !== 'none' || filters.warmth !== 0 || filters.vignette > 0 || filters.sharpen > 0) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const strength = filters.presetStrength / 100;

    // Warmth adjustment
    if (filters.warmth !== 0) {
      const w = filters.warmth * 0.5;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + w));       // red
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - w)); // blue
      }
    }

    // Presets
    switch (filters.activePreset) {
      case 'grayscale': {
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i] * (1 - strength) + gray * strength;
          data[i + 1] = data[i + 1] * (1 - strength) + gray * strength;
          data[i + 2] = data[i + 2] * (1 - strength) + gray * strength;
        }
        break;
      }
      case 'sepia': {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const tr = 0.393 * r + 0.769 * g + 0.189 * b;
          const tg = 0.349 * r + 0.686 * g + 0.168 * b;
          const tb = 0.272 * r + 0.534 * g + 0.131 * b;
          data[i] = data[i] * (1 - strength) + Math.min(255, tr) * strength;
          data[i + 1] = data[i + 1] * (1 - strength) + Math.min(255, tg) * strength;
          data[i + 2] = data[i + 2] * (1 - strength) + Math.min(255, tb) * strength;
        }
        break;
      }
      case 'invert': {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] * (1 - strength) + (255 - data[i]) * strength;
          data[i + 1] = data[i + 1] * (1 - strength) + (255 - data[i + 1]) * strength;
          data[i + 2] = data[i + 2] * (1 - strength) + (255 - data[i + 2]) * strength;
        }
        break;
      }
      case 'vintage': {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1 + 15 * strength);
          data[i + 1] = Math.min(255, data[i + 1] * 0.95);
          data[i + 2] = Math.max(0, data[i + 2] * 0.85);
        }
        break;
      }
      case 'cyberpunk': {
        for (let i = 0; i < data.length; i += 4) {
          // Boost cyan in shadows, pink/magenta in highlights
          const luma = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
          if (luma < 128) {
            data[i] = data[i] * 0.7;
            data[i + 1] = Math.min(255, data[i + 1] * 1.2 + 20);
            data[i + 2] = Math.min(255, data[i + 2] * 1.4 + 40);
          } else {
            data[i] = Math.min(255, data[i] * 1.3 + 30);
            data[i + 1] = data[i + 1] * 0.8;
            data[i + 2] = Math.min(255, data[i + 2] * 1.1 + 10);
          }
        }
        break;
      }
      case 'warm-golden': {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] + 35 * strength);
          data[i + 1] = Math.min(255, data[i + 1] + 18 * strength);
          data[i + 2] = Math.max(0, data[i + 2] - 15 * strength);
        }
        break;
      }
      case 'cold': {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] - 15 * strength);
          data[i + 1] = Math.min(255, data[i + 1] + 5 * strength);
          data[i + 2] = Math.min(255, data[i + 2] + 40 * strength);
        }
        break;
      }
      case 'hdr': {
        for (let i = 0; i < data.length; i += 4) {
          for (let c = 0; c < 3; c++) {
            let val = data[i + c] / 255;
            val = val < 0.5 ? 2 * val * val : 1 - 2 * (1 - val) * (1 - val);
            data[i + c] = Math.round(data[i + c] * (1 - strength) + val * 255 * strength);
          }
        }
        break;
      }
      case 'posterize': {
        const levels = 5;
        const step = 255 / (levels - 1);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.round(Math.round(data[i] / step) * step);
          data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
          data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
        }
        break;
      }
      case 'solarize': {
        const threshold = 128;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > threshold) data[i] = 255 - data[i];
          if (data[i + 1] > threshold) data[i + 1] = 255 - data[i + 1];
          if (data[i + 2] > threshold) data[i + 2] = 255 - data[i + 2];
        }
        break;
      }
      case 'dither': {
        // Floyd-Steinberg dithering simulation
        const w = canvas.width;
        const h = canvas.height;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const oldR = data[idx];
            const oldG = data[idx + 1];
            const oldB = data[idx + 2];
            const newR = oldR < 128 ? 0 : 255;
            const newG = oldG < 128 ? 0 : 255;
            const newB = oldB < 128 ? 0 : 255;
            data[idx] = newR;
            data[idx + 1] = newG;
            data[idx + 2] = newB;
            const errR = oldR - newR;
            const errG = oldG - newG;
            const errB = oldB - newB;

            if (x + 1 < w) {
              data[idx + 4] += (errR * 7) >> 4;
              data[idx + 5] += (errG * 7) >> 4;
              data[idx + 6] += (errB * 7) >> 4;
            }
            if (y + 1 < h) {
              if (x > 0) {
                const i2 = ((y + 1) * w + (x - 1)) * 4;
                data[i2] += (errR * 3) >> 4;
                data[i2 + 1] += (errG * 3) >> 4;
                data[i2 + 2] += (errB * 3) >> 4;
              }
              const i3 = ((y + 1) * w + x) * 4;
              data[i3] += (errR * 5) >> 4;
              data[i3 + 1] += (errG * 5) >> 4;
              data[i3 + 2] += (errB * 5) >> 4;
              if (x + 1 < w) {
                const i4 = ((y + 1) * w + (x + 1)) * 4;
                data[i4] += (errR * 1) >> 4;
                data[i4 + 1] += (errG * 1) >> 4;
                data[i4 + 2] += (errB * 1) >> 4;
              }
            }
          }
        }
        break;
      }
      case 'pixelate': {
        const size = Math.max(4, Math.round(canvas.width / 80));
        const w = canvas.width;
        const h = canvas.height;
        for (let y = 0; y < h; y += size) {
          for (let x = 0; x < w; x += size) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            for (let dy = 0; dy < size && y + dy < h; dy++) {
              for (let dx = 0; dx < size && x + dx < w; dx++) {
                const cur = ((y + dy) * w + (x + dx)) * 4;
                data[cur] = r;
                data[cur + 1] = g;
                data[cur + 2] = b;
              }
            }
          }
        }
        break;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Vignette overlay
  if (filters.vignette > 0) {
    const vStrength = filters.vignette / 100;
    const radius = Math.max(canvas.width, canvas.height) / 2;
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      radius * (1 - vStrength * 0.7),
      canvas.width / 2,
      canvas.height / 2,
      radius
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${vStrength * 0.85})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

/**
 * Erase background by color similarity (Magic Wand)
 */
export function removeBackgroundColor(
  img: HTMLImageElement,
  targetR: number,
  targetG: number,
  targetB: number,
  tolerance: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const tolSq = tolerance * tolerance * 3;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - targetR;
    const dg = data[i + 1] - targetG;
    const db = data[i + 2] - targetB;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq <= tolSq) {
      // Linear feather near tolerance boundary
      const factor = Math.sqrt(distSq / tolSq);
      if (factor > 0.8) {
        data[i + 3] = Math.round(data[i + 3] * ((factor - 0.8) / 0.2));
      } else {
        data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
