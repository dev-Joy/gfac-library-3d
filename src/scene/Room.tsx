import { useMemo } from 'react';
import * as THREE from 'three';
import { makeSignTexture, makeWoodTexture } from './textures';
import type { ZoneLayout } from '../types';

interface Props {
  zone: ZoneLayout;
}

const ZONE_HEIGHT: Record<string, number> = { general: 4.2, children: 3.5, archive: 3.8 };

export function Room({ zone }: Props) {
  const height = ZONE_HEIGHT[zone.id] ?? 4.2;
  const { width, depth } = zone.size;

  const floorTex = useMemo(() => {
    const tex = makeWoodTexture(zone.id === 'children' ? '#b0855a' : '#8a5f3c');
    tex.repeat.set(width / 2.4, depth / 2.4);
    return tex;
  }, [width, depth, zone.id]);

  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: zone.id === 'archive' ? '#3a342d' : '#5a4c3e', roughness: 0.95 }),
    [zone.id]
  );
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2c2620', roughness: 1 }), []);
  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2119', roughness: 0.85 }), []);

  const signTex = useMemo(
    () =>
      makeSignTexture(
        zone.id === 'archive' ? '보존서고' : zone.id === 'children' ? '어린이자료실' : '성현동 작은도서관',
        zone.id === 'general' ? 'GWANAK · SMALL LIBRARY 5F' : zone.id === 'children' ? 'CHILDREN’S ROOM' : 'ARCHIVE 2008–2019'
      ),
    [zone.id]
  );

  return (
    <group>
      {/* 바닥 (앞쪽으로 여유 있게 깔아 디오라마 느낌을 준다) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 2]} receiveShadow>
        <planeGeometry args={[width + 2, depth + 6]} />
        <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.04} />
      </mesh>

      {/* 천장 */}
      <mesh rotation-x={Math.PI / 2} position-y={height}>
        <planeGeometry args={[width, depth]} />
        <primitive object={ceilMat} attach="material" />
      </mesh>

      {/* 천장 조명 패널 */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * Math.min(width * 0.3, 3.2), height - 0.04, 0]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[2.1, 0.3]} />
          <meshBasicMaterial color="#ffe7c2" toneMapped={false} />
        </mesh>
      ))}

      {/* 벽 */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* 창문 (오른쪽 벽) */}
      {zone.id !== 'archive' &&
        [-2.2, 0.4].map((z, i) => (
          <group key={i} position={[width / 2 - 0.02, height * 0.6, z]} rotation-y={-Math.PI / 2}>
            <mesh>
              <planeGeometry args={[1.7, 1.7]} />
              <meshBasicMaterial color="#ffe9c4" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[1.56, 1.56]} />
              <meshBasicMaterial color="#fff8ea" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[0.05, 1.7, 0.04]} />
              <primitive object={trimMat} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[1.7, 0.05, 0.04]} />
              <primitive object={trimMat} attach="material" />
            </mesh>
          </group>
        ))}

      {/* 벽면 사인 */}
      <mesh position={[0, height - 0.85, -depth / 2 + 0.05]}>
        <planeGeometry args={[4.4, 0.86]} />
        <meshBasicMaterial map={signTex} transparent toneMapped={false} />
      </mesh>

      {/* 걸레받이 */}
      <mesh position={[0, 0.09, -depth / 2 + 0.03]}>
        <boxGeometry args={[width, 0.18, 0.05]} />
        <primitive object={trimMat} attach="material" />
      </mesh>
      <mesh position={[-width / 2 + 0.03, 0.09, 0]}>
        <boxGeometry args={[0.05, 0.18, depth]} />
        <primitive object={trimMat} attach="material" />
      </mesh>
      <mesh position={[width / 2 - 0.03, 0.09, 0]}>
        <boxGeometry args={[0.05, 0.18, depth]} />
        <primitive object={trimMat} attach="material" />
      </mesh>

      {/* 러그 */}
      {zone.id !== 'archive' && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.013, depth / 2 - 2.4]} receiveShadow>
          <planeGeometry args={[Math.min(width * 0.52, 5.4), 3.2]} />
          <meshStandardMaterial color={zone.id === 'children' ? '#7d3f3a' : '#4b4238'} roughness={1} />
        </mesh>
      )}

      {/* 열람 테이블 */}
      {zone.id !== 'archive' && <ReadingTable depth={depth} />}

      {/* 화분 */}
      {zone.id !== 'archive' && (
        <>
          <Plant position={[-width / 2 + 0.7, 0, depth / 2 - 0.6]} />
          <Plant position={[width / 2 - 0.7, 0, depth / 2 - 0.6]} />
        </>
      )}
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.4, 16]} />
        <meshStandardMaterial color="#7a5540" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#3e5c35" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.16, 0.86, 0.05]} castShadow>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#4a6b3e" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-0.14, 0.9, -0.06]} castShadow>
        <icosahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#35502e" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function ReadingTable({ depth }: { depth: number }) {
  const top = '#6b4f36';
  const legX = 0.95;

  return (
    <group position={[0, 0, depth / 2 - 2.3]}>
      {/* 상판 */}
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 0.07, 0.92]} />
        <meshStandardMaterial color={top} roughness={0.55} metalness={0.06} />
      </mesh>
      {/* 다리 */}
      {[
        [-legX, -0.36],
        [legX, -0.36],
        [-legX, 0.36],
        [legX, 0.36],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.07, 0.72, 0.07]} />
          <meshStandardMaterial color="#3b2b1e" roughness={0.8} />
        </mesh>
      ))}
      {/* 테이블 램프 */}
      <group position={[0.72, 0.77, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.03, 20]} />
          <meshStandardMaterial color="#c8a06a" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.32, 8]} />
          <meshStandardMaterial color="#c8a06a" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.17, 0.16, 20, 1, true]} />
          <meshStandardMaterial color="#e8c98f" emissive="#ffb85c" emissiveIntensity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 0.34, 0]} intensity={2.6} distance={4.5} decay={2} color="#ffcf8f" />
      </group>
      {/* 의자 */}
      {[-1.0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0, 0.85]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.44, 0.06, 0.44]} />
            <meshStandardMaterial color="#4a3626" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.72, -0.2]} castShadow>
            <boxGeometry args={[0.44, 0.5, 0.05]} />
            <meshStandardMaterial color="#4a3626" roughness={0.8} />
          </mesh>
          {[
            [-0.17, -0.17],
            [0.17, -0.17],
            [-0.17, 0.17],
            [0.17, 0.17],
          ].map(([lx, lz], j) => (
            <mesh key={j} position={[lx, 0.22, lz]}>
              <boxGeometry args={[0.04, 0.44, 0.04]} />
              <meshStandardMaterial color="#33251a" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
