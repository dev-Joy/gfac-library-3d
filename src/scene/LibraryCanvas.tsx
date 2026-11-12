import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLibrary } from '../store';
import { Room } from './Room';
import { ShelfBay } from './ShelfBay';
import { Furniture } from './Furniture';
import { Player } from './Player';
import { FocusBook } from './FocusBook';
import { FURNITURE } from '../data/floorplan';

/** 개발용: 3D 좌표 → 화면 좌표 변환 (브라우저 자동 검증에 사용) */
function DebugBridge() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__project = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height };
    };
  }, [camera, size]);

  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#ffffff', '#d9d3c7', 0.85]} />
      <directionalLight
        position={[11, 13, 7]}
        intensity={1.05}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-9, 9, -7]} intensity={0.35} color="#eaf2ff" />
    </>
  );
}

function Scene() {
  const layouts = useLibrary((s) => s.layouts);
  const bays = layouts ? Object.values(layouts).flatMap((z) => z.bays) : [];

  return (
    <>
      <Room />
      {bays.map((bay) => (
        <ShelfBay key={bay.id} bay={bay} />
      ))}
      <Furniture anchors={FURNITURE} />
      <Lights />
      <FocusBook />
      <DebugBridge />
    </>
  );
}

export function LibraryCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ fov: 62, near: 0.05, far: 90, position: [-11.5, 1.55, 6.6] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => useLibrary.getState().clearSelection()}
    >
      <color attach="background" args={['#ece9e2']} />
      <fog attach="fog" args={['#ece9e2', 34, 74]} />
      <Suspense fallback={null}>
        <Scene />
        <Player />
      </Suspense>
    </Canvas>
  );
}
