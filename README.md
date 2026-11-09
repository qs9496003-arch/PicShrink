# PicShrink

PicShrink by SadSha — a 100% client-side image editing suite. Resize, crop, filter, erase backgrounds, draw, watermark, build collages, make QR codes, pick palettes, and strip EXIF — all in your browser, no uploads, no account.

**Price: $9.99 lifetime.** Buy: info@toolzo.app

## Tools (10)

- **Resize & Shrink**: Scale by pixel dimensions, percentage, or target file size (KB). Convert to PNG, JPEG, and WebP.
- **Crop & Rotate**: Aspect presets (1:1, 4:3, 16:9, 9:16, 3:2), freeform crop, rotation, flip.
- **Filters & Adjust**: Brightness, contrast, saturation, blur, sharpen, vignette, plus 12 presets (B&W, sepia, vintage, cyberpunk, HDR, dither, pixelate, and more).
- **Background Eraser**: Magic-wand colour cutout and brush eraser to transparent PNG.
- **Draw & Annotate**: Pencil, neon brush, shapes, arrows, text stamps.
- **Watermark**: Repeated pattern or anchored corner stamp, with opacity and tilt.
- **Collage Maker**: 2–6 photo grids with spacing and rounded borders.
- **QR & Barcode**: Generate QR codes (URL, text, WiFi, vCard, phone) and scan QR codes from any image — works in every browser.
- **Palette & Loupe**: Dominant colour extraction and pixel colour loupe (HEX / RGB).
- **EXIF & Inspector**: Image properties with one-click EXIF stripping.

## Privacy

Your privacy matters — no file ever leaves your device. See [PRIVACY.md](PRIVACY.md).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Tech

React 18 + TypeScript + Vite + Tailwind CSS 4. Image processing is plain HTML5 Canvas 2D. QR decoding falls back to `jsqr` where the browser has no native BarcodeDetector.

## Attribution

Based on ImageToolbox by T8RIN, Apache 2.0.
