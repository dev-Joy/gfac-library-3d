import { useMemo, useRef, useState } from 'react';
import { useLibrary } from '../store';
import { booksInZone } from '../data/layout';
import type { Book, BookHit } from '../types';
import { searchBooks } from '../api/naru';

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
  const setZone = useLibrary((s) => s.setZone);
  const select = useLibrary((s) => s.select);
  const selectRemote = useLibrary((s) => s.selectRemote);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<Book[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setZone(hit.bay.zone);
    select(hit);
    setOpen(false);
    setQuery('');
    setRemote(null);
  };

  return (
    <div className="search">
      <input
        ref={inputRef}
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
          if (e.key === 'Enter' && local.length === 0) void runRemote();
        }}
      />

      {open && q.length >= 2 && (
        <div className="search-results">
          <div className="search-section">전시된 서가 · {local.length}건</div>
          {local.map((hit) => (
            <button key={`${hit.book.i}-${hit.book.call}`} className="result" onClick={() => pick(hit)}>
              <span className="result-title">{hit.book.t}</span>
              <span className="result-meta">
                {hit.book.a} · {hit.bay.label} · {hit.book.call || '청구기호 없음'}
              </span>
            </button>
          ))}
          {local.length === 0 && <div className="result-empty">전시 서가에 없습니다.</div>}

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

export function Hud() {
  const loading = useLibrary((s) => s.loading);
  const error = useLibrary((s) => s.error);
  const layouts = useLibrary((s) => s.layouts);
  const total = useLibrary((s) => s.total);
  const zone = useLibrary((s) => s.zone);
  const setZone = useLibrary((s) => s.setZone);
  const hovered = useLibrary((s) => s.hovered);
  const select = useLibrary((s) => s.select);

  const zones = layouts ? Object.values(layouts) : [];

  const randomPick = () => {
    if (!layouts) return;
    const target = layouts[zone];
    const bay = target.bays[Math.floor(Math.random() * target.bays.length)];
    const index = Math.floor(Math.random() * bay.books.length);
    select({ book: bay.books[index], bay, index });
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
          <button key={z.id} className={z.id === zone ? 'zone active' : 'zone'} onClick={() => setZone(z.id)}>
            <span className="zone-label">{z.label}</span>
            <span className="zone-count">{booksInZone(z).toLocaleString()}권</span>
          </button>
        ))}
        <button className="zone random" onClick={randomPick} title="현재 자료실에서 무작위로 한 권">
          🎲 책 뽑기
        </button>
      </nav>

      <div className="hint">드래그 회전 · 휠 확대 · 책을 클릭해 펼쳐보기</div>

      {hovered && (
        <div className="tooltip" style={{ left: hovered.x + 16, top: hovered.y + 16 }}>
          <strong>{hovered.hit.book.t}</strong>
          <span>{hovered.hit.book.a}</span>
          <em>{hovered.hit.book.call || '청구기호 없음'}</em>
        </div>
      )}

      {loading && <div className="overlay">서가를 불러오는 중…</div>}
      {error && (
        <div className="overlay error">
          <p>{error}</p>
          <small>node scripts/harvest.mjs 로 서가 데이터를 생성했는지 확인하세요.</small>
        </div>
      )}
    </>
  );
}
