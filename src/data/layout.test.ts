import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildLayout, booksInZone, kdcLabelOf } from './layout.ts';
import type { Book, ShelfMap } from '../types.ts';

function makeBook(id: number, kdc: string, call: string): Book {
  return {
    i: `979000000${String(id).padStart(4, '0')}`,
    t: `테스트 도서 ${id}`,
    a: '저자',
    p: '출판사',
    y: 2020,
    k: kdc,
    kn: '',
    s: 'general',
    loc: '성현동작은도서관 종합자료실',
    code: '',
    call,
    img: '',
    d: '2024-01-01',
  };
}

function fixture(): ShelfMap {
  return {
    general: {
      meta: { zone: 'general', label: '종합자료실', sub: 'KDC', order: 1 },
      books: [
        makeBook(1, '813.6', '나111'),
        makeBook(2, '001.3', '가222'),
        makeBook(3, '320.1', '다333'),
        makeBook(4, '951.1', '라444'),
      ],
    },
    children: {
      meta: { zone: 'children', label: '어린이자료실', sub: '그림책', order: 1 },
      books: [makeBook(5, '813.8', '마555'), makeBook(6, '375.1', '바666')],
    },
    other: {
      meta: { zone: 'archive', label: '보존서고', sub: '구장서', order: 1 },
      books: [makeBook(7, '843.6', 'F492p')],
    },
  };
}

describe('buildLayout', () => {
  it('자료실별로 베이를 만들고 권수를 보존한다', () => {
    const layout = buildLayout(fixture());

    assert.deepEqual(Object.keys(layout), ['general', 'children', 'archive']);
    assert.equal(booksInZone(layout.general), 4);
    assert.equal(booksInZone(layout.children), 2);
    assert.equal(booksInZone(layout.archive), 1);
    assert.ok(layout.general.bays.length > 0);
  });

  it('베이 안의 책을 KDC → 청구기호 순으로 꽂는다', () => {
    const layout = buildLayout(fixture());
    const books = layout.general.bays.flatMap((bay) => bay.books);
    assert.deepEqual(
      books.map((b) => b.k),
      ['001.3', '320.1', '813.6', '951.1']
    );
    assert.equal(books[0].call, '가222');
  });

  it('모든 베이를 방 안쪽(뒤·좌·우 벽)에 배치한다', () => {
    const layout = buildLayout(fixture());
    const { width, depth } = layout.general.size;

    for (const bay of layout.general.bays) {
      const [x, y, z] = bay.position;
      assert.equal(y, 0);
      assert.ok(Math.abs(x) <= width / 2);
      assert.ok(Math.abs(z) <= depth / 2);
      assert.ok([0, Math.PI / 2, -Math.PI / 2].includes(bay.rotationY));
    }
  });

  it('빈 서가는 만들지 않는다', () => {
    const layout = buildLayout(fixture());
    for (const zone of Object.values(layout)) {
      for (const bay of zone.bays) assert.ok(bay.books.length > 0);
    }
  });

  it('KDC 표찰을 3자리 분류로 만든다', () => {
    assert.equal(kdcLabelOf(makeBook(1, '813.6', '가')), '800 문학');
    assert.equal(kdcLabelOf(makeBook(2, '001.3', '가')), '000 총류');
  });
});
