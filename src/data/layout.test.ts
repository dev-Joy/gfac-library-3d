import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLayout, booksInZone, kdcLabelOf, spawnInFrontOfBay, ZONE_ORDER } from './layout.ts';
import { ROOM_BOUNDS, SECTIONS, ZONE_INFO } from './sections.ts';
import { GLASS, WALLS, furnitureColliders } from './floorplan.ts';
import type { Bay, Book, ShelfMap } from '../types.ts';

const RADIUS = 0.28;

/** 실제 배포 데이터 (public/data/shelves.json) — process.cwd() 기준 */
const shelvesPath = join(process.cwd(), 'public/data/shelves.json');
const shelves = JSON.parse(readFileSync(shelvesPath, 'utf8')) as { sections: ShelfMap };

function makeBook(id: number, kdc: string, call: string, title = `테스트 도서 ${id}`): Book {
  return {
    i: `979000000${String(id).padStart(4, '0')}`,
    t: title,
    a: '저자',
    p: '출판사',
    y: 2020,
    k: kdc,
    kn: '',
    s: 'general',
    loc: '성현동작은도서관 종합자료실',
    code: '',
    call,
    img: '',
    d: '2024-01-01',
  };
}

/** 베이 회전을 반영한 AABB */
function bayBox(bay: Bay) {
  const swapped = Math.abs(Math.sin(bay.rotationY)) > 0.5;
  const w = swapped ? 0.55 : bay.width;
  const d = swapped ? bay.width : 0.55;
  return { x: bay.position[0], z: bay.position[2], w, d };
}

const boxesOverlap = (
  a: { x: number; z: number; w: number; d: number },
  b: { x: number; z: number; w: number; d: number }
) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;

function circleHitsBox(x: number, z: number, c: { x: number; z: number; w: number; d: number }) {
  const dx = Math.max(Math.abs(x - c.x) - c.w / 2, 0);
  const dz = Math.max(Math.abs(z - c.z) - c.d / 2, 0);
  return dx * dx + dz * dz < RADIUS * RADIUS;
}

const realLayout = buildLayout(shelves);
const realBays = Object.values(realLayout).flatMap((z) => z.bays);

describe('존·섹션 정의', () => {
  it('ZONE_ORDER는 4개 존이며 archive는 없다', () => {
    assert.deepEqual(ZONE_ORDER, ['general', 'children', 'children-c', 'media']);
    assert.equal(ZONE_ORDER.length, 4);
    assert.equal((ZONE_ORDER as string[]).includes('archive'), false);
    assert.deepEqual(Object.keys(ZONE_INFO).sort(), [...ZONE_ORDER].sort());
  });

  it('SECTIONS는 10개이고 id가 유일하며 예산 합이 1,736권이다', () => {
    assert.equal(SECTIONS.length, 10);
    assert.equal(new Set(SECTIONS.map((s) => s.id)).size, 10);
    assert.equal(
      SECTIONS.reduce((n, s) => n + s.budget, 0),
      1736
    );
    for (const section of SECTIONS) {
      assert.ok(ZONE_ORDER.includes(section.zone), `${section.id}의 존이 잘못됨`);
      assert.ok(section.label.length > 0);
      assert.ok(section.kdcMax > section.kdcMin, `${section.id} KDC 범위 오류`);
    }
  });

  it('배치도 §6.2 라벨·존 매핑이 고정되어 있다', () => {
    const expected: Record<string, { zone: string; label: string }> = {
      'gen-000-700': { zone: 'general', label: '일반 000~700' },
      'gen-800': { zone: 'general', label: '일반 800~803' },
      'gen-west-800': { zone: 'general', label: '원서 800' },
      'gen-west-new': { zone: 'general', label: '원서신간' },
      'child-eng-c': { zone: 'children', label: '영C' },
      'child-west-000-700': { zone: 'children', label: '원서 000~700' },
      'child-800-900': { zone: 'children', label: '일반 800,900' },
      'child-toddler': { zone: 'children', label: '유' },
      'child-c-000-200': { zone: 'children', label: 'C 000~200' },
      'child-c-300-900': { zone: 'children-c', label: 'C 300~900' },
    };
    for (const [id, meta] of Object.entries(expected)) {
      const section = SECTIONS.find((s) => s.id === id);
      assert.ok(section, `${id} 섹션 없음`);
      assert.equal(section.zone, meta.zone);
      assert.equal(section.label, meta.label);
    }
  });
});

describe('buildLayout (배치도 섹션)', () => {
  it('4개 존을 만들고 media는 서가가 0권이다', () => {
    assert.deepEqual(Object.keys(realLayout), ['general', 'children', 'children-c', 'media']);
    assert.equal(realLayout.media.bays.length, 0);
    assert.equal(booksInZone(realLayout.media), 0);
    for (const zone of ZONE_ORDER.filter((z) => z !== 'media')) {
      assert.ok(realLayout[zone].bays.length > 0, `${zone} 베이 없음`);
      assert.ok(booksInZone(realLayout[zone]) > 0, `${zone} 배가 0권`);
    }
  });

  it('빈 베이가 없고 10개 섹션이 모두 베이로 존재한다', () => {
    for (const bay of realBays) {
      assert.ok(bay.books.length > 0, `${bay.id} 빈 베이`);
      assert.equal(bay.zone, SECTIONS.find((s) => s.id === bay.section)?.zone);
      assert.ok(SECTIONS.some((s) => s.id === bay.section && s.label === bay.label), `${bay.id} 라벨 불일치`);
    }
    const usedSections = new Set(realBays.map((b) => b.section));
    assert.equal(usedSections.size, SECTIONS.length);
    for (const section of SECTIONS) assert.ok(usedSections.has(section.id), `${section.id} 베이 없음`);
  });

  it('씬에 배치된 총 권수가 1,736권이며 other(구장서)는 제외된다', () => {
    const total = Object.values(realLayout).reduce((n, z) => n + booksInZone(z), 0);
    assert.equal(total, 1736);
    assert.equal(realBays.length, 27);
    assert.ok(!('other' in shelves.sections));
    for (const bay of realBays) assert.notEqual(bay.section, 'other');
  });

  it('베이의 책을 KDC → 청구기호 → 제목 순으로 꽂는다', () => {
    const compare = (a: Book, b: Book) =>
      (Number.parseFloat(a.k) || 0) - (Number.parseFloat(b.k) || 0) ||
      a.call.localeCompare(b.call, 'en') ||
      a.t.localeCompare(b.t, 'ko');
    for (const bay of realBays) {
      const sorted = [...bay.books].sort(compare);
      assert.deepEqual(
        bay.books.map((b) => `${b.i}|${b.call}`),
        sorted.map((b) => `${b.i}|${b.call}`),
        `${bay.id} 정렬 오류`
      );
      for (let i = 1; i < bay.books.length; i++) {
        assert.ok(compare(bay.books[i - 1], bay.books[i]) <= 0, `${bay.id} 정렬 위반`);
      }
    }
  });

  it('베이 좌표가 방 bounds 안에 있고 벽·가구와 겹치지 않는다', () => {
    for (const bay of realBays) {
      const box = bayBox(bay);
      assert.ok(box.x - box.w / 2 >= ROOM_BOUNDS.minX, `${bay.id} 서쪽 이탈`);
      assert.ok(box.x + box.w / 2 <= ROOM_BOUNDS.maxX, `${bay.id} 동쪽 이탈`);
      assert.ok(box.z - box.d / 2 >= ROOM_BOUNDS.minZ, `${bay.id} 북쪽 이탈`);
      assert.ok(box.z + box.d / 2 <= ROOM_BOUNDS.maxZ, `${bay.id} 남쪽 이탈`);
      for (const wall of [...WALLS, ...GLASS]) assert.ok(!boxesOverlap(box, wall), `${bay.id} 벽과 겹침`);
      for (const prop of furnitureColliders()) assert.ok(!boxesOverlap(box, prop), `${bay.id} 가구와 겹침`);
    }
  });

  it('베이는 서로 겹치지 않는다', () => {
    for (let i = 0; i < realBays.length; i++) {
      for (let j = i + 1; j < realBays.length; j++) {
        assert.ok(!boxesOverlap(bayBox(realBays[i]), bayBox(realBays[j])), `${realBays[i].id} ↔ ${realBays[j].id}`);
      }
    }
  });

  it('베이는 섹션 앵커에서 시작해 일정 간격으로 놓인다', () => {
    for (const section of SECTIONS) {
      const bays = realLayout[section.zone].bays.filter((b) => b.section === section.id);
      assert.ok(bays.length > 0, `${section.id} 베이 없음`);
      assert.ok(bays.length <= section.maxBays, `${section.id} maxBays 초과`);
      const [x, y, z] = bays[0].position;
      assert.equal(y, 0);
      assert.ok(Math.abs(x - section.anchor.x) < 1e-6);
      assert.ok(Math.abs(z - section.anchor.z) < 1e-6);
      const step = section.bayWidth + section.gap;
      for (let i = 1; i < bays.length; i++) {
        const dx = bays[i].position[0] - bays[i - 1].position[0];
        const dz = bays[i].position[2] - bays[i - 1].position[2];
        assert.ok(Math.abs(Math.hypot(dx, dz) - step) < 1e-6, `${section.id} 간격 오류`);
      }
    }
  });

  it('spawnInFrontOfBay는 베이 정면 1.75m이며 충돌하지 않는다', () => {
    const colliders = [...WALLS, ...GLASS, ...furnitureColliders(), ...realBays.map(bayBox)];
    for (const bay of realBays) {
      const spawn = spawnInFrontOfBay(bay);
      assert.equal(spawn.yaw, bay.rotationY);
      const expectedX = bay.position[0] + Math.sin(bay.rotationY) * 1.75;
      const expectedZ = bay.position[2] + Math.cos(bay.rotationY) * 1.75;
      assert.ok(Math.abs(spawn.pos[0] - expectedX) < 1e-6, `${bay.id} x`);
      assert.ok(Math.abs(spawn.pos[2] - expectedZ) < 1e-6, `${bay.id} z`);
      assert.equal(spawn.pos[1], 1.55);
      assert.ok(spawn.pos[0] > ROOM_BOUNDS.minX && spawn.pos[0] < ROOM_BOUNDS.maxX, `${bay.id} 스폰 x 이탈`);
      assert.ok(spawn.pos[2] > ROOM_BOUNDS.minZ && spawn.pos[2] < ROOM_BOUNDS.maxZ, `${bay.id} 스폰 z 이탈`);
      for (const collider of colliders) {
        assert.ok(!circleHitsBox(spawn.pos[0], spawn.pos[2], collider), `${bay.id} 스폰이 충돌체 안`);
      }
    }
  });

  it('buildLayout은 같은 데이터에 대해 결정적이다', () => {
    const again = buildLayout(shelves);
    for (const zone of ZONE_ORDER) {
      assert.deepEqual(
        again[zone].bays.map((b) => [b.id, ...b.position, b.rotationY, b.books.length]),
        realLayout[zone].bays.map((b) => [b.id, ...b.position, b.rotationY, b.books.length])
      );
    }
    const ids = (layout: typeof again) =>
      Object.values(layout).flatMap((z) => z.bays.flatMap((b) => b.books.map((x) => x.i)));
    assert.deepEqual(ids(again), ids(realLayout));
  });

  it('합성 데이터도 4존·빈 베이 없이 생성된다', () => {
    const fixture: ShelfMap = {};
    for (const section of SECTIONS) {
      const count = section.rows * section.cols + 3;
      const books = Array.from({ length: count }, (_, i) =>
        makeBook(i + section.order * 1000, `${Math.min(section.kdcMin + i, section.kdcMax - 1)}.1`, `가${i}`)
      );
      fixture[section.id] = {
        meta: { zone: section.zone, label: section.label, sub: section.label, order: section.order, section: section.id },
        books,
      };
    }
    const layout = buildLayout(fixture);
    assert.equal(Object.keys(layout).length, 4);
    assert.equal(layout.media.bays.length, 0);
    const total = Object.values(layout).reduce((n, z) => n + z.bays.reduce((m, b) => m + b.books.length, 0), 0);
    assert.equal(
      total,
      SECTIONS.reduce((n, s) => n + s.rows * s.cols + 3, 0)
    );
    for (const bay of Object.values(layout).flatMap((z) => z.bays)) assert.ok(bay.books.length > 0);
  });

  it('kdcLabelOf는 KDC 백단위 라벨을 만든다', () => {
    assert.equal(kdcLabelOf(makeBook(1, '813.7', '가1')), '800 문학');
    assert.equal(kdcLabelOf(makeBook(2, '004', '나1')), '000 총류');
    assert.equal(kdcLabelOf(makeBook(3, '', '다1')), '000 총류');
  });
});

describe('public/data/shelves.json', () => {
  it('10개 섹션·1,736권·meta.section을 포함한다', () => {
    const keys = Object.keys(shelves.sections);
    assert.equal(keys.length, 10);
    assert.deepEqual(keys.sort(), SECTIONS.map((s) => s.id).sort());
    let total = 0;
    for (const [id, shelf] of Object.entries(shelves.sections)) {
      assert.equal(shelf.meta.section, id, `${id} meta.section 누락`);
      assert.ok(shelf.books.length > 0, `${id} 빈 서가`);
      total += shelf.books.length;
    }
    assert.equal(total, 1736);
    for (const section of SECTIONS) {
      assert.equal(shelves.sections[section.id].books.length, section.budget, `${section.id} 예산 불일치`);
    }
  });
});
