import type { BoxCollider, FurnitureAnchor, ZoneId } from '../types';
import { ROOM_BOUNDS } from './sections.ts';

const T = 0.18; // 벽 두께

/** 외벽 */
export const WALLS: BoxCollider[] = [
  { x: 0, z: ROOM_BOUNDS.minZ, w: ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX + T, d: T },
  { x: 0, z: ROOM_BOUNDS.maxZ, w: ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX + T, d: T },
  { x: ROOM_BOUNDS.minX, z: 0, w: T, d: 20 },
  { x: ROOM_BOUNDS.maxX, z: 0, w: T, d: 20 },
  // 종합 ↔ 어린이 칸막이 (출입구 z −0.8…2.4)
  { x: -4, z: -5.4, w: T, d: 9.2 },
  { x: -4, z: 6.2, w: T, d: 7.6 },
  // 어린이 ↔ 별치 C 칸막이 (출입구 z 0.2…3.0)
  { x: 8, z: -5.0, w: T, d: 10.0 },
  { x: 8, z: 6.5, w: T, d: 7.0 },
];

/** 유리벽(미디어실·디지털정보실) — 충돌은 있지만 투명 */
export const GLASS: BoxCollider[] = [
  // 미디어실 외피 (북쪽 출입구 x 5.1…6.3)
  { x: 4.1, z: 4.2, w: 1.8, d: 0.06 },
  { x: 7.05, z: 4.2, w: 1.5, d: 0.06 },
  { x: 3.2, z: 6.7, w: 0.06, d: 5.0 },
  { x: 7.8, z: 6.7, w: 0.06, d: 5.0 },
  // 디지털정보실 유리벽
  { x: 5.4, z: -7.4, w: 0.06, d: 3.6 },
  { x: 6.7, z: -5.6, w: 2.6, d: 0.06 },
];

export const FURNITURE: FurnitureAnchor[] = [
  // 종합자료실 — 열람 테이블·PC 파티션·데스크·북카트
  { kind: 'reading-table', pos: [-12.6, 0, -5.4], rotationY: 0, zone: 'general' },
  { kind: 'reading-table', pos: [-7.6, 0, -5.4], rotationY: 0, zone: 'general' },
  { kind: 'reading-table', pos: [-12.8, 0, 3.8], rotationY: 0, zone: 'general' },
  { kind: 'pc-partition', pos: [-9.0, 0, 6.4], rotationY: 0, zone: 'general' },
  { kind: 'pc-partition', pos: [-5.6, 0, 6.4], rotationY: 0, zone: 'general' },
  { kind: 'desk', pos: [-4.9, 0, -0.6], rotationY: Math.PI / 2, zone: 'general' },
  { kind: 'book-cart', pos: [-14.2, 0, -6.6], rotationY: Math.PI / 2, zone: 'general' },
  { kind: 'book-cart', pos: [-5.6, 0, 8.2], rotationY: 0, zone: 'general' },
  { kind: 'plant', pos: [-16.3, 0, -2.6], rotationY: 0, zone: 'general' },
  { kind: 'plant', pos: [-4.7, 0, 9.2], rotationY: 0, zone: 'general' },

  // 어린이자료실
  { kind: 'low-table', pos: [1.6, 0, 5.2], rotationY: 0, zone: 'children' },
  { kind: 'book-cart', pos: [-2.5, 0, 3.8], rotationY: Math.PI / 2, zone: 'children' },
  { kind: 'book-cart', pos: [2.4, 0, -6.2], rotationY: 0, zone: 'children' },
  { kind: 'plant', pos: [7.4, 0, 1.6], rotationY: 0, zone: 'children' },

  // 별치 C
  { kind: 'reading-table', pos: [12.6, 0, 3.6], rotationY: 0, zone: 'children-c' },
  { kind: 'low-table', pos: [10.2, 0, 5.6], rotationY: 0, zone: 'children-c' },
  { kind: 'book-cart', pos: [9.4, 0, 7.2], rotationY: 0, zone: 'children-c' },
  { kind: 'plant', pos: [16.2, 0, 8.6], rotationY: 0, zone: 'children-c' },
];

export const FURNITURE_SIZE: Record<FurnitureAnchor['kind'], { w: number; d: number }> = {
  'reading-table': { w: 2.5, d: 1.1 },
  'pc-partition': { w: 1.7, d: 1.3 },
  desk: { w: 3.0, d: 0.85 },
  'book-cart': { w: 0.95, d: 0.55 },
  'low-table': { w: 1.7, d: 1.0 },
  plant: { w: 0.55, d: 0.55 },
  sign: { w: 0.1, d: 0.1 },
  cushion: { w: 0.6, d: 0.6 },
};

/** 가구 회전을 반영한 충돌 박스 (씬 고정 구조물 포함) */
export const furnitureColliders = (): BoxCollider[] => [
  ...FURNITURE.filter((f) => f.kind !== 'sign' && f.kind !== 'cushion').map((f) => {
    const size = FURNITURE_SIZE[f.kind];
    const swapped = Math.abs(Math.sin(f.rotationY)) > 0.5;
    return {
      x: f.pos[0],
      z: f.pos[2],
      w: swapped ? size.d : size.w,
      d: swapped ? size.w : size.d,
    };
  }),
  // 미디어실 소파 (Room.tsx MediaRoom)
  { x: 5.5, z: 8.9, w: 2.4, d: 0.8 },
];

export const ZONE_LABELS: { zone: ZoneId; text: string; sub: string; pos: [number, number, number] }[] = [
  { zone: 'general', text: '종합자료실', sub: 'GENERAL', pos: [-10.5, 2.55, 2.0] },
  { zone: 'children', text: '어린이자료실', sub: 'CHILDREN', pos: [1.2, 2.55, 3.0] },
  { zone: 'children-c', text: '별치 C', sub: 'C COLLECTION', pos: [12.4, 2.55, -2.0] },
];
