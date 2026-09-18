# Image Toolbox (Web)

A versatile, 100% client-side image editing and processing suite rewritten from the original Android application [ImageToolbox](https://github.com/T8RIN/ImageToolbox) into a modern React application.

All image processing runs entirely in your browser using HTML5 Canvas API and Web APIs — zero server upload, maximum privacy, instant performance.

## Features

- **Resize & Convert**: Scale by pixel dimensions, percentage factor, or target file size (KB). Format conversion to PNG, JPEG, and WebP with real-time compression estimation.
- **Crop & Transform**: Standard aspect ratios (1:1, 4:3, 16:9, 9:16, 3:2), freeform rectangle cropping, 90° rotation, and horizontal/vertical flipping.
- **Filters & Adjustments**: Live adjustments for brightness, contrast, saturation, blur, grayscale, sepia, invert, and hue rotation with instant preview.
- **Background Eraser**: Color similarity flood fill (Magic Wand) and manual eraser brush with adjustable radius and feathering.
- **Draw & Annotate**: Freehand pencil, neon glow brush, highlighter, straight arrows, rectangles, circles, and text watermarking.
- **Watermark & Protect**: Diagonal repeated copyright pattern overlays and single anchored corner stamp watermarks with opacity and tilt controls.
- **Collage Maker**: Multi-photo collage composer supporting 2 to 6 images with dynamic grid layouts, spacing, and border corner rounding.
- **QR & Barcode**: High-resolution custom QR code generator for URLs, plain text, WiFi credentials, and vCards.
- **Palette & Loupe**: Automatic dominant color extraction and live pixel hover loupe with HEX / RGB inspection and CSS variable export.
- **EXIF & Privacy Inspector**: Detailed image dimensions, megapixel count, and file specs with one-click EXIF metadata stripping for privacy.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion
- **Image Processing**: HTML5 Canvas 2D Context & ImageData API

## Getting Started

```bash
npm install
npm run dev
```

The application runs on `http://localhost:3000`.
