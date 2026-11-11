import { useEffect, useState } from 'react';
import { useLibrary } from '../store';
import { fetchBookDetail, fetchBookExist, LIB_NAME } from '../api/naru';
import type { NaruBookDetail } from '../api/naru';

type Status = { state: 'loading' } | { state: 'done'; hasBook: boolean; loanAvailable: boolean } | { state: 'error' };

export function BookPanel() {
  const selected = useLibrary((s) => s.selected);
  const remote = useLibrary((s) => s.remote);
  const clear = useLibrary((s) => s.clearSelection);
  const book = selected?.book ?? remote;

  const [status, setStatus] = useState<Status>({ state: 'loading' });
  const [detail, setDetail] = useState<NaruBookDetail | null>(null);

  useEffect(() => {
    if (!book) return;
    let alive = true;
    setStatus({ state: 'loading' });
    setDetail(null);

    fetchBookExist(book.i)
      .then((res) => {
        if (alive) setStatus({ state: 'done', hasBook: res.hasBook === 'Y', loanAvailable: res.loanAvailable === 'Y' });
      })
      .catch(() => alive && setStatus({ state: 'error' }));

    fetchBookDetail(book.i)
      .then((res) => alive && setDetail(res))
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [book?.i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clear]);

  if (!book) return null;

  const cover = book.img || detail?.bookImageURL || '';
  const description = detail?.description?.replace(/<[^>]+>/g, '').trim();
  const loanCount = detail?.loan_count;

  return (
    <aside className="panel">
      <button className="panel-close" onClick={clear} aria-label="닫기">
        ✕
      </button>

      <div className="panel-cover">
        {cover ? (
          <img src={cover} alt={`${book.t} 표지`} loading="lazy" />
        ) : (
          <div className="cover-fallback">{book.t.slice(0, 1)}</div>
        )}
      </div>

      <div className="panel-body">
        <h2>{book.t}</h2>
        <p className="authors">{book.a}</p>
        <p className="pub">
          {book.p} {book.y > 0 && `· ${book.y}`}
        </p>

        <div className="badges">
          {status.state === 'loading' && <span className="badge muted">소장 확인 중…</span>}
          {status.state === 'error' && <span className="badge muted">확인 불가</span>}
          {status.state === 'done' &&
            (status.hasBook ? (
              <>
                <span className="badge ok">소장</span>
                <span className={status.loanAvailable ? 'badge ok' : 'badge warn'}>
                  {status.loanAvailable ? '대출 가능' : '대출 중'}
                </span>
              </>
            ) : (
              <span className="badge warn">미소장</span>
            ))}
          {loanCount && <span className="badge muted">{Number(loanCount).toLocaleString()}회 대출</span>}
        </div>

        <dl className="info">
          {book.k && (
            <>
              <dt>KDC</dt>
              <dd>
                {book.k} {book.kn && <span className="dim">{book.kn}</span>}
              </dd>
            </>
          )}
          <dt>청구기호</dt>
          <dd>{book.call || <span className="dim">정보 없음</span>}</dd>
          <dt>자료실</dt>
          <dd>{book.loc || <span className="dim">{selected ? '미지정' : '서가 미배가'}</span>}</dd>
          {book.code && (
            <>
              <dt>별치기호</dt>
              <dd>{book.code}</dd>
            </>
          )}
          <dt>ISBN</dt>
          <dd className="mono">{book.i}</dd>
        </dl>

        {description && (
          <div className="desc">
            <h3>책 소개</h3>
            <p>{description}</p>
          </div>
        )}

        <p className="source">
          {LIB_NAME} · 도서관정보나루 OpenAPI
          <br />
          대출 가능 여부는 전일 기준입니다.
        </p>
      </div>
    </aside>
  );
}
