'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { useTexture } from '@/contexts/TextureContext';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export default function DisplacedMesh() {
  const { textureData, displacementSettings, selectedGeometry, hasContent, proceduralRepeat } = useTexture();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Create displacement texture from image data - ONLY if there's content
  const displacementTexture = useMemo(() => {
    if (!textureData.imageData || !hasContent) return null;

    const { imageData } = textureData;
    
    // Extract single channel (grayscale) data, full 0-255 range
    const grayscaleData = new Uint8Array(imageData.width * imageData.height);
    const width = imageData.width;
    const height = imageData.height;
    
    let sum = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const pixelIndex = i / 4;
      const r = imageData.data[i];
      const a = imageData.data[i + 3];
      
      // Full range: white (255) -> 255 (1.0, 0 disp after bias), black (0) -> 0 (0.0, -scale disp), transparent -> 255
      const value = (a === 0) ? 255 : r;
      grayscaleData[pixelIndex] = value;
      sum += value;
    }
    
    // Average for logging (0-1)
    const average = sum / (width * height * 255);
    
    // Create displacement texture
    const texture = new THREE.DataTexture(
      grayscaleData,
      width,
      height,
      THREE.RedFormat,
      THREE.UnsignedByteType
    );
    texture.needsUpdate = true;
    // Use MirroredRepeatWrapping for smooth edge transitions without clamping or hard seams
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    // Add linear filtering for smoother displacement sampling
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = true;
    
    // Store average for logging
    texture.userData.average = average;
    
    return texture;
  }, [textureData, hasContent, proceduralRepeat]);

  // Create geometry based on selected type
  const geometry = useMemo(() => {
    const segments = displacementSettings.segments;
    
    switch (selectedGeometry) {
      case 'plane':
        return new THREE.PlaneGeometry(10, 10, segments, segments);
      case 'sphere':
        return new THREE.SphereGeometry(5, segments, segments);
      case 'cylinder':
        return new THREE.CylinderGeometry(5, 5, 10, segments, segments);
      case 'torus':
        return new THREE.TorusGeometry(5, 2, Math.max(8, Math.floor(segments / 2)), segments);
      case 'cube':
        return new THREE.BoxGeometry(10, 10, 10, segments, segments, segments);
      case 'cone':
        return new THREE.ConeGeometry(5, 10, segments, segments);
      default:
        return new THREE.PlaneGeometry(10, 10, segments, segments);
    }
  }, [selectedGeometry, displacementSettings.segments]);

  // Calculate actual displacement scale and bias
  const actualDisplacementScale = hasContent ? displacementSettings.scale : 0;
  const avg = displacementTexture?.userData.average ?? 0.5;
  const actualDisplacementBias = hasContent ? -actualDisplacementScale : 0;  // White (1.0) -> 0 disp, black (0.0) -> -scale

  // Update texture properties when repeat changes
  useEffect(() => {
    if (displacementTexture && materialRef.current) {
      // Use MirroredRepeatWrapping for smooth edge transitions
      displacementTexture.wrapS = THREE.MirroredRepeatWrapping;
      displacementTexture.wrapT = THREE.MirroredRepeatWrapping;
      materialRef.current.needsUpdate = true;
    }
  }, [displacementTexture, proceduralRepeat]);

  // Debug logging
  useEffect(() => {
    console.log('DisplacedMesh state:', {
      hasContent,
      textureExists: !!displacementTexture,
      scale: actualDisplacementScale,
      bias: actualDisplacementBias,
      settingsScale: displacementSettings.scale,
      average: avg
    });
  }, [hasContent, displacementTexture, actualDisplacementScale, actualDisplacementBias, displacementSettings.scale, avg]);

  // Update material when settings change
  useEffect(() => {
    if (!materialRef.current) return;
    
    materialRef.current.wireframe = displacementSettings.wireframe;
    materialRef.current.metalness = displacementSettings.metalness;
    materialRef.current.roughness = displacementSettings.roughness;
    
    // Always update displacement properties
    if (hasContent && displacementTexture) {
      materialRef.current.displacementMap = displacementTexture;
      materialRef.current.displacementScale = actualDisplacementScale;
      materialRef.current.displacementBias = actualDisplacementBias;
      console.log('Applied displacement:', { scale: actualDisplacementScale, average: avg, bias: materialRef.current.displacementBias });
    } else {
      // Completely remove displacement when no content
      materialRef.current.displacementMap = null;
      materialRef.current.displacementScale = 0;
      materialRef.current.displacementBias = 0;
      console.log('Removed displacement');
    }
    materialRef.current.needsUpdate = true;
  }, [displacementSettings, displacementTexture, hasContent, actualDisplacementScale, actualDisplacementBias, avg]);

  // Optional: gentle rotation for better view
  useFrame(() => {
    if (meshRef.current && selectedGeometry !== 'plane' && displacementSettings.autoRotate) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      {hasContent ? (
        <meshStandardMaterial
          ref={materialRef}
          color="#e8e8e8"
          wireframe={displacementSettings.wireframe}
          metalness={displacementSettings.metalness}
          roughness={displacementSettings.roughness}
          envMapIntensity={2.5}
          displacementMap={displacementTexture}
          displacementScale={actualDisplacementScale}
          displacementBias={actualDisplacementBias}
          flatShading={false}
          side={THREE.DoubleSide}
          // Enhanced properties for better detail visibility
          emissive="#000000"
          emissiveIntensity={0}
          normalMapType={THREE.TangentSpaceNormalMap}
        />
      ) : (
        <meshStandardMaterial
          ref={materialRef}
          color="#e8e8e8"
          wireframe={displacementSettings.wireframe}
          metalness={displacementSettings.metalness}
          roughness={displacementSettings.roughness}
          envMapIntensity={2.5}
          flatShading={false}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

