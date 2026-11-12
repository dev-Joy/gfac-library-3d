import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { FurnitureAnchor } from '../types';
import { makeRugTexture, makeShelfLabel } from './textures';

const MAT = {
  oak: new THREE.MeshStandardMaterial({ color: '#d9bd93', roughness: 0.52, metalness: 0.02 }),
  oakDark: new THREE.MeshStandardMaterial({ color: '#b08a5c', roughness: 0.62 }),
  oakEdge: new THREE.MeshStandardMaterial({ color: '#c9a273', roughness: 0.5 }),
  board: new THREE.MeshStandardMaterial({ color: '#e8dcc4', roughness: 0.8 }),
  white: new THREE.MeshStandardMaterial({ color: '#f6f3ed', roughness: 0.62 }),
  navy: new THREE.MeshStandardMaterial({ color: '#31436d', roughness: 0.78 }),
  black: new THREE.MeshStandardMaterial({ color: '#22252a', roughness: 0.64 }),
  grey: new THREE.MeshStandardMaterial({ color: '#7d858c', roughness: 0.8 }),
  metal: new THREE.MeshStandardMaterial({ color: '#a7adb2', roughness: 0.35, metalness: 0.65 }),
  metalDark: new THREE.MeshStandardMaterial({ color: '#5c636a', roughness: 0.4, metalness: 0.5 }),
  screen: new THREE.MeshStandardMaterial({ color: '#111a24', roughness: 0.22, metalness: 0.2, emissive: '#2d4c6b', emissiveIntensity: 0.55 }),
  screenOff: new THREE.MeshStandardMaterial({ color: '#1a2028', roughness: 0.3, metalness: 0.3 }),
  panel: new THREE.MeshPhysicalMaterial({ color: '#e9e4d9', roughness: 0.5, transparent: true, opacity: 0.72 }),
  paper: new THREE.MeshStandardMaterial({ color: '#fbf8f0', roughness: 0.9 }),
  leafA: new THREE.MeshStandardMaterial({ color: '#4f7a45', roughness: 0.9, flatShading: true }),
  leafB: new THREE.MeshStandardMaterial({ color: '#5f8b4e', roughness: 0.9, flatShading: true }),
  leafC: new THREE.MeshStandardMaterial({ color: '#3d6338', roughness: 0.9, flatShading: true }),
  pot: new THREE.MeshStandardMaterial({ color: '#b9b2a4', roughness: 0.85 }),
  cushionA: new THREE.MeshStandardMaterial({ color: '#d3876f', roughness: 0.95 }),
  cushionB: new THREE.MeshStandardMaterial({ color: '#7b9db5', roughness: 0.95 }),
  cushionC: new THREE.MeshStandardMaterial({ color: '#c7b46a', roughness: 0.95 }),
};

const BOOK_COLORS = ['#b45a54', '#4f7f9e', '#c9a24a', '#5f8a5a', '#8a6a9a', '#c07a4a', '#5c6f8c'];

function Leg({
  position,
  height,
  radius = 0.025,
  material = MAT.metalDark,
  tilt = 0,
}: {
  position: [number, number, number];
  height: number;
  radius?: number;
  material?: THREE.Material;
  tilt?: number;
}) {
  return (
    <mesh position={position} rotation-x={tilt} castShadow>
      <cylinderGeometry args={[radius, radius * 0.9, height, 10]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Chair({
  position,
  rotationY = 0,
  tone = 'navy',
}: {
  position: [number, number, number];
  rotationY?: number;
  tone?: 'navy' | 'black' | 'grey';
}) {
  const fabric = tone === 'black' ? MAT.black : tone === 'grey' ? MAT.grey : MAT.navy;
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[0.46, 0.075, 0.45]} radius={0.03} smoothness={4} position={[0, 0.45, 0]} castShadow receiveShadow>
        <primitive object={fabric} attach="material" />
      </RoundedBox>
      <RoundedBox
        args={[0.44, 0.48, 0.065]}
        radius={0.03}
        smoothness={4}
        position={[0, 0.73, -0.205]}
        rotation-x={-0.09}
        castShadow
      >
        <primitive object={fabric} attach="material" />
      </RoundedBox>
      {[-0.19, 0.19].map((x) =>
        [-0.17, 0.17].map((z) => (
          <Leg key={`${x}-${z}`} position={[x, 0.22, z]} height={0.44} radius={0.018} tilt={z > 0 ? 0.06 : -0.06} />
        ))
      )}
    </group>
  );
}

function BookStack({ position, count = 4, rotationY = 0 }: { position: [number, number, number]; count?: number; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, 0.02 + i * 0.035, 0]} rotation-y={i * 0.12} castShadow>
          <boxGeometry args={[0.24 - i * 0.012, 0.033, 0.17]} />
          <meshStandardMaterial color={BOOK_COLORS[i % BOOK_COLORS.length]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function TableLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.03, 18]} />
        <primitive object={MAT.metal} attach="material" />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
        <primitive object={MAT.metal} attach="material" />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <coneGeometry args={[0.14, 0.16, 20, 1, true]} />
        <meshStandardMaterial color="#f2e6cf" roughness={0.7} side={THREE.DoubleSide} emissive="#ffd9a0" emissiveIntensity={0.35} />
      </mesh>
      <pointLight position={[0, 0.34, 0]} intensity={0.5} distance={2.2} decay={2} color="#ffd9a8" />
    </group>
  );
}

function Laptop({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox args={[0.34, 0.02, 0.24]} radius={0.008} smoothness={3} castShadow>
        <primitive object={MAT.grey} attach="material" />
      </RoundedBox>
      <group position={[0, 0.01, -0.11]} rotation-x={-0.28}>
        <RoundedBox args={[0.34, 0.22, 0.015]} radius={0.008} smoothness={3} position={[0, 0.11, 0]} castShadow>
          <primitive object={MAT.screen} attach="material" />
        </RoundedBox>
      </group>
    </group>
  );
}

function Table({
  width = 2.2,
  depth = 0.95,
  height = 0.74,
}: {
  width?: number;
  depth?: number;
  height?: number;
}) {
  return (
    <group>
      <RoundedBox args={[width, 0.055, depth]} radius={0.018} smoothness={4} position={[0, height, 0]} castShadow receiveShadow>
        <primitive object={MAT.oak} attach="material" />
      </RoundedBox>
      <mesh position={[0, height - 0.055, 0]}>
        <boxGeometry args={[width - 0.16, 0.05, depth - 0.16]} />
        <primitive object={MAT.oakEdge} attach="material" />
      </mesh>
      {[
        [-width / 2 + 0.14, -depth / 2 + 0.13],
        [width / 2 - 0.14, -depth / 2 + 0.13],
        [-width / 2 + 0.14, depth / 2 - 0.13],
        [width / 2 - 0.14, depth / 2 - 0.13],
      ].map(([x, z], i) => (
        <Leg key={i} position={[x, height / 2, z]} height={height} radius={0.028} />
      ))}
    </group>
  );
}

function ReadingTable({ laptop = false, tone = 'black' }: { laptop?: boolean; tone?: 'navy' | 'black' }) {
  return (
    <group>
      <Table width={2.25} depth={0.95} />
      {[-0.62, 0.62].map((x) =>
        [-0.78, 0.78].map((z) => (
          <Chair key={`${x}-${z}`} position={[x, 0, z]} rotationY={z > 0 ? Math.PI : 0} tone={tone} />
        ))
      )}
      <TableLamp position={[0.72, 0.77, 0]} />
      <BookStack position={[-0.55, 0.77, 0.1]} count={3} rotationY={0.3} />
      <BookStack position={[0.1, 0.77, -0.2]} count={2} rotationY={-0.2} />
      {laptop && <Laptop position={[-0.55, 0.77, 0.2]} rotationY={0.22} />}
      <mesh position={[-0.05, 0.775, 0.24]} rotation-y={0.15}>
        <boxGeometry args={[0.32, 0.006, 0.24]} />
        <primitive object={MAT.paper} attach="material" />
      </mesh>
    </group>
  );
}

function PcPartition() {
  return (
    <group>
      <RoundedBox args={[1.7, 0.055, 0.72]} radius={0.015} smoothness={4} position={[0, 0.72, 0]} castShadow receiveShadow>
        <primitive object={MAT.oak} attach="material" />
      </RoundedBox>
      {[-0.78, 0.78].map((x, i) => (
        <mesh key={i} position={[x, 0.35, 0]} castShadow>
          <boxGeometry args={[0.06, 0.7, 0.62]} />
          <primitive object={MAT.metalDark} attach="material" />
        </mesh>
      ))}
      {/* 모니터 2대 + 키보드 */}
      {[-0.4, 0.4].map((x, i) => (
        <group key={i} position={[x, 0.75, -0.12]}>
          <RoundedBox args={[0.52, 0.31, 0.03]} radius={0.008} smoothness={3} position={[0, 0.17, 0]} castShadow>
            <primitive object={MAT.screen} attach="material" />
          </RoundedBox>
          <mesh position={[0, 0.02, 0.02]}>
            <boxGeometry args={[0.05, 0.16, 0.05]} />
            <primitive object={MAT.metalDark} attach="material" />
          </mesh>
          <mesh position={[0, -0.045, 0.02]}>
            <boxGeometry args={[0.2, 0.012, 0.14]} />
            <primitive object={MAT.metalDark} attach="material" />
          </mesh>
          <mesh position={[0.13, -0.04, 0.02]} castShadow>
            <boxGeometry args={[0.28, 0.015, 0.1]} />
            <primitive object={MAT.white} attach="material" />
          </mesh>
          <mesh position={[0.31, -0.03, 0.02]}>
            <sphereGeometry args={[0.018, 10, 8]} />
            <primitive object={MAT.metalDark} attach="material" />
          </mesh>
        </group>
      ))}
      {/* 파티션 패널 */}
      <mesh position={[0, 1.16, -0.25]} castShadow>
        <boxGeometry args={[1.7, 0.6, 0.035]} />
        <primitive object={MAT.panel} attach="material" />
      </mesh>
      <mesh position={[0, 0.86, -0.25]}>
        <boxGeometry args={[1.72, 0.04, 0.05]} />
        <primitive object={MAT.metal} attach="material" />
      </mesh>
      {/* CPU 본체 */}
      <mesh position={[-0.72, 0.45, 0.18]} castShadow>
        <boxGeometry args={[0.18, 0.42, 0.4]} />
        <primitive object={MAT.black} attach="material" />
      </mesh>
      <Chair position={[0, 0, 0.72]} rotationY={Math.PI} tone="navy" />
      <BookStack position={[0.55, 0.75, 0.18]} count={2} rotationY={0.2} />
    </group>
  );
}

function Desk() {
  return (
    <group>
      <RoundedBox args={[2.6, 0.06, 0.86]} radius={0.018} smoothness={4} position={[0, 0.76, 0]} castShadow receiveShadow>
        <primitive object={MAT.oak} attach="material" />
      </RoundedBox>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[2.5, 0.72, 0.78]} />
        <primitive object={MAT.oakDark} attach="material" />
      </mesh>
      <mesh position={[0, 1.02, -0.28]} castShadow>
        <boxGeometry args={[2.1, 0.4, 0.05]} />
        <primitive object={MAT.oak} attach="material" />
      </mesh>
      <BookStack position={[-0.8, 1.23, -0.28]} count={5} rotationY={0.05} />
      <BookStack position={[-0.35, 1.23, -0.28]} count={4} rotationY={-0.08} />
      <group position={[0.55, 0, -0.05]}>
        <RoundedBox args={[0.5, 0.33, 0.03]} radius={0.008} smoothness={3} position={[0, 1.02, 0]} castShadow>
          <primitive object={MAT.screen} attach="material" />
        </RoundedBox>
        <mesh position={[0, 0.88, 0.02]}>
          <boxGeometry args={[0.05, 0.16, 0.05]} />
          <primitive object={MAT.metalDark} attach="material" />
        </mesh>
        <mesh position={[0, 0.8, 0.05]}>
          <boxGeometry args={[0.3, 0.015, 0.11]} />
          <primitive object={MAT.white} attach="material" />
        </mesh>
      </group>
      <mesh position={[1.1, 0.79, 0.1]} rotation-y={-0.4}>
        <boxGeometry args={[0.16, 0.06, 0.22]} />
        <primitive object={MAT.grey} attach="material" />
      </mesh>
      <BookStack position={[0.95, 0.79, -0.24]} count={3} rotationY={0.1} />
    </group>
  );
}

function BookCart() {
  return (
    <group>
      {[0.35, 0.72, 1.02].map((y, i) => (
        <RoundedBox key={i} args={[0.9, 0.035, 0.5]} radius={0.008} smoothness={2} position={[0, y, 0]} castShadow>
          <primitive object={MAT.oak} attach="material" />
        </RoundedBox>
      ))}
      {[-0.44, 0.44].map((x) =>
        [-0.24, 0.24].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.5, z]} castShadow>
            <boxGeometry args={[0.035, 1.02, 0.035]} />
            <primitive object={MAT.metalDark} attach="material" />
          </mesh>
        ))
      )}
      {[
        [-0.4, -0.2],
        [0.4, -0.2],
        [-0.4, 0.2],
        [0.4, 0.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.035, 14]} />
          <primitive object={MAT.black} attach="material" />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh key={`b${i}`} position={[-0.32 + i * 0.105, 0.87, 0]} castShadow>
          <boxGeometry args={[0.07, 0.22 + (i % 3) * 0.02, 0.3]} />
          <meshStandardMaterial color={BOOK_COLORS[i % BOOK_COLORS.length]} roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function LowTable() {
  return (
    <group>
      <RoundedBox args={[1.55, 0.05, 0.9]} radius={0.018} smoothness={4} position={[0, 0.5, 0]} castShadow receiveShadow>
        <primitive object={MAT.oak} attach="material" />
      </RoundedBox>
      {[
        [-0.68, -0.36],
        [0.68, -0.36],
        [-0.68, 0.36],
        [0.68, 0.36],
      ].map(([x, z], i) => (
        <Leg key={i} position={[x, 0.25, z]} height={0.5} radius={0.026} material={MAT.oakDark} />
      ))}
      {[-0.92, 0.92].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <RoundedBox args={[0.4, 0.06, 0.4]} radius={0.03} smoothness={3} position={[0, 0.3, 0]} castShadow>
            <primitive object={i === 0 ? MAT.navy : MAT.cushionA} attach="material" />
          </RoundedBox>
          {[-0.15, 0.15].map((lx) =>
            [-0.15, 0.15].map((lz) => (
              <Leg key={`${lx}-${lz}`} position={[lx, 0.15, lz]} height={0.3} radius={0.016} material={MAT.oakDark} />
            ))
          )}
        </group>
      ))}
      <BookStack position={[0.25, 0.53, 0.08]} count={3} rotationY={0.4} />
      <mesh position={[-0.3, 0.535, -0.1]} rotation-y={-0.3}>
        <boxGeometry args={[0.28, 0.02, 0.2]} />
        <meshStandardMaterial color="#e7d7b9" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Cushion({ tone = 0 }: { tone?: number }) {
  const mat = tone === 0 ? MAT.cushionA : tone === 1 ? MAT.cushionB : MAT.cushionC;
  return (
    <RoundedBox args={[0.58, 0.16, 0.58]} radius={0.07} smoothness={4} position={[0, 0.08, 0]} castShadow receiveShadow>
      <primitive object={mat} attach="material" />
    </RoundedBox>
  );
}

function DisplayShelf() {
  const w = 1.9;
  const h = 1.32;
  const d = 0.5;
  return (
    <group>
      {[-w / 2, w / 2].map((x, i) => (
        <RoundedBox key={i} args={[0.055, h, d]} radius={0.01} smoothness={2} position={[x, h / 2, 0]} castShadow>
          <primitive object={MAT.oak} attach="material" />
        </RoundedBox>
      ))}
      {[0.07, h - 0.03].map((y, i) => (
        <RoundedBox key={i} args={[w + 0.08, 0.06, d + 0.04]} radius={0.01} smoothness={2} position={[0, y, 0]} castShadow>
          <primitive object={MAT.oakDark} attach="material" />
        </RoundedBox>
      ))}
      <mesh position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w, h, 0.03]} />
        <primitive object={MAT.white} attach="material" />
      </mesh>
      {[0.36, 0.68, 1.0].map((y, r) => (
        <group key={r}>
          <mesh position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, 0.03, d]} />
            <primitive object={MAT.board} attach="material" />
          </mesh>
          {Array.from({ length: 11 }, (_, i) => (
            <mesh
              key={i}
              position={[-w / 2 + 0.12 + i * 0.15, y + 0.13, 0.02]}
              castShadow
            >
              <boxGeometry args={[0.075 + (i % 3) * 0.012, 0.2 + (i % 4) * 0.02, 0.16]} />
              <meshStandardMaterial color={BOOK_COLORS[(i + r) % BOOK_COLORS.length]} roughness={0.82} />
            </mesh>
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <mesh
              key={`f${i}`}
              position={[-w / 2 + 0.18 + i * 0.34, y + 0.02, 0.18]}
              rotation-x={-0.35}
              castShadow
            >
              <boxGeometry args={[0.28, 0.015, 0.2]} />
              <meshStandardMaterial color={i % 2 ? '#e7dcc4' : '#d9cdb4'} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      <BookStack position={[0.55, h + 0.02, 0]} count={4} rotationY={0.2} />
    </group>
  );
}

function Sofa() {
  return (
    <group>
      <RoundedBox args={[1.8, 0.34, 0.78]} radius={0.06} smoothness={4} position={[0, 0.24, 0]} castShadow receiveShadow>
        <primitive object={MAT.navy} attach="material" />
      </RoundedBox>
      <RoundedBox args={[1.78, 0.52, 0.2]} radius={0.07} smoothness={4} position={[0, 0.6, -0.31]} rotation-x={-0.06} castShadow>
        <primitive object={MAT.navy} attach="material" />
      </RoundedBox>
      {[-0.44, 0.44].map((x, i) => (
        <RoundedBox key={i} args={[0.8, 0.14, 0.66]} radius={0.05} smoothness={4} position={[x, 0.43, 0.02]} castShadow>
          <primitive object={MAT.navy} attach="material" />
        </RoundedBox>
      ))}
      {[-0.86, 0.86].map((x, i) => (
        <RoundedBox key={i} args={[0.16, 0.42, 0.78]} radius={0.05} smoothness={4} position={[x, 0.38, 0]} castShadow>
          <primitive object={MAT.navy} attach="material" />
        </RoundedBox>
      ))}
      {[-0.7, 0.7].map((x) =>
        [-0.28, 0.28].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.06, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.025, 0.12, 8]} />
            <primitive object={MAT.oakDark} attach="material" />
          </mesh>
        ))
      )}
      <BookStack position={[0.5, 0.5, 0.05]} count={2} rotationY={0.3} />
    </group>
  );
}

function MagazineRack() {
  return (
    <group>
      <RoundedBox args={[0.9, 0.05, 0.42]} radius={0.01} smoothness={2} position={[0, 0.42, 0]} castShadow>
        <primitive object={MAT.oak} attach="material" />
      </RoundedBox>
      <mesh position={[0, 0.72, -0.18]} castShadow>
        <boxGeometry args={[0.9, 0.6, 0.04]} />
        <primitive object={MAT.oakDark} attach="material" />
      </mesh>
      {[0.5, 0.68, 0.86].map((y, r) => (
        <group key={r}>
          <mesh position={[0, y, 0]} rotation-x={0.35} castShadow>
            <boxGeometry args={[0.88, 0.03, 0.3]} />
            <primitive object={MAT.oak} attach="material" />
          </mesh>
          {Array.from({ length: 4 }, (_, i) => (
            <mesh key={i} position={[-0.32 + i * 0.22, y + 0.1, 0.02]} rotation-x={0.32} castShadow>
              <boxGeometry args={[0.19, 0.27, 0.012]} />
              <meshStandardMaterial color={BOOK_COLORS[(i + r) % BOOK_COLORS.length]} roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}
      {[-0.38, 0.38].map((x) =>
        [-0.15, 0.15].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.21, z]}>
            <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
            <primitive object={MAT.metalDark} attach="material" />
          </mesh>
        ))
      )}
    </group>
  );
}

function Rug() {
  const tex = makeRugTexture();
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.016, 0]} receiveShadow>
      <planeGeometry args={[3.2, 2.4]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

function Plant() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.2, 0.44, 18]} />
        <primitive object={MAT.pot} attach="material" />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 18]} />
        <primitive object={MAT.oakDark} attach="material" />
      </mesh>
      {[
        [0, 0.8, 0, 0.34, MAT.leafA],
        [0.18, 1.0, 0.06, 0.24, MAT.leafB],
        [-0.16, 1.03, -0.05, 0.22, MAT.leafC],
        [0.05, 1.18, -0.12, 0.2, MAT.leafB],
        [-0.1, 0.9, 0.16, 0.2, MAT.leafC],
      ].map(([x, y, z, r, mat], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <icosahedronGeometry args={[r as number, 1]} />
          <primitive object={mat as THREE.Material} attach="material" />
        </mesh>
      ))}
      {[
        [0.1, 0.65],
        [-0.1, 0.7],
        [0, 0.75],
      ].map(([x, y], i) => (
        <mesh key={`s${i}`} position={[x, y, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
          <primitive object={MAT.leafC} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function DisplayTable() {
  const sign = makeShelfLabel('신간 도서', 'NEW ARRIVALS', '#b8d98a');
  return (
    <group>
      <RoundedBox args={[2.0, 0.05, 0.9]} radius={0.018} smoothness={4} position={[0, 0.75, 0]} castShadow receiveShadow>
        <primitive object={MAT.oak} attach="material" />
      </RoundedBox>
      {[
        [-0.88, -0.32],
        [0.88, -0.32],
        [-0.88, 0.32],
        [0.88, 0.32],
      ].map(([x, z], i) => (
        <Leg key={i} position={[x, 0.375, z]} height={0.75} radius={0.03} material={MAT.metalDark} />
      ))}
      <BookStack position={[-0.62, 0.78, 0.16]} count={6} rotationY={0.1} />
      <BookStack position={[-0.18, 0.78, -0.2]} count={4} rotationY={-0.18} />
      <mesh position={[0.18, 0.777, 0.12]} rotation-x={-Math.PI / 2} rotation-z={0.1}>
        <boxGeometry args={[0.34, 0.02, 0.24]} />
        <meshStandardMaterial color="#c9a24a" roughness={0.8} />
      </mesh>
      <mesh position={[0.36, 0.777, 0.16]} rotation-x={-Math.PI / 2} rotation-z={-0.06}>
        <boxGeometry args={[0.32, 0.02, 0.23]} />
        <meshStandardMaterial color="#5f8a5a" roughness={0.8} />
      </mesh>
      <group position={[0.68, 0.95, -0.12]} rotation-x={-0.25} rotation-y={-0.15}>
        <mesh>
          <planeGeometry args={[0.5, 0.32]} />
          <meshStandardMaterial map={sign} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function Furniture({ anchors }: { anchors: FurnitureAnchor[] }) {
  return (
    <group>
      {anchors.map((anchor, i) => (
        <group key={i} position={anchor.pos} rotation-y={anchor.rotationY}>
          {anchor.kind === 'reading-table' && <ReadingTable laptop={i % 4 === 1} tone={i % 2 === 0 ? 'navy' : 'black'} />}
          {anchor.kind === 'pc-partition' && <PcPartition />}
          {anchor.kind === 'desk' && <Desk />}
          {anchor.kind === 'book-cart' && <BookCart />}
          {anchor.kind === 'low-table' && <LowTable />}
          {anchor.kind === 'display-shelf' && <DisplayShelf />}
          {anchor.kind === 'display-table' && <DisplayTable />}
          {anchor.kind === 'sofa' && <Sofa />}
          {anchor.kind === 'magazine-rack' && <MagazineRack />}
          {anchor.kind === 'rug' && <Rug />}
          {anchor.kind === 'cushion' && <Cushion tone={i % 3} />}
          {anchor.kind === 'plant' && <Plant />}
        </group>
      ))}
    </group>
  );
}
