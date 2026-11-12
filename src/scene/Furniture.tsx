import * as THREE from 'three';
import type { FurnitureAnchor } from '../types';

const MAT = {
  oak: new THREE.MeshStandardMaterial({ color: '#d3b184', roughness: 0.62 }),
  oakDark: new THREE.MeshStandardMaterial({ color: '#b08c5c', roughness: 0.68 }),
  white: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.7 }),
  navy: new THREE.MeshStandardMaterial({ color: '#2f3f66', roughness: 0.72 }),
  black: new THREE.MeshStandardMaterial({ color: '#23262b', roughness: 0.6 }),
  metal: new THREE.MeshStandardMaterial({ color: '#9aa0a6', roughness: 0.42, metalness: 0.5 }),
  screen: new THREE.MeshStandardMaterial({ color: '#1b2430', roughness: 0.35, emissive: '#243a55', emissiveIntensity: 0.5 }),
  panel: new THREE.MeshStandardMaterial({ color: '#e7e2d7', roughness: 0.85 }),
};

function Chair({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.44, 0.05, 0.44]} />
        <primitive object={MAT.navy} attach="material" />
      </mesh>
      <mesh position={[0, 0.72, -0.2]} castShadow>
        <boxGeometry args={[0.42, 0.5, 0.05]} />
        <primitive object={MAT.navy} attach="material" />
      </mesh>
      {[
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]}>
          <boxGeometry args={[0.035, 0.44, 0.035]} />
          <primitive object={MAT.black} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Table({ width = 2.4, depth = 1.0, height = 0.74 }: { width?: number; depth?: number; height?: number }) {
  return (
    <group>
      <mesh position={[0, height, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.05, depth]} />
        <primitive object={MAT.oak} attach="material" />
      </mesh>
      {[
        [-width / 2 + 0.12, -depth / 2 + 0.12],
        [width / 2 - 0.12, -depth / 2 + 0.12],
        [-width / 2 + 0.12, depth / 2 - 0.12],
        [width / 2 - 0.12, depth / 2 - 0.12],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow>
          <boxGeometry args={[0.06, height, 0.06]} />
          <primitive object={MAT.metal} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function ReadingTable() {
  return (
    <group>
      <Table />
      {[-0.72, 0.72].map((x) =>
        [-0.82, 0.82].map((z) => (
          <Chair key={`${x}-${z}`} position={[x, 0, z]} rotationY={z > 0 ? Math.PI : 0} />
        ))
      )}
    </group>
  );
}

function PcPartition() {
  return (
    <group>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.06, 0.72]} />
        <primitive object={MAT.oak} attach="material" />
      </mesh>
      {[-0.75, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.36, 0]}>
          <boxGeometry args={[0.06, 0.72, 0.62]} />
          <primitive object={MAT.metal} attach="material" />
        </mesh>
      ))}
      {/* 모니터 2대 */}
      {[-0.4, 0.4].map((x, i) => (
        <group key={i} position={[x, 0.75, -0.1]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.52, 0.32, 0.03]} />
            <primitive object={MAT.screen} attach="material" />
          </mesh>
          <mesh position={[0, 0.02, 0.05]}>
            <boxGeometry args={[0.06, 0.18, 0.06]} />
            <primitive object={MAT.metal} attach="material" />
          </mesh>
        </group>
      ))}
      {/* 파티션 패널 */}
      <mesh position={[0, 1.18, -0.24]} castShadow>
        <boxGeometry args={[1.7, 0.62, 0.05]} />
        <primitive object={MAT.panel} attach="material" />
      </mesh>
      <Chair position={[0, 0, 0.62]} rotationY={Math.PI} />
    </group>
  );
}

function Desk() {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.06, 0.86]} />
        <primitive object={MAT.oak} attach="material" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[2.9, 0.72, 0.8]} />
        <primitive object={MAT.oakDark} attach="material" />
      </mesh>
      <mesh position={[0, 1.0, -0.28]} castShadow>
        <boxGeometry args={[2.4, 0.42, 0.05]} />
        <primitive object={MAT.oak} attach="material" />
      </mesh>
      <mesh position={[0.7, 0.92, 0.1]} castShadow>
        <boxGeometry args={[0.55, 0.34, 0.03]} />
        <primitive object={MAT.screen} attach="material" />
      </mesh>
      <mesh position={[0.7, 0.8, 0.18]}>
        <boxGeometry args={[0.2, 0.05, 0.12]} />
        <primitive object={MAT.metal} attach="material" />
      </mesh>
    </group>
  );
}

function BookCart() {
  return (
    <group>
      {[0.35, 0.75].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.9, 0.04, 0.5]} />
          <primitive object={MAT.oak} attach="material" />
        </mesh>
      ))}
      {[-0.44, 0.44].map((x) =>
        [-0.24, 0.24].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.5, z]}>
            <boxGeometry args={[0.04, 0.7, 0.04]} />
            <primitive object={MAT.metal} attach="material" />
          </mesh>
        ))
      )}
      {/* 바퀴 */}
      {[
        [-0.4, -0.2],
        [0.4, -0.2],
        [-0.4, 0.2],
        [0.4, 0.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
          <primitive object={MAT.black} attach="material" />
        </mesh>
      ))}
      {/* 꽂힌 책 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`b${i}`} position={[-0.32 + i * 0.13, 0.84, 0]} castShadow>
          <boxGeometry args={[0.08, 0.22, 0.3]} />
          <meshStandardMaterial color={['#c05a5a', '#4f7f9e', '#c9a24a', '#5f8a5a', '#8a6a9a'][i]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function LowTable() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.9]} />
        <primitive object={MAT.oak} attach="material" />
      </mesh>
      {[
        [-0.7, -0.36],
        [0.7, -0.36],
        [-0.7, 0.36],
        [0.7, 0.36],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.21, z]}>
          <boxGeometry args={[0.05, 0.42, 0.05]} />
          <primitive object={MAT.oakDark} attach="material" />
        </mesh>
      ))}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0]}>
          <cylinderGeometry args={[0.24, 0.26, 0.2, 16]} />
          <primitive object={MAT.navy} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Plant() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.4, 16]} />
        <meshStandardMaterial color="#b8b2a6" roughness={0.9} />
      </mesh>
      {[
        [0, 0.62, 0, 0.3],
        [0.15, 0.86, 0.05, 0.2],
        [-0.14, 0.9, -0.05, 0.17],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={['#4f7a45', '#5c8a4e', '#3f6538'][i]} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function Furniture({ anchors }: { anchors: FurnitureAnchor[] }) {
  return (
    <group>
      {anchors.map((anchor, i) => (
        <group key={i} position={anchor.pos} rotation-y={anchor.rotationY}>
          {anchor.kind === 'reading-table' && <ReadingTable />}
          {anchor.kind === 'pc-partition' && <PcPartition />}
          {anchor.kind === 'desk' && <Desk />}
          {anchor.kind === 'book-cart' && <BookCart />}
          {anchor.kind === 'low-table' && <LowTable />}
          {anchor.kind === 'plant' && <Plant />}
        </group>
      ))}
    </group>
  );
}
