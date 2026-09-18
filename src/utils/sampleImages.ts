export interface SampleImage {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
}

// Built-in base64/SVG or reliable public images
export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'landscape',
    name: 'Mountain Lake',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=60'
  },
  {
    id: 'portrait',
    name: 'Golden Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=60'
  },
  {
    id: 'architecture',
    name: 'Urban Cyberpunk',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=200&q=60'
  },
  {
    id: 'nature',
    name: 'Macro Flora',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=200&q=60'
  }
];

export async function fetchSampleAsDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    // If CORS fails on unsplash in preview, fallback to generated canvas pattern
    return createProceduralSample();
  }
}

export function createProceduralSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw vibrant scenic landscape
  const gradSky = ctx.createLinearGradient(0, 0, 0, 400);
  gradSky.addColorStop(0, '#1e1b4b');
  gradSky.addColorStop(0.5, '#4338ca');
  gradSky.addColorStop(1, '#f97316');
  ctx.fillStyle = gradSky;
  ctx.fillRect(0, 0, 800, 600);

  // Sun
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(400, 280, 70, 0, Math.PI * 2);
  ctx.fill();

  // Mountains
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, 450);
  ctx.lineTo(200, 250);
  ctx.lineTo(380, 420);
  ctx.lineTo(550, 220);
  ctx.lineTo(800, 460);
  ctx.lineTo(800, 600);
  ctx.lineTo(0, 600);
  ctx.closePath();
  ctx.fill();

  // Lake reflection
  const gradWater = ctx.createLinearGradient(0, 420, 0, 600);
  gradWater.addColorStop(0, '#0284c7');
  gradWater.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradWater;
  ctx.fillRect(0, 420, 800, 180);

  // Text tag
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText('Image Toolbox Demo', 400, 540);

  return canvas.toDataURL('image/jpeg', 0.9);
}
