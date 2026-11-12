# Spec: 성현동작은도서관 3D 실사 재현 (서가배치도·내부 사진 기반)

- Intent: [INT-001](intent.md) | Status: planned | 작성일: 2026-11-11
- Intent updated_at: 2026-11-12T17:47:16+09:00

## 1. 개요
- `public/서가배치도_성현.png`의 3개 서가 구역과 `public/성현동작은도서관_내부1~3.jpg`의 실내 사진을 근거로, 현재의 어두운 가상 ㄷ자 씬을 실제 도서관과 유사한 밝은 1인칭 3D 공간으로 재구성한다.
- 도서 데이터는 이미 수집된 도서관정보나루(111063) 카탈로그(`data/catalog.json`)와 표본 서가(`public/data/shelves.json`)를 재사용하고, 서가 라벨을 배치도에 고정한 뒤 장서를 KDC·청구기호 순으로 꽂는다.
- 열람 테이블·의자·PC 파티션·북카트·자료실 데스크·미디어실 유리문을 three.js 프리미티브로 절차 모델링해 사진과 유사한 인상을 만든다.
- 탐색 방식은 1인칭 도보(WASD + 마우스 시선)이며, 기존 책 클릭·상세 패널·정보나루 검색 연동은 유지한다.

## 2. 범위 (In-scope / Out-of-scope)

### In-scope
- 하나의 연속된 평면에 배치도 3개 구역(종합 A / 어린이 B / 어린이 별치 C)과 미디어실·디지털정보실 외피를 배치한다.
- 서가 베이를 배치도 라벨(§6.2의 10개 섹션)에 고정하고, 장서를 KDC → 청구기호 → 제목 순으로 정렬해 꽂는다.
- 밝은 실내 톤(흰 벽, 테라조 바닥, 천장 패널등, 창·블라인드)과 사진 속 가구를 절차 모델로 재현한다.
- 1인칭 도보 이동, 벽·서가·가구 충돌, 모바일 터치 이동 UI를 구현한다.
- 기존 검색·책 선택·상세 패널·정보나루 API 연동을 1인칭 환경에 맞게 회귀 없이 유지한다.

### Out-of-scope
- 실측 도면 기반의 정확한 치수·면적 재현(배치도는 개념도이므로 상대 비율로 구현).
- 보존서고(구장서 `other` 서가 240권)의 3D 배치 — 배치도·사진에 없으므로 데이터는 보존하되 씬에서 제외한다.
- 56,307권 전체 표시(표본 약 1,700권 유지), 도서관 운영시스템·대출 DB 연동.
- 사진 원본을 텍스처/파노라마로 사용하는 방식, 외부 GLTF 에셋 도입, 다중 사용자·음성 안내.

## 3. 영향 시스템 · 모듈 · 데이터
| 경로 | 현재 상태 | 변경 방향 |
| :--- | :--- | :--- |
| `src/types.ts:31` | `ZoneId = 'general' \| 'children' \| 'archive'` | `general \| children \| children-c \| media`로 재정의 |
| `src/types.ts:33` | `ShelfMeta { zone, label, sub, order }` | `section` 필드 추가(배치도 섹션 ID) |
| `src/types.ts:51` | `Bay { label, kdcRange, position, rotationY, ... }` | `section`, `zone` 갱신, 위치는 평면 모듈에서 주입 |
| `src/types.ts:66` | `ZoneLayout { bays, size, camera }` | `spawn`, `bounds`, `sections` 추가 |
| `src/data/layout.ts:84` | `buildLayout()`이 서가별로 베이를 만들어 ㄷ자 배치 | 섹션 기반 베이 생성 + `floorplan.ts` 좌표 사용 |
| `src/data/layout.ts:146-176` | 뒤·좌·우 벽 ㄷ자 자동 배치 | 제거하고 배치도 평면 좌표로 대체 |
| `src/data/sections.ts` (신규) | 없음 | 배치도 라벨 ↔ 서가 그룹 ↔ KDC 범위 매핑 SSOT |
| `src/data/floorplan.ts` (신규) | 없음 | 벽·출입구·가구 앵커·스폰 좌표·충돌 박스 |
| `scripts/build-shelves.mjs:20-48` | 서가 예산·메타가 하드코딩, `other` 포함 | 섹션 메타 방출, `other` 제외, 섹션별 예산 |
| `public/data/shelves.json` · `manifest.json` | 7개 서가 1,976권 | 6개 서가 1,736권(구장서 240권 제외) + 섹션 메타 |
| `src/scene/Room.tsx:22-27` | 벽 `#5a4c3e`, 천장 `#2c2620`의 어두운 톤 | 흰 벽·밝은 천장·창/블라인드로 전면 교체 |
| `src/scene/Room.tsx:125,162` | 단일 열람 테이블 1종 | 가구 컴포넌트로 분리·다수 배치 |
| `src/scene/ZoneRoom.tsx:18-49` | 어두운 앰비언트/포인트 조명 | 밝은 주광 + 패널등 조명으로 조정 |
| `src/scene/LibraryCanvas.tsx:39-57` | 그림자 캔버스 + OrbitControls | 1인칭 컨트롤로 교체, 배경·포그 톤 조정 |
| `src/scene/CameraRig.tsx:31-66` | 뷰 프리셋으로 카메라 lerp 이동 | 도보 모드에서 비활성, 스폰 이동만 사용 |
| `src/store.ts:14-100` | `view` 프리셋·`select` 시 카메라 텔레포트 | `walk` 상태·스폰·베이 포커스로 대체, 선택 시 텔레포트 제거 |
| `src/ui/Hud.tsx:139-204` | 구역 탭·힌트·툴팁 | 4개 구역 탭, 도보 조작 안내, 터치 UI 추가 |
| `scripts/browser-check.mjs:74-142` | `layouts.general`·`rotationY === 0` 전제 | 새 평면·도보 상태 기준으로 검증 스크립트 갱신 |
| `src/data/layout.test.ts:50` | `['general','children','archive']` 기대 | 4개 존·섹션 라벨·정렬 기준으로 재작성 |
| `vite.config.ts:15-38`, `src/api/naru.ts:6` | 정보나루 프록시·`LIB_CODE=111063` | 변경 없음(키 노출 금지 유지) |

## 4. 기능 요구사항 (FR-n)
- **FR-1 (평면)**: 하나의 연속 평면에 4개 존(종합 A, 어린이 B, 어린이 별치 C, 미디어실)을 배치하고, 존 사이는 벽 출입구로 연결한다.
- **FR-2 (섹션 고정)**: 모든 베이는 §6.2의 10개 섹션 라벨 중 하나에 속하며, 베이 순서는 배치도의 상대 위치(좌→우, 안→밖)를 따른다.
- **FR-3 (장서 정렬)**: 각 베이의 책은 KDC 대분류 → KDC 실수값 → 청구기호 → 제목 순으로 정렬한다. 라벨과 무관한 KDC 책은 인접 섹션으로 흡수하고 빈 베이를 만들지 않는다.
- **FR-4 (충돌)**: 플레이어는 벽·서가·테이블·데스크·유리벽을 통과하지 못하며, 통로 폭은 최소 1.0m를 확보한다.
- **FR-5 (1인칭 이동)**: 데스크톱은 WASD/방향키 이동 + 마우스 시선(포인터 락), 모바일은 가상 조이스틱 + 드래그 시선을 제공한다. 시선 높이는 1.55m로 고정한다.
- **FR-6 (상호작용)**: 책 hover 시 툴팁, 클릭 시 상세 패널이 열리며 카메라가 순간 이동하지 않는다. ESC/닫기로 패널을 닫는다.
- **FR-7 (검색·구역 이동)**: 구역 탭 또는 검색 결과 선택 시 해당 베이 앞 스폰 지점으로 이동해 시선을 서가로 향하게 하고, 검색 결과는 상세 패널을 연다.
- **FR-8 (조명·재질)**: 흰 벽, 테라조 바닥, 밝은 천장 패널등, 창과 블라인드를 적용하고 어두운 포그·갈색 벽을 제거한다.
- **FR-9 (가구)**: 내부1 사진 기준 열람 테이블 3~4세트, 검정/파랑 의자, PC 파티션 좌석 2열, 자료실 데스크, 내부2 기준 낮은 원목 서가·북카트 2대, 안내 사인을 배치한다.
- **FR-10 (미디어실)**: 내부3 사진 기준 `ON AIR` 유리문, 노란 간판, 미디어실 내부 어두운 톤·모니터, 디지털정보실 유리벽을 재현한다.
- **FR-11 (표찰·사인)**: 서가 표찰은 실제 표기(`유 800`, `원서 000~700`, `일반 800` 등)를 사용하고, 자료실 사인은 사진과 유사한 청록/노랑 계열로 만든다.
- **FR-12 (데이터 파이프라인)**: `build-shelves.mjs`가 섹션 메타를 방출하고 `layout.ts`가 이를 소비한다. 런타임에 정보나루 API 키를 노출하지 않는다.
- **FR-13 (기존 기능 보존)**: 검색(로컬+원격), 책 뽑기, 툴팁, 상세 패널(소장/대출·표지·책소개)은 그대로 동작한다.

## 5. 비기능 요구사항 (NFR-n)
- **NFR-1 (성능)**: 데스크톱 60fps 목표, 모바일 30fps 이상. 책은 기존 `InstancedMesh`를 유지하고, 가구는 가능한 한 병합 지오메트리/공유 재질을 사용한다.
- **NFR-2 (로딩)**: `shelves.json`은 gzip 1.5MB 이하, 초기 인터랙션까지 3초 이내(로컬 기준).
- **NFR-3 (안정성)**: 이동 중 프레임 드랍이 있어도 충돌·시선이 발산하지 않고, 벽 모서리에서 끼이지 않는다.
- **NFR-4 (호환)**: 최신 Chrome/Edge/Safari, 모바일 390×844 뷰포트에서 조작 UI가 가려지지 않는다.
- **NFR-5 (보안)**: `.env`의 `LIBRARY_API_KEY`는 클라이언트 번들에 포함되지 않는다(`vite.config.ts` 프록시 유지).
- **NFR-6 (접근성)**: 키보드만으로 이동·탭 전환이 가능하고, 포인터 락 미지원 환경에서도 이동 가능한 폴백을 제공한다.
- **NFR-7 (결정성)**: 동일 데이터에 대해 베이 위치·책 순서가 항상 동일하다(랜덤 배치 금지).
- **NFR-8 (유지보수)**: 배치도 라벨·KDC 범위·가구 앵커는 데이터 모듈 1곳(`sections.ts`, `floorplan.ts`)에서만 수정한다.

## 6. 인터페이스 · 데이터 스키마

### 6.1 타입 (제안 초안)
```ts
export type ZoneId = 'general' | 'children' | 'children-c' | 'media';

export interface ShelfSection {
  id: string;            // 'gen-000-700' 등 §6.2
  zone: ZoneId;
  label: string;         // 서가 표찰 문구
  color: string;         // 배치도 색상
  sourceShelf: string;   // shelves.json 키
  kdcMin: number;        // 포함 하한(포함)
  kdcMax: number;        // 포함 상한(미포함)
  order: number;
  capacity: number;      // 베이당 권수(rows*cols)
}

export interface Bay {
  id: string;
  zone: ZoneId;
  section: string;
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
  spawn: { pos: [number, number, number]; yaw: number };
  camera: { pos: [number, number, number]; target: [number, number, number] }; // 탭 전환용
}
```
- 위 타입은 **제안(초안)**이며, 구현 단계에서 `code-planner`가 확정한다. `ZoneLayout`의 기존 `camera`는 구역 탭 이동용으로 유지한다.

### 6.2 배치도 섹션 매핑 (확정)
| 섹션 ID | 존 | 표찰 | 원천 서가 | KDC 범위 | 색 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `gen-000-700` | general | 일반 000~700 | general | 000–799 | 연두 |
| `gen-800` | general | 일반 800~803 | general | 800–999 (9xx 흡수) | 연두 |
| `gen-west-800` | general | 원서 800 | general-west | 800–999 | 주황 |
| `gen-west-new` | general | 원서신간 | general-west | 전체 중 최신 등록 30권 | 주황 |
| `child-eng-c` | children | 영C | children-west-영C | 000–999 | 하늘 |
| `child-west-000-700` | children | 원서 000~700 | general-west | 000–799 | 주황 |
| `child-800-900` | children | 일반 800,900 | children | 800–999 | 연두 |
| `child-toddler` | children | 유 | children-유 | 000–999 | 회색 |
| `child-c-000-200` | children | C 000~200 | children-C | 000–299 | 분홍 |
| `child-c-300-900` | children-c | C 300~900 | children-C | 300–999 | 분홍 |
- `general-west`는 최신 30권을 `gen-west-new`로 먼저 배정한 뒤, 800 이상은 `gen-west-800`, 800 미만은 `child-west-000-700`으로 분할한다(중복 배정 금지).
- `other`(구장서)는 씬에서 제외한다.
- 섹션별 베이 수는 `ceil(배정 권수 / capacity)`로 계산하고, 0권이면 베이를 만들지 않는다.

### 6.3 평면·충돌 데이터 (제안 초안)
```ts
export interface WallBox { x: number; z: number; w: number; d: number; }
export interface FurnitureAnchor {
  kind: 'reading-table' | 'pc-partition' | 'desk' | 'book-cart' | 'low-shelf' | 'plant';
  pos: [number, number, number];
  rotationY: number;
  zone: ZoneId;
}
export interface FloorPlan {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  colliders: WallBox[];       // 벽·서가·가구 충돌 박스
  furniture: FurnitureAnchor[];
  zoneSpawns: Record<ZoneId, { pos: [number, number, number]; yaw: number }>;
}
```
- 좌표계는 Y-up, 1 unit = 1m. 종합 A는 좌측, 어린이 B는 중앙, 별치 C는 우측, 미디어실은 입구 쪽 모서리에 둔다.

### 6.4 스토어 (제안 초안)
- `walk: { pos: [number, number, number]; yaw: number; pitch: number }` 추가.
- `setZone(zone)`은 `zoneSpawns`로 플레이어를 이동시키고 `view` 프리셋은 탭 이동 애니메이션에만 사용한다.
- `select(hit)`은 패널만 열고 카메라를 이동시키지 않는다. `focusBay(bay)`가 스폰 좌표를 계산한다.

## 7. 예외 · 엣지 케이스
- **E-1**: 섹션에 배정할 책이 0권이면 베이를 생성하지 않고 라벨도 표시하지 않는다.
- **E-2**: `shelves.json`에 `meta.section`이 없는 구버전 데이터면 `sections.ts` 매핑으로 폴백하고 콘솔 경고 1회만 남긴다.
- **E-3**: 포인터 락이 거부되면(iframe·헤드리스·권한) 클릭-드래그 시선 + 방향키 이동으로 폴백한다.
- **E-4**: 모바일에서 터치 UI와 상세 패널이 겹치면 패널을 하단 시트로 전환한다.
- **E-5**: WebGL 컨텍스트 생성 실패 시 기존 HUD 오류 오버레이 문구를 재사용한다.
- **E-6**: 벽 모서리·문턱에서 충돌이 막히면 마지막 정상 위치로 1프레임 롤백한다.
- **E-7**: 표찰 텍스트가 베이 폭을 넘으면 폰트 크기를 줄이고 2줄로 감싼다.
- **E-8**: 표지 이미지 로드 실패 시 기존 색상 폴백을 유지한다(`FocusBook.tsx:6-37`).
- **E-9**: 미디어실에는 서가가 없으므로 `booksInZone(media)=0`을 정상으로 처리한다.
- **E-10**: `ResizeObserver`/뷰포트 변경 시 충돌·카메라 종횡비가 갱신된다.

## 8. 수용 기준 (AC-n)
- **AC-1**: Given 배치도 섹션 표, When 앱을 로드하면, Then 4개 존과 10개 섹션 라벨이 모두 존재하고 `archive` 존은 없다.
- **AC-2**: Given 샘플 서가 데이터, When 레이아웃을 생성하면, Then 각 베이의 표찰은 §6.2 라벨 중 하나이고 책은 KDC→청구기호→제목 순이다.
- **AC-3**: Given 1,736권, When 로드하면, Then 씬에 배치된 총 권수가 1,736권이며 `other` 240권은 포함되지 않는다.
- **AC-4**: Given 도보 모드, When W를 2초 누르면, Then 플레이어가 전진하고 서가·벽을 통과하지 않는다.
- **AC-5**: Given 서가 앞, When 책을 클릭하면, Then 상세 패널이 열리고 카메라 위치는 변하지 않는다.
- **AC-6**: Given 검색 결과, When 항목을 선택하면, Then 해당 베이 앞으로 이동하고 상세 패널이 열린다.
- **AC-7**: Given 어느 존, When 화면을 캡처하면, Then 벽·천장이 밝은 톤이고 어두운 갈색 포그가 없다.
- **AC-8**: Given 종합 A, When 둘러보면, Then 열람 테이블·의자·PC 파티션·데스크가 보인다.
- **AC-9**: Given 미디어실, When 접근하면, Then `ON AIR` 유리문과 노란 사인이 보인다.
- **AC-10**: Given 모바일 390×844, When 로드하면, Then 이동 UI가 노출되고 탭·패널이 겹치지 않는다.
- **AC-11**: Given 전체 검증, When `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`를 실행하면, Then 모두 종료 코드 0이고 브라우저 콘솔 에러가 0건이다.
- **AC-12**: Given 정보나루 검색, When 원격 검색을 실행하면, Then 기존과 동일하게 결과가 표시되고 네트워크에 `authKey`가 노출되지 않는다.

## 9. 가정과 리스크
- **가정 A-1**: 배치도의 3개 박스는 별도 건물이 아니라 같은 층의 3개 서가 클러스터이며, 색은 장서 구분(원서/일반/영C/유/C)을 뜻한다.
- **가정 A-2**: `general-west`의 KDC 800 이상은 좌측 A, 800 미만은 중앙 B에 배치한다(배치도 표기 기준).
- **가정 A-3**: 사진에 보이는 가구 수량·배치는 대표값이며, 통로 확보를 위해 일부 조정한다.
- **리스크 R-1**: 배치도에 실측 치수가 없어 실제와 비율이 다를 수 있다 → 상대 위치·동선 우선, §2 Out-of-scope 명시.
- **리스크 R-2**: 1인칭 전환으로 기존 테스트·브라우저 검증이 깨진다 → `layout.test.ts`·`browser-check.mjs`를 같은 단계에서 갱신.
- **리스크 R-3**: 가구·유리·조명 추가로 draw call이 증가한다 → 지오메트리 병합·재질 공유·그림자 범위 제한.
- **리스크 R-4**: 포인터 락이 자동화 환경에서 차단된다 → 키보드/드래그 폴백과 디버그 브리지 유지.
- **리스크 R-5**: 섹션 매핑이 실제 서가와 다를 수 있다 → 매핑을 `sections.ts` 1곳에 두고 후속 수정 비용 최소화.
- **리스크 R-6**: `docs/intent` 인계 4요소는 모두 기록되어 있음(누락 없음).
- **가정 A-4**: 기존 `total`(56,307권) 표기는 유지하고, 3D 배치 권수는 별도로 표기한다.

## 10. 미해결 질문 (Open questions)
- 없음 (미확인 질문이 없습니다)
