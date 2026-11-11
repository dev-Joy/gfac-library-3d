/**
 * data/catalog.json → public/data/shelves.json (3D 서가 배치용 표본)
 * 카탈로그 전체 수집은 scripts/harvest.mjs 가 담당한다.
 *
 * 실행: node scripts/build-shelves.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(ROOT, 'data/catalog.json');
if (!existsSync(catalogPath)) {
  console.error('data/catalog.json 이 없습니다. 먼저 node scripts/harvest.mjs 를 실행하세요.');
  process.exit(1);
}

const books = JSON.parse(readFileSync(catalogPath, 'utf8'));

/** 3D 장면에 실제로 꽂을 권수 (서가 단위) */
const SHELF_BUDGET = {
  'children-C': 600,
  'children-유': 180,
  'children-west-영C': 180,
  'children-점C': 30,
  general: 600,
  'general-west': 150,
  'general-큰글책': 40,
  'general-점C': 20,
  'general-향토': 20,
  'general-향': 10,
  other: 400,
};

const SHELF_META = {
  children: { zone: 'children', label: '어린이자료실', sub: '일반', order: 0 },
  'children-C': { zone: 'children', label: '어린이자료실', sub: '별치 C', order: 1 },
  'children-유': { zone: 'children', label: '어린이자료실', sub: '유아', order: 2 },
  'children-점C': { zone: 'children', label: '어린이자료실', sub: '점자', order: 3 },
  'children-west-영C': { zone: 'children', label: '어린이자료실', sub: '영어', order: 4 },
  general: { zone: 'general', label: '종합자료실', sub: 'KDC 000–900', order: 1 },
  'general-west': { zone: 'general', label: '종합자료실', sub: '서양서', order: 2 },
  'general-큰글책': { zone: 'general', label: '종합자료실', sub: '큰글책', order: 3 },
  'general-점C': { zone: 'general', label: '종합자료실', sub: '점자', order: 4 },
  'general-향토': { zone: 'general', label: '종합자료실', sub: '향토', order: 5 },
  'general-향': { zone: 'general', label: '종합자료실', sub: '향토', order: 6 },
  other: { zone: 'archive', label: '보존서고', sub: '구장서 (2008–2019)', order: 1 },
};

const kdcOf = (k) => {
  const n = Number.parseFloat(k);
  return Number.isFinite(n) ? String(Math.floor(n / 100) * 100).padStart(3, '0') : '000';
};

const byShelf = new Map();
for (const b of books) {
  if (!byShelf.has(b.s)) byShelf.set(b.s, []);
  byShelf.get(b.s).push(b);
}

const shelves = {};
const stats = {};

for (const [id, list] of byShelf) {
  const meta = SHELF_META[id] ?? {
    zone: id.startsWith('children') ? 'children' : id.startsWith('general') ? 'general' : 'archive',
    label: id,
    sub: '',
    order: 99,
  };
  const budget = SHELF_BUDGET[id] ?? 40;

  // KDC 대분류별 균등 표본 → 서가 한 칸(bay)이 한 분류가 되도록
  const groups = new Map();
  for (const b of list) {
    const k = kdcOf(b.k);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(b);
  }
  const keys = [...groups.keys()].sort();
  const perGroup = Math.max(1, Math.floor(budget / keys.length));

  const picked = [];
  for (const k of keys) {
    const group = groups.get(k);
    const sorted = [...group].sort(
      (x, y) =>
        (Number.parseFloat(x.k) || 0) - (Number.parseFloat(y.k) || 0) ||
        x.call.localeCompare(y.call, 'en') ||
        x.t.localeCompare(y.t, 'ko')
    );
    const n = Math.min(perGroup, sorted.length);
    const stride = sorted.length / n;
    for (let i = 0; i < n; i++) picked.push(sorted[Math.floor(i * stride)]);
  }

  const unique = [...new Map(picked.map((b) => [b.i + b.call, b])).values()].sort(
    (x, y) =>
      kdcOf(x.k).localeCompare(kdcOf(y.k)) ||
      x.call.localeCompare(y.call, 'en') ||
      x.t.localeCompare(y.t, 'ko')
  );

  shelves[id] = { meta, books: unique };
  stats[id] = { ...meta, total: list.length, picked: unique.length };
}

// 별치 서가 중 권수가 극히 적은 것은 상위 자료실 서가로 흡수해 빈 서가가 보이지 않게 한다.
const MIN_BAY = 50;
for (const [id, data] of Object.entries(shelves)) {
  if (id === 'general' || id === 'children' || id === 'other' || id === 'general-west') continue;
  if (data.books.length >= MIN_BAY) continue;
  const parent = data.meta.zone === 'children' ? 'children' : 'general';
  shelves[parent].books.push(...data.books);
  stats[parent].picked += data.books.length;
  delete shelves[id];
  delete stats[id];
}

const manifest = {  generatedAt: new Date().toISOString(),
  libCode: '111063',
  libName: '성현동작은도서관',
  total: books.length,
  shelves: stats,
};

writeFileSync(join(ROOT, 'public/data/shelves.json'), JSON.stringify(shelves));
writeFileSync(join(ROOT, 'public/data/manifest.json'), JSON.stringify(manifest, null, 2));
console.log('shelves:', Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, `${v.picked}/${v.total}`])));
console.log('total picked:', Object.values(stats).reduce((a, b) => a + b.picked, 0));
