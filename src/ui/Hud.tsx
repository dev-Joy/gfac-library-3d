import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLibrary } from '../store';
import { booksInZone, ZONE_ORDER } from '../data/layout';
import type { Book, BookHit } from '../types';
import { searchBooks } from '../api/naru';
import {
  exitLookLock,
  lookState,
  requestLookLock,
  subscribeLook,
  touchInput,
} from '../scene/input';

function useLocalIndex() {
  const layouts = useLibrary((s) => s.layouts);
  return useMemo(() => {
    const out: BookHit[] = [];
    if (!layouts) return out;
    for (const zone of Object.values(layouts)) {
      for (const bay of zone.bays) {
        bay.books.forEach((book, index) => out.push({ book, bay, index }));
      }
    }
    return out;
  }, [layouts]);
}

function SearchBar() {
  const index = useLocalIndex();
  const focusBay = useLibrary((s) => s.focusBay);
  const selectRemote = useLibrary((s) => s.selectRemote);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<Book[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const local = useMemo(() => {
    if (q.length < 2) return [];
    return index
      .filter((h) => h.book.t.toLowerCase().includes(q) || h.book.a.toLowerCase().includes(q))
      .slice(0, 7);
  }, [q, index]);

  const runRemote = async () => {
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const docs = await searchBooks(query.trim(), 8);
      setRemote(
        docs.map((d) => ({
          i: d.isbn13,
          t: d.bookname,
          a: d.authors,
          p: d.publisher,
          y: Number(d.publication_year) || 0,
          k: d.class_no ?? '',
          kn: '',
          s: '',
          loc: '',
          code: '',
          call: '',
          img: d.bookImageURL,
          d: '',
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const pick = (hit: BookHit) => {
    focusBay(hit);
    setOpen(false);
    setQuery('');
    setRemote(null);
  };

  return (
    <div className="search">
      <input
        value={query}
        placeholder="제목이나 저자로 서가 찾기 (2자 이상)"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setRemote(null);
          setError(null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter') {
            if (local.length) pick(local[0]);
            else void runRemote();
          }
        }}
      />

      {open && q.length >= 2 && (
        <div className="search-results">
          <div className="search-section">서가 · {local.length}건</div>
          {local.map((hit) => (
            <button key={`${hit.book.i}-${hit.book.call}`} className="result" onClick={() => pick(hit)}>
              <span className="result-title">{hit.book.t}</span>
              <span className="result-meta">
                {hit.book.a} · {hit.bay.label} · {hit.book.call || '청구기호 없음'}
              </span>
            </button>
          ))}
          {local.length === 0 && <div className="result-empty">배가된 서가에 없습니다.</div>}

          <button className="search-more" onClick={() => void runRemote()} disabled={loading}>
            {loading ? '찾는 중…' : '도서관정보나루에서 전체 검색'}
          </button>

          {error && <div className="result-empty error">{error}</div>}

          {remote?.map((book) => (
            <button
              key={book.i}
              className="result"
              onClick={() => {
                selectRemote(book);
                setOpen(false);
                setQuery('');
              }}
            >
              <span className="result-title">{book.t}</span>
              <span className="result-meta">
                {book.a} · {book.p} {book.y || ''} · 소장 확인
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const update = (clientX: number, clientY: number) => {
    const dx = clientX - origin.current.x;
    const dy = clientY - origin.current.y;
    const dist = Math.min(46, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    setKnob({ x, y });
    touchInput.x = x / 46;
    touchInput.y = -y / 46;
  };

  const end = () => {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    touchInput.x = 0;
    touchInput.y = 0;
  };

  return (
    <div
      className="joystick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        active.current = true;
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

function LookToggle() {
  const locked = useSyncExternalStore(subscribeLook, () => lookState.locked);
  return (
    <button
      className={locked ? 'look active' : 'look'}
      onClick={() => {
        if (lookState.locked) exitLookLock();
        else void requestLookLock();
      }}
      title="포인터 락으로 마우스 시선을 고정합니다 (Esc 해제)"
    >
      {locked ? '시선 고정 해제 · Esc' : '🖱 마우스 시선 고정'}
    </button>
  );
}

export function Hud() {
  const loading = useLibrary((s) => s.loading);
  const error = useLibrary((s) => s.error);
  const layouts = useLibrary((s) => s.layouts);
  const total = useLibrary((s) => s.total);
  const zone = useLibrary((s) => s.zone);
  const setZone = useLibrary((s) => s.setZone);
  const hovered = useLibrary((s) => s.hovered);
  const focusBay = useLibrary((s) => s.focusBay);

  const zones = layouts ? ZONE_ORDER.map((id) => layouts[id]) : [];

  const randomPick = () => {
    if (!layouts) return;
    const withBooks = ZONE_ORDER.map((id) => layouts[id]).filter((z) => z.bays.length > 0);
    const target = layouts[zone].bays.length ? layouts[zone] : withBooks[0];
    if (!target) return;
    const bay = target.bays[Math.floor(Math.random() * target.bays.length)];
    const index = Math.floor(Math.random() * bay.books.length);
    focusBay({ book: bay.books[index], bay, index });
  };

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            성현동 <span>작은도서관</span>
          </div>
          <div className="brand-sub">METAVERSE SHELF · 관악문화재단</div>
        </div>
        <SearchBar />
        <div className="meta">
          <strong>{total.toLocaleString()}</strong>권 배가
          <span>전체 장서 56,307권 중</span>
        </div>
      </header>

      <nav className="zones">
        {zones.map((z) => (
          <button
            key={z.id}
            className={z.id === zone ? 'zone active' : 'zone'}
            onClick={() => setZone(z.id)}
          >
            <span className="zone-label">{z.label}</span>
            <span className="zone-count">{booksInZone(z).toLocaleString()}</span>
          </button>
        ))}
        <button className="zone random" onClick={randomPick} title="현재 자료실에서 무작위로 한 권">
          🎲 책 뽑기
        </button>
      </nav>

      <div className="hint">W A S D / 방향키 이동 · Shift 달리기 · 드래그 시선 · 책 클릭</div>
      <div className="controls">
        <LookToggle />
      </div>
      <Joystick />

      {hovered && (
        <div className="tooltip" style={{ left: hovered.x + 16, top: hovered.y + 16 }}>
          <strong>{hovered.hit.book.t}</strong>
          <span>{hovered.hit.book.a}</span>
          <em>
            {hovered.hit.bay.label} · {hovered.hit.book.call || '청구기호 없음'}
          </em>
        </div>
      )}

      {loading && <div className="overlay">서가를 불러오는 중…</div>}
      {error && (
        <div className="overlay error">
          <p>{error}</p>
          <small>node scripts/build-shelves.mjs 로 서가 데이터를 생성했는지 확인하세요.</small>
        </div>
      )}
    </>
  );
}
