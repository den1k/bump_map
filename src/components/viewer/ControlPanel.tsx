'use client';

import React from 'react';
import { useTexture } from '@/contexts/TextureContext';

export default function ControlPanel() {
  const { displacementSettings, updateDisplacementSettings, hasContent } = useTexture();

  return (
    <div className="p-4 bg-gray-800 text-white">
      <h3 className="text-sm font-semibold mb-3">Displacement Settings</h3>
      
      {/* Content Status Indicator */}
      {!hasContent && (
        <div className="mb-4 p-2 bg-yellow-600 text-white text-xs rounded">
          ⚠️ No texture content - displacement disabled
        </div>
      )}

      {/* Displacement Scale */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-300 mb-2">
          Displacement Scale: {displacementSettings.scale.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={displacementSettings.scale}
          onChange={(e) => updateDisplacementSettings({ scale: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Segments/Subdivisions */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-300 mb-2">
          Subdivisions: {displacementSettings.segments}
        </label>
        <input
          type="range"
          min="16"
          max="256"
          step="16"
          value={displacementSettings.segments}
          onChange={(e) => updateDisplacementSettings({ segments: parseInt(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-gray-400 mt-1">Higher = smoother (but slower)</p>
      </div>

      {/* Material Properties */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-300 mb-2">
          Metalness: {displacementSettings.metalness.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={displacementSettings.metalness}
          onChange={(e) => updateDisplacementSettings({ metalness: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-300 mb-2">
          Roughness: {displacementSettings.roughness.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={displacementSettings.roughness}
          onChange={(e) => updateDisplacementSettings({ roughness: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-4 mb-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={displacementSettings.wireframe}
            onChange={(e) => updateDisplacementSettings({ wireframe: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Show Wireframe</span>
        </label>
        
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={displacementSettings.autoRotate}
            onChange={(e) => updateDisplacementSettings({ autoRotate: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Auto Rotate</span>
        </label>
      </div>
    </div>
  );
}

