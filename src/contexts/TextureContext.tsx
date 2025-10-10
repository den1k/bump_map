'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TextureData, DisplacementSettings, BrushSettings, GeometryType } from '@/types';

interface TextureContextType {
  textureData: TextureData;
  updateTexture: (imageData: ImageData) => void;
  displacementSettings: DisplacementSettings;
  updateDisplacementSettings: (settings: Partial<DisplacementSettings>) => void;
  brushSettings: BrushSettings;
  updateBrushSettings: (settings: Partial<BrushSettings>) => void;
  selectedGeometry: GeometryType;
  setSelectedGeometry: (geometry: GeometryType) => void;
  canvasSize: number;
  hasContent: boolean;
  proceduralDsl: string;
  setProceduralDsl: (dsl: string) => void;
  proceduralRepeat: 'tile' | 'clamp';
  setProceduralRepeat: (repeat: 'tile' | 'clamp') => void;
  editorMode: 'draw' | 'procedural';
  setEditorMode: (mode: 'draw' | 'procedural') => void;
}

const TextureContext = createContext<TextureContextType | undefined>(undefined);

export function TextureProvider({ children }: { children: ReactNode }) {
  const [textureData, setTextureData] = useState<TextureData>({
    imageData: null,
    dataUrl: null,
  });

  const [displacementSettings, setDisplacementSettings] = useState<DisplacementSettings>({
    scale: 0.2,
    segments: 256,
    wireframe: false,
    metalness: 0,
    roughness: 0.8,
    autoRotate: false,
  });

  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 20,
    color: 0,
    tool: 'brush',
  });

  const [selectedGeometry, setSelectedGeometry] = useState<GeometryType>('cube');
  const [hasContent, setHasContent] = useState(false);
  const canvasSize = 512; // Fixed canvas resolution
  const [proceduralDsl, setProceduralDsl] = useState<string>('');
  const [proceduralRepeat, setProceduralRepeat] = useState<'tile' | 'clamp'>('tile');
  const [editorMode, setEditorMode] = useState<'draw' | 'procedural'>('procedural');

  const updateTexture = useCallback((imageData: ImageData) => {
    // Check if texture has any non-neutral content
    // Only exact 255 is considered neutral (tolerance = 0)
    let hasNonNeutralPixels = false;
    const neutralValue = 255;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Check if pixel is EXACTLY white (255, 255, 255)
      if (r !== neutralValue || g !== neutralValue || b !== neutralValue) {
        hasNonNeutralPixels = true;
        console.log('Found non-neutral pixel at index', i/4, ':', {r, g, b});
        break;
      }
    }
    console.log('Content detection result:', hasNonNeutralPixels);
    setHasContent(hasNonNeutralPixels);

    // Convert ImageData to data URL for React state
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL();
      setTextureData({
        imageData,
        dataUrl,
      });
    }

    // Reset procedural repeat for non-procedural updates
    setProceduralRepeat('tile');
  }, []);

  const updateDisplacementSettings = useCallback((settings: Partial<DisplacementSettings>) => {
    setDisplacementSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const updateBrushSettings = useCallback((settings: Partial<BrushSettings>) => {
    setBrushSettings(prev => ({ ...prev, ...settings }));
  }, []);

  return (
    <TextureContext.Provider
      value={{
        textureData,
        updateTexture,
        displacementSettings,
        updateDisplacementSettings,
        brushSettings,
        updateBrushSettings,
        selectedGeometry,
        setSelectedGeometry,
        canvasSize,
        hasContent,
        proceduralDsl,
        setProceduralDsl,
        proceduralRepeat,
        setProceduralRepeat,
        editorMode,
        setEditorMode,
      }}
    >
      {children}
    </TextureContext.Provider>
  );
}

export function useTexture() {
  const context = useContext(TextureContext);
  if (!context) {
    throw new Error('useTexture must be used within TextureProvider');
  }
  return context;
}

