## 요약
레이아웃 컴포넌트 3개에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#10 / 13**.

## 사전 지식
- props 인터페이스의 optional(`?:`) 과 함수 시그니처 구조 분해
- `<Link>` (react-router-dom) vs `<a>` 의 차이
- Zustand selector 패턴 (`useStore((s) => s.field)`)
- 반응형 클래스 (`hidden lg:flex`, `lg:hidden`)

## 학습 포인트

### `Header.tsx`
1. **props 인터페이스 + 구조 분해** — `function Header({ a, b }: Props)` 가 표준
2. **`sticky top-0 z-30`** — 스크롤 시 상단 고정 + stacking 관계
3. **JSX 조건부 렌더 함정** — `0 && <X/>` 는 `0` 을 그대로 렌더. number 검사는 `count > 0` 명시
4. **aria-label 접근성** — 시각 텍스트가 없는 아이콘 버튼은 aria-label 필수
5. **`<Link>` vs `<a>`** — Link 는 SPA 라우팅, a 는 페이지 리로드. SPA 에선 Link/NavLink 만

### `Footer.tsx`
1. **가장 단순한 함수 컴포넌트** — props/상태/로직 없음. React.memo 도 불필요
2. **시맨틱 태그** — `<footer>`, `<nav>` 가 `<div>` 보다 SEO·a11y 친화

### `Sidebar.tsx`
1. **구조 분해 시 디폴트 값** — `mode = 'category'` 로 런타임 기본값. optional 타입과 짝
2. **derived state 의 빈 상태 가드** — `selected.length === categories.length && categories.length > 0`
3. **Zustand selector 패턴** — `useStore((s) => s.wrongNotes.length)` 처럼 좁히면, length 변경에만 리렌더 (성능 최적화 핵심)
4. **Fragment (`<>...</>`)** — 의미 없는 래퍼 div 회피. React 의 단일 루트 제약 우회
5. **반응형 분기 — 같은 콘텐츠 두 형태 렌더** — 데스크톱(sticky aside) + 모바일(드로어 오버레이). `hidden lg:flex` / `lg:hidden`
6. **드로어 UX 패턴** — fixed inset-0 + 반투명 배경 + 클릭 시 닫기

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `Header.tsx` | 17 | sticky + z-index |
| `Header.tsx` | 19 | JSX falsy 렌더 (`0` 함정) |
| `Header.tsx` | 26 | aria-label 접근성 |
| `Header.tsx` | 35 | Link vs a |
| `Footer.tsx` | 3 | 가장 단순한 함수 컴포넌트 |
| `Sidebar.tsx` | 18 | 구조 분해 디폴트 값 |
| `Sidebar.tsx` | 31 | derived state 빈 상태 가드 |
| `Sidebar.tsx` | 35 | selector 패턴 성능 최적화 |
| `Sidebar.tsx` | 117 | Fragment + 반응형 두 형태 렌더 |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- NavLink 로 바꿔서 active 표시 → 별도 PR
- 드로어 슬라이드 애니메이션 → 별도 PR
- store selector 메모이제이션 (shallow) → 별도 PR

## 다음 PR
**PR #11 `docs/learn-quiz-components`** — 퀴즈 UI 6개 (ChoiceButton, FeedbackPanel, ProgressBar, QuestionNavigator, QuizCard, QuizSettings).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
