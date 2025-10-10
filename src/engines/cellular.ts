import { DSLDocument } from '@/dsl/types';

function countNeighbors(grid: Uint8Array, x: number, y: number, n: number, wrap: boolean, w: number, h: number, kind: 'moore' | 'vonneumann'): number {
  let c = 0;
  for (let dy = -n; dy <= n; dy++) {
    for (let dx = -n; dx <= n; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (kind === 'vonneumann' && Math.abs(dx) + Math.abs(dy) > n) continue;
      let nx = x + dx;
      let ny = y + dy;
      if (wrap) {
        nx = (nx + w) % w;
        ny = (ny + h) % h;
      }
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      c += grid[ny * w + nx] ? 1 : 0;
    }
  }
  return c;
}

export function renderCellular(doc: DSLDocument): ImageData {
  const { header, cellular } = doc;
  if (!cellular) throw new Error('Cellular section missing');
  const { width, height } = header.size;

  const cells = cellular.grid.resolution;
  const w = cells, h = cells;
  let grid = new Uint8Array(w * h);

  // init
  if (cellular.grid.init.kind === 'rand') {
    const p = cellular.grid.init.p;
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < p ? 1 : 0;
  }

  const bornSet = new Set<number>();
  const surviveSet = new Set<number>();
  const isEca = typeof cellular.rules.ecaRule === 'number' && cellular.rules.ecaRule >= 0;
  if (cellular.rules.life) {
    const m = cellular.rules.life.match(/^B([0-9]*)\/S([0-9]*)$/i);
    if (m) {
      m[1].split('').forEach(n => n && bornSet.add(Number(n)));
      m[2].split('').forEach(n => n && surviveSet.add(Number(n)));
    }
  }
  if (cellular.rules.born) cellular.rules.born.forEach(n => bornSet.add(n));
  if (cellular.rules.survive) cellular.rules.survive.forEach(n => surviveSet.add(n));

  let tmp = new Uint8Array(w * h);
  if (isEca) {
    // Elementary CA evolves 1D rows; render each subsequent row from previous row
    // Seed first row from init rand
    const rule = cellular.rules.ecaRule! & 0xff;
    // Ensure first row is initialized
    for (let x = 0; x < w; x++) {
      if (cellular.grid.init.kind === 'rand') grid[x] = Math.random() < cellular.grid.init.p ? 1 : 0;
    }
    for (let y = 1; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const l = grid[(y - 1) * w + ((x - 1 + w) % w)];
        const c = grid[(y - 1) * w + x];
        const r = grid[(y - 1) * w + ((x + 1) % w)];
        const neighborhood = (l << 2) | (c << 1) | r;
        const bit = (rule >> neighborhood) & 1;
        grid[y * w + x] = bit;
      }
    }
  } else {
    for (let it = 0; it < cellular.rules.iterations; it++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const alive = grid[idx] === 1;
          const nc = countNeighbors(grid, x, y, cellular.grid.neighborhood.radius, cellular.grid.wrap, w, h, cellular.grid.neighborhood.kind);
          let next = 0;
          if (!alive && bornSet.has(nc)) next = 1;
          else if (alive && surviveSet.has(nc)) next = 1;
          tmp[idx] = next;
        }
      }
      const swap = grid; grid = tmp; tmp = swap;
    }
  }

  // rasterize to canvas respecting spacing
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  const bg = Math.round(header.background * 255);
  ctx.fillStyle = `rgb(${bg},${bg},${bg})`;
  ctx.fillRect(0, 0, width, height);

  // Apply scale and translate transformations
  ctx.save();
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.translate(centerX, centerY);
  ctx.scale(cellular.scale, cellular.scale);
  ctx.translate(-centerX + cellular.translate.x * width, -centerY + cellular.translate.y * height);

  const cellSize = Math.min(width, height) / cells;
  const gap = cellular.grid.spacing;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const state = grid[y * w + x];
      const shade = cellular.shadeMap && cellular.shadeMap[state] !== undefined ? cellular.shadeMap[state] : (state ? 0.0 : 1.0);
      const v = Math.round(shade * 255);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      const px = Math.floor(x * cellSize + gap * 0.5);
      const py = Math.floor(y * cellSize + gap * 0.5);
      const sz = Math.max(0, Math.floor(cellSize - gap));
      ctx.fillRect(px, py, sz, sz);
    }
  }

  ctx.restore(); // Restore original transform
  return ctx.getImageData(0, 0, width, height);
}


