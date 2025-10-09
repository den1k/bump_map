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
    <div className="p-4 bg-white border-b border-gray-300">
      <h3 className="text-sm font-semibold mb-3">Drawing Tools</h3>
      
      {/* Tool Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">Tool</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleToolChange('brush')}
            className={`flex-1 px-3 py-2 rounded text-sm ${
              brushSettings.tool === 'brush'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Brush
          </button>
          <button
            onClick={() => handleToolChange('eraser')}
            className={`flex-1 px-3 py-2 rounded text-sm ${
              brushSettings.tool === 'eraser'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Eraser
          </button>
        </div>
      </div>

      {/* Brush Size */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Brush Size: {brushSettings.size}px
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
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Displacement Value: {brushSettings.color} 
          <span className="text-gray-500 ml-1">
            ({brushSettings.color < 100 ? 'Push In' : brushSettings.color > 155 ? 'Push Out' : 'Neutral'})
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="255"
          value={brushSettings.color}
          onChange={handleColorChange}
          className="w-full mb-2"
        />
        <div className="flex gap-2">
          <button
            onClick={() => updateBrushSettings({ color: 0 })}
            className="flex-1 h-10 bg-black border border-gray-300 rounded"
            title="Black (Push In)"
          />
          <button
            onClick={() => updateBrushSettings({ color: 128 })}
            className="flex-1 h-10 bg-gray-400 border border-gray-300 rounded"
            title="Gray (Neutral - No Displacement)"
          />
          <button
            onClick={() => updateBrushSettings({ color: 255 })}
            className="flex-1 h-10 bg-white border border-gray-300 rounded"
            title="White (Push Out)"
          />
        </div>
      </div>

      {/* Current Color Preview */}
      <div className="mt-3 p-2 border border-gray-300 rounded">
        <div className="text-xs text-gray-600 mb-1">Current Color:</div>
        <div
          className="w-full h-8 border border-gray-300 rounded"
          style={{
            backgroundColor: `rgb(${brushSettings.color}, ${brushSettings.color}, ${brushSettings.color})`
          }}
        />
      </div>
    </div>
  );
}

