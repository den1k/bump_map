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
- **Brush**: Paint grayscale values (white = max displacement, black = no displacement)
- **Eraser**: Remove painted areas
- **Brush Size Slider**: Adjust brush size (1-100px)
- **Displacement Value Slider**: Choose grayscale color (0-255)
  - 0 (Black) = No displacement
  - 128 (Gray) = Medium displacement
  - 255 (White) = Maximum displacement

**Canvas Controls:**
- Click and drag to draw
- **Undo/Redo**: Use the buttons or keyboard shortcuts
  - `Ctrl+Z` / `Cmd+Z` - Undo
  - `Ctrl+Y` / `Cmd+Y` or `Ctrl+Shift+Z` - Redo
- **Fill**: Fill entire canvas with current color
- **Clear**: Reset canvas to white

**Import/Export:**
- **Import Image**: Load existing images as bump maps (auto-converted to grayscale)
- **Export PNG**: Save your bump map for use in other 3D applications

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
2. **Grayscale Matters**: Remember that brightness = height
   - Paint white for mountains/peaks
   - Paint black for valleys/depressions
   - Use gray for gentle slopes
3. **Use Undo Often**: Experiment freely - you have 50 levels of undo history
4. **Test Different Models**: The same texture looks different on different geometries
5. **Adjust Scale**: If displacement seems too subtle or extreme, adjust the scale slider
6. **Export Often**: Save your work regularly using the Export button

## 🎯 Example Workflows

### Creating Terrain:
1. Select "Plane" geometry
2. Set subdivisions to 128+
3. Paint with varying gray values to create hills and valleys
4. Adjust displacement scale to 1.5-2.0
5. Toggle wireframe to see mesh deformation

### Creating a Planet Surface:
1. Select "Sphere" geometry
2. Import a grayscale image or paint manually
3. Set subdivisions to 128
4. Adjust displacement scale to 0.5-1.0
5. Tweak metalness/roughness for desired surface appearance

### Abstract 3D Art:
1. Choose any geometry (Torus is fun!)
2. Fill with medium gray
3. Paint random black and white splotches
4. Crank displacement scale to 2.5+
5. Enable wireframe for sci-fi look

## 🔧 Technical Details

- **Canvas Resolution**: 512x512 pixels
- **Texture Format**: Grayscale (RGB values converted to height)
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
- Make sure you're not painting all white or all black
- Increase subdivisions for smoother geometry

**Import not working:**
- Ensure image is PNG or JPEG format
- Image will be auto-resized to 512x512

Enjoy creating bump maps! 🎨✨

