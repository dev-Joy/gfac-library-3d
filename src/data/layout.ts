import type { Bay, BayBook, Book, ShelfMap, ZoneId, ZoneLayout } from '../types';

export const ZONE_ORDER: ZoneId[] = ['general', 'children', 'archive'];

export const ZONE_ORIGIN: Record<ZoneId, [number, number, number]> = {
  general: [0, 0, 0],
  children: [0, 0, 56],
  archive: [0, 0, 112],
};

interface ZoneSpec {
  label: string;
  description: string;
  rows: number;
  cols: number;
  bayWidth: number;
  bayHeight: number;
  baysPerRun: number;
  aisle: number;
  maxBays: number;
}

const ZONE_SPEC: Record<ZoneId, ZoneSpec> = {
  general: {
    label: '종합자료실',
    description: 'KDC 000–900 · 일반 장서와 서양서',
    rows: 4,
    cols: 18,
    bayWidth: 0.98,
    bayHeight: 2.24,
    baysPerRun: 5,
    aisle: 3.1,
    maxBays: 12,
  },
  children: {
    label: '어린이자료실',
    description: '그림책 · 유아 · 영어 그림책',
    rows: 3,
    cols: 16,
    bayWidth: 0.9,
    bayHeight: 1.5,
    baysPerRun: 5,
    aisle: 2.6,
    maxBays: 20,
  },
  archive: {
    label: '보존서고',
    description: '2008–2019 구장서 · 서양서 원서',
    rows: 4,
    cols: 16,
    bayWidth: 0.95,
    bayHeight: 2.2,
    baysPerRun: 4,
    aisle: 2.8,
    maxBays: 8,
  },
};

const KDC_LABEL: Record<string, string> = {
  '000': '총류',
  '100': '철학',
  '200': '종교',
  '300': '사회과학',
  '400': '자연과학',
  '500': '기술과학',
  '600': '예술',
  '700': '언어',
  '800': '문학',
  '900': '역사',
};

const kdcHundred = (k: string) => {
  const n = Number.parseFloat(k);
  if (!Number.isFinite(n)) return '000';
  return String(Math.floor(n / 100) * 100).padStart(3, '0');
};

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function buildLayout(shelves: ShelfMap): Record<ZoneId, ZoneLayout> {
  const byZone: Record<ZoneId, { order: number; shelfId: string; books: BayBook[] }[]> = {
    general: [],
    children: [],
    archive: [],
  };

  for (const [shelfId, shelf] of Object.entries(shelves)) {
    const zone = shelf.meta.zone;
    if (!byZone[zone]) continue;
    byZone[zone].push({
      order: shelf.meta.order,
      shelfId,
      books: shelf.books.map((b: Book) => ({ ...b, shelfId })),
    });
  }

  const result = {} as Record<ZoneId, ZoneLayout>;

  for (const zone of ZONE_ORDER) {
    const spec = ZONE_SPEC[zone];
    const origin = ZONE_ORIGIN[zone];
    const capacity = spec.rows * spec.cols;

    const ordered = byZone[zone].sort((a, b) => a.order - b.order);

    // 자료실 안의 모든 책을 KDC → 청구기호 순으로 정렬한 뒤 균등한 두께로 나눈다.
    const sorted = ordered
      .flatMap((shelf) => shelf.books)
      .sort(
        (a, b) =>
          kdcHundred(a.k).localeCompare(kdcHundred(b.k)) ||
          (Number.parseFloat(a.k) || 0) - (Number.parseFloat(b.k) || 0) ||
          a.call.localeCompare(b.call, 'en') ||
          a.t.localeCompare(b.t, 'ko')
      );

    const bayCount = Math.max(1, Math.ceil(sorted.length / capacity));
    const perBay = Math.ceil(sorted.length / bayCount);

    const bays: Bay[] = chunk(sorted, perBay).map((books, index) => {
      const hundred = kdcHundred(books[0].k);
      return {
        id: `${zone}-${index}`,
        zone,
        shelfId: books[0].shelfId,
        label: `${hundred} ${KDC_LABEL[hundred] ?? ''}`.trim(),
        kdcRange: hundred,
        position: [0, 0, 0] as [number, number, number],
        rotationY: 0,
        rows: spec.rows,
        cols: spec.cols,
        width: spec.bayWidth,
        height: spec.bayHeight,
        books,
      };
    });

    // 베이 수가 너무 많으면 KDC 커버리지를 유지하며 균등 솎아내기
    const kept =
      bays.length > spec.maxBays
        ? Array.from({ length: spec.maxBays }, (_, i) => bays[Math.floor((i * bays.length) / spec.maxBays)])
        : bays;

    // 벽면을 따라 ㄷ자로 배치: 뒤벽 + 좌벽 + 우벽
    const step = spec.bayWidth + 0.1;
    const n = kept.length;
    const backCount = Math.max(1, Math.round(n * 0.44));
    const sideTotal = n - backCount;
    const leftCount = Math.ceil(sideTotal / 2);
    const rightCount = sideTotal - leftCount;

    const backLen = backCount * step;
    const sideLen = Math.max(leftCount, rightCount, 1) * step;
    const width = Math.max(backLen + 1.8, 4.8);
    const depth = Math.max(sideLen + 2.0, 5.4);

    const back = kept.slice(0, backCount);
    const left = kept.slice(backCount, backCount + leftCount);
    const right = kept.slice(backCount + leftCount);

    back.forEach((bay, i) => {
      bay.position = [origin[0] - ((backCount - 1) / 2) * step + i * step, 0, origin[2] - depth / 2 + 0.5];
      bay.rotationY = 0;
    });

    left.forEach((bay, i) => {
      bay.position = [origin[0] - width / 2 + 0.5, 0, origin[2] - ((leftCount - 1) / 2) * step + i * step];
      bay.rotationY = Math.PI / 2;
    });

    right.forEach((bay, i) => {
      bay.position = [origin[0] + width / 2 - 0.5, 0, origin[2] - ((rightCount - 1) / 2) * step + i * step];
      bay.rotationY = -Math.PI / 2;
    });

    result[zone] = {
      id: zone,
      label: spec.label,
      description: spec.description,
      bays: kept,
      size: { width, depth },
      camera: {
        pos: [origin[0], spec.rows > 3 ? 2.95 : 2.55, origin[2] + depth / 2 + 1.9],
        target: [origin[0], spec.rows > 3 ? 0.9 : 0.75, origin[2] - depth / 2 + 1.3],
      },
    };
  }

  return result;
}

export function kdcLabelOf(book: Book): string {
  const h = kdcHundred(book.k);
  return `${h} ${KDC_LABEL[h] ?? ''}`.trim();
}

export const booksInZone = (zone: ZoneLayout) => zone.bays.reduce((n, b) => n + b.books.length, 0);
