/// <reference lib="webworker" />
import { parseDSL } from '@/dsl/parser';
import { WorkerRequest, WorkerResponse, WorkerResponseDone } from '@/dsl/types';
import { renderLSystem } from '@/engines/lsystem';
import { renderCellular } from '@/engines/cellular';
import { renderMath } from '@/engines/math';
import { applyContrastGamma, gaussianBlurGrayscale, edgeAwareBlur } from '@/engines/post';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const { dslText } = e.data;
    const doc = parseDSL(dslText);
    let imageData: ImageData;
    switch (doc.engine) {
      case 'lsystem': imageData = renderLSystem(doc); break;
      case 'cellular': imageData = renderCellular(doc); break;
      case 'math': imageData = renderMath(doc); break;
      default: throw new Error(`Unknown engine: ${doc.engine}`);
    }
    const { blur = 0, blur_spread = 1.0, edge_blur = 0, contrast = 1, gamma = 1 } = doc.header.post || {};
    if (blur && blur > 0) imageData = gaussianBlurGrayscale(imageData, blur, blur_spread);
    if (edge_blur && edge_blur > 0) imageData = edgeAwareBlur(imageData, Math.min(1, edge_blur));
    if (contrast !== 1 || gamma !== 1) applyContrastGamma(imageData.data, contrast, gamma);
    
    // Apply invert if requested
    if (doc.header.invert) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];       // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
        // Alpha unchanged
      }
    }

    const payload: WorkerResponseDone = {
      type: 'done',
      width: imageData.width,
      height: imageData.height,
      data: new Uint8ClampedArray(imageData.data),
    };
    (self as any).postMessage(payload, [payload.data.buffer]);
  } catch (err: any) {
    (self as any).postMessage({ type: 'error', message: err?.message || String(err) } as WorkerResponse);
  }
};


