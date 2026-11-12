import { useMemo } from 'react';
import * as THREE from 'three';
import { GLASS, WALLS, ZONE_LABELS } from '../data/floorplan';
import { ROOM_BOUNDS } from '../data/sections';
import { makeHangingSign, makeOnAir, makeTerrazzo } from './textures';

const HEIGHT = ROOM_BOUNDS.height;

function WallBoxes() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f6f3ed', roughness: 0.92 }), []);
  return (
    <>
      {WALLS.map((wall, i) => (
        <mesh key={i} position={[wall.x, HEIGHT / 2, wall.z]} castShadow receiveShadow>
          <boxGeometry args={[wall.w, HEIGHT, wall.d]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </>
  );
}

function GlassBoxes() {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#cfe6e4',
        transparent: true,
        opacity: 0.22,
        roughness: 0.05,
        metalness: 0,
        transmission: 0.6,
        side: THREE.DoubleSide,
      }),
    []
  );
  return (
    <>
      {GLASS.map((wall, i) => (
        <mesh key={i} position={[wall.x, HEIGHT / 2, wall.z]}>
          <boxGeometry args={[wall.w, HEIGHT - 0.1, wall.d]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </>
  );
}

function Windows() {
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8e4dc', roughness: 0.7 }), []);
  const blind = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.95 }), []);
  const light = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f4f7fb' }), []);
  // 동쪽 벽 창 (별치 C · 어린이)
  const spots = [
    { z: -6.4, w: 2.2 },
    { z: -3.4, w: 2.2 },
    { z: 1.2, w: 2.4 },
    { z: 7.4, w: 2.0 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <group key={i} position={[ROOM_BOUNDS.maxX - 0.11, 1.85, s.z]} rotation-y={-Math.PI / 2}>
          <mesh>
            <planeGeometry args={[s.w, 1.7]} />
            <primitive object={light} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <planeGeometry args={[s.w - 0.1, 1.6]} />
            <primitive object={blind} attach="material" />
          </mesh>
          {Array.from({ length: 7 }, (_, k) => (
            <mesh key={k} position={[0, 0.66 - k * 0.22, 0.02]}>
              <boxGeometry args={[s.w - 0.12, 0.018, 0.01]} />
              <meshStandardMaterial color="#dcd8cf" />
            </mesh>
          ))}
          {/* 창틀 테두리 */}
          <mesh position={[0, 0.87, 0.03]}>
            <boxGeometry args={[s.w, 0.06, 0.05]} />
            <primitive object={frame} attach="material" />
          </mesh>
          <mesh position={[0, -0.87, 0.03]}>
            <boxGeometry args={[s.w, 0.06, 0.05]} />
            <primitive object={frame} attach="material" />
          </mesh>
          <mesh position={[-s.w / 2 + 0.03, 0, 0.03]}>
            <boxGeometry args={[0.06, 1.8, 0.05]} />
            <primitive object={frame} attach="material" />
          </mesh>
          <mesh position={[s.w / 2 - 0.03, 0, 0.03]}>
            <boxGeometry args={[0.06, 1.8, 0.05]} />
            <primitive object={frame} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Ceiling() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbfaf7', roughness: 1 }), []);
  const light = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff' }), []);
  const xs = [-13, -8, -3, 2, 7, 12];
  const zs = [-6.5, -1.5, 3.5];
  return (
    <>
      <mesh rotation-x={Math.PI / 2} position-y={HEIGHT}>
        <planeGeometry args={[34, 20]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {xs.flatMap((x) =>
        zs.map((z) => (
          <mesh key={`${x}-${z}`} position={[x, HEIGHT - 0.06, z]} rotation-x={Math.PI / 2}>
            <planeGeometry args={[1.9, 0.28]} />
            <primitive object={light} attach="material" />
          </mesh>
        ))
      )}
      {/* 다운라이트 */}
      {[-10, -5, 0, 5, 10].map((x) =>
        [-8, 8].map((z) => (
          <mesh key={`d${x}-${z}`} position={[x, HEIGHT - 0.02, z]} rotation-x={Math.PI / 2}>
            <circleGeometry args={[0.13, 16]} />
            <primitive object={light} attach="material" />
          </mesh>
        ))
      )}
    </>
  );
}

function HangingSigns() {
  const textures = useMemo(
    () =>
      ZONE_LABELS.map((z) =>
        makeHangingSign(z.text, z.sub, z.zone === 'children' ? '#22a8a0' : z.zone === 'general' ? '#1f9d95' : '#2aa5b8')
      ),
    []
  );
  return (
    <>
      {ZONE_LABELS.map((z, i) => (
        <group key={z.zone} position={z.pos}>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.55, 6]} />
            <meshStandardMaterial color="#9aa0a6" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[1.65, 0.42, 0.05]} />
            <meshStandardMaterial map={textures[i]} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function MediaRoom() {
  const onAir = useMemo(() => makeOnAir(), []);
  const yellowSign = useMemo(() => makeHangingSign('미디어실', 'MEDIA ZONE', '#f2c400'), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.9 }), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.7 }), []);

  return (
    <group>
      {/* 미디어실 내부 바닥/천장 */}
      <mesh rotation-x={-Math.PI / 2} position={[5.5, 0.015, 6.7]}>
        <planeGeometry args={[4.6, 5.0]} />
        <primitive object={dark} attach="material" />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[5.5, HEIGHT - 0.02, 6.7]}>
        <planeGeometry args={[4.6, 5.0]} />
        <meshStandardMaterial color="#3a3f47" roughness={1} />
      </mesh>

      {/* 출입문: 유리문 + 프레임 (통행 가능) */}
      <mesh position={[5.7 - 0.6, 1.15, 4.2]}>
        <boxGeometry args={[0.07, 2.3, 0.1]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[5.7 + 0.6, 1.15, 4.2]}>
        <boxGeometry args={[0.07, 2.3, 0.1]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[5.7, 2.28, 4.2]}>
        <boxGeometry args={[1.27, 0.08, 0.1]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[5.7, 1.12, 4.2]}>
        <planeGeometry args={[1.13, 2.16]} />
        <meshPhysicalMaterial
          color="#d8ebe8"
          transparent
          opacity={0.22}
          roughness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ON AIR 사인 — 바깥면 + 안쪽면 */}
      <mesh position={[7.0, 1.75, 4.16]} rotation-y={Math.PI}>
        <planeGeometry args={[1.55, 0.95]} />
        <meshBasicMaterial map={onAir} transparent toneMapped={false} />
      </mesh>
      <mesh position={[7.0, 1.75, 4.24]}>
        <planeGeometry args={[1.55, 0.95]} />
        <meshBasicMaterial map={onAir} transparent toneMapped={false} />
      </mesh>

      {/* 미디어실 노란 간판 — 바깥면 + 안쪽면 */}
      <mesh position={[5.7, 2.62, 4.14]} rotation-y={Math.PI}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshBasicMaterial map={yellowSign} toneMapped={false} />
      </mesh>
      <mesh position={[5.7, 2.62, 4.26]}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshBasicMaterial map={yellowSign} toneMapped={false} />
      </mesh>

      {/* 내부 조명 */}
      <pointLight position={[5.5, 2.5, 6.6]} intensity={8} distance={7} color="#ffe3b0" />

      {/* 내부 모니터·소파 */}
      {[4.6, 6.4].map((x, i) => (
        <group key={i} position={[x, 0, 7.6]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.85, 0.5, 0.04]} />
            <primitive object={dark} attach="material" />
          </mesh>
          <mesh position={[0, 0.45, 0.15]}>
            <boxGeometry args={[0.8, 0.06, 0.4]} />
            <primitive object={frame} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh position={[5.5, 0.32, 8.9]}>
        <boxGeometry args={[2.4, 0.55, 0.8]} />
        <primitive object={dark} attach="material" />
      </mesh>
    </group>
  );
}

function DigitalRoom() {
  const screen = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1b2430', emissive: '#3d6a8f', emissiveIntensity: 0.6 }),
    []
  );
  const sign = useMemo(() => makeHangingSign('디지털정보실', 'DIGITAL INFO', '#1f9d95'), []);
  return (
    <group>
      {[
        [6.2, -8.4],
        [7.2, -8.4],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.72, 0]} castShadow>
            <boxGeometry args={[1.1, 0.06, 0.6]} />
            <meshStandardMaterial color="#e3ddd2" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.15, -0.1]}>
            <boxGeometry args={[0.5, 0.33, 0.03]} />
            <primitive object={screen} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh position={[5.42, 2.3, -7.4]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Room() {
  const floor = useMemo(() => {
    const tex = makeTerrazzo();
    tex.repeat.set(34 / 2.2, 20 / 2.2);
    return tex;
  }, []);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[34, 20]} />
        <meshStandardMaterial map={floor} roughness={0.55} metalness={0.03} />
      </mesh>
      <WallBoxes />
      <GlassBoxes />
      <Windows />
      <Ceiling />
      <HangingSigns />
      <MediaRoom />
      <DigitalRoom />
    </group>
  );
}
