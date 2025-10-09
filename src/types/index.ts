export type GeometryType = 'plane' | 'sphere' | 'cylinder' | 'torus' | 'cube' | 'cone';

export type DrawingTool = 'brush' | 'eraser' | 'fill';

export interface TextureData {
  imageData: ImageData | null;
  dataUrl: string | null;
}

export interface DisplacementSettings {
  scale: number;
  segments: number;
  wireframe: boolean;
  metalness: number;
  roughness: number;
  autoRotate: boolean;
}

export interface BrushSettings {
  size: number;
  color: number; // 0-255 grayscale value
  tool: DrawingTool;
}

