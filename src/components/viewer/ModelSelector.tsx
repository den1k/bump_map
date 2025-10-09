'use client';

import React from 'react';
import { useTexture } from '@/contexts/TextureContext';
import { GeometryType } from '@/types';

const geometryOptions: { value: GeometryType; label: string; icon: string }[] = [
  { value: 'plane', label: 'Plane', icon: '▭' },
  { value: 'sphere', label: 'Sphere', icon: '●' },
  { value: 'cylinder', label: 'Cylinder', icon: '▯' },
  { value: 'torus', label: 'Torus', icon: '◯' },
  { value: 'cube', label: 'Cube', icon: '◼' },
  { value: 'cone', label: 'Cone', icon: '▲' },
];

export default function ModelSelector() {
  const { selectedGeometry, setSelectedGeometry } = useTexture();

  return (
    <div className="p-4 bg-gray-800 border-b border-gray-700">
      <h3 className="text-sm font-semibold text-white mb-3">3D Model</h3>
      <div className="grid grid-cols-3 gap-2">
        {geometryOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedGeometry(option.value)}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              selectedGeometry === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <span className="text-lg mr-1">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

