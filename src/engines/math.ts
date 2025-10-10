import { DSLDocument } from '@/dsl/types';

// Replace the entire renderMath function with the new implementation
export function renderMath(doc: DSLDocument): ImageData {
  const { header, math } = doc;
  if (!math) throw new Error('Math section missing');
  const { width, height } = header.size;
  const bg = Math.round(header.background * 255);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  // Fill background first
  ctx.fillStyle = `rgb(${bg},${bg},${bg})`;
  ctx.fillRect(0, 0, width, height);

  // Simple fallback if no expr
  if (!math.expr || math.expr.trim() === '') {
    const v = 128;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }

  // Compile evaluator
  let shadeFunc: (u: number, v: number) => number;
  try {
    const body = `
      const scale = ${math.scale};
      const rotate_rad = ${math.rotate} * Math.PI / 180;
      const tx = ${math.translate.x};
      const ty = ${math.translate.y};
      const period_x = ${math.period ? math.period.x : 32};
      const period_y = ${math.period ? math.period.y : 32};

      // All transformations in centered coordinates (around 0.5, 0.5)
      // Center coordinates around origin
      let u = u0 - 0.5;
      let v = v0 - 0.5;
      
      // 1. Scale around center (invert so scale > 1.0 zooms in)
      u /= scale;
      v /= scale;
      
      // 2. Rotate around center
      const cosr = Math.cos(rotate_rad);
      const sinr = Math.sin(rotate_rad);
      const temp = u * cosr - v * sinr;
      v = u * sinr + v * cosr;
      u = temp;
      
      // 3. Translate
      u -= tx;
      v -= ty;
      
      // Move back to 0..1 range
      u += 0.5;
      v += 0.5;

      function mandelbrot(u, v, maxIter = 256, bailout = 4) {
        const c_re = -2.0 + u * 3.0;
        const c_im = -1.2 + v * 2.4;
        let z_re = 0.0;
        let z_im = 0.0;
        let n = 0;
        while (n < maxIter && z_re * z_re + z_im * z_im < bailout * bailout) {
          const z_re2 = z_re * z_re;
          const z_im2 = z_im * z_im;
          const new_z_re = z_re2 - z_im2 + c_re;
          const new_z_im = 2.0 * z_re * z_im + c_im;
          z_re = new_z_re;
          z_im = new_z_im;
          n++;
        }
        return n === maxIter ? 0.0 : 1.0 - (n / maxIter);
      }

      function julia(u, v, c_re = -0.4, c_im = 0.6, maxIter = 256, bailout = 4) {
        const z_re = -2.0 + u * 4.0;
        const z_im = -2.0 + v * 4.0;
        let zz_re = z_re;
        let zz_im = z_im;
        let n = 0;
        while (n < maxIter && zz_re * zz_re + zz_im * zz_im < bailout * bailout) {
          const zz_re2 = zz_re * zz_re;
          const zz_im2 = zz_im * zz_im;
          const new_zz_re = zz_re2 - zz_im2 + c_re;
          const new_zz_im = 2.0 * zz_re * zz_im + c_im;
          zz_re = new_zz_re;
          zz_im = new_zz_im;
          n++;
        }
        return n === maxIter ? 0.0 : 1.0 - (n / maxIter);
      }

      function burningShip(u, v, maxIter = 256, bailout = 4) {
        const c_re = -2.0 + u * 3.0;
        const c_im = -1.2 + v * 2.4;
        let z_re = 0.0;
        let z_im = 0.0;
        let n = 0;
        while (n < maxIter && z_re * z_re + z_im * z_im < bailout * bailout) {
          const z_re2 = z_re * z_re;
          const z_im2 = z_im * z_im;
          const new_z_re = Math.abs(z_re2 - z_im2 + c_re);
          const new_z_im = Math.abs(2.0 * z_re * z_im + c_im);
          z_re = new_z_re;
          z_im = new_z_im;
          n++;
        }
        return n === maxIter ? 0.0 : 1.0 - (n / maxIter);
      }

      let shade;
      ${math.expr.trim()}
      if (typeof shade !== 'undefined') {
        return Math.max(0, Math.min(1, shade));
      } else {
        return ${header.background};
      }
    `;
    shadeFunc = new Function('u0', 'v0', body) as (u: number, v: number) => number;
  } catch (e) {
    // No silent fallback for invalid expr; throw to show error in UI
    if (/checker/i.test(math.expr)) {
      // Only fallback to old checker if keyword present and no full eval
      const size = 16;
      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          const on = ((x / size) | 0) % 2 === ((y / size) | 0) % 2;
          const v = on ? 32 : 224;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, size, size);
        }
      }
      return ctx.getImageData(0, 0, width, height);
    } else {
      throw new Error(`Failed to compile math expression: ${e instanceof Error ? e.message : String(e)}. Ensure valid JavaScript that sets 'shade' to a number between 0 and 1.`);
    }
  }

  // Assume 'uv' coords
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const shade = shadeFunc(u, v);
      const val = Math.round(shade * 255);
      const i = (y * width + x) * 4;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return imageData;
}


