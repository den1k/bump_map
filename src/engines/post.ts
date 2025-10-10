export function applyContrastGamma(data: Uint8ClampedArray, contrast: number, gamma: number) {
  const c = contrast;
  const g = gamma !== 0 ? gamma : 1;
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] / 255;
    let y = v;
    if (c !== 1) {
      y = (y - 0.5) * c + 0.5;
    }
    if (g !== 1) {
      y = Math.pow(Math.max(0, Math.min(1, y)), 1 / g);
    }
    const u = Math.max(0, Math.min(255, Math.round(y * 255)));
    data[i] = data[i + 1] = data[i + 2] = u;
  }
}

export function gaussianBlurGrayscale(imageData: ImageData, sigma: number): ImageData {
  if (sigma <= 0) return imageData;
  const { width, height, data } = imageData;
  // build 1D kernel
  const radius = Math.max(1, Math.floor(sigma * 3));
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = v; sum += v;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) gray[i] = data[i * 4] / 255;

  const tmp = new Float32Array(width * height);
  // horizontal
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const nx = Math.min(width - 1, Math.max(0, x + k));
        acc += gray[y * width + nx] * kernel[k + radius];
      }
      tmp[y * width + x] = acc;
    }
  }
  // vertical
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const ny = Math.min(height - 1, Math.max(0, y + k));
        acc += tmp[ny * width + x] * kernel[k + radius];
      }
      const u = Math.max(0, Math.min(255, Math.round(acc * 255)));
      const idx = (y * width + x) * 4;
      data[idx] = data[idx + 1] = data[idx + 2] = u;
    }
  }
  return imageData;
}

export function edgeAwareBlur(imageData: ImageData, strength: number): ImageData {
  if (strength <= 0) return imageData;
  const { width, height, data } = imageData;
  // Compute grayscale and gradients (Sobel)
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) gray[i] = data[i * 4] / 255;
  const gxK = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gyK = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const mag = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0, sy = 0;
      let k = 0;
      for (let j = -1; j <= 1; j++) {
        for (let i2 = -1; i2 <= 1; i2++) {
          const v = gray[(y + j) * width + (x + i2)];
          sx += v * gxK[k];
          sy += v * gyK[k];
          k++;
        }
      }
      const g = Math.min(1, Math.hypot(sx, sy));
      mag[y * width + x] = g;
    }
  }
  // Create blurred copy
  const blurSigma = 1.5;
  const copy = new ImageData(new Uint8ClampedArray(data), width, height);
  const blurred = gaussianBlurGrayscale(copy, blurSigma);
  const bd = blurred.data;
  // Blend: near edges (high mag) blend more towards blurred
  for (let idx = 0; idx < width * height; idx++) {
    const m = mag[idx] * strength; // 0..1
    const i4 = idx * 4;
    const o = data[i4];
    const b = bd[i4];
    const u = Math.round(o * (1 - m) + b * m);
    data[i4] = data[i4 + 1] = data[i4 + 2] = u;
  }
  return imageData;
}


