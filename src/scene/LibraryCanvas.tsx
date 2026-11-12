import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useLibrary } from '../store';
import { Room } from './Room';
import { ShelfBay } from './ShelfBay';
import { Furniture } from './Furniture';
import { Player } from './Player';
import { FocusBook } from './FocusBook';
import { Post } from './Post';
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
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#ffffff', '#c9c2b4', 0.5]} />
      <directionalLight
        position={[14, 12, 6]}
        intensity={1.1}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[-10, 8, -8]} intensity={0.3} color="#dce9ff" />
      {[
        [-12.0, -3.0],
        [-9.0, 2.5],
        [7.0, -5.0],
        [13.0, 0.0],
      ].map(([x, z], i) => (
        <pointLight
          key={i}
          position={[x, 2.85, z]}
          intensity={11}
          distance={15}
          decay={2}
          color="#fff0d8"
        />
      ))}
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
      <ContactShadows
        position={[0, 0.008, 0]}
        scale={40}
        blur={2.6}
        far={4}
        opacity={0.3}
        frames={1}
        resolution={512}
        color="#3f342b"
      />
      <FocusBook />
      <DebugBridge />
    </>
  );
}

export function LibraryCanvas() {
  const webgl = useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  }, []);

  if (!webgl) {
    return (
      <div className="overlay error">
        <p>이 브라우저에서는 3D 도서관을 표시할 수 없습니다.</p>
        <small>WebGL을 활성화하거나 최신 브라우저를 사용해 주세요.</small>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 58, near: 0.05, far: 90, position: [-10.6, 1.58, 3.6] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      onPointerMissed={() => useLibrary.getState().clearSelection()}
    >
      <color attach="background" args={['#e9e5dc']} />
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fff3e0"
          position={[0, 3.05, 0]}
          scale={[18, 2, 12]}
          rotation-x={Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#dfeaff"
          position={[15, 2.4, 0]}
          scale={[10, 4, 1]}
          rotation-y={-Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#ffffff"
          position={[-14, 2.4, 0]}
          scale={[8, 3, 1]}
          rotation-y={Math.PI / 2}
        />
      </Environment>
      <Suspense fallback={null}>
        <Scene />
        <Player />
      </Suspense>
      <Post />
    </Canvas>
  );
}
