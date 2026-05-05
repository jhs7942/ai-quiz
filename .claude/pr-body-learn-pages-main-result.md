## 요약
핵심 두 페이지 `MainPage`, `ResultPage` 에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#8 / 13**.

## 사전 지식
- `useNavigate()` (프로그래매틱) vs `<Link>` (선언적)
- local state vs store state 의 책임 경계
- derived state — useMemo 가 항상 좋은 건 아님
- `Record<Tab, string>` 으로 exhaustiveness check

## 학습 포인트

### `MainPage.tsx` (208줄, 6개 주석)
1. **`useNavigate` 의 위치** — 코드 흐름(퀴즈 시작 후 이동) 으로 라우팅. `<Link>` 는 사용자 클릭용
2. **store 구조 분해의 트레이드오프** — 한 번에 여러 키 분해는 간단하지만, 어떤 키든 변경 시 컴포넌트 리렌더. 성능 필요하면 selector 좁히기
3. **local state vs store state** — 페이지 한정 임시 데이터(loading flag, 목록 fetch 결과)는 useState. 다른 곳에서 공유는 store
4. **이름 충돌 회피 패턴** — `setCategories_` (언더스코어). store 의 setCategories 와 구분
5. **deps 배열 비교** — `[]` (mount-once) vs `[mode]` (mode 변경 시)
6. **derived state vs useMemo** — 가벼운 .filter/.reduce 는 직접 계산이 메모이제이션보다 빠를 수 있음
7. **다중 분기 삼항의 한계** — 4단계 nesting 가독성. 더 깊으면 함수/predicate switch 로 추출

### `ResultPage.tsx` (221줄, 5개 주석)
1. **saved 플래그 (useState vs useRef)** — UI 영향 없으면 어느 쪽이든 OK. 일관성으로 useState
2. **guard effect + early return** — questions 가 비면 메인으로. effect 가 navigate 트리거하는 동안 빈 화면 (`return null`)
3. **`?.` + `??` 조합** — `?` 는 access 안전, `??` 는 결과 빈값 처리. `scored?.isCorrect ?? false` 한 줄에 둘 다 등장
4. **derived data** — questions + scoredAnswers 를 매 렌더마다 결합. 가벼우니 useMemo 불필요
5. **template literal + .join** — 결과 텍스트 빌드 패턴. 백틱 + ${} + 여러 줄
6. **`navigator.clipboard`** — Clipboard API. HTTPS/localhost 한정. Promise 반환
7. **`Record<Tab, string>`** — Tab union 의 모든 키 강제. 새 멤버 추가 시 빠진 키를 컴파일러가 알림

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `MainPage.tsx` | 22 | 로컬 type 별칭 (Mode union) |
| `MainPage.tsx` | 30 | store 구조 분해의 리렌더 영향 |
| `MainPage.tsx` | 34 | 이름 충돌 회피 (`setCategories_`) |
| `MainPage.tsx` | 47 | mount-once effect + .finally |
| `MainPage.tsx` | 65 | derived state — 직접 계산 |
| `MainPage.tsx` | 152 | 다중 ternary 의 가독성 한계 |
| `ResultPage.tsx` | 35 | saved 플래그 (useState 선택) |
| `ResultPage.tsx` | 41 | guard effect → early return null |
| `ResultPage.tsx` | 60 | `?.` + `??` 조합 |
| `ResultPage.tsx` | 121 | navigator.clipboard.writeText |
| `ResultPage.tsx` | 132 | `Record<Tab, string>` exhaustiveness |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- 다중 ternary → switch 컴포넌트로 리팩토링 → 별도 PR
- store selector 패턴으로 좁히기 (성능) → 별도 PR
- 점수 카드 별도 컴포넌트로 추출 → 별도 PR

## 다음 PR
**PR #9 `docs/learn-pages-static`** — `AboutPage`, `ContactPage`, `PrivacyPage`, `ReportPage`. 정적 콘텐츠 + Layout 재사용.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
