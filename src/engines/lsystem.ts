import { DSLDocument, LSystemSection } from '@/dsl/types';

interface TurtleState {
  x: number;
  y: number;
  angle: number; // radians
}

function expandLSystem(axiom: string, rules: LSystemSection['rules'], iterations: number): string {
  let current = axiom;
  for (let it = 0; it < iterations; it++) {
    let next = '';
    for (let i = 0; i < current.length; i++) {
      const ch = current[i];
      // probabilistic match: choose from rules with same from
      const candidates = rules.filter(r => r.from === ch);
      if (candidates.length === 0) {
        next += ch;
      } else if (candidates.length === 1) {
        next += candidates[0].to;
      } else {
        const r = Math.random();
        // normalize weights or assume equal if missing
        const weights = candidates.map(c => c.probability ?? 1 / candidates.length);
        const sum = weights.reduce((a, b) => a + b, 0);
        let acc = 0;
        let chosen = 0;
        for (let j = 0; j < weights.length; j++) {
          acc += weights[j] / sum;
          if (r <= acc) { chosen = j; break; }
        }
        next += candidates[chosen].to;
      }
    }
    current = next;
  }
  return current;
}

export function renderLSystem(doc: DSLDocument): ImageData {
  const { header, lsystem } = doc;
  if (!lsystem) throw new Error('L-system section missing');
  const { width, height} = header.size;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  // background
  const bg = Math.round(header.background * 255);
  ctx.fillStyle = `rgb(${bg},${bg},${bg})`;
  ctx.fillRect(0, 0, width, height);

  // Apply scale and translate transformations
  ctx.save();
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.translate(centerX, centerY);
  ctx.scale(lsystem.scale, lsystem.scale);
  ctx.translate(-centerX + lsystem.translate.x * width, -centerY + lsystem.translate.y * height);

  // expand
  const sequence = expandLSystem(lsystem.axiom, lsystem.rules, lsystem.interp.iterations);

  // turtle render
  const angleRad = (lsystem.interp.angle * Math.PI) / 180;
  const thickness = Math.max(0.5, lsystem.interp.thickness);
  const step = lsystem.interp.step * (lsystem.interp.spacing || 1);
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // simple normalization: center and scale to fit step count
  let state: TurtleState = { x: width / 2, y: height / 2, angle: -Math.PI / 2 };
  const stack: TurtleState[] = [];

  for (let i = 0; i < sequence.length; i++) {
    const token = sequence[i];
    if (token === 'F') {
      const nx = state.x + Math.cos(state.angle) * step;
      const ny = state.y + Math.sin(state.angle) * step;
      // Shade per token (defaults to black if not specified)
      const shadeMap = lsystem.interp.shadeMap || {};
      const shade = typeof shadeMap['F'] === 'number' ? Math.max(0, Math.min(1, shadeMap['F'])) : 0.0;
      const v = Math.round(shade * 255);
      ctx.strokeStyle = `rgb(${v},${v},${v})`;
      ctx.beginPath();
      ctx.moveTo(state.x, state.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      state = { ...state, x: nx, y: ny };
    } else if (token === '+') {
      state = { ...state, angle: state.angle + angleRad };
    } else if (token === '-') {
      state = { ...state, angle: state.angle - angleRad };
    } else if (token === '[') {
      stack.push({ ...state });
    } else if (token === ']') {
      const s = stack.pop();
      if (s) state = s;
    }
  }

  ctx.restore(); // Restore original transform
  return ctx.getImageData(0, 0, width, height);
}


