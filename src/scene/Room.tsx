import { useMemo } from 'react';
import * as THREE from 'three';
import { GLASS, WALLS, ZONE_LABELS } from '../data/floorplan';
import { ROOM_BOUNDS } from '../data/sections';
import {
  makeHangingSign,
  makeNoticeTexture,
  makeOnAir,
  makePosterTexture,
  makeTerrazzo,
  makeWindowView,
} from './textures';

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
  const view = useMemo(() => makeWindowView(), []);
  // 동쪽 벽 창 (별치 C)
  const spots = [
    { z: -5.0, w: 2.2 },
    { z: -1.8, w: 2.2 },
    { z: 1.4, w: 2.4 },
    { z: 4.6, w: 2.0 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <group key={i} position={[ROOM_BOUNDS.maxX - 0.11, 1.85, s.z]} rotation-y={-Math.PI / 2}>
          <mesh>
            <planeGeometry args={[s.w, 1.7]} />
            <meshBasicMaterial map={view} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.42, 0.012]}>
            <planeGeometry args={[s.w - 0.1, 0.82]} />
            <primitive object={blind} attach="material" />
          </mesh>
          {Array.from({ length: 4 }, (_, k) => (
            <mesh key={k} position={[0, 0.78 - k * 0.2, 0.02]}>
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
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f9f7f2' }), []);
  const housing = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: 0.6, emissive: '#fff6e8', emissiveIntensity: 0.45 }),
    []
  );
  const light = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fffdf6' }), []);
  const cove = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff2dc' }), []);
  const xs = [-13, -8, -3, 2, 7, 12];
  const zs = [-5, 0, 5];
  return (
    <>
      <mesh rotation-x={Math.PI / 2} position-y={HEIGHT}>
        <planeGeometry args={[34, 14]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {xs.flatMap((x) =>
        zs.map((z) => (
          <group key={`${x}-${z}`} position={[x, HEIGHT - 0.05, z]}>
            <mesh rotation-x={Math.PI / 2}>
              <boxGeometry args={[2.05, 0.07, 0.4]} />
              <primitive object={housing} attach="material" />
            </mesh>
            <mesh position={[0, -0.04, 0]} rotation-x={Math.PI / 2}>
              <planeGeometry args={[1.92, 0.3]} />
              <primitive object={light} attach="material" />
            </mesh>
          </group>
        ))
      )}
      {/* 천장 코브 조명 */}
      {[
        { pos: [0, HEIGHT - 0.1, -6.86], size: [33.6, 0.05, 0.05] },
        { pos: [0, HEIGHT - 0.1, 6.86], size: [33.6, 0.05, 0.05] },
        { pos: [-16.86, HEIGHT - 0.1, 0], size: [0.05, 0.05, 13.6] },
        { pos: [16.86, HEIGHT - 0.1, 0], size: [0.05, 0.05, 13.6] },
      ].map((p, i) => (
        <mesh key={`cove${i}`} position={p.pos as [number, number, number]}>
          <boxGeometry args={p.size as [number, number, number]} />
          <primitive object={cove} attach="material" />
        </mesh>
      ))}
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
            <boxGeometry args={[1.2, 0.32, 0.04]} />
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
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#24282e', roughness: 0.9 }), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.7 }), []);

  return (
    <group>
      {/* 미디어실 내부 바닥/천장 */}
      <mesh rotation-x={-Math.PI / 2} position={[14.7, 0.015, 5.05]}>
        <planeGeometry args={[4.2, 3.7]} />
        <primitive object={dark} attach="material" />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[14.7, HEIGHT - 0.02, 5.05]}>
        <planeGeometry args={[4.2, 3.7]} />
        <meshStandardMaterial color="#343a40" roughness={1} />
      </mesh>

      {/* 출입문: 유리문 + 프레임 (통행 가능) */}
      {[13.8, 15.2].map((x, i) => (
        <mesh key={i} position={[x, 1.15, 3.2]}>
          <boxGeometry args={[0.07, 2.3, 0.1]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      <mesh position={[14.5, 2.28, 3.2]}>
        <boxGeometry args={[1.47, 0.08, 0.1]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[14.5, 1.12, 3.2]}>
        <planeGeometry args={[1.3, 2.16]} />
        <meshPhysicalMaterial color="#d8ebe8" transparent opacity={0.22} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[14.9, 1.05, 3.14]} rotation-y={Math.PI}>
        <boxGeometry args={[0.03, 0.5, 0.04]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ON AIR — 유리문 바깥면 */}
      <mesh position={[16.0, 1.7, 3.14]} rotation-y={Math.PI}>
        <planeGeometry args={[1.05, 0.66]} />
        <meshBasicMaterial map={onAir} transparent toneMapped={false} />
      </mesh>
      {/* 미디어실 노란 간판 */}
      <mesh position={[14.5, 2.68, 3.13]} rotation-y={Math.PI}>
        <planeGeometry args={[1.25, 0.34]} />
        <meshBasicMaterial map={yellowSign} toneMapped={false} />
      </mesh>

      {/* 내부 조명·모니터·소파 */}
      <pointLight position={[14.7, 2.5, 5.2]} intensity={7} distance={6} color="#ffe3b0" />
      {[13.6, 15.8].map((x, i) => (
        <group key={i} position={[x, 0, 6.25]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.85, 0.5, 0.05]} />
            <primitive object={dark} attach="material" />
          </mesh>
          <mesh position={[0, 0.45, 0.15]}>
            <boxGeometry args={[0.8, 0.06, 0.4]} />
            <primitive object={frame} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh position={[14.7, 0.32, 6.55]} castShadow>
        <boxGeometry args={[2.2, 0.55, 0.75]} />
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
        [5.85, -6.25],
        [6.85, -6.25],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.72, 0]} castShadow>
            <boxGeometry args={[1.0, 0.06, 0.6]} />
            <meshStandardMaterial color="#e3ddd2" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.15, -0.08]}>
            <boxGeometry args={[0.5, 0.33, 0.03]} />
            <primitive object={screen} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh position={[5.03, 2.3, -5.7]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1.2, 0.34]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Room() {
  const floor = useMemo(() => {
    const tex = makeTerrazzo();
    tex.repeat.set(34 / 2.2, 14 / 2.2);
    return tex;
  }, []);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[34, 14]} />
        <meshPhysicalMaterial map={floor} bumpMap={floor} bumpScale={0.015} roughness={0.42} metalness={0.02} envMapIntensity={0.9} />
      </mesh>
      <WallBoxes />
      <GlassBoxes />
      <Windows />
      <Ceiling />
      <Baseboards />
      <HangingSigns />
      <WallClock />
      <WestWindow />
      <NorthWindow />
      <NoticeBoard />
      <ColumnTrim />
      <EntranceDoor />
      <MediaRoom />
      <DigitalRoom />
    </group>
  );
}

function Baseboards() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e4ded2', roughness: 0.7 }), []);
  const parts: { pos: [number, number, number]; size: [number, number, number] }[] = [
    { pos: [0, 0.07, -6.9], size: [34, 0.14, 0.04] },
    { pos: [-9.2, 0.07, 6.9], size: [15.6, 0.14, 0.04] },
    { pos: [9.3, 0.07, 6.9], size: [15.4, 0.14, 0.04] },
    { pos: [-16.9, 0.07, 0], size: [0.04, 0.14, 14] },
    { pos: [16.9, 0.07, 0], size: [0.04, 0.14, 14] },
    { pos: [-3.9, 0.07, -4.2], size: [0.04, 0.14, 5.6] },
    { pos: [-3.9, 0.07, 4.2], size: [0.04, 0.14, 5.6] },
    { pos: [8.1, 0.07, -3.8], size: [0.04, 0.14, 6.4] },
    { pos: [8.1, 0.07, 4.0], size: [0.04, 0.14, 6.0] },
  ];
  return (
    <>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos} castShadow>
          <boxGeometry args={p.size} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </>
  );
}

function WallClock() {
  const face = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.6 }), []);
  const ink = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2c2f33', roughness: 0.5 }), []);
  return (
    <group position={[-6.4, 2.45, -6.88]}>
      <mesh castShadow>
        <circleGeometry args={[0.24, 36]} />
        <primitive object={face} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <ringGeometry args={[0.22, 0.25, 36]} />
        <primitive object={ink} attach="material" />
      </mesh>
      <mesh position={[0, 0.06, 0.012]} castShadow>
        <boxGeometry args={[0.016, 0.13, 0.006]} />
        <primitive object={ink} attach="material" />
      </mesh>
      <mesh position={[0.05, -0.02, 0.012]} castShadow>
        <boxGeometry args={[0.1, 0.014, 0.006]} />
        <primitive object={ink} attach="material" />
      </mesh>
    </group>
  );
}

function EntranceDoor() {
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cfcac1', roughness: 0.5, metalness: 0.3 }), []);
  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#e6f0f2', transparent: true, opacity: 0.2, roughness: 0.05 }),
    []
  );
  return (
    <group>
      {[-1.4, 1.6].map((x, i) => (
        <mesh key={i} position={[x, 1.2, 6.9]} castShadow>
          <boxGeometry args={[0.08, 2.4, 0.1]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      <mesh position={[0.1, 2.38, 6.9]}>
        <boxGeometry args={[3.08, 0.08, 0.1]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[0.1, 1.2, 6.9]}>
        <planeGeometry args={[2.9, 2.3]} />
        <primitive object={glass} attach="material" />
      </mesh>
      <mesh position={[0.6, 1.15, 6.84]}>
        <boxGeometry args={[0.04, 0.6, 0.05]} />
        <primitive object={frame} attach="material" />
      </mesh>
    </group>
  );
}

function WestWindow() {
  const view = useMemo(() => makeWindowView(), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e7e2d8', roughness: 0.6 }), []);
  const blind = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.95 }), []);
  return (
    <group position={[-16.88, 1.95, 1.2]} rotation-y={Math.PI / 2}>
      <mesh>
        <planeGeometry args={[2.6, 1.9]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.5, 0.012]}>
        <planeGeometry args={[2.5, 0.9]} />
        <primitive object={blind} attach="material" />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0, 0.86 - i * 0.2, 0.02]}>
          <boxGeometry args={[2.5, 0.016, 0.012]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      {[
        [0, 0.98, 2.64, 0.06],
        [0, -0.98, 2.64, 0.06],
        [-1.3, 0, 0.06, 2.0],
        [1.3, 0, 0.06, 2.0],
      ].map(([x, y, w, h], i) => (
        <mesh key={`f${i}`} position={[x, y, 0.03]}>
          <boxGeometry args={[w, h, 0.05]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      <pointLight position={[-1.2, 0, 0]} intensity={3.2} distance={7} decay={2} color="#eaf4ff" />
    </group>
  );
}

export function Posters() {
  const a = useMemo(() => makePosterTexture('함께 읽는 동네', '성현동 작은도서관', '#2f7e78'), []);
  const b = useMemo(() => makePosterTexture('9월 독서의 달', '어린이 그림책 전시', '#c07a4a'), []);
  return (
    <group>
      {[
        { x: -7.3, tex: a },
        { x: -5.9, tex: b },
      ].map((p, i) => (
        <group key={i} position={[p.x, 2.55, -6.8]}>
          <mesh>
            <planeGeometry args={[0.72, 0.96]} />
            <meshStandardMaterial map={p.tex} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[0.8, 1.04, 0.03]} />
            <meshStandardMaterial color="#5c554b" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function NoticeBoard() {
  const tex = useMemo(() => makeNoticeTexture(), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8d6b45', roughness: 0.6 }), []);
  return (
    <group position={[-3.9, 1.7, -1.0]} rotation-y={-Math.PI / 2}>
      <mesh>
        <planeGeometry args={[1.65, 1.1]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[1.75, 1.2, 0.04]} />
        <primitive object={frame} attach="material" />
      </mesh>
    </group>
  );
}

export function Beams() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eae6de', roughness: 0.9 }), []);
  return (
    <>
      {[-3.5, 3.5].map((z, i) => (
        <mesh key={i} position={[0, HEIGHT - 0.14, z]} castShadow>
          <boxGeometry args={[33.8, 0.16, 0.28]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
      {[-10.5, 0.5, 11.5].map((x, i) => (
        <mesh key={`x${i}`} position={[x, HEIGHT - 0.14, 0]} castShadow>
          <boxGeometry args={[0.28, 0.16, 13.8]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </>
  );
}

function ColumnTrim() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ece7de', roughness: 0.78 }), []);
  return (
    <>
      {[
        [-15.8, 0.2],
        [3.0, -0.4],
        [10.6, 0.6],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.56, 0.36, 0.56]} />
            <primitive object={mat} attach="material" />
          </mesh>
          <mesh position={[0, HEIGHT - 0.1, 0]} castShadow>
            <boxGeometry args={[0.56, 0.2, 0.56]} />
            <primitive object={mat} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function NorthWindow() {
  const view = useMemo(() => makeWindowView(), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e7e2d8', roughness: 0.6 }), []);
  const blind = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.95 }), []);
  return (
    <group position={[-6.4, 1.95, -6.86]}>
      <mesh>
        <planeGeometry args={[3.2, 1.9]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.55, 0.012]}>
        <planeGeometry args={[3.1, 0.8]} />
        <primitive object={blind} attach="material" />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0, 0.88 - i * 0.18, 0.02]}>
          <boxGeometry args={[3.1, 0.016, 0.012]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      {[
        [0, 0.98, 3.36, 0.06],
        [0, -0.98, 3.36, 0.06],
        [-1.61, 0, 0.06, 2.0],
        [1.61, 0, 0.06, 2.0],
      ].map(([x, y, w, h], i) => (
        <mesh key={`f${i}`} position={[x, y, 0.03]}>
          <boxGeometry args={[w, h, 0.05]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      <pointLight position={[0, 0.2, 1.2]} intensity={4.5} distance={8} decay={2} color="#eaf4ff" />
    </group>
  );
}
