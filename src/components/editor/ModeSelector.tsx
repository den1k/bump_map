'use client';

import React from 'react';
import { useTexture } from '@/contexts/TextureContext';

export default function ModeSelector() {
  const { editorMode, setEditorMode } = useTexture();

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-300">
      <button
        onClick={() => setEditorMode('draw')}
        className={`px-3 py-1 rounded text-sm ${editorMode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        Canvas
      </button>
      <button
        onClick={() => setEditorMode('procedural')}
        className={`px-3 py-1 rounded text-sm ${editorMode === 'procedural' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        Procedural
      </button>
    </div>
  );
}

