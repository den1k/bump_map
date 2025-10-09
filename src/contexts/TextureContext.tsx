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
}

const TextureContext = createContext<TextureContextType | undefined>(undefined);

export function TextureProvider({ children }: { children: ReactNode }) {
  const [textureData, setTextureData] = useState<TextureData>({
    imageData: null,
    dataUrl: null,
  });

  const [displacementSettings, setDisplacementSettings] = useState<DisplacementSettings>({
    scale: 1.0,
    segments: 128,
    wireframe: false,
    metalness: 0.8,
    roughness: 0.05,
    autoRotate: false,
  });

  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 20,
    color: 255,
    tool: 'brush',
  });

  const [selectedGeometry, setSelectedGeometry] = useState<GeometryType>('cube');
  const [hasContent, setHasContent] = useState(false);
  const canvasSize = 512; // Fixed canvas resolution

  const updateTexture = useCallback((imageData: ImageData) => {
    // Check if texture has any non-neutral content
    // Only exact 128 is considered neutral (tolerance = 0)
    let hasNonNeutralPixels = false;
    const neutralValue = 128;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Check if pixel is EXACTLY neutral gray (128, 128, 128)
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

