'use client';

import React, { useRef, useState } from 'react';
import { useTexture } from '@/contexts/TextureContext';
import { parseDSL } from '@/dsl/parser';

export default function ImportExport() {
  const { textureData, updateTexture, canvasSize, proceduralDsl, setProceduralDsl, editorMode } = useTexture();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dslInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Draw image to canvas and extract ImageData
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw and convert to grayscale
          ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
          const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
          
          // Convert to grayscale
          for (let i = 0; i < imageData.data.length; i += 4) {
            const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            imageData.data[i] = avg;
            imageData.data[i + 1] = avg;
            imageData.data[i + 2] = avg;
          }
          
          updateTexture(imageData);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!textureData.imageData && !proceduralDsl) return;

    const exportSize = 4000; // 4000x4000 pixels high-resolution export

    try {
      setIsExporting(true);
      setExportStatus(editorMode === 'procedural' ? `Rendering ${exportSize}×${exportSize}… This may take a while.` : `Upscaling to ${exportSize}×${exportSize}…`);

      if (editorMode === 'procedural' && proceduralDsl) {
        // For procedural: temporarily set size to 10000x10000 in DSL, and scale blur proportionally
        const doc = parseDSL(proceduralDsl);
        const currentW = doc.header.size.width;
        const scaleFactor = currentW > 0 ? exportSize / currentW : 1;
        const originalBlur = (doc.header.post && typeof doc.header.post.blur === 'number') ? (doc.header.post.blur as number) : 0;
        const scaledBlur = originalBlur * scaleFactor;

        let highResDsl = proceduralDsl.replace(/size:\s*\d+x\d+/i, `size: ${exportSize}x${exportSize}`);

        // If blur is present in post:, replace it; otherwise, append it
        if (/\bpost\b[^\n]*\bblur\s*=\s*[-+]?\d*\.?\d+/i.test(highResDsl)) {
          highResDsl = highResDsl.replace(/(post:[^\n]*\bblur\s*=\s*)([-+]?\d*\.?\d+)/i, `$1${scaledBlur.toFixed(3)}`);
        } else if (/\bpost\s*:/i.test(highResDsl)) {
          highResDsl = highResDsl.replace(/(post:\s*)([^\n]*)/i, (m, p1, p2) => `${p1}${p2 ? p2.trim().replace(/\s+$/, '') + ', ' : ''}blur=${scaledBlur.toFixed(3)}`);
        } else {
          // No post line at all; insert one after header lines
          highResDsl = highResDsl.replace(/(seed:\s*.*\n)/i, `$1post: blur=${scaledBlur.toFixed(3)}\n`);
        }
        
        // For cellular, adjust translate for exact centering at high res
        if (doc.engine === 'cellular' && doc.cellular) {
          let { x: tx, y: ty } = doc.cellular.translate;
          // If zero translate, add sub-pixel center bias if needed (empirical for alignment)
          if (tx === 0 && ty === 0) {
            tx = 0.5 / scaleFactor; // Tiny relative shift to match preview alignment
            ty = 0.5 / scaleFactor;
          }
          highResDsl = highResDsl.replace(/translate:\s*\{?\s*x:\s*([-+]?\d*\.?\d*),\s*y:\s*([-+]?\d*\.?\d*)\s*\}?/i, `translate: x=${tx.toFixed(3)}, y=${ty.toFixed(3)}`);
        }

        // Create temporary worker for high-res render
        const highResWorker = new Worker(new URL('@/workers/proceduralTexture.worker.ts', import.meta.url));
        
        highResWorker.onmessage = (e: MessageEvent) => {
          const msg = e.data;
          if (msg.type === 'done') {
            const imageData = new ImageData(msg.data, msg.width, msg.height);
            
            // Create canvas from high-res ImageData
            const canvas = document.createElement('canvas');
            canvas.width = exportSize;
            canvas.height = exportSize;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.putImageData(imageData, 0, 0);
              
              const link = document.createElement('a');
              link.download = `bump-map-${exportSize}px-procedural-${Date.now()}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            }
            setIsExporting(false);
            setExportStatus('');
          } else if (msg.type === 'error') {
            console.error('High-res render error:', msg.message);
            setExportStatus('High-res render failed. Falling back to upscale…');
            // Fallback to scaling low-res if high-res fails
            if (textureData.imageData) {
              scaleAndExport(textureData.imageData, exportSize).finally(() => {
                setIsExporting(false);
                setExportStatus('');
              });
            } else {
              setIsExporting(false);
              setExportStatus('');
            }
          }
          highResWorker.terminate();
        };

        highResWorker.postMessage({ type: 'render', dslText: highResDsl });
      } else {
        // For drawn textures: smoothly scale existing 512x512 to 10000x10000
        if (textureData.imageData) {
          await scaleAndExport(textureData.imageData, exportSize);
        }
        setIsExporting(false);
        setExportStatus('');
      }
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
      setExportStatus('');
    }
  };

  // Helper function to scale and export low-res texture
  const scaleAndExport = (imageData: ImageData, size: number): Promise<void> => {
    return createImageFromImageDataAsync(imageData).then((sourceImg) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true; // Smooth scaling
        ctx.drawImage(
          sourceImg,
          0, 0, imageData.width, imageData.height,
          0, 0, size, size
        );
        
        const link = document.createElement('a');
        link.download = `bump-map-${size}px-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    });
  };

  // Async helper function to create an Image from ImageData
  const createImageFromImageDataAsync = (imageData: ImageData): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(imageData, 0, 0);
      }
      
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = canvas.toDataURL();
    });
  };

  const handleImportDsl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (typeof text === 'string') setProceduralDsl(text);
    };
    reader.readAsText(file);
  };

  const handleExportDsl = () => {
    const blob = new Blob([proceduralDsl || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `procedural-${Date.now()}.dsl`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 bg-white border-t border-gray-300">
      <h3 className="text-sm font-semibold mb-3">Import / Export</h3>
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={isExporting}
        >
          Import Image
        </button>
        <button
          onClick={handleExport}
          className={`flex-1 px-4 py-2 rounded text-white ${isExporting ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600'}`}
          disabled={(!textureData.dataUrl && !proceduralDsl) || isExporting}
        >
          <span className="inline-flex items-center gap-2">
            {isExporting && (
              <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            {isExporting ? 'Exporting…' : 'Export PNG'}
          </span>
        </button>
        <button
          onClick={() => dslInputRef.current?.click()}
          className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          disabled={isExporting}
        >
          Import DSL
        </button>
        <button
          onClick={handleExportDsl}
          className="flex-1 px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800"
          disabled={isExporting}
        >
          Export DSL
        </button>
      </div>
      {isExporting && (
        <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
          <span className="inline-block h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>{exportStatus}</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleImport}
        className="hidden"
      />
      <input
        ref={dslInputRef}
        type="file"
        accept=".dsl,text/plain"
        onChange={handleImportDsl}
        className="hidden"
      />
    </div>
  );
}

