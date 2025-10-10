import { CellularSection, CommonHeader, DSLDocument, EngineKind, LSystemSection, MathSection, PostProcessOptions } from './types';

function parseSize(value: string): { width: number; height: number } {
  const m = value.trim().match(/^(\d+)x(\d+)$/i);
  if (!m) throw new Error(`Invalid size: ${value}`);
  return { width: parseInt(m[1], 10), height: parseInt(m[2], 10) };
}

function parsePost(value: string): Partial<PostProcessOptions> {
  const out: Partial<PostProcessOptions> = {};
  value.split(',').forEach(part => {
    const [k, v] = part.split('=').map(s => s.trim());
    if (!k) return;
    const num = Number(v);
    if (!Number.isNaN(num)) (out as any)[k] = num;
  });
  return out;
}

function parseShadeMap(value: string): Record<string, number> {
  const map: Record<string, number> = {};
  value.split(',').forEach(pair => {
    const [k, v] = pair.split(':').map(s => s.trim());
    if (k && v) map[k] = Number(v);
  });
  return map;
}

export function parseDSL(text: string): DSLDocument {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let currentSection: 'axiom' | 'rules' | 'interp' | 'grid' | 'math' | 'none' = 'none';

  const header: Partial<CommonHeader> = {
    engine: 'lsystem',
    size: { width: 512, height: 512 },
    seed: 1,
    background: 0.5,
    repeat: 'tile',
    post: {},
  };

  const lsys: LSystemSection = {
    axiom: '',
    rules: [],
    interp: {
      iterations: 1,
      step: 5,
      angle: 90,
      thickness: 1,
      spacing: 1,
      bounds: 'fit',
      shadeMap: {},
    },
    scale: 1.0,
    translate: { x: 0, y: 0 },
  };

  const cell: CellularSection = {
    grid: {
      resolution: 256,
      wrap: true,
      neighborhood: { kind: 'moore', radius: 1 },
      states: 2,
      init: { kind: 'rand', p: 0.5 },
      spacing: 1,
    },
    rules: { iterations: 100 },
    angle: 0,
    smooth: 0,
    shadeMap: { 0: 1.0, 1: 0.0 },
    scale: 1.0,
    translate: { x: 0, y: 0 },
  };

  const math: MathSection = {
    coords: 'uv',
    scale: 1,
    rotate: 0,
    translate: { x: 0, y: 0 },
    period: undefined,
    expr: 'shade = 0.5',
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#') || line.startsWith('//')) continue;

    if (line === '[axiom]') { currentSection = 'axiom'; continue; }
    if (line === '[rules]') { currentSection = 'rules'; continue; }
    if (line === '[interp]') { currentSection = 'interp'; continue; }
    if (line === '[grid]') { currentSection = 'grid'; continue; }
    if (line === '[math]') { currentSection = 'math'; continue; }

    // header key: value
    if (currentSection === 'none') {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        switch (key) {
          case 'engine': header.engine = value as EngineKind; break;
          case 'size': header.size = parseSize(value); break;
          case 'seed': header.seed = Number(value); break;
          case 'background': {
            const bgValue = Number(value);
            header.background = isNaN(bgValue) ? 0.5 : bgValue;
            break;
          }
          case 'repeat': header.repeat = (value === 'tile' ? 'tile' : 'clamp'); break;
          case 'post': header.post = parsePost(value); break;
          default: break;
        }
        continue;
      }
    }

    // sections parsing
    if (currentSection === 'axiom') {
      lsys.axiom += (lsys.axiom ? '\n' : '') + raw; // keep raw
      continue;
    }

    if (currentSection === 'rules') {
      // format: A@p=0.2 -> B
      const m = line.match(/^(.*?)\s*->\s*(.*)$/);
      if (m) {
        const lhs = m[1].trim();
        const rhs = m[2].trim();
        let from = lhs;
        let probability: number | undefined = undefined;
        const p = lhs.match(/^(.*)@p\s*=\s*([0-9]*\.?[0-9]+)/i);
        if (p) {
          from = p[1].trim();
          probability = Number(p[2]);
        }
        lsys.rules.push({ from, to: rhs, probability });
      }
      continue;
    }

    if (currentSection === 'interp') {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        switch (key) {
          case 'iterations': lsys.interp.iterations = Number(value); break;
          case 'step': lsys.interp.step = Number(value); break;
          case 'angle': lsys.interp.angle = Number(value); break;
          case 'thickness': lsys.interp.thickness = Number(value); break;
          case 'spacing': lsys.interp.spacing = Number(value); break;
          case 'bounds': lsys.interp.bounds = value as any; break;
          case 'shade': lsys.interp.shadeMap = parseShadeMap(value); break;
          case 'scale': lsys.scale = Number(value); break;
          case 'translate': {
            const m = value.split(',').map(s => Number(s.trim()));
            if (m.length === 2) lsys.translate = { x: m[0], y: m[1] };
            break;
          }
          default: break;
        }
      }
      continue;
    }

    if (currentSection === 'grid') {
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        switch (key) {
          case 'resolution': cell.grid.resolution = Number(value); break;
          case 'wrap': cell.grid.wrap = value.toLowerCase() === 'true'; break;
          case 'neighborhood': {
            const m = value.match(/^(moore|vonneumann)\s*:\s*(\d+)/i);
            if (m) cell.grid.neighborhood = { kind: m[1].toLowerCase() as any, radius: Number(m[2]) };
            break;
          }
          case 'states': cell.grid.states = Number(value); break;
          case 'init': {
            const m = value.match(/^rand\s*:\s*([0-9]*\.?[0-9]+)/i);
            if (m) cell.grid.init = { kind: 'rand', p: Number(m[1]) };
            break;
          }
          case 'spacing': cell.grid.spacing = Number(value); break;
          case 'life': cell.rules.life = value; break;
          case 'iterations': cell.rules.iterations = Number(value); break;
          case 'eca': cell.rules.ecaRule = Number(value); break;
          case 'angle': cell.angle = Number(value); break;
          case 'smooth': cell.smooth = Number(value); break;
          case 'shade': {
            const m = value.split(',').map(s => s.trim());
            m.forEach(entry => {
              const mm = entry.match(/^state\((\d+)\)\s*=\s*([0-9]*\.?[0-9]+)/i);
              if (mm) cell.shadeMap![Number(mm[1])] = Number(mm[2]);
            });
            break;
          }
          case 'scale': cell.scale = Number(value); break;
          case 'translate': {
            const m = value.split(',').map(s => Number(s.trim()));
            if (m.length === 2) cell.translate = { x: m[0], y: m[1] };
            break;
          }
          default: break;
        }
      }
      continue;
    }

    if (currentSection === 'math') {
      // handle key=value and multiline expr starting with 'expr:'
      if (line.startsWith('expr:')) {
        const first = raw.slice(raw.indexOf('expr:') + 5);
        math.expr = (first ? first + '\n' : '');
        // consume following lines as part of expr until next section header
        for (let j = i + 1; j < lines.length; j++) {
          const lraw = lines[j];
          const ltrim = lraw.trim();
          if (ltrim.startsWith('[') && ltrim.endsWith(']')) { break; }
          math.expr += lraw + '\n';
          i = j; // advance
        }
      } else {
        const idx = line.indexOf('=');
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim();
          switch (key) {
            case 'coords': math.coords = value as any; break;
            case 'scale': math.scale = Number(value); break;
            case 'rotate': math.rotate = Number(value); break;
            case 'translate': {
              const m = value.split(',').map(s => Number(s.trim()));
              if (m.length === 2) math.translate = { x: m[0], y: m[1] };
              break;
            }
            case 'period': {
              const m = value.split(',').map(s => Number(s.trim()));
              if (m.length === 2) math.period = { x: m[0], y: m[1] };
              break;
            }
            default: break;
          }
        }
      }
      continue;
    }
  }

  const doc: DSLDocument = {
    header: header as CommonHeader,
    engine: header.engine as EngineKind,
    lsystem: lsys,
    cellular: cell,
    math,
  };
  return doc;
}


