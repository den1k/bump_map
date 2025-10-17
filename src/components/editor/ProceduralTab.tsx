'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTexture } from '@/contexts/TextureContext';
import { parseDSL } from '@/dsl/parser';

const DEFAULT_DSL = `engine: math
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=32,32
expr:
  ix = Math.floor(u * period_x)
  iy = Math.floor(v * period_y)
  checker = (ix + iy) % 2
  shade = checker === 0 ? 32/255 : 224/255
`;

type Preset = { label: string; dsl: string };
const PRESETS: { group: string; items: Preset[] }[] = [
  {
    group: 'Math',
    items: [
      { label: 'Checker (demo)', dsl: `engine: math
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=32,32
expr:
  ix = Math.floor(u * period_x)
  iy = Math.floor(v * period_y)
  checker = (ix + iy) % 2
  shade = checker === 0 ? 32/255 : 224/255
` },
      { label: 'Sine Curve', dsl: `engine: math
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=1,1
expr:
  freq = 8;
  amp = 0.4;
  y = 0.5 + amp * Math.sin(2 * Math.PI * freq * u);
  dist = Math.abs(v - y);
  // Smooth gradient falloff
  lineWidth = 0.01;
  shade = 1.0 - Math.exp(-dist * dist / (2 * lineWidth * lineWidth)) * 0.7;
` },
      { label: 'Circle Outline', dsl: `engine: math
size: 512x512
seed: 1
background: 1.0
repeat: clamp
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=1,1
expr:
  cx = 0.5; cy = 0.5; r = 0.3; w = 0.03;
  d = Math.sqrt((u-cx)**2 + (v-cy)**2);
  dist = Math.abs(d - r);
  shade = (dist < w) ? 0.0 : 1.0;
` },
      { label: 'Radial Waves', dsl: `engine: math
size: 512x512
seed: 1
background: 1.0
repeat: clamp
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=1,1
expr:
  dist = Math.sqrt((u-0.5)**2 + (v-0.5)**2);
  shade = 0.5 + 0.5 * Math.sin(2 * Math.PI * dist * 8);
` },
      { label: 'White Noise', dsl: `engine: math
size: 512x512
seed: 1
background: 0.5
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=32,32
expr:
  // Simple pseudo-random noise
  x = Math.floor(u * period_x);
  y = Math.floor(v * period_y);
  hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  shade = (hash - Math.floor(hash));
` },
      { label: 'Smooth Noise', dsl: `engine: math
size: 512x512
seed: 1
background: 0.5
repeat: tile
post: blur=2.0, edge_blur=0.0, contrast=1.2, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=8,8
expr:
  // Value noise with bilinear interpolation
  x = u * period_x;
  y = v * period_y;
  x0 = Math.floor(x); y0 = Math.floor(y);
  x1 = x0 + 1; y1 = y0 + 1;
  fx = x - x0; fy = y - y0;
  // Smoothstep interpolation
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  // Hash function for random values
  h00 = Math.sin(x0 * 12.9898 + y0 * 78.233) * 43758.5453;
  h10 = Math.sin(x1 * 12.9898 + y0 * 78.233) * 43758.5453;
  h01 = Math.sin(x0 * 12.9898 + y1 * 78.233) * 43758.5453;
  h11 = Math.sin(x1 * 12.9898 + y1 * 78.233) * 43758.5453;
  v00 = h00 - Math.floor(h00);
  v10 = h10 - Math.floor(h10);
  v01 = h01 - Math.floor(h01);
  v11 = h11 - Math.floor(h11);
  // Bilinear interpolation
  v0 = v00 * (1 - fx) + v10 * fx;
  v1 = v01 * (1 - fx) + v11 * fx;
  shade = v0 * (1 - fy) + v1 * fy;
` },
      { label: 'Clouds', dsl: `engine: math
size: 512x512
seed: 1
background: 0.5
repeat: tile
post: blur=1.0, edge_blur=0.0, contrast=1.3, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=16,16
expr:
  // Fractal Brownian Motion (FBM) - layered noise
  function noise(x, y, freq) {
    x = x * freq; y = y * freq;
    x0 = Math.floor(x); y0 = Math.floor(y);
    fx = x - x0; fy = y - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    h00 = Math.sin(x0 * 12.9898 + y0 * 78.233) * 43758.5453;
    h10 = Math.sin((x0+1) * 12.9898 + y0 * 78.233) * 43758.5453;
    h01 = Math.sin(x0 * 12.9898 + (y0+1) * 78.233) * 43758.5453;
    h11 = Math.sin((x0+1) * 12.9898 + (y0+1) * 78.233) * 43758.5453;
    v00 = h00 - Math.floor(h00);
    v10 = h10 - Math.floor(h10);
    v01 = h01 - Math.floor(h01);
    v11 = h11 - Math.floor(h11);
    v0 = v00 * (1-fx) + v10 * fx;
    v1 = v01 * (1-fx) + v11 * fx;
    return v0 * (1-fy) + v1 * fy;
  }
  // Layer multiple octaves
  value = 0;
  amplitude = 1.0;
  frequency = 1.0;
  for (let i = 0; i < 4; i++) {
    value += noise(u, v, frequency) * amplitude;
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  shade = value / 2.0;
` },
      { label: 'Turbulence', dsl: `engine: math
size: 512x512
seed: 1
background: 0.5
repeat: tile
post: blur=0.5, edge_blur=0.0, contrast=1.5, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
period=16,16
expr:
  // Turbulence using absolute noise
  function noise(x, y, freq) {
    x = x * freq; y = y * freq;
    x0 = Math.floor(x); y0 = Math.floor(y);
    fx = x - x0; fy = y - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    h00 = Math.sin(x0 * 12.9898 + y0 * 78.233) * 43758.5453;
    h10 = Math.sin((x0+1) * 12.9898 + y0 * 78.233) * 43758.5453;
    h01 = Math.sin(x0 * 12.9898 + (y0+1) * 78.233) * 43758.5453;
    h11 = Math.sin((x0+1) * 12.9898 + (y0+1) * 78.233) * 43758.5453;
    v00 = h00 - Math.floor(h00);
    v10 = h10 - Math.floor(h10);
    v01 = h01 - Math.floor(h01);
    v11 = h11 - Math.floor(h11);
    v0 = v00 * (1-fx) + v10 * fx;
    v1 = v01 * (1-fx) + v11 * fx;
    return v0 * (1-fy) + v1 * fy;
  }
  // Absolute value creates turbulence
  value = 0;
  amplitude = 1.0;
  frequency = 1.0;
  for (let i = 0; i < 5; i++) {
    value += Math.abs(noise(u, v, frequency) - 0.5) * amplitude;
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  shade = value;
` },
    ],
  },
  {
    group: 'L-system',
    items: [
      { label: 'Square Curve', dsl: `engine: lsystem
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[axiom]
F+F+F+F

[rules]
F -> F+F−F−F+F

[interp]
iterations=2
step=6
angle=90
thickness=1
spacing=1
shade=F:0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Koch Snowflake', dsl: `engine: lsystem
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[axiom]
F--F--F

[rules]
F -> F+F--F+F

[interp]
iterations=3
step=4
angle=60
thickness=1
spacing=1
shade=F:0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Dragon Curve', dsl: `engine: lsystem
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[axiom]
FX

[rules]
X -> X+YF+
Y -> -FX-Y

[interp]
iterations=10
step=4
angle=90
thickness=1
spacing=1
shade=F:0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Hilbert Curve', dsl: `engine: lsystem
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[axiom]
L

[rules]
L -> +RF-LFL-FR+
R -> -LF+RFR+FL-

[interp]
iterations=5
step=5
angle=90
thickness=1
spacing=1
shade=F:0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Plant', dsl: `engine: lsystem
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[axiom]
X

[rules]
X -> F+[[X]-X]-F[-FX]+X
F -> FF

[interp]
iterations=5
step=4
angle=25
thickness=1
spacing=1
shade=F:0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Sierpinski Arrowhead', dsl: `engine: lsystem
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[axiom]
F

[rules]
F -> F-G+F+G-F
G -> GG

[interp]
iterations=5
step=4
angle=60
thickness=1
spacing=1
shade=F:0.0
scale=1.0
translate=0.0,0.0
` },
    ],
  },
  {
    group: 'Cellular',
    items: [
      { label: 'Game of Life', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=128
wrap=true
neighborhood=moore:1
states=2
init=rand:0.5
spacing=1
life=B3/S23
iterations=120
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'HighLife', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=128
wrap=true
neighborhood=moore:1
states=2
init=rand:0.5
spacing=1
life=B36/S23
iterations=120
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Seeds', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=128
wrap=true
neighborhood=moore:1
states=2
init=rand:0.5
spacing=1
life=B2/S
iterations=120
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Maze', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=128
wrap=true
neighborhood=moore:1
states=2
init=rand:0.5
spacing=1
life=B3/S12345
iterations=300
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Day & Night', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=128
wrap=true
neighborhood=moore:1
states=2
init=rand:0.5
spacing=1
life=B3678/S34678
iterations=150
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Rule 30 (ECA)', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=512
wrap=true
neighborhood=moore:1
states=2
init=rand:0.01
spacing=0
eca=30
iterations=0
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Rule 90 (ECA)', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=512
wrap=true
neighborhood=moore:1
states=2
init=rand:0.01
spacing=0
eca=90
iterations=0
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
      { label: 'Rule 110 (ECA)', dsl: `engine: cellular
size: 512x512
seed: 1
background: 1.0
repeat: tile
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[grid]
resolution=512
wrap=true
neighborhood=moore:1
states=2
init=rand:0.01
spacing=0
eca=110
iterations=0
shade=state(0)=1.0, state(1)=0.0
scale=1.0
translate=0.0,0.0
` },
    ],
  },
  {
    group: 'Fractals',
    items: [
      { label: 'Mandelbrot', dsl: `engine: math
size: 512x512
seed: 1
background: 1.0
repeat: clamp
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
expr:
  shade = mandelbrot(u, v, 256, 4)
` },
      { label: 'Julia', dsl: `engine: math
size: 512x512
seed: 2
background: 1.0
repeat: clamp
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
expr:
  shade = julia(u, v, -0.4, 0.6, 256, 4)
` },
      { label: 'Burning Ship', dsl: `engine: math
size: 512x512
seed: 3
background: 1.0
repeat: clamp
invert: false
post: blur=0.0, blur_spread=1.0, edge_blur=0.0, contrast=1.0, gamma=1.0

[math]
coords=uv
scale=1.0
rotate=0
translate=0.0,0.0
expr:
  shade = burningShip(u, v, 256, 4)
` },
    ],
  },
];

function parseEngine(dsl: string): 'math' | 'lsystem' | 'cellular' {
  const m = dsl.match(/^[\s\S]*?\bengine\s*:\s*(\w+)/i);
  const e = (m?.[1] || 'math').toLowerCase();
  return (e === 'lsystem' || e === 'cellular') ? e : 'math';
}

function setEngineInDsl(dsl: string, engine: 'math' | 'lsystem' | 'cellular'): string {
  if (/\bengine\s*:/i.test(dsl)) {
    return dsl.replace(/(\bengine\s*:\s*)(\w+)/i, `$1${engine}`);
  }
  return `engine: ${engine}\n` + dsl;
}

function extractTranslate(dslText: string): { x: number; y: number } {
  // Look for translate= anywhere in the DSL
  const match = dslText.match(/translate\s*=\s*([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)/i);
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  }
  return { x: 0, y: 0 };
}

function extractScale(dslText: string): number {
  // Look for scale= anywhere in the DSL  
  const match = dslText.match(/^\s*scale\s*=\s*([+-]?\d+\.?\d*)/im);
  return match ? parseFloat(match[1]) : 1.0;
}

function extractInvert(dslText: string): boolean {
  // Look for invert: in the header
  const match = dslText.match(/^\s*invert\s*:\s*(true|false)/im);
  return match ? match[1].toLowerCase() === 'true' : false;
}

function setInvertInDsl(dsl: string, invert: boolean): string {
  if (/\binvert\s*:/i.test(dsl)) {
    return dsl.replace(/(\binvert\s*:\s*)(true|false)/i, `$1${invert}`);
  }
  // Insert after repeat: line if it exists
  if (/\brepeat\s*:/i.test(dsl)) {
    return dsl.replace(/(\brepeat\s*:\s*\w+)/i, `$1\ninvert: ${invert}`);
  }
  // Otherwise insert after background line
  if (/\bbackground\s*:/i.test(dsl)) {
    return dsl.replace(/(\bbackground\s*:\s*[^\n]+)/i, `$1\ninvert: ${invert}`);
  }
  return `invert: ${invert}\n` + dsl;
}

export default function ProceduralTab() {
  const { updateTexture, canvasSize, proceduralDsl, setProceduralDsl, setProceduralRepeat } = useTexture();
  const [dsl, setDsl] = React.useState<string>(proceduralDsl || DEFAULT_DSL);
  const [status, setStatus] = React.useState<string>('idle');
  const workerRef = React.useRef<Worker | null>(null);
  const [isRendering, setIsRendering] = React.useState(false);
  const debounceRef = React.useRef<number | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = React.useState<'math' | 'lsystem' | 'cellular'>(parseEngine(dsl));
  const [presetKey, setPresetKey] = React.useState<string>('');
  const [translateX, setTranslateX] = useState(() => extractTranslate(dsl).x);
  const [translateY, setTranslateY] = useState(() => extractTranslate(dsl).y);
  const [scale, setScale] = useState(() => extractScale(dsl));
  const [invert, setInvert] = useState(() => extractInvert(dsl));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [viewTransform, setViewTransform] = useState({ offsetX: 0, offsetY: 0, scale: 1.0 });
  const translateDebounceRef = React.useRef<number | null>(null);
  const scaleDebounceRef = React.useRef<number | null>(null);
  const isUpdatingFromInteraction = React.useRef(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Update DSL with translate values
  const updateTranslateInDsl = useCallback((x: number, y: number) => {
    isUpdatingFromInteraction.current = true;
    const xFormatted = x.toFixed(3);
    const yFormatted = y.toFixed(3);
    const updated = dsl.replace(/translate\s*=\s*[+-]?\d+\.?\d*\s*,\s*[+-]?\d+\.?\d*/i, `translate=${xFormatted},${yFormatted}`);
    setDsl(updated);
    setProceduralDsl(updated);
    // Don't reset viewTransform yet - wait for texture to regenerate
    // Flag will be cleared when render completes
  }, [dsl, setProceduralDsl]);


  // Update DSL with scale value
  const updateScaleInDsl = useCallback((scale: number) => {
    isUpdatingFromInteraction.current = true;
    const scaleFormatted = scale.toFixed(3);
    const updated = dsl.replace(/scale\s*=\s*[+-]?\d+\.?\d*/i, `scale=${scaleFormatted}`);
    setDsl(updated);
    setProceduralDsl(updated);
    // Don't reset viewTransform yet - wait for texture to regenerate
    // Flag will be cleared when render completes
  }, [dsl, setProceduralDsl]);

  // Draw preview canvas with view transformations
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (previewCanvas) {
      // Draw the texture with current view transform
      ctx.save();
      
      // Apply transformations: translate for pan, scale for zoom
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Translate to center, apply scale, translate back, then apply offset
      ctx.translate(centerX + viewTransform.offsetX, centerY + viewTransform.offsetY);
      ctx.scale(viewTransform.scale, viewTransform.scale);
      ctx.translate(-centerX, -centerY);
      
      ctx.drawImage(previewCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Create a checkerboard background pattern when no texture
      const tileSize = 8;
      for (let y = 0; y < canvas.height; y += tileSize) {
        for (let x = 0; x < canvas.width; x += tileSize) {
          const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
          ctx.fillStyle = isEven ? '#f0f0f0' : '#ffffff';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }, [previewCanvas, viewTransform]);

  // Mouse handlers for drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Update view transform immediately for smooth panning
    setViewTransform(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY
    }));
    
    // Convert pixel delta to UV delta (same sign - drag right = translate right)
    // Account for scale: when zoomed in (scale > 1), same pixel movement = smaller UV change
    const uvDeltaX = (deltaX / 256.0) / scale;
    const uvDeltaY = (deltaY / 256.0) / scale;

    const newX = translateX + uvDeltaX;
    const newY = translateY + uvDeltaY;
    
    setTranslateX(newX);
    setTranslateY(newY);
    
    // Debounce DSL update
    if (translateDebounceRef.current) {
      window.clearTimeout(translateDebounceRef.current);
    }
    translateDebounceRef.current = window.setTimeout(() => {
      updateTranslateInDsl(newX, newY);
      translateDebounceRef.current = null;
    }, 500);
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Immediately apply pending changes
    if (translateDebounceRef.current) {
      window.clearTimeout(translateDebounceRef.current);
      translateDebounceRef.current = null;
      updateTranslateInDsl(translateX, translateY);
    }
  };

  // Wheel handler for zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // deltaY > 0 (scroll down) = zoom out (smaller scale)
    // deltaY < 0 (scroll up) = zoom in (larger scale)
    // Less sensitive: 1.02/0.98 = 2% change per scroll
    const zoomFactor = e.deltaY > 0 ? 0.98 : 1.02;
    const newScale = Math.max(0.1, Math.min(10, scale * zoomFactor));
    
    setScale(newScale);
    
    // Update preview transform for immediate feedback
    setViewTransform(prev => ({
      ...prev,
      scale: newScale / extractScale(dsl)
    }));
    
    // Debounce DSL update
    if (scaleDebounceRef.current) {
      window.clearTimeout(scaleDebounceRef.current);
    }
    scaleDebounceRef.current = window.setTimeout(() => {
      updateScaleInDsl(newScale);
      scaleDebounceRef.current = null;
    }, 500);
  };

  // Reset view transform
  const handleResetView = () => {
    setTranslateX(0);
    setTranslateY(0);
    setScale(1.0);
    setViewTransform({ offsetX: 0, offsetY: 0, scale: 1.0 });
    
    // Update DSL directly without setting the interaction flag
    let updated = dsl.replace(/translate\s*=\s*[+-]?\d+\.?\d*\s*,\s*[+-]?\d+\.?\d*/i, `translate=0.000,0.000`);
    updated = updated.replace(/scale\s*=\s*[+-]?\d+\.?\d*/i, `scale=1.000`);
    setDsl(updated);
    setProceduralDsl(updated);
  };

  // Sync state from DSL changes (only when not dragging/zooming)
  React.useEffect(() => {
    if (isDragging || translateDebounceRef.current || scaleDebounceRef.current || isUpdatingFromInteraction.current) {
      return; // Don't sync while user is interacting or we're updating from interaction
    }
    const translate = extractTranslate(dsl);
    const dslScale = extractScale(dsl);
    setTranslateX(translate.x);
    setTranslateY(translate.y);
    setScale(dslScale);
  }, [dsl, isDragging]);

  React.useEffect(() => {
    // dynamic import worker via new URL for next bundler
    const w = new Worker(new URL('@/workers/proceduralTexture.worker.ts', import.meta.url));
    workerRef.current = w;
    
    w.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'done') {
        const imageData = new ImageData(msg.data, msg.width, msg.height);
        
        // Update both preview canvas and 3D texture
        const offscreen = document.createElement('canvas');
        offscreen.width = msg.width;
        offscreen.height = msg.height;
        const offCtx = offscreen.getContext('2d');
        if (offCtx) {
          offCtx.putImageData(imageData, 0, 0);
          setPreviewCanvas(offscreen);
        }
        
        // Update 3D texture
        updateTexture(imageData);
        
        // Reset view transform now that new texture has arrived with transforms baked in
        setViewTransform({ offsetX: 0, offsetY: 0, scale: 1.0 });
        
        // Clear the interaction flag now that render is complete
        isUpdatingFromInteraction.current = false;
        
        const doc = parseDSL(dsl);
        setProceduralRepeat(doc.header.repeat);
        setStatus('done');
      } else if (msg.type === 'error') {
        setStatus('error: ' + msg.message);
      }
      setIsRendering(false);
    };
    
    return () => { w.terminate(); };
  }, [updateTexture, dsl, setProceduralRepeat]);

  // Initial render on mount (after worker and textarea are ready)
  React.useEffect(() => {
    if (!workerRef.current || !textareaRef.current) return;
    const initialDsl = textareaRef.current.value;
    setIsRendering(true);
    setStatus('rendering');
    workerRef.current.postMessage({ type: 'render', dslText: initialDsl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const handleRender = React.useCallback(() => {
    if (!workerRef.current) return;
    setIsRendering(true);
    setStatus('rendering');
    workerRef.current.postMessage({ type: 'render', dslText: dsl });
  }, [dsl]);

  // Immediate render on DSL change
  React.useEffect(() => {
    if (!workerRef.current) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setIsRendering(true);
      setStatus('rendering');
      workerRef.current!.postMessage({ type: 'render', dslText: dsl });
    }, 100); // Short debounce for typing, but renders happen quickly
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [dsl]);

  return (
    <div className="p-4 bg-white border-t border-gray-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Procedural Generator (DSL)</h3>
        <div className={`text-xs ${status.startsWith('error') ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          {status}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <label className="text-xs text-gray-900 font-medium">Engine</label>
        <select
          value={engine}
          onChange={(e) => {
            const eng = e.target.value as 'math' | 'lsystem' | 'cellular';
            setEngine(eng);
            const next = setEngineInDsl(dsl, eng);
            setDsl(next);
            setProceduralDsl(next);
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
        >
          <option value="math">Math</option>
          <option value="lsystem">L-system</option>
          <option value="cellular">Cellular</option>
        </select>

        <label className="text-xs text-gray-900 font-medium ml-3">Presets</label>
        <select
          value={presetKey}
          onChange={(e) => {
            const key = e.target.value;
            setPresetKey(key);
            const [gIdx, iIdx] = key.split(':').map(Number);
            if (!Number.isNaN(gIdx) && !Number.isNaN(iIdx)) {
              const preset = PRESETS[gIdx]?.items[iIdx];
              if (preset) {
                setEngine(parseEngine(preset.dsl));
                setDsl(preset.dsl);
                setProceduralDsl(preset.dsl);
                const translate = extractTranslate(preset.dsl);
                setTranslateX(translate.x);
                setTranslateY(translate.y);
                setScale(extractScale(preset.dsl));
                setInvert(extractInvert(preset.dsl));
                setViewTransform({ offsetX: 0, offsetY: 0, scale: 1.0 });
              }
            }
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
        >
          <option value="">Select preset…</option>
          {PRESETS.map((group, gi) => (
            <optgroup key={group.group} label={group.group}>
              {group.items.map((p, pi) => (
                <option key={`${gi}:${pi}`} value={`${gi}:${pi}`}>{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <textarea
        value={dsl}
        onChange={(e) => { setDsl(e.target.value); setProceduralDsl(e.target.value); }}
        className="w-full h-48 p-2 border border-gray-300 rounded font-mono text-xs bg-white text-gray-900"
        spellCheck={false}
      />
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <button
          onClick={handleRender}
          disabled={isRendering}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          Render
        </button>
        <button
          onClick={() => setDsl(DEFAULT_DSL)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Reset DSL
        </button>
        <button
          onClick={handleResetView}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Reset View
        </button>
        
        <div className="ml-4 flex items-center gap-2">
          <label className="text-xs text-gray-900 font-medium">Scale:</label>
          <input
            type="number"
            value={scale.toFixed(3)}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 1.0;
              setScale(val);
              updateScaleInDsl(val);
            }}
            step="0.1"
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
          />
          <label className="text-xs text-gray-900 font-medium">Offset X:</label>
          <input
            type="number"
            value={translateX.toFixed(3)}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setTranslateX(val);
              updateTranslateInDsl(val, translateY);
            }}
            step="0.1"
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
          />
          <label className="text-xs text-gray-900 font-medium">Y:</label>
          <input
            type="number"
            value={translateY.toFixed(3)}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setTranslateY(val);
              updateTranslateInDsl(translateX, val);
            }}
            step="0.1"
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <label className="text-sm font-medium text-gray-900 mb-2">Preview (drag to pan, scroll to zoom)</label>
        <canvas
          ref={canvasRef}
          width={256}
          height={256}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="border border-gray-300 rounded shadow-sm cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">Canvas size: {canvasSize}×{canvasSize}</p>
    </div>
  );
}


