# Bump Map Texture Editor - Usage Guide

## 🚀 Getting Started

The development server should now be running at [http://localhost:3000](http://localhost:3000)

If not, start it with:
```bash
npm run dev
```

## 🎨 Features Overview

### Left Panel - 2D Texture Editor

**Drawing Tools:**
- **Brush**: Paint grayscale values (white = no displacement, black = maximum displacement)
- **Eraser**: Remove painted areas back to white
- **Brush Size Slider**: Adjust brush size (1-100px)
- **Displacement Value Slider**: Choose grayscale color (0-255)
  - 0 (Black) = Maximum displacement
  - 128 (Gray) = Medium displacement
  - 255 (White) = No displacement

**Canvas Controls:**
- Click and drag to draw
- **Undo/Redo**: Use the buttons or keyboard shortcuts
  - `Ctrl+Z` / `Cmd+Z` - Undo
  - `Ctrl+Y` / `Cmd+Y` or `Ctrl+Shift+Z` - Redo
- **Fill**: Fill entire canvas with current color
- **Clear**: Reset canvas to white (no displacement)

**Import/Export:**
- **Import Image**: Load existing images as displacement maps (auto-converted to grayscale)
- **Export PNG**: Save your displacement map for use in other 3D applications
- **Import DSL / Export DSL**: Load/save procedural `.dsl` definitions

### Right Panel - 3D Viewer

**Model Selection:**
Choose from 6 different 3D geometries:
- Plane (great for terrain)
- Sphere (planetary surfaces)
- Cylinder
- Torus
- Cube
- Cone

**3D Controls:**
- **Left Click + Drag**: Rotate camera (orbit)
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out

**Displacement Settings:**
- **Displacement Scale** (0-3): Controls how much the texture affects geometry
  - Higher values = more dramatic displacement
- **Subdivisions** (16-256): Mesh detail level
  - Higher = smoother displacement (but slower performance)
  - Lower = faster rendering (but more blocky)
- **Metalness** (0-1): Material metallic property
- **Roughness** (0-1): Material surface roughness
- **Show Wireframe**: Toggle wireframe view to see mesh geometry

## 💡 Tips & Best Practices

1. **Start Simple**: Begin with low subdivisions (64) while designing, then increase for final preview
2. **Grayscale Matters**: Remember that darkness = height/displacement
   - Paint black for raised areas/mountains/peaks
   - Paint white for flat/base level areas
   - Use gray for gentle slopes
3. **Use Undo Often**: Experiment freely - you have 50 levels of undo history
4. **Test Different Models**: The same texture looks different on different geometries
5. **Adjust Scale**: If displacement seems too subtle or extreme, adjust the scale slider
6. **Export Often**: Save your work regularly using the Export button

## 🎯 Example Workflows

### Creating Terrain:
1. Select "Plane" geometry
2. Set subdivisions to 128+
3. Paint with varying gray values to create hills and valleys (black = raised, white = flat)
4. Adjust displacement scale to 1.5-2.0
5. Toggle wireframe to see mesh deformation

### Creating a Planet Surface:
1. Select "Sphere" geometry
2. Import a grayscale image or paint manually (black areas will be raised)
3. Set subdivisions to 128
4. Adjust displacement scale to 0.5-1.0
5. Tweak metalness/roughness for desired surface appearance

### Abstract 3D Art:
1. Choose any geometry (Torus is fun!)
2. Fill with white (flat)
3. Paint random black and gray splotches for raised features
4. Crank displacement scale to 2.5+
5. Enable wireframe for sci-fi look

## 🔧 Technical Details

- **Canvas Resolution**: 512x512 pixels
- **Texture Format**: Grayscale (RGB values converted to displacement, inverted: black = max)
- **Real-time Updates**: Throttled to ~60fps for smooth performance
- **Displacement Mapping**: Uses Three.js `displacementMap` and `displacementScale`
- **History Limit**: 50 undo/redo states

## 🐛 Troubleshooting

**App runs slowly:**
- Reduce subdivisions to 64 or lower
- Lower displacement scale
- Use smaller brush sizes

**Displacement not visible:**
- Increase displacement scale
- Make sure you're not painting all white (all white = no displacement)
- Increase subdivisions for smoother geometry

**Import not working:**
- Ensure image is PNG or JPEG format
- Image will be auto-resized to 512x512

Enjoy creating displacement maps! 🎨✨

---

## 🧮 Procedural DSL (Beta)
Paste into the Procedural tab and click Render.

### Common Parameters
These apply to all engines:

- **engine**: Selects the generation algorithm. Options:
  - `math`: Mathematical expressions for precise patterns (e.g., gradients, noise, fractals).
  - `cellular`: Cellular automata like Conway's Game of Life for organic, evolving patterns.
  - `lsystem`: L-systems for fractal-like branching structures (e.g., trees, plants).

- **size**: Output texture dimensions in pixels, format `WIDTHxHEIGHT`. Default: `512x512`. Note: The editor canvas is fixed at 512x512, but custom sizes will be resized to fit. Example: `812x412` for rectangular textures.

- **seed**: Random number seed for reproducible results. Integer, default: `1`. Change to get different random variations.

- **background**: Base grayscale value for areas not covered by the pattern (0.0 = black/max displacement, 1.0 = white/no displacement). Default: `0.5` (mid-gray). Example: `background: 0` for black background.

- **repeat**: How texture edges are handled: `tile` (seamless repeating) or `clamp` (mirrored edges). Default: `tile`.

- **post**: Post-processing effects, comma-separated `key=value`:
  - `blur`: Standard Gaussian blur (0.0-1.0).
  - `edge_blur`: Edge-preserving blur for smoother transitions (0.0-1.0).
  - `contrast`: Adjust contrast (0.0-2.0, 1.0 = neutral).
  - `gamma`: Gamma correction for brightness (0.5-2.0, 1.0 = neutral).

### Math Engine
Generate textures using mathematical expressions. The `expr` block is now evaluated as JavaScript code per pixel, with variables `u` and `v` (transformed UV coordinates 0-1), and parameters like `period_x`, `period_y` available. Set `shade` (0.0-1.0) as the output grayscale value.

Parameters:
- **coords**: Coordinate system: `uv` (default, 0-1), `xy` (pixel coordinates 0-width/0-height). Currently only `uv` supported.
- **scale**: Overall scaling factor (default: 1.0).
- **rotate**: Rotation in degrees (default: 0).
- **translate**: Offset as `x,y` (default: 0,0).
- **period**: Tiling period as `x,y` for periodic functions (default: 32,32 for checker-like).

Expression:
- Write JS code using Math.floor, Math.mod (use % ), etc.
- Supported: basic arithmetic, Math.*, if/ternary.
- `shade` must be set to 0.0-1.0.

Example - Checkerboard:
```
engine: math
size: 512x512
seed: 2
background: 1.0
post: blur=0.0, edge_blur=0.2, contrast=1.2, gamma=1.0

[math]
coords=uv
scale=1
rotate=0
translate=0,0
period=32,32
expr:
  ix = Math.floor(u * period_x)
  iy = Math.floor(v * period_y)
  let checker = (ix + iy) % 2
  shade = checker === 0 ? 0.125 : 0.88
```

This creates a 32x32 checkerboard with dark (0.125) and light (0.88) squares, matching the previous demo.

### Cellular Engine
Simulates cellular automata on a grid.

Grid parameters:
- **resolution**: Simulation grid size (default: 256, higher = more detail but slower).
- **wrap**: `true`/`false` - toroidal (wrapping) boundaries (default: true).
- **neighborhood**: Cell neighbors: `moore:1` (8 neighbors, default), `vonneumann:1` (4 neighbors), radius up to 2.
- **states**: Number of cell states (default: 2, binary).
- **init**: Initial state: `rand:p` where p is probability (0.0-1.0) of state 1 (default: rand:0.5).
- **spacing**: Output scaling (default: 1).

Rules:
- **life**: Conway's Game of Life rules as `B birth/S survival` (e.g., `B3/S23` default for Life).
- **iterations**: Simulation steps (default: 100, up to 1000+ for evolution).
- **eca**: For 1D elementary CA, rule number (0-255) instead of life.
- **angle**: Rotation of the grid in degrees (default: 0).
- **smooth**: Interpolation smoothness (0-1, default: 0 nearest-neighbor).

Shading:
- **shade**: `state(N)=value` for each state N (0 to states-1), value 0.0-1.0. Default: state(0)=1.0, state(1)=0.0.

Example - Game of Life:
```
engine: cellular
size: 512x512
background: 1.0
post: blur=0.1, contrast=1.5

[grid]
resolution=128
wrap=true
neighborhood=moore:1
states=2
init=rand:0.3
spacing=2
life=B3/S23
iterations=200
angle=0
smooth=0.5
shade=state(0)=1.0, state(1)=0.0
```

### L-System Engine
Generates fractal patterns via Lindenmayer systems.

Sections:
- **[axiom]**: Starting string (multiline).
- **[rules]**: Rewrite rules `A -> ABC` or probabilistic `A@p=0.2 -> BC` (p=probability).
- **[interp]**: Interpretation parameters:
  - **iterations**: Rewrite steps (default: 1, 3-5 typical).
  - **step**: Line segment length (default: 5).
  - **angle**: Turn angle in degrees (default: 90).
  - **thickness**: Line width (default: 1).
  - **spacing**: Pattern scaling (default: 1).
  - **bounds**: `fit` (auto-scale to canvas) or `fixed`.
  - **shade**: Symbol shading `F:0.0,+:1.0` etc. (F=draw forward, +=turn left, -=turn right).

Example - Koch Snowflake:
```
engine: lsystem
size: 512x512
seed: 1
background: 0
post: edge_blur=0.05

[axiom]
F

[rules]
F -> F+F-F+F-F

[interp]
iterations=4
step=3
angle=60
thickness=1
spacing=1
bounds=fit
shade=F:0.0
```

### Advanced Tips
- Combine engines for complex textures by layering (future feature).
- Expressions in math support basic math, trig (sin, cos), noise, fract, floor, etc. See `math.ts` for full functions.
- For displacement maps: Remember 0.0 (black) = raised areas, 1.0 (white) = flat.
- Experiment with seeds and post-processing for variations.
- Save as .dsl files via Export for reuse.

---

