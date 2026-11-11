import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLibrary } from '../store';
import { ZoneRoom } from './ZoneRoom';
import { CameraRig } from './CameraRig';
import { FocusBook } from './FocusBook';

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

const BG: Record<string, string> = {
  general: '#171310',
  children: '#1d1710',
  archive: '#13110f',
};

export function LibraryCanvas() {
  const layouts = useLibrary((s) => s.layouts);
  const zone = useLibrary((s) => s.zone);
  const clearSelection = useLibrary((s) => s.clearSelection);
  const active = layouts?.[zone];
  const bg = BG[zone] ?? '#171310';

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.05, far: 80, position: [0, 2.3, 9] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => clearSelection()}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 16, 44]} />

      <Suspense fallback={null}>
        {active && <ZoneRoom key={active.id} zone={active} />}
        <FocusBook />
      </Suspense>

      <CameraRig />
      <DebugBridge />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
