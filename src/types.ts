export interface Book {
  i: string; // isbn13
  t: string; // title
  a: string; // authors
  p: string; // publisher
  y: number; // publication year
  k: string; // KDC class number
  kn: string; // KDC class name
  s: string; // shelf id
  loc: string; // shelf location name (자료실)
  code: string; // 별치기호
  call: string; // 청구기호(저자기호)
  img: string; // cover url
  d: string; // registration date
}

export type ZoneId = 'general' | 'children' | 'archive';

export interface ShelfMeta {
  zone: ZoneId;
  label: string;
  sub: string;
  order: number;
}

export interface ShelfData {
  meta: ShelfMeta;
  books: Book[];
}

export type ShelfMap = Record<string, ShelfData>;

export interface BayBook extends Book {
  shelfId: string;
}

export interface Bay {
  id: string;
  zone: ZoneId;
  shelfId: string;
  label: string;
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
  camera: { pos: [number, number, number]; target: [number, number, number] };
}

export interface BookHit {
  book: BayBook;
  bay: Bay;
  index: number;
}
