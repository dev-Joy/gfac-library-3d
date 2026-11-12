import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Bay, BayBook, BookHit } from '../types';
import { makeShelfLabel } from './textures';
import { useLibrary } from '../store';
import { dragState } from './input';

const KDC_COLORS: Record<string, string[]> = {
  '000': ['#c9c4b8', '#a89f92', '#ddd6c8', '#b8ada0'],
  '100': ['#5b7ba6', '#7893b8', '#43618a', '#8ea8c9'],
  '200': ['#8f74a3', '#a68cb8', '#755c88', '#b9a3c9'],
  '300': ['#d99a63', '#e8b17e', '#bf7f4c', '#f0c497'],
  '400': ['#5c9990', '#77b0a7', '#47817a', '#8fc4bb'],
  '500': ['#6f9a5f', '#88b077', '#5a814b', '#9dc48c'],
  '600': ['#bf6570', '#d0808a', '#a34e58', '#dd9aa2'],
  '700': ['#d3b05a', '#e2c377', '#b89544', '#edd08c'],
  '800': ['#a85f5f', '#bf7775', '#8c4b4b', '#d0908d'],
  '900': ['#8f7458', '#a68a6c', '#765f47', '#b8a084'],
};

const BOOK_DEPTH = 0.19;

function spineColor(book: BayBook, i: number): THREE.Color {
  const hundred = Number.isFinite(Number.parseFloat(book.k))
    ? String(Math.floor(Number.parseFloat(book.k) / 100) * 100).padStart(3, '0')
    : '000';
  const palette = KDC_COLORS[hundred] ?? KDC_COLORS['000'];
  const hash = [...book.i].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7) + i;
  return new THREE.Color(palette[hash % palette.length]);
}

function bookHeight(book: BayBook, i: number, max: number) {
  const hash = ([...book.t].reduce((h, c) => (h * 17 + c.charCodeAt(0)) % 1009, 3) + i * 7) % 100;
  return max * (0.74 + (hash / 100) * 0.26);
}

interface Props {
  bay: Bay;
}

export function ShelfBay({ bay }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const select = useLibrary((s) => s.select);
  const hover = useLibrary((s) => s.hover);

  const { rows, cols, width, height, books } = bay;
  const count = rows * cols;

  const rowGap = (height - 0.26) / rows;
  const slot = (width - 0.14) / cols;
  const depth = BOOK_DEPTH;

  const labelTex = useMemo(
    () => makeShelfLabel(bay.label, bay.kdcRange, bay.color),
    [bay.label, bay.kdcRange, bay.color]
  );
  useEffect(() => () => labelTex.dispose(), [labelTex]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();

    books.forEach((book, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const rowCount = Math.min(cols, books.length - row * cols);
      const rowWidth = rowCount * slot;
      const seed = ([...book.t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 11) + index * 17) % 1000;
      const h = bookHeight(book, index, rowGap * 0.74);
      const thickness = slot * (0.58 + (seed % 100) * 0.0034);
      dummy.position.set(-rowWidth / 2 + slot * (col + 0.5), 0.12 + rowGap * row + h / 2, 0.02 + (seed % 7) * 0.002);
      dummy.rotation.y = 0;
      dummy.scale.set(thickness, h, depth * (0.94 + (seed % 5) * 0.02));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, spineColor(book, index));
    });

    for (let i = books.length; i < count; i++) {
      dummy.position.set(0, -10, 0);
      dummy.scale.set(0.001, 0.001, 0.001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [books, cols, count, depth, rowGap, slot]);

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.instanceId === undefined) return;
    const book = books[event.instanceId];
    if (!book) return;
    hover({ book, bay, index: event.instanceId } as BookHit, event.clientX, event.clientY);
  };

  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#cfae7f', roughness: 0.68, metalness: 0.02 }),
    []
  );
  const boardMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#dcbf93', roughness: 0.72 }),
    []
  );
  const backMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#efe8da', roughness: 0.9 }),
    []
  );
  const bookGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bookMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.76, metalness: 0.02 }),
    []
  );

  useEffect(
    () => () => {
      bookGeometry.dispose();
      bookMaterial.dispose();
      frameMat.dispose();
      boardMat.dispose();
      backMat.dispose();
    },
    [bookGeometry, bookMaterial, frameMat, boardMat, backMat]
  );

  return (
    <group position={bay.position} rotation-y={bay.rotationY}>
      {/* 옆판 */}
      <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, height, depth + 0.07]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.05, height, depth + 0.07]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* 뒷판 */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, height, 0.03]} />
        <primitive object={backMat} attach="material" />
      </mesh>
      {/* 상판 · 하판 */}
      <mesh position={[0, height - 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.1, 0.06, depth + 0.07]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.1, 0.12, depth + 0.07]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* 선반 */}
      {Array.from({ length: rows }, (_, r) => (
        <mesh key={r} position={[0, 0.12 + rowGap * r, 0]} receiveShadow castShadow>
          <boxGeometry args={[width, 0.022, depth]} />
          <primitive object={boardMat} attach="material" />
        </mesh>
      ))}

      {/* 책 */}
      <instancedMesh
        ref={meshRef}
        args={[bookGeometry, bookMaterial, count]}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation();
          if (dragState.moved) return;
          if (e.instanceId === undefined) return;
          const book = books[e.instanceId];
          if (!book) return;
          select({ book, bay, index: e.instanceId });
        }}
        onPointerMove={handleMove}
        onPointerOut={() => hover(null)}
      />

      {/* 분류 표찰 */}
      <mesh position={[0, height - 0.16, depth / 2 + 0.04]}>
        <planeGeometry args={[Math.min(width * 0.92, 0.95), 0.28]} />
        <meshBasicMaterial map={labelTex} toneMapped={false} />
      </mesh>
    </group>
  );
}
