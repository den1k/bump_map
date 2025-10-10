'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTexture } from '@/contexts/TextureContext';
import useTextureHistory from '@/hooks/useTextureHistory';
import useThrottle from '@/hooks/useThrottle';
import ProceduralTab from './ProceduralTab';

export default function TextureEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { canvasSize, brushSettings, updateTexture, editorMode: mode, setEditorMode: setMode } = useTexture();
  const { addToHistory, undo, redo, canUndo, canRedo } = useTextureHistory();
  const isDrawingRef = useRef(false);
  const strokeStartedRef = useRef(false);

  // Throttle texture updates to 60fps max for performance
  const throttledUpdateTexture = useThrottle(updateTexture, 16); // ~60fps

  // Initialize canvas as white (no displacement by default)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create imageData with EXACT white values
    const imageData = ctx.createImageData(canvasSize, canvasSize);
    // Fill entire image with exactly 255 (white)
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;     // R - exactly 255
      imageData.data[i + 1] = 255; // G - exactly 255
      imageData.data[i + 2] = 255; // B - exactly 255
      imageData.data[i + 3] = 255; // A - fully opaque
    }
    
    // Put the exact data onto the canvas
    ctx.putImageData(imageData, 0, 0);
    
    updateTexture(imageData);
    addToHistory(imageData);
  }, [canvasSize, updateTexture, addToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const draw = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { size, color, tool } = brushSettings;
    
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    
    if (tool === 'eraser') {
      ctx.fill();
    } else {
      const grayscale = `rgb(${color}, ${color}, ${color})`;
      ctx.fillStyle = grayscale;
      ctx.fill();
    }

    // Update texture data (throttled for performance)
    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
    // Convert transparent pixels to white for no displacement
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] === 0) { // If transparent
        imageData.data[i] = 255;     // R
        imageData.data[i + 1] = 255; // G
        imageData.data[i + 2] = 255; // B
        imageData.data[i + 3] = 255; // A
      }
    }
    throttledUpdateTexture(imageData);
  }, [brushSettings, canvasSize, throttledUpdateTexture]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    isDrawingRef.current = true;
    strokeStartedRef.current = true;
    draw(point.x, point.y);
  }, [getCanvasPoint, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    draw(point.x, point.y);
  }, [getCanvasPoint, draw]);

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current && strokeStartedRef.current) {
      // Save to history when stroke ends
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
          addToHistory(imageData);
        }
      }
      strokeStartedRef.current = false;
    }
    isDrawingRef.current = false;
  }, [canvasSize, addToHistory]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawingRef.current && strokeStartedRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
          addToHistory(imageData);
        }
      }
      strokeStartedRef.current = false;
    }
    isDrawingRef.current = false;
  }, [canvasSize, addToHistory]);

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.putImageData(previousState, 0, 0);
        updateTexture(previousState);
      }
    }
  }, [undo, updateTexture]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.putImageData(nextState, 0, 0);
        updateTexture(nextState);
      }
    }
  }, [redo, updateTexture]);

  const fillCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { color } = brushSettings;
    const grayscale = `rgb(${color}, ${color}, ${color})`;
    
    ctx.fillStyle = grayscale;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
    // Ensure alpha is 255 for filled areas
    for (let i = 3; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;
    }
    updateTexture(imageData);
    addToHistory(imageData);
  }, [brushSettings, canvasSize, updateTexture, addToHistory]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create fresh imageData with exact white values
    const imageData = ctx.createImageData(canvasSize, canvasSize);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255;     // R - exactly 255
      imageData.data[i + 1] = 255; // G - exactly 255
      imageData.data[i + 2] = 255; // B - exactly 255
      imageData.data[i + 3] = 255; // A - fully opaque
    }
    
    // Put exact data onto canvas
    ctx.putImageData(imageData, 0, 0);
    
    updateTexture(imageData);
    addToHistory(imageData);
  }, [canvasSize, updateTexture, addToHistory]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        {mode === 'draw' ? (
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="border-2 border-gray-300 cursor-crosshair"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            imageRendering: 'pixelated',
            background: 'repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 50% / 20px 20px'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        ) : (
          <div className="w-full">
            <ProceduralTab />
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-gray-300">
        <h3 className="text-sm font-semibold mb-3">Canvas Actions</h3>
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button
            onClick={fillCanvas}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Fill entire canvas with current color"
          >
            Fill
          </button>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="Clear canvas to white (no displacement)"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </div>
  );
}

