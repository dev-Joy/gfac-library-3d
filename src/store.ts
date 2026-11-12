import { create } from 'zustand';
import type { Book, BookHit, ShelfMap, ZoneId, ZoneLayout } from './types';
import { buildLayout, spawnInFrontOfBay, ZONE_ORDER } from './data/layout';
import { ZONE_INFO } from './data/sections';

export interface WalkState {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
}

interface LibraryState {
  layouts: Record<ZoneId, ZoneLayout> | null;
  loading: boolean;
  error: string | null;
  total: number;
  zone: ZoneId;
  walk: WalkState;
  /** 탭·검색으로 스폰이 바뀐 시점 — Player가 즉시 카메라를 재배치한다. */
  walkEpoch: number;
  hovered: { hit: BookHit; x: number; y: number } | null;
  selected: BookHit | null;
  remote: Book | null;

  load: () => Promise<void>;
  setZone: (zone: ZoneId) => void;
  syncZone: (zone: ZoneId) => void;
  setWalk: (walk: Partial<WalkState>) => void;
  hover: (hit: BookHit | null, x?: number, y?: number) => void;
  select: (hit: BookHit) => void;
  selectRemote: (book: Book) => void;
  clearSelection: () => void;
  focusBay: (hit: BookHit) => void;
}

const spawnWalk = (zone: ZoneId): WalkState => {
  const spawn = ZONE_INFO[zone].spawn;
  return { x: spawn.x, z: spawn.z, yaw: spawn.yaw, pitch: 0 };
};

export const useLibrary = create<LibraryState>((set, get) => ({
  layouts: null,
  loading: true,
  error: null,
  total: 0,
  zone: 'general',
  walk: spawnWalk('general'),
  walkEpoch: 0,
  hovered: null,
  selected: null,
  remote: null,

  load: async () => {
    try {
      const res = await fetch('/data/shelves.json');
      if (!res.ok) throw new Error(`서가 데이터를 불러오지 못했습니다 (${res.status})`);
      const payload = (await res.json()) as { sections?: ShelfMap } | ShelfMap;
      const layouts = buildLayout(payload);
      const total = Object.values(layouts).reduce(
        (n, zone) => n + zone.bays.reduce((m, bay) => m + bay.books.length, 0),
        0
      );
      const requested = new URLSearchParams(window.location.search).get('zone');
      const zone: ZoneId =
        requested && (ZONE_ORDER as string[]).includes(requested) ? (requested as ZoneId) : 'general';
      set((s) => ({
        layouts,
        total,
        loading: false,
        zone,
        walk: spawnWalk(zone),
        walkEpoch: s.walkEpoch + 1,
      }));
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : '알 수 없는 오류' });
    }
  },

  setZone: (zone) => {
    if (!get().layouts) return;
    const url = new URL(window.location.href);
    url.searchParams.set('zone', zone);
    window.history.replaceState(null, '', url);
    set({ zone, selected: null, remote: null, hovered: null, walk: spawnWalk(zone), walkEpoch: get().walkEpoch + 1 });
  },

  syncZone: (zone) => {
    if (get().zone === zone) return;
    const url = new URL(window.location.href);
    url.searchParams.set('zone', zone);
    window.history.replaceState(null, '', url);
    set({ zone });
  },

  setWalk: (walk) => set((s) => ({ walk: { ...s.walk, ...walk } })),

  hover: (hit, x = 0, y = 0) => set({ hovered: hit ? { hit, x, y } : null }),

  select: (hit) => set({ selected: hit, remote: null }),

  selectRemote: (book) => set({ remote: book, selected: null }),

  clearSelection: () => set({ selected: null, remote: null }),

  focusBay: (hit) => {
    const spawn = spawnInFrontOfBay(hit.bay);
    set({
      selected: hit,
      remote: null,
      zone: hit.bay.zone,
      walk: { x: spawn.pos[0], z: spawn.pos[2], yaw: spawn.yaw, pitch: 0 },
      walkEpoch: get().walkEpoch + 1,
    });
    const url = new URL(window.location.href);
    url.searchParams.set('zone', hit.bay.zone);
    window.history.replaceState(null, '', url);
  },
}));

export const zoneList = ZONE_ORDER;
