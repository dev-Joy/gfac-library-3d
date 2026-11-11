import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Bay, BayBook, BookHit } from '../types';
import { makeLabelTexture } from './textures';
import { useLibrary } from '../store';

const KDC_COLORS: Record<string, string[]> = {
  '000': ['#9a948a', '#7b746b', '#b0a89b', '#8a8175'],
  '100': ['#3b506b', '#4a6280', '#2e4055', '#556f8c'],
  '200': ['#6a5578', '#7c658c', '#57466a', '#8b739b'],
  '300': ['#a87045', '#b98356', '#8f5c37', '#c2926a'],
  '400': ['#3f7268', '#4f857a', '#35615a', '#5f978b'],
  '500': ['#4a7040', '#5c8550', '#3c5c34', '#6d9a5f'],
  '600': ['#8a3b46', '#9c4c57', '#772f38', '#ae626b'],
  '700': ['#a8893f', '#b99b52', '#8f7430', '#c7ab68'],
  '800': ['#7e3232', '#92413f', '#6a2828', '#a35552'],
  '900': ['#63503c', '#75604a', '#52402f', '#87705a'],
};

const BOOK_DEPTH = 0.19;

function spineColor(book: BayBook, i: number): THREE.Color {
  const hundred = Number.isFinite(Number.parseFloat(book.k))
    ? String(Math.floor(Number.parseFloat(book.k) / 100) * 100).padStart(3, '0')
    : '000';
  const palette = KDC_COLORS[hundred] ?? KDC_COLORS['000'];
  const hash = [...book.i].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7) + i;
  const color = new THREE.Color(palette[hash % palette.length]);
  // 채도를 살짝 낮추고 명도를 흔들어 실물 서가 느낌을 준다
  color.lerp(new THREE.Color('#8d8274'), 0.18);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, hsl.s, Math.min(0.56, Math.max(0.2, hsl.l + ((hash % 13) - 6) * 0.008)));
  return color;
}

function bookHeight(book: BayBook, i: number, max: number) {
  const hash = ([...book.t].reduce((h, c) => (h * 17 + c.charCodeAt(0)) % 1009, 3) + i * 7) % 100;
  return max * (0.72 + (hash / 100) * 0.28);
}

interface Props {
  bay: Bay;
  zOffset?: number;
}

export function ShelfBay({ bay, zOffset = 0 }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const select = useLibrary((s) => s.select);
  const hover = useLibrary((s) => s.hover);

  const { rows, cols, width, height, books } = bay;
  const count = rows * cols;

  const rowGap = (height - 0.22) / rows;
  const slot = (width - 0.16) / cols;
  const depth = BOOK_DEPTH;

  const labelTex = useMemo(() => {
    const [num, ...rest] = bay.label.split(' ');
    return makeLabelTexture(num ?? bay.label, rest.join(' ') || `${books.length}권`);
  }, [bay.label, books.length]);

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
      const h = bookHeight(book, index, rowGap * 0.78);
      const thickness = slot * (0.56 + (seed % 100) * 0.0036);
      dummy.position.set(-rowWidth / 2 + slot * (col + 0.5), 0.1 + rowGap * row + h / 2, 0.02 + (seed % 7) * 0.002);
      dummy.rotation.y = 0;
      dummy.scale.set(thickness, h, depth * (0.94 + (seed % 5) * 0.02));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, spineColor(book, index));
    });

    // 남는 인스턴스는 화면에서 제거
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

  const handleOut = () => hover(null);

  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4a3527', roughness: 0.82, metalness: 0.05 }),
    []
  );
  const boardMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5b4230', roughness: 0.86 }),
    []
  );
  const bookGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bookMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.02 }),
    []
  );

  useEffect(
    () => () => {
      bookGeometry.dispose();
      bookMaterial.dispose();
      frameMat.dispose();
      boardMat.dispose();
    },
    [bookGeometry, bookMaterial, frameMat, boardMat]
  );

  return (
    <group position={[bay.position[0], bay.position[1], bay.position[2] - zOffset]} rotation-y={bay.rotationY}>
      {/* 옆판 */}
      <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.045, height, depth + 0.06]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.045, height, depth + 0.06]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* 뒷판 */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, height, 0.03]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      {/* 상판 · 하판 */}
      <mesh position={[0, height - 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.09, 0.06, depth + 0.06]} />
        <primitive object={frameMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.09, 0.1, depth + 0.06]} />
        <primitive object={frameMat} attach="material" />
      </mesh>

      {/* 선반 */}
      {Array.from({ length: rows }, (_, r) => (
        <mesh key={r} position={[0, 0.1 + rowGap * r, 0]} receiveShadow castShadow>
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
          if (e.instanceId === undefined) return;
          const book = books[e.instanceId];
          if (!book) return;
          select({ book, bay, index: e.instanceId });
        }}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
      />

      {/* 분류 표찰 */}
      <mesh position={[0, height - 0.16, depth / 2 + 0.035]}>
        <planeGeometry args={[width * 0.66, width * 0.2]} />
        <meshBasicMaterial map={labelTex} toneMapped={false} />
      </mesh>
    </group>
  );
}
