import React, { Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import FloatingBlocks from './FloatingBlocks';
import MinecraftTitle from './MinecraftTitle';

const CameraRig = () => {
  const { camera, mouse } = useThree();
  const vec = new THREE.Vector3();

  useFrame(() => {
    vec.set(mouse.x * 0.5, mouse.y * 0.5, camera.position.z);
    camera.position.lerp(vec, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

const TransitionScene: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-[#f0f9ff]">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 12], fov: 50 }} gl={{ antialias: true }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
          <directionalLight position={[-10, -5, -5]} intensity={0.5} color="#bae6fd" />
          <Suspense fallback={null}>
            <FloatingBlocks />
            <CameraRig />
            <Environment preset="studio" />
          </Suspense>
        </Canvas>
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="w-full flex justify-center px-4">
          <MinecraftTitle text="PUIVA MACAU" />
        </div>
      </div>
    </div>
  );
};

export default TransitionScene;
