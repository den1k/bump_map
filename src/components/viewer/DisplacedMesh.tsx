'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { useTexture } from '@/contexts/TextureContext';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export default function DisplacedMesh() {
  const { textureData, displacementSettings, selectedGeometry, hasContent } = useTexture();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Create displacement texture from image data - ONLY if there's content
  const displacementTexture = useMemo(() => {
    if (!textureData.imageData || !hasContent) return null;

    const { imageData } = textureData;
    
    // Extract single channel (grayscale) data and normalize
    const grayscaleData = new Uint8Array(imageData.width * imageData.height);
    const neutralValue = 128;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const pixelIndex = i / 4;
      const r = imageData.data[i];
      const a = imageData.data[i + 3];
      
      // Use exact value for opaque pixels, neutral for transparent
      grayscaleData[pixelIndex] = (a === 0) ? neutralValue : r;
    }
    
    // Create texture using RedFormat (single channel) for better precision
    const texture = new THREE.DataTexture(
      grayscaleData,
      imageData.width,
      imageData.height,
      THREE.RedFormat,
      THREE.UnsignedByteType
    );
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, [textureData, hasContent]);

  // Create geometry based on selected type
  const geometry = useMemo(() => {
    const segments = displacementSettings.segments;
    
    switch (selectedGeometry) {
      case 'plane':
        return new THREE.PlaneGeometry(3, 3, segments, segments);
      case 'sphere':
        return new THREE.SphereGeometry(1.5, segments, segments);
      case 'cylinder':
        return new THREE.CylinderGeometry(1, 1, 3, segments, segments);
      case 'torus':
        return new THREE.TorusGeometry(1, 0.4, segments / 2, segments);
      case 'cube':
        return new THREE.BoxGeometry(2, 2, 2, segments, segments, segments);
      case 'cone':
        return new THREE.ConeGeometry(1, 2, segments, segments);
      default:
        return new THREE.PlaneGeometry(3, 3, segments, segments);
    }
  }, [selectedGeometry, displacementSettings.segments]);

  // Calculate actual displacement scale and bias
  const actualDisplacementScale = hasContent ? displacementSettings.scale : 0;
  const actualDisplacementBias = hasContent ? -0.5 * actualDisplacementScale : 0;

  // Debug logging
  useEffect(() => {
    console.log('DisplacedMesh state:', {
      hasContent,
      textureExists: !!displacementTexture,
      scale: actualDisplacementScale,
      bias: actualDisplacementBias,
      settingsScale: displacementSettings.scale
    });
  }, [hasContent, displacementTexture, actualDisplacementScale, actualDisplacementBias, displacementSettings.scale]);

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
      console.log('Applied displacement:', { scale: actualDisplacementScale, bias: actualDisplacementBias });
    } else {
      // Completely remove displacement when no content
      materialRef.current.displacementMap = null;
      materialRef.current.displacementScale = 0;
      materialRef.current.displacementBias = 0;
      console.log('Removed displacement');
    }
    materialRef.current.needsUpdate = true;
  }, [displacementSettings, displacementTexture, hasContent, actualDisplacementScale, actualDisplacementBias]);

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
          color="#d3d3d3"
          wireframe={displacementSettings.wireframe}
          metalness={displacementSettings.metalness}
          roughness={displacementSettings.roughness}
          envMapIntensity={1}
          displacementMap={displacementTexture}
          displacementScale={actualDisplacementScale}
          displacementBias={actualDisplacementBias}
          flatShading={false}
        />
      ) : (
        <meshStandardMaterial
          ref={materialRef}
          color="#d3d3d3"
          wireframe={displacementSettings.wireframe}
          metalness={displacementSettings.metalness}
          roughness={displacementSettings.roughness}
          envMapIntensity={1}
          flatShading={false}
        />
      )}
    </mesh>
  );
}

