# Spec: 3D 도서관 이동 버벅거림 해소 + 전체 56,307권 KDC 배가

- Intent: [INT-002](intent.md) | Status: planned | 작성일: 2026-11-12
- Intent updated_at: 2026-11-12T20:19:46+09:00

## 1. 개요

- **목적**: (1) 1인칭 도보 이동의 프레임 끊김을 제거하고, (2) 로컬 카탈로그 56,307권 전량을 KDC·청구기호 순으로 서가에 배가해 실제 장서 규모와 화면을 일치시킨다.
- **현재 상태**: 3D에는 섹션 예산만큼 표본 1,736권만 배가되어 있고(`public/data/manifest.json`의 `placed`), 31,352권은 자료실 정보가 없어 `other`로 제외된다. 렌더 파이프라인은 후처리·그림자·포인터 경로에서 매 프레임 중복 비용이 발생한다.
- **1차 최적화**: 커밋 `1d39567`로 후처리 `?quality=high` 게이트, ContactShadows `frames=1`·512, 그림자 1024, dpr 1.5, SoftShadows 제거, 서가 프레임 `castShadow` 제거가 반영되어 있다. 본 명세는 이 변경을 되돌리지 않고 실측·검증·보완하는 것을 전제로 한다.
- **문서 상태**: §10의 미해결 질문 5건은 아직 확정되지 않았다. §4의 FR은 §9의 가정 A-1~A-5(권장안)를 기준으로 작성했으며, 결정이 바뀌면 명세 재작성이 필요하다.

## 2. 범위 (In-scope / Out-of-scope)

### In-scope
- 이동 중 성능 기준선 계측과 병목 확정(프레임 시간, FPS, draw call, 후처리 패스).
- 정적 그림자·후처리·포인터 이벤트 경로 최적화(1차 최적화 검증·보완 포함).
- `data/catalog.json` → 56,307권 전량 배가 데이터 파이프라인(런타임 API 미사용).
- 존·섹션 배정 규칙, 베이별 전량 배정과 렌더 슬롯 샘플링, 표찰 권수 표기.
- 섹션 단위 분할 로딩·유휴 프리페치, 전량 검색·상세 패널·서가 이동.
- 테스트·`manifest.json`·`README.md` 갱신과 브라우저 검증.

### Out-of-scope
- 도서관정보나루 실시간 재수집(`scripts/harvest.mjs` 실행)과 운영시스템 연동.
- 실측 도면 치수·가구 재모델링, 서가 수를 수백 개로 늘리는 물리 배치 재설계.
- 56,307권 전량을 개별 3D 스파인으로 동시에 렌더링하는 방식(§9 A-1).
- 신규 의존성·외부 GLTF 에셋·이미지 텍스처 도입.

## 3. 영향 시스템 · 모듈 · 데이터

> 라인 번호는 2026-11-12 작업 트리 기준이다.

| 구분 | 경로:라인 | 현재 동작 / 변경 지점 |
| :--- | :--- | :--- |
| 데이터 생성 | `scripts/build-shelves.mjs:51` | 섹션별 배정 루프. `:67` 예산 표본 추출, `:104` 예산 미달 흡수 |
| 데이터 출력 | `scripts/build-shelves.mjs:144` | 단일 `public/data/shelves.json` 출력 → 섹션 분할 출력으로 대체 |
| 섹션 정의 | `src/data/sections.ts:39` | 10개 섹션, `budget`·`maxBays`·`rows`·`cols`·`anchor` |
| 레이아웃 | `src/data/layout.ts:33` | `buildLayout(data)` — `:95` 예산 절단, `:104` 용량, `:105` `maxBays` 상한 |
| 베이 렌더 | `src/scene/ShelfBay.tsx:67` | `count = rows×cols` 고정, `:87` `books.forEach`로 전량 행렬 설정 |
| 베이 클릭·hover | `src/scene/ShelfBay.tsx:144` | pointermove마다 hover 스토어 갱신, `:245` 인스턴스 3중 메시 |
| 후처리 | `src/scene/Post.tsx:64` | `?quality=high` 게이트, `:86` 블룸 상시, `:109` 매 프레임 `composer.render` |
| 그림자·캔버스 | `src/scene/LibraryCanvas.tsx:39` | 그림자 1024, `:81` ContactShadows `frames=1`·512, `:101` dpr 1.5 |
| 이동·시선 | `src/scene/Player.tsx:96` | 포인터 락 이동마다 `setWalk`, `:146` `useFrame` 이동·충돌 |
| HUD | `src/ui/Hud.tsx:14` | 로컬 인덱스, `:42` 제목·저자 필터, `:213` `hovered` 구독, `:279` 툴팁 |
| 스토어 | `src/store.ts:54` | 단일 `fetch('/data/shelves.json')`, `:60` 총 권수 집계 |
| 타입 | `src/types.ts:1` | `Book`, `:48` `ShelfData`, `:60` `Bay`, `:86` `BookHit` |
| 테스트 | `src/data/layout.test.ts:64` | 예산 합 1,736, `:124` 총 1,736·27베이, `:288` shelves.json 1,736 단언 |
| 브라우저 검증 | `scripts/browser-check.mjs:117` | 이동 검증 — 성능 측정 확장 지점 |
| 문서 | `README.md:5` | 1,736권 표기 |

## 4. 기능 요구사항 (FR-n)

- **FR-1 기준선 계측**: 이동 중(전진 5초) 평균 FPS·p95 프레임 시간·draw call·후처리 패스 수를 측정할 수 있어야 한다. 계측 API는 `import.meta.env.DEV`에서만 노출한다.
- **FR-2 정적 그림자**: 정적 장면의 그림자 맵을 매 프레임 재생성하지 않는다. `gl.shadowMap.autoUpdate=false`로 시작하고, 선택 책(`FocusBook`) 변경 등 그림자에 영향을 주는 변경 시에만 `needsUpdate=true`로 1회 갱신한다.
- **FR-3 후처리 예산**: 기본(균형) 모드에서 씬 렌더는 1회여야 한다. 비네트와 컬러 그레이드는 1개 `ShaderPass`로 병합하고, 블룸은 절반 해상도 입력으로 계산한다. SSAO·Bokeh는 `?quality=high`에서만 켠다.
- **FR-4 포인터 비용**: 포인터 락 중에는 hover 레이캐스트를 수행하지 않는다. 비락 상태에서도 `hover` 스토어 갱신은 인스턴스 ID가 바뀔 때만 수행하고, 좌표 갱신은 rAF 1회로 제한한다. 포인터 락의 yaw/pitch 상태 갱신도 rAF 단위로 병합한다.
- **FR-5 전량 배가**: `data/catalog.json`의 56,307권을 중복·누락 0건으로 정확히 1개 베이에 배정한다. 정렬은 KDC 수치 → `call`(en) → `t`(ko) 오름차순이다. 런타임에 도서관정보나루 API를 호출하지 않는다.
- **FR-6 존·섹션 배정**: `s`가 `general*`이면 종합, `children*`이면 어린이로 배정한다. `other`(31,352권)는 가정 A-2에 따라 KDC로 종합 섹션에 배정한다. `code`(별치)와 KDC 범위로 10개 섹션에 매핑하고, 매핑되지 않는 별치·어린이 일반은 같은 존의 KDC 인접 섹션에 흡수한다.
- **FR-7 KDC 없음**: `k`가 수치로 파싱되지 않는 390권은 가정 A-5에 따라 종합자료실 말미의 `미분류` 베이에만 배정하고 다른 책과 섞지 않는다.
- **FR-8 베이 배정**: 각 섹션의 베이 수는 `min(maxBays, max(1, ceil(books.length / (rows×cols))))`로 산정하되, `maxBays` 상한 때문에 책을 버리지 않는다. 각 베이는 배정된 전량 책 목록(`bay.books`)을 보유한다.
- **FR-9 렌더 슬롯 샘플링**: 베이가 실제로 그리는 스파인 수는 `min(bay.books.length, rows×cols)`다. 슬롯 `s`는 전량 목록의 `floor(s × total / count)`번째 책에 대응한다. 표찰에는 베이의 전량 권수를 표기한다(예: `일반 000~700 · 13,842권`).
- **FR-10 검색·상세**: 로컬 검색은 로드된 전량 책을 제목·저자 부분 일치로 찾고, 결과 선택 시 해당 베이로 이동한다. 상세 패널은 기존 API(소장/대출·표지·책소개)를 유지하되 실패 시 로컬 필드로 폴백한다.
- **FR-11 분할 로딩**: 배가 데이터는 섹션 단위 파일로 분할한다. 첫 화면은 스폰 인접 섹션(원서 800·원서신간)만 로드하고, 나머지 섹션은 유휴 시간에 프리페치한다. HUD에 로드 진행률(`n/56,307`)을 표시한다.
- **FR-12 회귀**: 키보드·조이스틱 이동, 벽·서가 충돌, 존 전환, 책 클릭, 검색, 상세 패널, `?quality=high` 토글이 기존과 동일하게 동작한다.

## 5. 비기능 요구사항 (NFR-n)

- **NFR-1**: 데스크톱 1920×1080에서 이동 중 평균 60fps 이상, p95 프레임 ≤ 20ms. 모바일 30fps 이상(가정 A-3).
- **NFR-2**: 이동 중 1% low가 30fps 미만으로 떨어지지 않는다.
- **NFR-3**: 첫 화면 데이터 전송량은 gzip 1.5MB 이하, 전 섹션 합계는 gzip 4MB 이하다.
- **NFR-4**: 56k 배가 후 데스크톱 Chrome 힙 증가가 150MB 이내다.
- **NFR-5**: `.env` API 키를 브라우저에 노출하지 않고, 신규 의존성을 추가하지 않는다.
- **NFR-6**: 배가 결과는 같은 `catalog.json`에 대해 결정적이다.
- **NFR-7**: `npm run check`(`tsc --noEmit` + `node --test`)와 `npm run build`가 통과한다.
- **NFR-8**: 문서·데이터는 UTF-8 No BOM, 순수 LF를 유지한다.

## 6. 인터페이스 · 데이터 스키마

### 확정(기존 코드)
- `Book` — `src/types.ts:1` (`i,t,a,p,y,k,s,loc,code,call,img,d`).
- `ShelfData` — `src/types.ts:48` (`meta`, `books`).
- `Bay` — `src/types.ts:60` (`rows`, `cols`, `books` 포함).
- `BookHit` — `src/types.ts:86` (`book`, `bay`, `index`).
- `buildLayout(data)` — `src/data/layout.ts:33`.
- `useLibrary.load()` — `src/store.ts:54`, 현재 `/data/shelves.json` 단일 fetch.
- `makeShelfLabel(label, sub, color)` — `src/scene/textures.ts:4`.

### 제안(초안 — 구현 시 확정)
```ts
// public/data/sections/{sectionId}.json
type BookTuple = [string, string, string, string, number, string, string, string];
// [i, t, a, p, y, k, call, img]

interface SectionPayload {
  schema: 1;
  id: string;
  meta: ShelfMeta;
  total: number;
  books: BookTuple[]; // KDC → call → t 정렬 완료
}

// public/data/manifest.json
interface Manifest {
  schema: 1;
  total: number;        // 56307
  placed: number;       // 56307
  unclassified: number; // 390
  duplicates: number;
  unmapped: number;
  generatedAt: string;
  bySection: Record<string, { label: string; zone: ZoneId; books: number; bays: number; renderSlots: number }>;
  byZone: Record<ZoneId, number>;
}

// src/data/layout.ts (신규 순수 함수)
function renderCountOf(total: number, rows: number, cols: number): number;
function sourceIndexAt(slot: number, total: number, count: number): number;
function slotOfSource(index: number, total: number, count: number): number;

// src/store.ts (신규 액션)
loadManifest(): Promise<void>;
loadSection(id: string): Promise<void>;
ensureSections(ids: string[]): Promise<void>;
loadedBooks: number; // HUD 진행률
```
- `ShelfSection.budget`은 폐기하고 `rows×cols×maxBays`를 렌더 용량 기준으로 쓴다. `latest` 섹션의 최신 권수는 `rows×cols`로 계산한다.
- `ShelfBay`는 `bay.books` 전량을 유지하고 `renderCountOf`·`sourceIndexAt`로 표시 슬롯을 계산한다.
- `FocusBook`은 `slotOfSource(index, total, count)`로 3D 위치를 계산한다.

## 7. 예외 · 엣지 케이스

- `data/catalog.json`은 `.gitignore` 대상이다. 없으면 `npm run shelves`는 안내 후 종료하고, 테스트는 커밋된 `public/data`만 사용한다.
- 중복 키(`i|call|t`)가 있으면 1권만 배정하고 `manifest.duplicates`에 기록한다.
- KDC가 없는 390권은 `미분류` 베이에만 배정한다(A-5).
- 매핑되지 않는 별치 코드(`점C`, `향`, `큰글책`, `큰`, `큰글씨`, `소리책`, `RP`, `R`, `RC`)는 같은 존의 KDC 인접 섹션에 흡수하고 `manifest.unmapped`에 건수를 기록한다.
- `other` 31,352권은 A-2에 따라 종합에 배정한다. 실제 구장서(비공개)로 판명되면 매핑 함수 1곳만 교체한다.
- 섹션 파일 로딩 실패·부분 로딩: 해당 섹션만 오류 표시하고 나머지는 계속 렌더링한다. 재시도 버튼을 제공한다.
- 존 전환 중 이전 요청이 늦게 도착하면 `AbortController`로 취소하고 마지막 요청만 반영한다.
- 포인터 락 미지원·권한 거부: 기존 드래그 시선 폴백을 유지한다.
- 모바일·소형 화면: SSAO·Bokeh를 켜지 않고 dpr 상한을 낮춘다.
- 검색어 1자: 기존 2자 규칙을 유지해 로컬 검색을 수행하지 않는다.
- 선택 책이 속한 섹션이 아직 로드되지 않음: 섹션을 로드한 뒤 `focusBay`를 적용한다.
- 렌더 슬롯이 0인 베이(빈 섹션): 인스턴스 메시를 만들지 않는다.
- `?quality=high` 토글: URL 파라미터를 유지하고 새로고침 후에도 상태가 유지된다.

## 8. 수용 기준 (AC-n)

- **AC-1**: Given 이동 키를 5초간 누른 상태에서 When 프레임을 측정하면 Then 데스크톱 평균 60fps 이상, p95 ≤ 20ms다.
- **AC-2**: Given 정적 장면에서 When 1초 이상 대기하면 Then 그림자 맵 재생성 횟수가 0회이고, 책 선택 변경 시 1회 갱신된다.
- **AC-3**: Given 포인터 락 상태에서 When 마우스를 움직이면 Then hover 레이캐스트가 0회다.
- **AC-4**: Given 같은 책 위에서 마우스를 움직일 때 When 인스턴스 ID가 같으면 Then `hover` 스토어 갱신이 0회다.
- **AC-5**: Given `data/catalog.json`에서 When `npm run shelves`를 실행하면 Then `manifest.placed=56307`, 중복 0, 누락 0이다.
- **AC-6**: Given 배가 결과에서 When 각 베이를 검사하면 Then `bay.books`는 KDC→청구기호→제목 오름차순이고, 렌더 슬롯 수는 `min(bay.books.length, rows×cols)`다.
- **AC-7**: Given `other` 책에서 When 배정 결과를 검사하면 Then 전부 종합자료실 섹션 중 하나에 속한다.
- **AC-8**: Given KDC 없는 책에서 When 배정 결과를 검사하면 Then `미분류` 베이에만 속한다.
- **AC-9**: Given 전량 로드 상태에서 When 제목 일부를 검색하면 Then 해당 책이 결과에 나오고 선택 시 올바른 베이로 이동한다.
- **AC-10**: Given 첫 진입에서 When 스폰 인접 섹션만 로드된 상태면 Then 3D가 렌더링되고 HUD에 `n/56,307` 진행률이 표시되며, 나머지 섹션은 유휴 로드된다.
- **AC-11**: Given 기존 회귀 시나리오에서 When `scripts/browser-check.mjs`를 실행하면 Then 콘솔 에러 0, 클릭·검색·이동이 동작한다.
- **AC-12**: Given `?quality=high`에서 When 토글하면 Then SSAO·Bokeh가 켜지고 균형 모드로 돌아오면 꺼진다.

## 9. 가정과 리스크

- **A-1 (Q1 권장)**: 데이터는 전량 배가하되 3D 스파인은 베이별 렌더 슬롯(예: `rows×cols`)으로 균등 샘플링한다. 56k 개별 스파인 상시 렌더는 하지 않는다. → 리스크: "전부 눈에 보이는 배가"를 기대하면 불충족.
- **A-2 (Q2 권장)**: `other` 31,352권을 KDC로 종합자료실에 배정한다. → 리스크: 실제 구장서(비공개)라면 사실 왜곡.
- **A-3 (Q3 권장)**: 데스크톱 60fps + 모바일 30fps.
- **A-4 (Q4 권장)**: 성능 부족 시 화질 자동 하향(균형 모드 기본)을 허용한다.
- **A-5 (Q5 신규)**: KDC 없는 390권은 종합 말미 `미분류` 1베이에 배정한다.
- **리스크**: 섹션 파일이 커지면(`gen-000-700` 약 27k권) 첫 로드가 느려진다 → 스폰 인접 섹션 우선 로드·프리페치.
- **리스크**: `public/data`가 git 추적 대상이라 56k 생성물 커밋 diff가 커진다 → gzip·압축 스키마·리뷰 분리.
- **리스크**: `budget` 제거로 기존 테스트·문서·구버전 폴백이 깨진다 → `layout.ts:63` 폴백을 `rows×cols×maxBays` 기준으로 갱신.
- **리스크**: 그림자 `autoUpdate=false`로 선택 책 그림자가 갱신되지 않을 수 있다 → 선택 변경 시 `needsUpdate`.
- **리스크**: ContactShadows `frames=1`은 플레이어 이동 시 접지 음영이 고정된다 → 시각 허용 여부 확인.
- **리스크**: 1차 최적화가 커밋 `1d39567`로 반영되어 intent.md의 "미커밋" 문구가 스테일이다 → intent 갱신(문구 정정)을 먼저 제안하고, 승인 시 `updated_at` 갱신과 spec/plan 헤더 재동기화가 필요하다.

## 10. 미해결 질문 (Open questions)

- [ ] Q1. 56,307권을 3D에서 어느 수준으로 표현할까? (① 데이터 전량 + 렌더 슬롯 샘플링 ② 물리적으로 전량 렌더(베이·밀도 대폭 확장) ③ 기존 표본 유지)
- [ ] Q2. 자료실 정보가 없는 31,352권(`other`)을 어떻게 배정할까? (① KDC만으로 종합자료실 배치 ② KDC·별치 휴리스틱으로 어린이/종합 분배 ③ 배가 제외)
- [ ] Q3. 성능 목표 기기·수치는? (① 데스크톱 60fps + 모바일 30fps ② 데스크톱 60fps만 ③ 최소 사양 기준 별도)
- [ ] Q4. 성능이 부족할 때 화질 자동 하향(후처리·dpr)을 허용할까? (① 허용 ② 고정 화질 ③ 사용자 토글)
- [ ] Q5. KDC가 없는 390권을 어떻게 처리할까? (① 종합 말미 `미분류` 1베이 ② 000 총류로 편입 ③ 배가 제외)
