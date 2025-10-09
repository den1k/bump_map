'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import DisplacedMesh from './DisplacedMesh';
import * as THREE from 'three';

export default function Scene3D() {
  return (
    <div className="w-full h-full bg-gray-50">
      <Canvas 
        shadows 
        camera={{ fov: 75, position: [0, 0, 5] }}
        scene={{ background: new THREE.Color(0xfafafa) }} // Off-white light gray
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          shadowMap: { type: THREE.PCFSoftShadowMap, enabled: true }
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          {/* Lights - Blender-like dramatic shading with strong key, fill, and rim */}
          <ambientLight intensity={0.15} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={3.0}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.0001}
            shadow-radius={8}
          />
          <directionalLight 
            position={[-5, 5, -5]} 
            intensity={0.8} 
          />
          {/* Rim light for edge shading */}
          <directionalLight 
            position={[0, 5, -10]} 
            intensity={1.2} 
          />
          <hemisphereLight args={['#ffdbac', '#d2b48c', 0.3]} />
          
          {/* The mesh with displacement */}
          <DisplacedMesh />
          
          {/* Ground plane to receive shadows - subtle for shading visualization */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshBasicMaterial color="#f5f5dc" opacity={0.1} transparent />
          </mesh>
          
          {/* Camera Controls */}
          <OrbitControls enableDamping dampingFactor={0.05} />
        </Suspense>
      </Canvas>
    </div>
  );
}

