import { create } from 'zustand';
import type { Book, BookHit, ShelfMap, ZoneId, ZoneLayout } from './types';
import { buildLayout, ZONE_ORDER } from './data/layout';

export interface ViewPreset {
  pos: [number, number, number];
  target: [number, number, number];
  nonce: number;
}

interface LibraryState {
  layouts: Record<ZoneId, ZoneLayout> | null;
  loading: boolean;
  error: string | null;
  total: number;
  zone: ZoneId;
  view: ViewPreset;
  hovered: { hit: BookHit; x: number; y: number } | null;
  selected: BookHit | null;
  remote: Book | null;

  load: () => Promise<void>;
  setZone: (zone: ZoneId) => void;
  setView: (pos: [number, number, number], target: [number, number, number]) => void;
  hover: (hit: BookHit | null, x?: number, y?: number) => void;
  select: (hit: BookHit) => void;
  selectRemote: (book: Book) => void;
  clearSelection: () => void;
}

export const useLibrary = create<LibraryState>((set, get) => ({
  layouts: null,
  loading: true,
  error: null,
  total: 0,
  zone: 'general',
  view: { pos: [0, 2.3, 9], target: [0, 1.3, 0], nonce: 0 },
  hovered: null,
  selected: null,
  remote: null,

  load: async () => {
    try {
      const res = await fetch('/data/shelves.json');
      if (!res.ok) throw new Error(`서가 데이터를 불러오지 못했습니다 (${res.status})`);
      const shelves = (await res.json()) as ShelfMap;
      const layouts = buildLayout(shelves);
      const total = Object.values(layouts).reduce(
        (n, zone) => n + zone.bays.reduce((m, bay) => m + bay.books.length, 0),
        0
      );
      const requested = new URLSearchParams(window.location.search).get('zone');
      const zone: ZoneId = requested === 'children' || requested === 'archive' ? requested : 'general';
      set((s) => ({
        layouts,
        total,
        loading: false,
        zone,
        view: {
          ...layouts[zone].camera,
          nonce: s.view.nonce + 1,
        },
      }));
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : '알 수 없는 오류' });
    }
  },

  setZone: (zone) => {
    const layouts = get().layouts;
    if (!layouts) return;
    const url = new URL(window.location.href);
    url.searchParams.set('zone', zone);
    window.history.replaceState(null, '', url);
    set((s) => ({
      zone,
      selected: null,
      remote: null,
      hovered: null,
      view: { ...layouts[zone].camera, nonce: s.view.nonce + 1 },
    }));
  },

  setView: (pos, target) => set((s) => ({ view: { pos, target, nonce: s.view.nonce + 1 } })),

  hover: (hit, x = 0, y = 0) => set({ hovered: hit ? { hit, x, y } : null }),

  select: (hit) =>
    set((s) => {
      const [x, , z] = hit.bay.position;
      const rot = hit.bay.rotationY;
      const fx = Math.sin(rot);
      const fz = Math.cos(rot);
      return {
        selected: hit,
        remote: null,
        view: {
          pos: [x + fx * 2.7, 1.72, z + fz * 2.7],
          target: [x + fx * 0.15, 1.05, z + fz * 0.15],
          nonce: s.view.nonce + 1,
        },
      };
    }),

  selectRemote: (book) => set({ remote: book, selected: null }),

  clearSelection: () => set({ selected: null, remote: null }),
}));

export const zoneList = ZONE_ORDER;
