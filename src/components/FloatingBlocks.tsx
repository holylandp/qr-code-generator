import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ACADEMIC_COLORS = ['#38bdf8', '#fb923c', '#ffffff', '#a5f3fc', '#818cf8'];

const generateHappyBlocks = (count: number) => {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    blocks.push({
      position: [(Math.random() - 0.5) * 35, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15 - 5],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      scale: Math.random() * 0.6 + 0.3,
      speedRot: Math.random() * 0.01 + 0.005,
      color: ACADEMIC_COLORS[Math.floor(Math.random() * ACADEMIC_COLORS.length)]
    });
  }
  return blocks;
};

const FloatingBlocks: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 50;
  const blockData = useMemo(() => generateHappyBlocks(count), []);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  React.useLayoutEffect(() => {
    if (meshRef.current) {
      blockData.forEach((data, i) => {
        color.set(data.color);
        meshRef.current!.setColorAt(i, color);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [blockData, color]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    blockData.forEach((block, i) => {
      block.rotation[0] += block.speedRot;
      block.rotation[1] += block.speedRot;
      const yPos = (block.position[1] as number) + Math.sin(t * 0.5 + i * 0.1) * 0.8;
      const xPos = (block.position[0] as number) + Math.cos(t * 0.3 + i) * 0.5;
      tempObject.position.set(xPos, yPos, block.position[2] as number);
      tempObject.rotation.set(block.rotation[0] as number, block.rotation[1] as number, block.rotation[2] as number);
      tempObject.scale.setScalar(block.scale as number);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.2} metalness={0.1} transparent={true} opacity={0.9} />
    </instancedMesh>
  );
};

export default FloatingBlocks;
