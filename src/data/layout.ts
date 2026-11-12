import type { Bay, BayBook, Book, ShelfMap, ZoneId, ZoneLayout } from '../types';
import { SECTIONS, ZONE_INFO } from './sections.ts';

export const ZONE_ORDER: ZoneId[] = ['general', 'children', 'children-c', 'media'];

const kdcHundred = (k: string) => {
  const n = Number.parseFloat(k);
  if (!Number.isFinite(n)) return '000';
  return String(Math.floor(n / 100) * 100).padStart(3, '0');
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

function sortBooks(a: Book, b: Book) {
  return (
    (Number.parseFloat(a.k) || 0) - (Number.parseFloat(b.k) || 0) ||
    a.call.localeCompare(b.call, 'en') ||
    a.t.localeCompare(b.t, 'ko')
  );
}

export function buildLayout(data: ShelfMap | { sections?: ShelfMap }): Record<ZoneId, ZoneLayout> {
  const sections = (('sections' in data ? data.sections : data) as ShelfMap);

  const layouts = {} as Record<ZoneId, ZoneLayout>;
  for (const zone of ZONE_ORDER) {
    const info = ZONE_INFO[zone];
    const size = {
      width: info.bounds.maxX - info.bounds.minX,
      depth: 20,
    };
    layouts[zone] = {
      id: zone,
      label: info.label,
      description: info.description,
      bays: [],
      size,
      spawn: { pos: [info.spawn.x, 1.55, info.spawn.z], yaw: info.spawn.yaw },
      camera: {
        pos: [info.spawn.x, 1.55, info.spawn.z],
        target: [info.spawn.x - Math.sin(info.spawn.yaw) * 3, 1.4, info.spawn.z - Math.cos(info.spawn.yaw) * 3],
      },
    };
  }

  for (const section of SECTIONS) {
    const source = sections[section.id] ?? sections[section.sourceShelf];
    const raw = source?.books ?? [];
    if (!raw.length) continue;

    const books: BayBook[] = raw
      .map((b) => ({ ...b, shelfId: section.sourceShelf, section: section.id }))
      .sort(sortBooks);

    const capacity = section.rows * section.cols;
    const bayCount = Math.min(section.maxBays, Math.max(1, Math.ceil(books.length / capacity)));
    const perBay = Math.ceil(books.length / bayCount);
    const step = section.bayWidth + section.gap;

    for (let i = 0; i < bayCount; i++) {
      const slice = books.slice(i * perBay, (i + 1) * perBay);
      if (!slice.length) break;
      const theta = section.anchor.rotationY;
      const offset = i * step;
      const x = section.anchor.x + offset * Math.cos(theta);
      const z = section.anchor.z - offset * Math.sin(theta);
      const hundred = kdcHundred(slice[0].k);

      const bay: Bay = {
        id: `${section.id}-${i}`,
        zone: section.zone,
        section: section.id,
        label: section.label,
        color: section.color,
        kdcRange: `${hundred} ${KDC_LABEL[hundred] ?? ''}`.trim(),
        position: [x, 0, z],
        rotationY: theta,
        rows: section.rows,
        cols: section.cols,
        width: section.bayWidth,
        height: section.bayHeight,
        books: slice,
      };
      layouts[section.zone].bays.push(bay);
    }
  }

  return layouts;
}

export function kdcLabelOf(book: Book): string {
  const h = kdcHundred(book.k);
  return `${h} ${KDC_LABEL[h] ?? ''}`.trim();
}

export const booksInZone = (zone: ZoneLayout) => zone.bays.reduce((n, b) => n + b.books.length, 0);

/** 베이 앞 1.6m 지점의 스폰 좌표 */
export function spawnInFrontOfBay(bay: Bay): { pos: [number, number, number]; yaw: number } {
  const theta = bay.rotationY;
  const fx = Math.sin(theta);
  const fz = Math.cos(theta);
  return {
    pos: [bay.position[0] + fx * 1.75, 1.55, bay.position[2] + fz * 1.75],
    yaw: theta,
  };
}
