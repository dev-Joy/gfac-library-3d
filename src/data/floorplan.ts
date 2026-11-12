import type { BoxCollider, FurnitureAnchor, ZoneId } from '../types';
import { ROOM_BOUNDS } from './sections.ts';

const T = 0.18; // 벽 두께

/** 외벽 · 칸막이 · 기둥 */
export const WALLS: BoxCollider[] = [
  { x: 0, z: ROOM_BOUNDS.minZ, w: ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX + T, d: T },
  // 남벽은 중앙 출입구(x −1.4…1.6)를 비운다.
  { x: -9.2, z: ROOM_BOUNDS.maxZ, w: 15.6, d: T },
  { x: 9.3, z: ROOM_BOUNDS.maxZ, w: 15.4, d: T },
  { x: ROOM_BOUNDS.minX, z: 0, w: T, d: 14 },
  { x: ROOM_BOUNDS.maxX, z: 0, w: T, d: 14 },
  // 종합 ↔ 어린이 칸막이 (출입구 z −1.4…1.4)
  { x: -4, z: -4.2, w: T, d: 5.6 },
  { x: -4, z: 4.2, w: T, d: 5.6 },
  // 어린이 ↔ 별치 C 칸막이 (출입구 z −0.6…1.0)
  { x: 8, z: -3.8, w: T, d: 6.4 },
  { x: 8, z: 4.0, w: T, d: 6.0 },
  // 기둥
  { x: -8.6, z: 0.2, w: 0.36, d: 0.36 },
  { x: 3.0, z: -0.4, w: 0.36, d: 0.36 },
  { x: 10.6, z: 0.6, w: 0.36, d: 0.36 },
];

/** 유리벽(미디어실·디지털정보실) — 충돌은 있지만 투명 */
export const GLASS: BoxCollider[] = [
  // 미디어실 (별치 C 남동쪽) — 북쪽 출입구 x 13.8…15.2
  { x: 13.2, z: 3.2, w: 1.2, d: 0.06 },
  { x: 16.0, z: 3.2, w: 1.6, d: 0.06 },
  { x: 12.6, z: 5.05, w: 0.06, d: 3.7 },
  { x: 16.8, z: 5.05, w: 0.06, d: 3.7 },
  { x: 14.7, z: 6.9, w: 4.2, d: 0.06 },
  // 디지털정보실 (어린이자료실 북동쪽)
  { x: 5.0, z: -5.7, w: 0.06, d: 2.2 },
  { x: 6.3, z: -4.6, w: 1.4, d: 0.06 },
  { x: 7.4, z: -5.7, w: 0.06, d: 2.2 },
];

export const FURNITURE: FurnitureAnchor[] = [
  // 종합자료실 — 열람 테이블·PC 파티션·데스크·북카트·화분
  { kind: 'reading-table', pos: [-12.2, 0, -2.8], rotationY: 0, zone: 'general' },
  { kind: 'reading-table', pos: [-8.4, 0, -1.2], rotationY: 0, zone: 'general' },
  { kind: 'reading-table', pos: [-13.8, 0, 0.2], rotationY: 0, zone: 'general' },
  { kind: 'reading-table', pos: [-7.2, 0, 2.2], rotationY: 0, zone: 'general' },
  { kind: 'pc-partition', pos: [-6.2, 0, -3.0], rotationY: 0, zone: 'general' },
  { kind: 'pc-partition', pos: [-6.2, 0, -0.8], rotationY: 0, zone: 'general' },
  { kind: 'desk', pos: [-5.3, 0, 4.2], rotationY: Math.PI / 2, zone: 'general' },
  { kind: 'book-cart', pos: [-10.0, 0, -2.6], rotationY: Math.PI / 2, zone: 'general' },
  { kind: 'book-cart', pos: [-5.8, 0, 6.0], rotationY: 0, zone: 'general' },
  { kind: 'plant', pos: [-15.9, 0, 6.2], rotationY: 0, zone: 'general' },
  { kind: 'plant', pos: [-4.8, 0, -6.2], rotationY: 0, zone: 'general' },
  { kind: 'plant', pos: [-4.7, 0, 6.3], rotationY: 0, zone: 'general' },
  { kind: 'plant', pos: [-13.6, 0, 3.4], rotationY: 0, zone: 'general' },
  { kind: 'plant', pos: [-5.2, 0, -3.4], rotationY: 0, zone: 'general' },
  { kind: 'display-shelf', pos: [-7.2, 0, -5.0], rotationY: 0, zone: 'general' },
  { kind: 'display-shelf', pos: [-5.6, 0, 1.6], rotationY: Math.PI / 2, zone: 'general' },
  { kind: 'magazine-rack', pos: [-14.8, 0, 3.2], rotationY: Math.PI / 2, zone: 'general' },
  { kind: 'rug', pos: [-11.0, 0, 0.4], rotationY: 0, zone: 'general' },
  { kind: 'display-table', pos: [-11.0, 0, 0.4], rotationY: 0, zone: 'general' },

  // 어린이자료실 — 낮은 테이블·북카트·쿠션·화분
  { kind: 'low-table', pos: [5.0, 0, 0.4], rotationY: 0, zone: 'children' },
  { kind: 'book-cart', pos: [-2.2, 0, 3.2], rotationY: Math.PI / 2, zone: 'children' },
  { kind: 'book-cart', pos: [2.2, 0, -5.0], rotationY: 0, zone: 'children' },
  { kind: 'cushion', pos: [0.8, 0, 4.2], rotationY: 0, zone: 'children' },
  { kind: 'cushion', pos: [2.0, 0, 4.6], rotationY: Math.PI / 4, zone: 'children' },
  { kind: 'cushion', pos: [1.2, 0, 5.4], rotationY: -Math.PI / 4, zone: 'children' },
  { kind: 'plant', pos: [7.6, 0, 6.0], rotationY: 0, zone: 'children' },
  { kind: 'plant', pos: [-2.9, 0, 6.2], rotationY: 0, zone: 'children' },
  { kind: 'display-shelf', pos: [4.6, 0, -2.2], rotationY: 0, zone: 'children' },
  { kind: 'rug', pos: [1.2, 0, 3.6], rotationY: 0, zone: 'children' },
  { kind: 'sofa', pos: [6.9, 0, 1.6], rotationY: -Math.PI / 2, zone: 'children' },
  { kind: 'magazine-rack', pos: [-2.5, 0, -2.6], rotationY: Math.PI / 2, zone: 'children' },

  // 별치 C — 열람 테이블·낮은 테이블·북카트·화분
  { kind: 'reading-table', pos: [9.7, 0, 2.0], rotationY: 0, zone: 'children-c' },
  { kind: 'reading-table', pos: [9.7, 0, 5.2], rotationY: 0, zone: 'children-c' },
  { kind: 'low-table', pos: [14.0, 0, -0.6], rotationY: 0, zone: 'children-c' },
  { kind: 'book-cart', pos: [11.2, 0, 6.0], rotationY: 0, zone: 'children-c' },
  { kind: 'plant', pos: [16.4, 0, -6.0], rotationY: 0, zone: 'children-c' },
  { kind: 'plant', pos: [8.6, 0, 6.2], rotationY: 0, zone: 'children-c' },
  { kind: 'display-shelf', pos: [14.2, 0, -2.6], rotationY: 0, zone: 'children-c' },
  { kind: 'rug', pos: [9.8, 0, 3.8], rotationY: 0, zone: 'children-c' },
  { kind: 'magazine-rack', pos: [15.0, 0, 1.8], rotationY: 0, zone: 'children-c' },
];

export const FURNITURE_SIZE: Record<FurnitureAnchor['kind'], { w: number; d: number }> = {
  'reading-table': { w: 2.6, d: 2.2 },
  'pc-partition': { w: 1.7, d: 1.5 },
  desk: { w: 3.0, d: 0.9 },
  'book-cart': { w: 0.95, d: 0.55 },
  'low-table': { w: 1.9, d: 1.7 },
  'display-shelf': { w: 2.0, d: 0.6 },
  'display-table': { w: 2.1, d: 0.95 },
  sofa: { w: 1.9, d: 0.9 },
  'magazine-rack': { w: 0.9, d: 0.45 },
  rug: { w: 3.0, d: 2.2 },
  plant: { w: 0.55, d: 0.55 },
  sign: { w: 0.1, d: 0.1 },
  cushion: { w: 0.62, d: 0.62 },
};

/** 가구 회전을 반영한 충돌 박스 */
export const furnitureColliders = (): BoxCollider[] =>
  FURNITURE.filter((f) => f.kind !== 'sign' && f.kind !== 'cushion' && f.kind !== 'rug').map((f) => {
    const size = FURNITURE_SIZE[f.kind];
    const swapped = Math.abs(Math.sin(f.rotationY)) > 0.5;
    return {
      x: f.pos[0],
      z: f.pos[2],
      w: swapped ? size.d : size.w,
      d: swapped ? size.w : size.d,
    };
  });

export const ZONE_LABELS: { zone: ZoneId; text: string; sub: string; pos: [number, number, number] }[] = [
  { zone: 'general', text: '종합자료실', sub: 'GENERAL', pos: [-10.5, 2.72, -1.2] },
  { zone: 'children', text: '어린이자료실', sub: 'CHILDREN', pos: [1.2, 2.72, -1.5] },
  { zone: 'children-c', text: '별치 C', sub: 'C COLLECTION', pos: [12.4, 2.72, -1.5] },
];
