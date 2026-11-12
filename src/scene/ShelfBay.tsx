import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Bay, BayBook, BookHit } from '../types';
import { makeShelfLabel, makeSpineTexture, makeWoodTexture } from './textures';
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

const SHELF_DEPTH = 0.34;
const BOOK_DEPTH = 0.22;

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

let woodTexture: THREE.CanvasTexture | null = null;
function getWood() {
  if (!woodTexture) {
    woodTexture = makeWoodTexture('#b98a58', 96);
    woodTexture.repeat.set(0.6, 1.4);
  }
  return woodTexture;
}

let spineTexture: THREE.CanvasTexture | null = null;
function getSpineTexture() {
  if (!spineTexture) spineTexture = makeSpineTexture();
  return spineTexture;
}

interface Props {
  bay: Bay;
}

export function ShelfBay({ bay }: Props) {
  const spineRef = useRef<THREE.InstancedMesh>(null);
  const pageRef = useRef<THREE.InstancedMesh>(null);
  const bandRef = useRef<THREE.InstancedMesh>(null);
  const select = useLibrary((s) => s.select);
  const hover = useLibrary((s) => s.hover);

  const { rows, cols, width, height, books } = bay;
  const count = rows * cols;

  const rowGap = (height - 0.28) / rows;
  const slot = (width - 0.16) / cols;

  const labelTex = useMemo(
    () => makeShelfLabel(bay.label, bay.kdcRange, bay.color),
    [bay.label, bay.kdcRange, bay.color]
  );
  useEffect(() => () => labelTex.dispose(), [labelTex]);

  useLayoutEffect(() => {
    const spine = spineRef.current;
    const page = pageRef.current;
    const band = bandRef.current;
    if (!spine) return;
    const dummy = new THREE.Object3D();
    const pageDummy = new THREE.Object3D();
    const bandDummy = new THREE.Object3D();

    books.forEach((book, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const rowCount = Math.min(cols, books.length - row * cols);
      const rowWidth = rowCount * slot;
      const seed = ([...book.t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 11) + index * 17) % 1000;
      const h = bookHeight(book, index, rowGap * 0.74);
      const thickness = slot * (0.58 + (seed % 100) * 0.0034);
      const x = -rowWidth / 2 + slot * (col + 0.5);
      const y = 0.13 + rowGap * row + h / 2;
      const z = 0.02 + (seed % 7) * 0.002;

      dummy.position.set(x, y, z);
      dummy.rotation.y = 0;
      dummy.scale.set(thickness, h, BOOK_DEPTH * (0.96 + (seed % 5) * 0.015));
      dummy.updateMatrix();
      spine.setMatrixAt(index, dummy.matrix);
      spine.setColorAt(index, spineColor(book, index));

      pageDummy.position.set(x, y + 0.002, z - 0.008);
      pageDummy.rotation.y = 0;
      pageDummy.scale.set(thickness * 0.84, h * 0.94, BOOK_DEPTH * 0.9);
      pageDummy.updateMatrix();
      page!.setMatrixAt(index, pageDummy.matrix);

      bandDummy.position.set(x, y + h * 0.24, BOOK_DEPTH / 2 + 0.012);
      bandDummy.rotation.y = 0;
      bandDummy.scale.set(thickness * 0.7, 0.018, 0.007);
      bandDummy.updateMatrix();
      band!.setMatrixAt(index, bandDummy.matrix);
    });

    for (let i = books.length; i < count; i++) {
      dummy.position.set(0, -20, 0);
      dummy.scale.set(0.001, 0.001, 0.001);
      dummy.updateMatrix();
      spine.setMatrixAt(i, dummy.matrix);
      page?.setMatrixAt(i, dummy.matrix);
      band?.setMatrixAt(i, dummy.matrix);
    }

    spine.instanceMatrix.needsUpdate = true;
    if (spine.instanceColor) spine.instanceColor.needsUpdate = true;
    for (const mesh of [page, band]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
    }
    spine.computeBoundingSphere();
    page?.computeBoundingSphere();
    band?.computeBoundingSphere();
  }, [books, cols, count, rowGap, slot]);

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.instanceId === undefined) return;
    const book = books[event.instanceId];
    if (!book) return;
    hover({ book, bay, index: event.instanceId } as BookHit, event.clientX, event.clientY);
  };

  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getWood(), bumpMap: getWood(), bumpScale: 0.012, color: '#e0bf94', roughness: 0.55, metalness: 0.02 }),
    []
  );
  const boardMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getWood(), bumpMap: getWood(), bumpScale: 0.01, color: '#eed6b2', roughness: 0.6 }),
    []
  );
  const backMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#efe9dd', roughness: 0.86 }),
    []
  );
  const spineGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const spineMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getSpineTexture(), roughness: 0.66, metalness: 0.02 }),
    []
  );
  const pageMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f3ecdd', roughness: 0.92 }),
    []
  );
  const bandMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f8f4e9', roughness: 0.85 }),
    []
  );

  useEffect(
    () => () => {
      spineGeometry.dispose();
      spineMaterial.dispose();
      pageMaterial.dispose();
      bandMaterial.dispose();
      frameMat.dispose();
      boardMat.dispose();
      backMat.dispose();
    },
    [spineGeometry, spineMaterial, pageMaterial, bandMaterial, frameMat, boardMat, backMat]
  );

  return (
    <group position={bay.position} rotation-y={bay.rotationY}>
      {/* 옆판 */}
      <RoundedBox
        args={[0.06, height, SHELF_DEPTH + 0.06]}
        radius={0.012}
        smoothness={2}
        position={[-width / 2, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={frameMat} attach="material" />
      </RoundedBox>
      <RoundedBox
        args={[0.06, height, SHELF_DEPTH + 0.06]}
        radius={0.012}
        smoothness={2}
        position={[width / 2, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={frameMat} attach="material" />
      </RoundedBox>
      {/* 뒷판 */}
      <mesh position={[0, height / 2, -SHELF_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[width, height, 0.03]} />
        <primitive object={backMat} attach="material" />
      </mesh>
      {/* 상판 · 하판 */}
      <RoundedBox
        args={[width + 0.12, 0.07, SHELF_DEPTH + 0.08]}
        radius={0.012}
        smoothness={2}
        position={[0, height - 0.035, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={frameMat} attach="material" />
      </RoundedBox>
      <RoundedBox
        args={[width + 0.12, 0.14, SHELF_DEPTH + 0.08]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.07, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={frameMat} attach="material" />
      </RoundedBox>

      {/* 선반 */}
      {Array.from({ length: rows }, (_, r) => (
        <mesh key={r} position={[0, 0.14 + rowGap * r, 0]} receiveShadow castShadow>
          <boxGeometry args={[width, 0.03, SHELF_DEPTH]} />
          <primitive object={boardMat} attach="material" />
        </mesh>
      ))}

      {/* 책 (표지·페이지·라벨 3중 인스턴싱) */}
      <instancedMesh
        ref={spineRef}
        args={[spineGeometry, spineMaterial, count]}
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
      <instancedMesh ref={pageRef} args={[spineGeometry, pageMaterial, count]} frustumCulled={false} raycast={() => null} />
      <instancedMesh ref={bandRef} args={[spineGeometry, bandMaterial, count]} frustumCulled={false} raycast={() => null} />

      {/* 분류 표찰 */}
      <mesh position={[0, height - 0.19, SHELF_DEPTH / 2 + 0.045]}>
        <planeGeometry args={[Math.min(width * 0.9, 0.92), 0.24]} />
        <meshStandardMaterial map={labelTex} roughness={0.8} />
      </mesh>
      <mesh position={[0, height - 0.19, SHELF_DEPTH / 2 + 0.04]}>
        <boxGeometry args={[Math.min(width * 0.9, 0.92) + 0.03, 0.27, 0.012]} />
        <meshStandardMaterial color="#b9b2a6" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
}
