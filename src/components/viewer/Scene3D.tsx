'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import DisplacedMesh from './DisplacedMesh';
import * as THREE from 'three';

export default function Scene3D() {
  return (
    <div className="w-full h-full bg-gray-800">
      <Canvas 
        shadows 
        camera={{ fov: 60, position: [0, 0, 30] }}
        scene={{ background: new THREE.Color(0x1a1a1a) }} // Darker background for better contrast
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        }}
      >
        <Suspense fallback={null}>
          {/* Key light - main directional light from upper left, increased intensity */}
          <directionalLight
            position={[-15, 20, 10]}
            intensity={4.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            color="#ffffff"
          />
          
          {/* Rim light - creates edge highlights to show surface detail */}
          <directionalLight
            position={[10, 5, -15]}
            intensity={3}
            color="#b0d0ff"
          />
          
          {/* Fill light - soft light from opposite side */}
          <directionalLight
            position={[5, -3, 5]}
            intensity={1.5}
            color="#ffd0b0"
          />
          
          {/* Top light for depth */}
          <directionalLight
            position={[0, 25, 0]}
            intensity={2}
            color="#ffffff"
          />
          
          {/* Subtle ambient light to prevent pure black */}
          <ambientLight intensity={0.15} color="#c8d4e0" />
          
          {/* The mesh with displacement */}
          <DisplacedMesh />
          
          {/* Ground plane to receive shadows */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0.02} opacity={0.4} transparent />
          </mesh>
          
          {/* Camera Controls */}
          <OrbitControls enableDamping dampingFactor={0.05} />
          
          {/* Environment for reflections - more dramatic preset */}
          <Environment preset="city" environmentIntensity={0.3} />
          
        </Suspense>
      </Canvas>
    </div>
  );
}

