# Bump Map Texture Editor

A web-based tool for creating and previewing bump textures used to displace faces on 3D models.

## Overview

This tool provides an intuitive interface for designing displacement and bump maps with real-time 3D preview. Create intricate surface details and see how they affect 3D geometry instantly.

## Features

- **2D Texture Editor**: Paint and design custom bump/displacement maps with an intuitive drawing interface
- **Real-time 3D Preview**: See your textures applied to 3D models instantly using Three.js
- **Multiple 3D Models**: Preview your textures on various geometries including:
  - Plane/Square
  - Sphere
  - Cylinder
  - Torus
  - And more...
- **Displacement Function**: Utilizes Three.js displacement mapping for realistic surface deformation

## Tech Stack

- **Next.js** - React framework for the web application
- **Three.js** - 3D graphics rendering and displacement mapping
- **TypeScript** - Type-safe development

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start creating bump maps.

## How It Works

1. Draw or import a grayscale texture in the 2D editor
2. Select a 3D model from the preview panel
3. Watch as the displacement function interprets brightness values to deform the mesh geometry
4. Export your bump map for use in other 3D applications

## Use Cases

- Creating realistic terrain heightmaps
- Designing surface details for 3D models
- Prototyping displacement effects
- Learning about bump and displacement mapping techniques
