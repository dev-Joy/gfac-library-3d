/**
 * data/catalog.json → public/data/shelves.json
 * 배치도 섹션(`src/data/sections.ts`) 단위로 장서를 배정한다. 구장서(other)는 제외.
 *
 * 실행: node scripts/build-shelves.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS } from '../src/data/sections.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(ROOT, 'data/catalog.json');
if (!existsSync(catalogPath)) {
  console.error('data/catalog.json 이 없습니다. 먼저 node scripts/harvest.mjs 를 실행하세요.');
  process.exit(1);
}

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const kdc = (k) => {
  const n = Number.parseFloat(k);
  return Number.isFinite(n) ? n : 0;
};
const sortBooks = (a, b) =>
  kdc(a.k) - kdc(b.k) || a.call.localeCompare(b.call, 'en') || a.t.localeCompare(b.t, 'ko');
const keyOf = (b) => `${b.i}|${b.call}|${b.t}`;

const byShelf = new Map();
for (const book of catalog) {
  if (!byShelf.has(book.s)) byShelf.set(book.s, []);
  byShelf.get(book.s).push(book);
}

const assigned = new Set();
const sections = {};

function take(book) {
  const key = keyOf(book);
  if (assigned.has(key)) return null;
  assigned.add(key);
  return book;
}

// 1) 원서신간: general-west 최신 등록 30권을 먼저 확보한다.
const west = [...(byShelf.get('general-west') ?? [])].sort(
  (a, b) => b.d.localeCompare(a.d) || a.t.localeCompare(b.t, 'ko')
);
const newest = west.slice(0, 30).map(take).filter(Boolean);

// 2) 섹션별 배정
for (const section of SECTIONS) {
  let books;
  if (section.id === 'gen-west-new') {
    books = newest;
  } else {
    const pool = byShelf.get(section.sourceShelf) ?? [];
    books = pool
      .filter((b) => {
        const n = kdc(b.k);
        return n >= section.kdcMin && n < section.kdcMax;
      })
      .map(take)
      .filter(Boolean);
  }

  books.sort(sortBooks);
  const budget = section.budget;
  const sampled =
    books.length <= budget
      ? books
      : Array.from({ length: budget }, (_, i) => books[Math.floor((i * books.length) / budget)]);

  sections[section.id] = {
    meta: {
      zone: section.zone,
      label: section.label,
      sub: section.label,
      order: section.order,
      section: section.id,
    },
    books: sampled,
  };
}

// 3) 어느 섹션에도 속하지 못한 책은 같은 존의 인접 섹션으로 흡수한다 (빈 서가·유실 방지)
const leftovers = [];
for (const [shelfId, pool] of byShelf) {
  if (shelfId === 'other') continue;
  for (const book of pool) {
    const key = keyOf(book);
    if (!assigned.has(key)) {
      assigned.add(key);
      leftovers.push({ book, shelfId });
    }
  }
}

const distanceTo = (section, value) => {
  if (value < section.kdcMin) return section.kdcMin - value;
  if (value >= section.kdcMax) return value - (section.kdcMax - 1);
  return 0;
};

// 섹션 예산에 미달한 곳에만 남은 장서를 흡수한다 (표본 총량 유지).
for (const section of SECTIONS) {
  let need = section.budget - sections[section.id].books.length;
  if (need <= 0) continue;
  const pool = leftovers
    .filter((x) => (section.zone === 'children' ? x.shelfId.startsWith('children') : x.shelfId.startsWith('general')))
    .filter((x) => !x.used)
    .sort((a, b) => distanceTo(section, kdc(a.book.k)) - distanceTo(section, kdc(b.book.k)));
  for (const item of pool) {
    if (need <= 0) break;
    item.used = true;
    sections[section.id].books.push(item.book);
    need--;
  }
  sections[section.id].books.sort(sortBooks);
}

const stats = Object.fromEntries(
  SECTIONS.map((s) => [
    s.id,
    {
      label: s.label,
      zone: s.zone,
      books: sections[s.id].books.length,
      capacity: s.rows * s.cols,
      bays: Math.max(1, Math.ceil(sections[s.id].books.length / (s.rows * s.cols))),
    },
  ])
);

const totalBooks = Object.values(sections).reduce((n, s) => n + s.books.length, 0);
const manifest = {
  generatedAt: new Date().toISOString(),
  libCode: '111063',
  libName: '성현동작은도서관',
  total: catalog.length,
  placed: totalBooks,
  sections: stats,
};

writeFileSync(join(ROOT, 'public/data/shelves.json'), JSON.stringify({ sections }));
writeFileSync(join(ROOT, 'public/data/manifest.json'), JSON.stringify(manifest, null, 2));

console.log(JSON.stringify(stats, null, 2));
console.log(`placed=${totalBooks} / catalog=${catalog.length}`);
