export type EngineKind = 'lsystem' | 'cellular' | 'math';

export interface CommonHeader {
  engine: EngineKind;
  size: { width: number; height: number };
  seed: number;
  background: number; // 0..1
  repeat: 'tile' | 'clamp';
  invert: boolean; // invert grayscale values
  post: Partial<PostProcessOptions>;
}

export interface PostProcessOptions {
  blur: number; // gaussian sigma (px)
  blur_spread: number; // blur spread factor
  edge_blur: number; // 0..1 blend strength
  contrast: number; // 1.0 = none
  gamma: number; // 1.0 = none
}

// L-system specific
export interface LSystemSection {
  axiom: string;
  rules: Array<{ from: string; to: string; probability?: number }>;
  interp: {
    iterations: number;
    step: number; // px
    angle: number; // deg
    thickness: number; // px
    spacing: number; // scale factor
    bounds: 'fit' | 'normalize' | 'crop';
    shadeMap?: Record<string, number>; // token -> 0..1
  };
  scale: number;
  translate: { x: number; y: number };
}

// Cellular automata specific
export interface CellularSection {
  grid: {
    resolution: number; // cells per side (square grid)
    wrap: boolean;
    neighborhood: { kind: 'moore' | 'vonneumann'; radius: number };
    states: number;
    init: { kind: 'rand'; p: number } | { kind: 'none' };
    spacing: number; // px between cells when rendering
  };
  rules: {
    life?: string; // e.g., "B3/S23"
    born?: number[];
    survive?: number[];
    iterations: number;
    ecaRule?: number; // Elementary CA rule number (0..255)
  };
  angle: number; // final rotation degrees
  smooth: number; // 0..1
  shadeMap?: Record<number, number>; // state -> 0..1
  scale: number;
  translate: { x: number; y: number };
}

// Math/Expression specific (minimal v1)
export interface MathSection {
  coords: 'uv' | 'pixel' | 'polar';
  scale: number;
  rotate: number; // deg
  translate: { x: number; y: number };
  period?: { x: number; y: number };
  expr: string; // raw expression block (to be compiled)
}

export interface DSLDocument {
  header: CommonHeader;
  engine: EngineKind;
  lsystem?: LSystemSection;
  cellular?: CellularSection;
  math?: MathSection;
}

export interface WorkerRequest {
  type: 'render';
  dslText: string;
}

export interface WorkerResponseDone {
  type: 'done';
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA
}

export interface WorkerResponseError {
  type: 'error';
  message: string;
}

export type WorkerResponse = WorkerResponseDone | WorkerResponseError;


