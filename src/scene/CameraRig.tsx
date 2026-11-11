import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLibrary } from '../store';

type OrbitControlsLike = {
  target: THREE.Vector3;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  update: () => void;
  maxPolarAngle: number;
  minDistance: number;
  maxDistance: number;
  enablePan: boolean;
  dampingFactor: number;
};

const DURATION = 1.15;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** 구역 전환 / 서가 포커스 시 카메라를 부드럽게 이동 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsLike | null;
  const view = useLibrary((s) => s.view);

  const fromPos = useRef(new THREE.Vector3());
  const fromTarget = useRef(new THREE.Vector3());
  const progress = useRef(1);

  useEffect(() => {
    if (!controls) return;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.minDistance = 0.9;
    controls.maxDistance = 34;
    controls.enablePan = false;
    controls.dampingFactor = 0.08;
  }, [controls]);

  useEffect(() => {
    fromPos.current.copy(camera.position);
    fromTarget.current.copy(controls?.target ?? new THREE.Vector3(0, 1.2, 0));
    progress.current = 0;
  }, [view.nonce, camera, controls]);

  useEffect(() => {
    const onStart = () => {
      progress.current = 1;
    };
    controls?.addEventListener('start', onStart);
    return () => controls?.removeEventListener('start', onStart);
  }, [controls]);

  useFrame((_, delta) => {
    if (progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + delta / DURATION);
    const t = ease(progress.current);
    const toPos = new THREE.Vector3(...view.pos);
    const toTarget = new THREE.Vector3(...view.target);

    camera.position.lerpVectors(fromPos.current, toPos, t);
    if (controls) {
      controls.target.lerpVectors(fromTarget.current, toTarget, t);
      controls.update();
    }
  });

  return null;
}
