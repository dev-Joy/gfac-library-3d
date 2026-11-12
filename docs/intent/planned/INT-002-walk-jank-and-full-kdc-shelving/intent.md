---
id: INT-002
title: 3D 도서관 이동 버벅거림 해소 + 전체 56,307권 KDC 배가
status: planned
priority: P2
created: 2026-11-12
updated: 2026-11-12
updated_at: 2026-11-12T20:19:46+09:00
---

# Intent: 3D 도서관 이동 버벅거림 해소 + 전체 56,307권 KDC 배가

## 문제 (Problem)
- 1인칭 도보(WASD·포인터 락)로 이동할 때 프레임이 끊긴다. 커밋 기준으로는 SSAO·Bokeh·Bloom·SMAA 후처리, ContactShadows(1024·매 프레임), 2048 그림자, SoftShadows가 겹쳐 돌았고, 포인터가 책 위를 지날 때마다 hover 스토어 갱신과 레이캐스트가 발생한다. 작업 트리에는 1차 경량화(후처리 `?quality=high` 게이트, ContactShadows `frames=1`·512, 그림자 1024, dpr 1.5, SoftShadows 제거)가 미커밋 상태로 존재하나 실측·검증 전이다.
- 현재 3D 서가에는 섹션별 예산(budget)만큼 표본 1,736권만 배가되어 있어, 실제 56,307권이 서가에 있다는 사실과 화면이 불일치한다. 31,352권은 `shelf_loc_name`이 비어 `other`로 분류되어 배가 대상에서 빠졌다.

## 제안 결과 (Proposed outcome)
- 이동 중 체감 끊김 없이 걸어 다닐 수 있다. 데스크톱 60fps(모바일 30fps) 기준으로 후처리·그림자·hover 비용이 예산 안에 유지되고, 부족할 때는 화질이 자동 하향된다.
- 로컬 `data/catalog.json`의 56,307권 전량이 KDC(`k`)·청구기호(`call`) 순으로 자료실·섹션 서가에 배치된다(런타임 도서관정보나루 API 호출 없음). 검색으로 어느 책이든 해당 서가·위치로 이동할 수 있고 상세 패널(표지·소장·청구기호)이 동작한다.
- 전량 배가 이후에도 이동 성능 목표가 유지된다(렌더 밀도 LOD·지연 로딩 적용).

## 영향 사용자 및 시스템 (Affected users and systems)
- 사용자: 3D 도서관을 도보로 둘러보는 이용자(데스크톱·모바일 브라우저), 특정 책을 서가에서 찾는 이용자.
- 시스템: `src/scene/Post.tsx`, `src/scene/LibraryCanvas.tsx`, `src/scene/ShelfBay.tsx`, `src/scene/Player.tsx`, `src/ui/Hud.tsx`, `src/store.ts`, `scripts/build-shelves.mjs`, `src/data/sections.ts`·`layout.ts`, `public/data/*`, 신규 전량 배가 데이터 파이프라인.

## 제약 (Constraints)
- React 19 + @react-three/fiber + three 스택을 유지하고, 신규 의존성·외부 에셋은 도입하지 않는다.
- `.env`의 API 키는 브라우저에 노출하지 않는다. 이번 배가는 런타임 API 없이 로컬 카탈로그만 사용한다.
- 작업 트리에 있는 미커밋 1차 최적화(후처리 게이트·그림자·dpr)를 되돌리지 않고, 실측으로 효과를 확인한 뒤 남은 병목만 보완한다.
- `data/catalog.json`(20.5MB)을 그대로 클라이언트에 내려보내지 않는다. 존·섹션 단위 분할, 지연 로딩, 압축이 필요하다.
- 현재 모델링된 베이 물리 용량은 `rows×cols×maxBays` 합계 2,356슬롯으로 56,307권의 4.2%에 불과하다. 전량 배가는 데이터 구조와 렌더 밀도 설계가 함께 필요하다.
- KDC(`k`)가 없는 390권과 자료실 정보가 없는 31,352권의 존 배정 규칙을 정해야 한다(추정으로 채우되 근거를 남긴다).

## 배경 · 결정 · 참조 (Context handoff)
- 원 요구: "이동할 때 버벅거림이 심하다 — 어떻게 줄일까" + "56,000권이 실제 서가에 다 배가되어 있다. API 없더라도 KDC 보고 전부 배치해 달라". (출처: 대화 요청)
- D-01: 성능 개선과 전량 배가를 하나의 intent로 묶고 성능 예산 확보를 선행 조건으로 둔다 — 근거: 전량 배가가 렌더 부하를 키우므로 순서를 분리하면 재작업이 발생 / 폐기 대안: 2개 intent 분리.
- D-02: 배가 원천은 로컬 `data/catalog.json`(56,307권)이고 런타임 API는 쓰지 않는다 — 근거: 사용자가 API 없이 KDC 배치를 요청했고 카탈로그에 `k`·`call`이 존재 / 폐기 대안: `harvest.mjs` 재수집.
- D-03: 1차 경량화가 작업 트리에 있으나 성능 목표는 미검증이다 — T-01에서 남은 병목(hover 레이캐스트·setWalk 이벤트, 전량 배가 시 렌더 밀도)을 실측해 확정한다.
- 참조: `src/scene/Post.tsx:109` 매 프레임 `composer.render`, `:86` 블룸 상시 / `src/scene/LibraryCanvas.tsx:87` ContactShadows `frames=1`·512(1차 적용), `:39` 그림자 1024(1차 적용).
- 참조: `src/scene/ShelfBay.tsx:144` pointermove마다 hover 갱신 → `src/ui/Hud.tsx:213` HUD 리렌더 / `src/scene/Player.tsx:96` 포인터 락 이동마다 `setWalk` 호출.
- 참조: `scripts/build-shelves.mjs:67` 섹션 budget 기준 표본 추출(placed 1,736) / `scripts/harvest.mjs:56` `shelf_loc_name` 없으면 `other`(31,352권) / `src/data/sections.ts:49` 베이 용량 `rows×cols`, maxBays 합계 2,356슬롯.
- 범위 밖·전제: 도서관정보나루 실시간 재수집·운영시스템 연동, 실측 도면 치수, 56k 전량의 개별 3D 클릭(렌더 LOD 시 검색·목록으로 대체)은 범위 밖. 전제: 카탈로그의 `k`(KDC)·`call`(저자기호)를 실제 배가 순서의 기준으로 신뢰한다.

## 미해결 질문 (Open questions)
- [ ] 56,307권을 3D에서 어느 수준으로 표현할까? (① 데이터 전량 + 성능 예산 내 렌더 LOD ② 물리적으로 전량 렌더(베이·밀도 대폭 확장) ③ 기존 표본 유지)
- [ ] 자료실 정보가 없는 31,352권(`other`)을 어떻게 배정할까? (① KDC만으로 종합자료실 배치 ② KDC·별치 휴리스틱으로 어린이/종합 분배 ③ 배가 제외)
- [ ] 성능 목표 기기·수치는? (① 데스크톱 60fps + 모바일 30fps ② 데스크톱 60fps만 ③ 최소 사양 기준 별도)
- [ ] 성능이 부족할 때 화질 자동 하향(후처리·dpr)을 허용할까? (① 허용 ② 고정 화질 ③ 사용자 토글)

## 작업 (Tasks)
- [ ] T-01 [P1] 이동 중 성능 기준선 실측(프레임 시간·draw call·후처리/그림자 비용) 및 병목 확정
- [ ] T-02 [P1] 후처리 1차 경량화(`?quality=high` 게이트·dpr 1.5) 검증 및 잔여 비용(블룸 상시) 조정
- [ ] T-03 [P1] 그림자·조명 1차 경량화(ContactShadows `frames=1`·1024/512, SoftShadows 제거) 검증 및 정적 shadow autoUpdate 검토
- [ ] T-04 [P1] hover·레이캐스트·setWalk 이벤트 경로 스로틀 및 HUD 리렌더 차단
- [ ] T-05 [P2] catalog.json 56,307권 전량 KDC·청구기호 순 배가 데이터 생성(존·섹션 분할·지연 로딩)
- [ ] T-06 [P2] 전량 배가 상태에서 성능 목표 재검증(데스크톱 60fps·모바일 30fps)
