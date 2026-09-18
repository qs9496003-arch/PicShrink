export type ToolId = 
  | 'resize-shrink'
  | 'crop-transform'
  | 'filters'
  | 'background-eraser'
  | 'draw-markup'
  | 'watermark'
  | 'collage'
  | 'qr-barcode'
  | 'palette-picker'
  | 'metadata-info';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  category: 'edit' | 'adjust' | 'create' | 'utilities';
  description: string;
  iconName: string;
  badge?: string;
}

export interface ProcessedImageInfo {
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  dataUrl: string;
  file?: File;
}

export interface FilterSettings {
  brightness: number;     // -100 to 100
  contrast: number;       // -100 to 100
  saturation: number;     // -100 to 100
  exposure: number;       // -100 to 100
  warmth: number;         // -100 to 100
  hue: number;            // 0 to 360
  blur: number;           // 0 to 50
  sharpen: number;        // 0 to 100
  vignette: number;       // 0 to 100
  activePreset: string;   // 'none', 'grayscale', 'sepia', 'invert', 'vintage', 'cyberpunk', 'cold', 'warm-golden', 'duotone', 'dither', 'pixelate', 'sketch', 'emboss', 'hdr'
  presetStrength: number; // 0 to 100
}

export interface ResizeSettings {
  mode: 'dimensions' | 'percentage' | 'target-weight';
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  percentage: number;
  targetWeightKb: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.01 to 1.0
  resizeAlgorithm: 'bilinear' | 'nearest-neighbor' | 'bicubic';
}

export interface CropSettings {
  aspectRatio: 'free' | '1:1' | '4:3' | '3:2' | '16:9' | '9:16' | '2:3' | '5:4';
  rotation: number; // 0, 90, 180, 270
  fineAngle: number; // -45 to 45
  flipH: boolean;
  flipV: boolean;
}

export interface WatermarkSettings {
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  mode: 'single' | 'repeated';
  position: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
  repeatGap: number;
  imageWatermarkUrl?: string;
  imageScale: number;
}

export interface CollageSettings {
  layout: '2-horizontal' | '2-vertical' | '3-rows' | '3-mosaic' | '4-grid' | '6-mosaic';
  spacing: number;
  borderRadius: number;
  backgroundColor: string;
  aspectRatio: '1:1' | '4:3' | '16:9' | '9:16';
}
