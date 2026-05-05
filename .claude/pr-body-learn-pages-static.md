## 요약
정적 페이지 4개에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#9 / 13**.

## 사전 지식
- `useMeta` 커스텀 훅 (PR #7 학습)
- `target="_blank"` + `rel="noopener noreferrer"` 의 보안 의의
- 시맨틱 HTML — h1/h2/section/table 등의 검색엔진·스크린리더 영향
- public/ 디렉토리의 절대 경로 의미

## 학습 포인트
1. **정적 페이지 컴포넌트의 표준 형태** — 데이터 fetch 없음, 상태 없음, JSX 만 반환. Layout(Header/Footer) + useMeta 만
2. **min-h-screen + flex flex-col** — Footer 화면 하단 고정 패턴 (sticky footer)
3. **시맨틱 HTML 의 효과** — h1/h2/section 이 검색엔진/스크린리더 구조 파악에 사용
4. **외부 링크 보안 (`rel="noopener noreferrer"`)** — tabnabbing 공격 방지 + 추적 차단
5. **`mailto:` scheme** — OS 기본 메일 클라이언트 호출. `?subject=...&body=...` 미리 채우기 가능
6. **법적 페이지의 작성 옵션** — JSX 직접 / markdown import / CMS 셋 중 선택. 분량 따라 결정
7. **public/ 절대 경로 (`/report-stats.png`)** — 빌드 시 dist/ 로 복사
8. **alt 속성** — 접근성 + SEO 필수
9. **`overflow-x-auto` + `table` 시맨틱** — 모바일 가로 스크롤 + 검색엔진 친화

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `AboutPage.tsx` | 5 | 정적 페이지 표준 형태 |
| `AboutPage.tsx` | 13 | sticky footer 패턴 |
| `AboutPage.tsx` | 17 | 시맨틱 HTML |
| `ContactPage.tsx` | 28 | mailto: scheme |
| `ContactPage.tsx` | 36 | rel="noopener noreferrer" 보안 |
| `PrivacyPage.tsx` | 5 | 법적 페이지 작성 옵션 |
| `ReportPage.tsx` | 38 | public/ 절대 경로, alt 의미 |
| `ReportPage.tsx` | 88 | overflow-x-auto + 시맨틱 table |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- 정적 페이지 컴포넌트 추출(공통 wrapper) → 별도 PR
- markdown import 로 법적 페이지 분리 → 별도 PR

## 다음 PR
**PR #10 `docs/learn-layout-components`** — `Header`, `Footer`, `Sidebar`. 반응형 드로어, route active.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
