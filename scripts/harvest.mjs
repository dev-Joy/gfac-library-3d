/**
 * 도서관정보나루 OpenAPI → 성현동작은도서관(111063) 장서 전체 수집
 * 결과: data/catalog.json (전체), public/data/shelves.json (3D 서가용 표본), public/data/manifest.json
 *
 * 실행: node scripts/harvest.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB_CODE = process.env.LIB_CODE ?? '111063';
const PAGE_SIZE = 500;
const CONCURRENCY = 4;
const REQUEST_DELAY_MS = 80;

const envPath = join(ROOT, '.env');
const env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const KEY =
  process.env.LIBRARY_API_KEY ??
  process.env.DATA4LIBRARY_KEY ??
  process.env.KEY ??
  env.match(/^(?:LIBRARY_API_KEY|DATA4LIBRARY_KEY|KEY)\s*=\s*(.+)$/m)?.[1]?.trim();

if (!KEY) {
  console.error('인증키가 없습니다. .env 에 KEY=... 를 설정하세요.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(pageNo) {
  const url =
    `https://data4library.kr/api/itemSrch?type=ALL&libCode=${LIB_CODE}` +
    `&authKey=${KEY}&pageNo=${pageNo}&pageSize=${PAGE_SIZE}&format=json`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!text.trim()) throw new Error('empty body');
      const json = JSON.parse(text);
      if (json?.response?.errCode) throw new Error(json.response.error ?? json.response.errCode);
      return json.response;
    } catch (err) {
      if (attempt === 4) throw err;
      await sleep(400 * attempt);
    }
  }
}

/** 실제 배가 순서: 자료실 → 별치기호 → KDC → 저자기호 */
function shelfIdOf(doc) {
  const cn = doc.callNumbers?.[0]?.callNumber ?? {};
  const loc = cn.shelf_loc_name ?? '';
  const code = (cn.separate_shelf_code ?? '').trim();
  const zone = loc.includes('어린이') ? 'children' : loc.includes('종합') ? 'general' : 'other';
  const west = loc.includes('서양서') ? '-west' : '';
  const sep = code ? `-${code.replace(/[^\w가-힣]/g, '')}` : '';
  return `${zone}${west}${sep}`;
}

function normalize(doc) {
  const cn = doc.callNumbers?.[0]?.callNumber ?? {};
  return {
    i: doc.isbn13 ?? '',
    t: doc.bookname ?? '',
    a: doc.authors ?? '',
    p: doc.publisher ?? '',
    y: Number(doc.publication_year) || 0,
    k: doc.class_no ?? '',
    kn: doc.class_nm ?? '',
    s: shelfIdOf(doc),
    loc: cn.shelf_loc_name ?? '',
    code: (cn.separate_shelf_code ?? '').trim(),
    call: cn.book_code ?? '',
    img: doc.bookImageURL ?? '',
    d: doc.reg_date ?? '',
  };
}

function kdcKey(k) {
  const n = Number.parseFloat(k);
  return Number.isFinite(n) ? Math.floor(n / 100) * 100 : 0;
}

function buildSubset(books, target = 2600) {
  // KDC 대분류·자료실 비율을 유지하며 결정적으로 표본 추출
  const groups = new Map();
  for (const b of books) {
    const key = `${b.s}::${kdcKey(b.k)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }
  const total = books.length;
  const picked = [];
  for (const [, list] of groups) {
    const quota = Math.max(1, Math.round((list.length / total) * target));
    // 최신 등록 순으로 고르되 균등 간격 유지
    const stride = list.length / quota;
    const sorted = [...list].sort((x, y) => (y.d - x.d) || x.t.localeCompare(y.t, 'ko'));
    for (let n = 0; n < quota && n < sorted.length; n++) {
      picked.push(sorted[Math.floor(n * stride)]);
    }
  }
  return picked;
}

async function main() {
  console.log(`[harvest] libCode=${LIB_CODE} pageSize=${PAGE_SIZE}`);
  const first = await fetchPage(1);
  const numFound = first.numFound;
  const pages = Math.ceil(numFound / PAGE_SIZE);
  console.log(`[harvest] numFound=${numFound} pages=${pages}`);

  const byPage = new Array(pages);
  byPage[0] = first;
  let next = 2;
  let done = 1;

  async function worker() {
    while (next <= pages) {
      const p = next++;
      byPage[p - 1] = await fetchPage(p);
      done++;
      if (done % 20 === 0) console.log(`[harvest] ${done}/${pages}`);
      await sleep(REQUEST_DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const books = [];
  for (const page of byPage) {
    for (const item of page?.docs ?? []) books.push(normalize(item.doc));
  }
  console.log(`[harvest] collected=${books.length}`);

  const subset = buildSubset(books);
  subset.sort((x, y) =>
    x.s.localeCompare(y.s) ||
    (Number.parseFloat(x.k) || 0) - (Number.parseFloat(y.k) || 0) ||
    x.call.localeCompare(y.call, 'ko')
  );

  const shelves = {};
  for (const b of subset) {
    const list = (shelves[b.s] ??= []);
    if (list.length < 400) list.push(b);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    libCode: LIB_CODE,
    libName: '성현동작은도서관',
    total: books.length,
    subset: subset.length,
    shelves: Object.fromEntries(
      Object.entries(shelves).map(([id, list]) => [id, { count: list.length, loc: list[0]?.loc ?? '' }])
    ),
  };

  mkdirSync(join(ROOT, 'data'), { recursive: true });
  mkdirSync(join(ROOT, 'public/data'), { recursive: true });
  writeFileSync(join(ROOT, 'data/catalog.json'), JSON.stringify(books));
  writeFileSync(join(ROOT, 'public/data/shelves.json'), JSON.stringify(shelves));
  writeFileSync(join(ROOT, 'public/data/manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('[harvest] wrote data/catalog.json, public/data/shelves.json, public/data/manifest.json');
  console.log(JSON.stringify(manifest.shelves, null, 2));
}

main().catch((err) => {
  console.error('[harvest] FAILED:', err);
  process.exit(1);
});
