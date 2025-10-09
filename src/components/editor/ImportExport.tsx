'use client';

import React, { useRef } from 'react';
import { useTexture } from '@/contexts/TextureContext';

export default function ImportExport() {
  const { textureData, updateTexture, canvasSize } = useTexture();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    if (!textureData.dataUrl) return;

    const link = document.createElement('a');
    link.download = `bump-map-${Date.now()}.png`;
    link.href = textureData.dataUrl;
    link.click();
  };

  return (
    <div className="p-4 bg-white border-t border-gray-300">
      <h3 className="text-sm font-semibold mb-3">Import / Export</h3>
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Import Image
        </button>
        <button
          onClick={handleExport}
          className="flex-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={!textureData.dataUrl}
        >
          Export PNG
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}

