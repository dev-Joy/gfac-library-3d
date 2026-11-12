import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLibrary } from '../store';
import type { BoxCollider, ZoneId } from '../types';
import { WALLS, GLASS, furnitureColliders } from '../data/floorplan';
import { ZONE_INFO } from '../data/sections';
import { dragState, lookState, registerLookTarget, setLookLocked, touchInput } from './input';

const EYE = 1.55;
const RADIUS = 0.3;
const SPEED = 2.6;

function circleHitsBox(x: number, z: number, c: BoxCollider) {
  const dx = Math.max(Math.abs(x - c.x) - c.w / 2, 0);
  const dz = Math.max(Math.abs(z - c.z) - c.d / 2, 0);
  return dx * dx + dz * dz < RADIUS * RADIUS;
}

function zoneAt(x: number, z: number): ZoneId {
  if (x >= 12.6 && x <= 16.8 && z >= 2.6 && z <= 6.9) return 'media';
  if (x >= 8) return 'children-c';
  if (x >= -4) return 'children';
  return 'general';
}

export function Player() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const layouts = useLibrary((s) => s.layouts);
  const walkEpoch = useLibrary((s) => s.walkEpoch);

  const keys = useRef(new Set<string>());
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const persist = useRef(0);
  const bob = useRef(0);

  const colliders = useMemo<BoxCollider[]>(() => {
    const bays: BoxCollider[] = [];
    if (layouts) {
      for (const zone of Object.values(layouts)) {
        for (const bay of zone.bays) {
          const swapped = Math.abs(Math.sin(bay.rotationY)) > 0.5;
          bays.push({
            x: bay.position[0],
            z: bay.position[2],
            w: swapped ? 0.55 : bay.width,
            d: swapped ? bay.width : 0.55,
          });
        }
      }
    }
    return [...WALLS, ...GLASS, ...furnitureColliders(), ...bays];
  }, [layouts]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      keys.current.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // 시선: 포인터 락(1순위) → 드래그(폴백)
  useEffect(() => {
    const el = gl.domElement;
    registerLookTarget(el);

    const onLockChange = () => setLookLocked(document.pointerLockElement === el);
    const onLockError = () => setLookLocked(false);

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (lookState.locked) return;
      dragging.current = true;
      dragState.moved = false;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      const locked = lookState.locked && document.pointerLockElement === el;
      if (locked) {
        const { yaw, pitch } = useLibrary.getState().walk;
        useLibrary.getState().setWalk({
          yaw: yaw - e.movementX * 0.0026,
          pitch: THREE.MathUtils.clamp(pitch - e.movementY * 0.0022, -1.15, 1.15),
        });
        dragState.moved = false;
        return;
      }
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragState.moved = true;
      last.current = { x: e.clientX, y: e.clientY };
      const state = useLibrary.getState().walk;
      useLibrary.getState().setWalk({
        yaw: state.yaw - dx * 0.0032,
        pitch: THREE.MathUtils.clamp(state.pitch - dy * 0.0028, -1.15, 1.15),
      });
    };
    const onUp = () => {
      dragging.current = false;
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', onLockError);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
      registerLookTarget(null);
      setLookLocked(false);
    };
  }, [gl]);

  // 탭·검색으로 스폰이 바뀌면 다음 프레임을 기다리지 않고 즉시 카메라를 옮긴다.
  useEffect(() => {
    const walk = useLibrary.getState().walk;
    camera.position.set(walk.x, EYE, walk.z);
    camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
    camera.updateMatrixWorld();
    bob.current = 0;
    persist.current = 0;
  }, [camera, walkEpoch]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.06);
    const state = useLibrary.getState();
    const walk = state.walk;

    const forward = (keys.current.has('KeyW') || keys.current.has('ArrowUp') ? 1 : 0) -
      (keys.current.has('KeyS') || keys.current.has('ArrowDown') ? 1 : 0) + touchInput.y;
    const strafe = (keys.current.has('KeyD') || keys.current.has('ArrowRight') ? 1 : 0) -
      (keys.current.has('KeyA') || keys.current.has('ArrowLeft') ? 1 : 0) + touchInput.x;

    let { x, z } = walk;
    const len = Math.hypot(forward, strafe);

    if (len > 0.01) {
      const f = forward / Math.max(1, len);
      const s = strafe / Math.max(1, len);
      const sin = Math.sin(walk.yaw);
      const cos = Math.cos(walk.yaw);
      const dx = (-sin * f + cos * s) * SPEED * dt;
      const dz = (-cos * f - sin * s) * SPEED * dt;

      const nx = x + dx;
      if (!colliders.some((c) => circleHitsBox(nx, z, c))) x = nx;
      const nz = z + dz;
      if (!colliders.some((c) => circleHitsBox(x, nz, c))) z = nz;

      bob.current += dt * 7;
    } else {
      bob.current += dt * 2;
    }

    camera.position.set(x, EYE + Math.sin(bob.current) * 0.012, z);
    camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');

    // 저장은 0.12초 간격으로만 (렌더 부하 방지)
    persist.current += dt;
    if (persist.current > 0.12) {
      persist.current = 0;
      if (Math.abs(x - walk.x) > 0.0001 || Math.abs(z - walk.z) > 0.0001) state.setWalk({ x, z });
      state.syncZone(zoneAt(x, z));
    }
  });

  // ── 개발용 디버그 브리지 (브라우저 자동 검증) ──
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.__walkPose = () => ({
      x: camera.position.x,
      z: camera.position.z,
      yaw: camera.rotation.y,
      pitch: camera.rotation.x,
    });
    w.__teleport = (x: number, z: number, yaw?: number) => {
      const state = useLibrary.getState();
      state.setWalk({
        x,
        z,
        ...(typeof yaw === 'number' ? { yaw, pitch: 0 } : {}),
      });
      const walk = useLibrary.getState().walk;
      camera.position.set(walk.x, EYE, walk.z);
      camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
      camera.updateMatrixWorld();
      bob.current = 0;
      state.syncZone(zoneAt(walk.x, walk.z));
      return { x: walk.x, z: walk.z, yaw: walk.yaw };
    };
    return () => {
      delete w.__walkPose;
      delete w.__teleport;
    };
  }, [camera]);

  return null;
}

export const ZONE_SPAWNS = ZONE_INFO;
