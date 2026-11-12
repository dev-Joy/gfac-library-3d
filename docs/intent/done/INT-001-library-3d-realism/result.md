# Result: 성현동작은도서관 3D 실사 재현 (서가배치도·내부 사진 기반)
- Intent: [INT-001](intent.md) | 완료일: 2026-11-12 | Tier: 3 | Spec/Plan: [spec.md](spec.md) · [plan.md](plan.md)

## 결과 요약
- 배치도 3구역·4개 존·10개 섹션 구조로 씬을 재작성하고, 1,736권(구장서 `other` 제외)을 KDC·청구기호 순으로 배치도 라벨에 고정 배가했다.
- 사진 톤(흰 벽·테라조 바닥·패널등·창/블라인드)과 열람 테이블·PC 파티션·자료실 데스크·북카트·미디어실(ON AIR) 유리문을 절차 모델로 재현하고, 1인칭 도보(WASD·포인터 락·충돌·모바일 조이스틱)를 추가했다.
- 기존 책 클릭 상세 패널·로컬/원격 검색·정보나루 연동을 회귀 없이 유지했고, 검색 결과 선택 시 해당 베이 앞 스폰 이동까지 검증했다.

## 변경 산출물
| 경로 | 변경 | 핵심 내용 1줄 |
| :--- | :--- | :--- |
| `src/data/sections.ts` | 신규 | 배치도 라벨 ↔ 서가 그룹 ↔ KDC 범위 매핑 SSOT(10개 섹션) |
| `src/data/floorplan.ts` | 신규 | 벽·출입구·가구 앵커·존 스폰·충돌 박스 좌표 정의 |
| `src/data/layout.ts` | 수정 | ㄷ자 자동 배치 제거, 섹션 기반 베이 생성·정렬로 재편 |
| `src/data/layout.test.ts` | 수정 | 존 4종·라벨 10종·KDC 정렬·결정성 + 1.0m 통로 BFS 도달 테스트 추가(이번 세션) |
| `src/types.ts` | 수정 | `ZoneId` 4종, `Bay.section`, `ZoneLayout.spawn` 계약 반영 |
| `src/store.ts` | 수정 | `walk` 상태·`setZone` 스폰 이동·`focusBay`, 선택 시 카메라 비텔레포트 |
| `src/scene/Player.tsx` | 신규 | 1인칭 도보·충돌·포인터 락 폴백·모바일 조이스틱 |
| `src/scene/input.ts` | 신규 | 키보드·마우스·터치 입력 정규화 |
| `src/scene/Furniture.tsx` | 신규 | 열람 테이블·의자·PC 파티션·데스크·북카트·낮은 원목 서가 절차 모델 |
| `src/scene/Post.tsx` | 신규 | 후처리 파이프라인(품질 게이트) 구성 |
| `src/scene/Room.tsx` | 수정 | 갈색 벽·어두운 천장 → 흰 벽·테라조 바닥·패널등·창/블라인드 |
| `src/scene/ShelfBay.tsx` | 수정 | 표찰을 실제 표기(`유`, `원서 000~700`, `일반 800~803`)로 교체 |
| `src/scene/textures.ts` | 수정 | 표찰 폰트 자동 축소·2줄 래핑(E-7) 보강(이번 세션) |
| `src/scene/LibraryCanvas.tsx` | 수정 | 1인칭 캔버스 전환 + WebGL 미지원 오류 오버레이(E-5) 보강(이번 세션) |
| `src/scene/CameraRig.tsx`·`src/scene/ZoneRoom.tsx` | 삭제 | 뷰 프리셋 카메라·구 존 조명 제거 |
| `src/ui/Hud.tsx`·`src/styles.css` | 수정 | 4개 존 탭·도보 조작 안내·터치 UI·모바일 레이아웃 |
| `scripts/build-shelves.mjs` | 수정 | 섹션 메타 방출, `other` 제외, 섹션별 예산 배분 |
| `scripts/browser-check.mjs` | 수정 | 새 평면·도보 기준 검증 + 검색 이동·원격 검색 판정 추가(이번 세션) |
| `public/data/shelves.json`·`public/data/manifest.json` | 수정 | 10개 섹션·27개 베이·1,736권 + 섹션 메타 10종 재생성 |
| `vite.config.ts` | 수정 | 정보나루 프록시 경로 정리(키 클라이언트 비노출 유지) |
| `README.md`·`CHANGELOG.md`·`docs/preview.png`·`package.json` | 수정/신규 | 사용법·변경 이력·미리보기·스크립트 정리 |
| `docs/intent/done/INT-001-library-3d-realism/{intent,spec,plan}.md` | 수정 | 표찰 문구·AC-3 문구 정정 및 완료 전이 반영(이번 세션) |

## 검증 결과
| 항목 | 결과 | 증거(출처) |
| :--- | :--- | :--- |
| 정적 분석·린트 | Pass | `code-tester` 원시 출력: `pnpm run check` → `tsc --noEmit` exit 0 |
| 단위·통합 테스트 | Pass | `code-tester` 원시 출력: `pnpm test` 18 tests / 18 pass / 0 fail, 1.0m 통로 BFS로 27개 베이 스폰 전부 도달 |
| 브라우저 검증(ego→Aside→Playwright) | Pass | `code-tester` 원시 출력(Chrome CDP): ready=true, total=1736, 콘솔 에러 none, 책 클릭→패널 열림, 검색 결과 선택→베이 앞 `dist=0`, 원격 검색 8건(numFound=6562), 모바일 390×844 `.joystick` display=block·뷰포트 내부·topbar/zones 비겹침, 프로덕션 빌드 정적 서버 DOM 1.5s·`shelves.json` 506ms·3D 준비 12.3s(헤드리스 SwiftShader) |
| 전역 배포(sync/Status)·인코딩 | 미수행(사유: 애플리케이션 저장소로 전역 배포 파이프라인 미해당) / 인코딩 UTF-8 No BOM·LF 확인 | 오케스트레이터 실행 로그(WSL), `file`·`xxd` 헤더 확인 |
| 정합성 게이트 | 필수(하드) / 근거: ① Tier 3 + ② scripts/ 배포·계약 자산 경로 변경 / 방식: 2-pass + 재판정 1회 / 미검증: 해당 없음(NFR-1 실기기 성능은 INT-002 T-01로 이관, 비차단) | 오케스트레이터 게이트 판정 기록(§A 매트릭스) |
| conformance-reviewer | PASS_WITH_NOTES | 판정 리포트 요약: FR/AC 전항이 코드·테스트·브라우저 증거로 충족, NFR-1(60fps)만 실기기 GPU 미측정 |

## 잔여 리스크 및 후속
- 후속 intent 후보: INT-002 — 이동 버벅거림 해소 + 전체 56,307권 KDC 배가(NFR-1 실기기 성능 측정 T-01 포함)
- 알려진 제약: 배치도가 개념도여서 실측 치수·비율과 차이가 있을 수 있음(상대 위치·동선 우선) / 롤백: `git checkout 3213560` 또는 `git revert` 후 `pnpm build` 재배포

## 참조
- 요구: [intent.md](intent.md) · 명세: [spec.md](spec.md) · 계획: [plan.md](plan.md)
- 워크로그: `docs/works/WORKS_HISTORY.md` 미기록(사유: `docs/works/` 미사용 프로젝트) · 커밋/PR: `db2e4d2..3213560`
