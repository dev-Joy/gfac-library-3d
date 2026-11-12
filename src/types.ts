export interface Book {
  i: string; // isbn13
  t: string; // title
  a: string; // authors
  p: string; // publisher
  y: number; // publication year
  k: string; // KDC class number
  kn: string; // KDC class name
  s: string; // source shelf id
  loc: string; // shelf location name (자료실)
  code: string; // 별치기호
  call: string; // 청구기호(저자기호)
  img: string; // cover url
  d: string; // registration date
}

export type ZoneId = 'general' | 'children' | 'children-c' | 'media';

/** 서가 표찰 단위 (배치도 기준) */
export interface ShelfSection {
  id: string;
  zone: ZoneId;
  label: string;
  color: string;
  sourceShelf: string;
  kdcMin: number; // 포함
  kdcMax: number; // 미포함
  order: number;
  rows: number;
  cols: number;
  bayWidth: number;
  bayHeight: number;
  gap: number;
  anchor: { x: number; z: number; rotationY: number };
  maxBays: number;
  budget: number; // 3D에 배가할 표본 권수
}

export interface ShelfMeta {
  zone: ZoneId;
  label: string;
  sub: string;
  order: number;
  section?: string;
}

export interface ShelfData {
  meta: ShelfMeta;
  books: Book[];
}

export type ShelfMap = Record<string, ShelfData>;

export interface BayBook extends Book {
  shelfId: string;
  section: string;
}

export interface Bay {
  id: string;
  zone: ZoneId;
  section: string;
  label: string;
  color: string;
  kdcRange: string;
  position: [number, number, number];
  rotationY: number;
  rows: number;
  cols: number;
  width: number;
  height: number;
  books: BayBook[];
}

export interface ZoneLayout {
  id: ZoneId;
  label: string;
  description: string;
  bays: Bay[];
  size: { width: number; depth: number };
  spawn: { pos: [number, number, number]; yaw: number };
  camera: { pos: [number, number, number]; target: [number, number, number] };
}

export interface BookHit {
  book: BayBook;
  bay: Bay;
  index: number;
}

export interface BoxCollider {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface FurnitureAnchor {
  kind:
    | 'reading-table'
    | 'pc-partition'
    | 'desk'
    | 'book-cart'
    | 'low-table'
    | 'plant'
    | 'sign'
    | 'cushion';
  pos: [number, number, number];
  rotationY: number;
  zone: ZoneId;
  variant?: string;
}
