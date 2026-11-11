import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLibrary } from '../store';

function useCover(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (!alive) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        setTexture(tex);
      },
      undefined,
      () => setTexture(null)
    );
    return () => {
      alive = false;
    };
  }, [url]);

  return texture;
}

export function FocusBook() {
  const selected = useLibrary((s) => s.selected);
  const group = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const cover = useCover(selected?.book.img ?? '');

  useEffect(() => {
    progress.current = 0;
  }, [selected]);

  const bay = selected?.bay;
  const index = selected?.index ?? 0;

  let position: [number, number, number] = [0, -50, 0];
  let rotation = 0.32;

  if (bay) {
    const row = Math.floor(index / bay.cols);
    const col = index % bay.cols;
    const slot = (bay.width - 0.16) / bay.cols;
    const rowCount = Math.min(bay.cols, bay.books.length - row * bay.cols);
    const rowWidth = rowCount * slot;
    const rowGap = (bay.height - 0.22) / bay.rows;
    const lx = -rowWidth / 2 + slot * (col + 0.5);
    const lz = 0.42;
    const rot = bay.rotationY;
    position = [
      bay.position[0] + lx * Math.cos(rot) + lz * Math.sin(rot),
      bay.position[1] + 0.1 + rowGap * row + 0.14,
      bay.position[2] - lx * Math.sin(rot) + lz * Math.cos(rot),
    ];
    rotation = rot + 0.32;
  }

  useFrame((state, delta) => {
    if (!group.current || !bay) return;
    progress.current = Math.min(1, progress.current + delta * 2.6);
    const t = 1 - Math.pow(1 - progress.current, 3);
    const float = Math.sin(state.clock.elapsedTime * 2.2) * 0.012;
    group.current.position.set(position[0], position[1] + float + (1 - t) * -0.05, position[2] + (1 - t) * 0.12);
    group.current.scale.setScalar(0.86 + t * 0.14);
    group.current.rotation.set(0, rotation + Math.sin(state.clock.elapsedTime * 0.6) * 0.03, 0);
  });

  if (!selected) return null;

  return (
    <group ref={group} position={position}>
      {/* 책 두께 */}
      <mesh castShadow>
        <boxGeometry args={[0.19, 0.26, 0.035]} />
        <meshStandardMaterial color="#efe4cf" roughness={0.9} />
      </mesh>
      {/* 앞표지 */}
      <mesh position={[0, 0, 0.0185]}>
        <planeGeometry args={[0.19, 0.26]} />
        {cover ? (
          <meshBasicMaterial map={cover} toneMapped={false} />
        ) : (
          <meshStandardMaterial color="#8c4b3f" roughness={0.8} />
        )}
      </mesh>
      {/* 뒤표지 */}
      <mesh position={[0, 0, -0.0185]} rotation-y={Math.PI}>
        <planeGeometry args={[0.19, 0.26]} />
        <meshStandardMaterial color="#e4d7bf" roughness={0.9} />
      </mesh>
    </group>
  );
}
