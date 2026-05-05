## 요약
앱 진입점과 라우팅 트리에 학습용 주석을 추가합니다. 코드 변경 없음(주석만).

학습 시리즈 **#2 / 13**. 시리즈 전체 매핑은 `.claude/plans/plan.md` § "학습용 코드 주석 시리즈" 참조.

## 사전 지식 (이 PR을 읽기 전에)
- React 18 의 `createRoot` API — 과거 `ReactDOM.render` 가 왜 사라졌는지
- TypeScript non-null assertion 연산자 `!` — 어떤 상황에서 안전한지
- SPA 라우팅 개념 — "URL이 바뀌어도 페이지 리로드 없이 컴포넌트만 교체"

## 학습 포인트

### `src/main.tsx`
1. **앱의 단일 진입점** — index.html → main.tsx 한 곳에서만 React 트리를 마운트
2. **`createRoot()` (React 18+)** — Concurrent Features 를 쓰려면 필수. 과거 `ReactDOM.render()` 는 deprecated
3. **`document.getElementById('root')!`의 `!`** — TS non-null assertion. "절대 null 아님" 약속. 안전한 진입점에서만 사용
4. **`<StrictMode>`** — 개발 모드에서 useEffect/setState 를 의도적으로 두 번 호출해 부수효과 누수를 노출. 프로덕션에선 자동 제거
5. **`import './index.css'`** — Vite 가 번들에 자동 주입. `<link>` 태그 불필요

### `src/App.tsx`
1. **`BrowserRouter`** — HTML5 history API 사용. 깔끔한 URL(`/quiz`). HashRouter 는 `/#/quiz`
2. **`Routes` + `Route`** — v6 에서 가장 정확한 매치를 자동 선택 (순서 무관)
3. **`<Navigate to="/" replace />`** — 컴포넌트 형태 리다이렉트. `replace` 는 history 스택을 치환해서 뒤로가기로 잘못된 URL 재방문 차단
4. **`path="*"` 와일드카드** — fallback 라우트. 여기서는 404 페이지 대신 메인으로 돌려보내는 정책 선택
5. **`BrowserRouter` 는 트리 최상단에 1번만** — 하위의 `useNavigate`/`useLocation`/`Link` 가 모두 같은 라우팅 컨텍스트를 공유하기 위함

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `src/main.tsx` | 7 | `!` non-null assertion 의 정당성 |
| `src/main.tsx` | 12 | `<StrictMode>` 의 진짜 의미 |
| `src/App.tsx` | 5 | `BrowserRouter` vs `HashRouter` |
| `src/App.tsx` | 25 | `Navigate replace` 의 history 치환 효과 |
| `src/App.tsx` | 22 | path="*" wildcard fallback |

## 검증
- ✅ `npm run build` (tsc + Vite) 통과
- 동작 변경 없음 (주석만)

## Anti-scope
- 라우트 코드 스플리팅(lazy import + Suspense) → 별도 PR
- 404 전용 페이지 도입 → 별도 PR
- StrictMode 제거/유지 결정 → 별도 ADR

## 다음 PR
**PR #3 `docs/learn-types`** — `src/types/index.ts` 의 discriminated union, `Record`, `Partial`, optional 필드, store 인터페이스. 이 PR 머지/리뷰와 무관하게 이미 main 에서 분기 진행 가능.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
