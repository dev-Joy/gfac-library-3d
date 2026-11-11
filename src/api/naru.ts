/**
 * 도서관정보나루 OpenAPI 클라이언트.
 * dev/preview 서버의 프록시(vite.config.ts)가 authKey 를 주입하므로 키는 브라우저로 내려가지 않는다.
 */
const BASE = '/api/naru';
export const LIB_CODE = '111063';
export const LIB_NAME = '성현동작은도서관';

export interface NaruBookExist {
  hasBook: 'Y' | 'N';
  loanAvailable: 'Y' | 'N';
  libName?: string;
}

export interface NaruBookDetail {
  bookname: string;
  authors: string;
  publisher: string;
  publication_year: string;
  isbn13: string;
  class_no: string;
  class_nm: string;
  bookImageURL: string;
  description?: string;
  loan_count?: string;
}

export interface NaruSearchDoc {
  bookname: string;
  authors: string;
  publisher: string;
  publication_year: string;
  isbn13: string;
  bookImageURL: string;
  class_no?: string;
}

async function request<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    format: 'json',
  });
  const res = await fetch(`${BASE}/${endpoint}?${qs.toString()}`);
  if (!res.ok) throw new Error(`도서관정보나루 요청 실패 (${res.status})`);
  const text = await res.text();
  const json = text.trim() ? JSON.parse(text) : null;
  const body = json?.response;
  if (!body) throw new Error('도서관정보나루 응답이 비어 있습니다.');
  if (body.errCode) throw new Error(body.error ?? String(body.errCode));
  return body as T;
}

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as Promise<T>;
}

/** 특정 도서관 소장/대출가능 여부 (대출가능은 전일 기준) */
export function fetchBookExist(isbn13: string) {
  return cached(`exist:${isbn13}`, async () => {
    const body = await request<{ result?: { hasBook?: string; loanAvailable?: string } }>('bookExist', {
      libCode: LIB_CODE,
      isbn13,
    });
    const result = body.result ?? {};
    return {
      hasBook: (result.hasBook ?? 'N') as 'Y' | 'N',
      loanAvailable: (result.loanAvailable ?? 'N') as 'Y' | 'N',
      libName: LIB_NAME,
    } satisfies NaruBookExist;
  });
}

/** 표지·책소개·대출건수 등 상세 */
export function fetchBookDetail(isbn13: string) {
  return cached(`detail:${isbn13}`, async () => {
    const body = await request<{ detail?: { book?: NaruBookDetail }[] }>('srchDtlList', {
      isbn13,
      loaninfoYN: 'Y',
    });
    const raw = body.detail?.[0]?.book;
    if (!raw) throw new Error('도서 상세 정보가 없습니다.');
    return {
      bookname: raw.bookname,
      authors: raw.authors,
      publisher: raw.publisher,
      publication_year: raw.publication_year,
      isbn13: raw.isbn13,
      class_no: raw.class_no,
      class_nm: raw.class_nm,
      bookImageURL: raw.bookImageURL,
      description: raw.description,
      loan_count: raw.loan_count,
    } satisfies NaruBookDetail;
  });
}

/** 키워드 검색 (전체 도서관 대상) */
export async function searchBooks(keyword: string, pageSize = 10) {
  const body = await request<{ docs?: { doc: NaruSearchDoc }[] }>('srchBooks', {
    keyword,
    pageNo: 1,
    pageSize,
  });
  return (body.docs ?? []).map((d) => d.doc);
}
