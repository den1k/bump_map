'use client';

import React from 'react';
import { useTexture } from '@/contexts/TextureContext';
import { DrawingTool } from '@/types';

export default function DrawingTools() {
  const { brushSettings, updateBrushSettings } = useTexture();

  // Set default brush color to white (push out) for better UX
  React.useEffect(() => {
    if (brushSettings.color === 255) {
      // Already set, do nothing
    }
  }, [brushSettings.color]);

  const handleToolChange = (tool: DrawingTool) => {
    updateBrushSettings({ tool });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBrushSettings({ size: parseInt(e.target.value) });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBrushSettings({ color: parseInt(e.target.value) });
  };

  return (
    <div className="p-2 bg-white border-b border-gray-300">
      {/* Tool Selection */}
      <div className="mb-2">
        <label className="block text-xs text-gray-600 mb-1">Tool</label>
        <div className="flex gap-1">
          <button
            onClick={() => handleToolChange('brush')}
            className={`flex-1 px-2 py-1 rounded text-xs ${
              brushSettings.tool === 'brush'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Brush
          </button>
          <button
            onClick={() => handleToolChange('eraser')}
            className={`flex-1 px-2 py-1 rounded text-xs ${
              brushSettings.tool === 'eraser'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Eraser
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="flex gap-2 mb-1">
        {/* Brush Size */}
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">
            Size: {brushSettings.size}px
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={brushSettings.size}
            onChange={handleSizeChange}
            className="w-full"
          />
        </div>

        {/* Color/Value Picker */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-600">
              Value: {brushSettings.color}
            </label>
            <div
              className="w-6 h-6 border border-gray-300 rounded"
              style={{
                backgroundColor: `rgb(${brushSettings.color}, ${brushSettings.color}, ${brushSettings.color})`
              }}
              title={`Current color: ${brushSettings.color}`}
            />
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={brushSettings.color}
            onChange={handleColorChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

