## 요약
퀴즈 UI 컴포넌트 6개에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#11 / 13**.

## 사전 지식
- `useRef<HTMLElement>(null)` 으로 DOM 직접 조작
- `as const` 가 리터럴 타입을 보존하는 효과
- React 의 단방향 데이터 흐름 (props down, events up)
- `Array.from({length}, (_, i) => ...)` 빌더 패턴

## 학습 포인트

### `ChoiceButton.tsx`
1. **state union 으로 모순 상태 차단** — boolean 여러 개 대신 union 하나로 "한 시점 한 상태" 강제
2. **모듈 상수 `LABELS`** — 매 렌더 새 배열 생성 회피
3. **let + 분기로 className 빌드** — Tailwind 의 동적 한계 우회. 대안: classnames, 객체 매핑

### `FeedbackPanel.tsx`
1. **Array.isArray 타입가드** — `string | string[]` 유니온을 화면용 문자열로 평탄화. TS narrowing

### `ProgressBar.tsx`
1. **`total > 0` 가드** — 0 으로 나누기 방지
2. **동적 width 는 inline style** — Tailwind 는 빌드 타임 정적이라 `w-${x}%` 안 됨. 동적 수치는 style

### `QuestionNavigator.tsx`
1. **`Array.from({length}, (_, i) => ...)`** — 길이만 정해진 배열 빌더. _ 는 unused 관용
2. **compact prop 분기** — 한 컴포넌트가 두 레이아웃. 커지면 분리 + 공통 훅으로 추출

### `QuizCard.tsx`
1. **`useRef<HTMLDivElement>(null)`** — DOM 직접 참조. .current 로 접근. 변경해도 리렌더 안 함
2. **deps `[question.id]` + 자동 포커스** — 다음 문제 진입 시 키보드 흐름 유지 (a11y)
3. **`as HTMLElement` 단언** — Element 에는 focus() 없음. 더 좁은 타입으로 단언
4. **e.preventDefault + 직접 focus 이동** — Tab 기본 동작 차단, 4개 안에서만 순환
5. **e.shiftKey** — Shift+Tab 은 역방향. 한 핸들러에서 양방향

### `QuizSettings.tsx`
1. **`as const`** — 배열·객체를 readonly + 리터럴 타입으로. value 가 'all'|'easy'|... 로 좁혀짐 → onChange 타입 검증 강화
2. **callback prop 패턴** — onChange/onStart. "데이터는 위→아래, 이벤트는 아래→위" 단방향 흐름
3. **`Partial<QuizSettings>`** — 부분 갱신 표현. setSettings 가 받은 키만 store 에 반영

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `ChoiceButton.tsx` | 4 | state union → 모순 차단 |
| `ChoiceButton.tsx` | 11 | 모듈 상수 |
| `ChoiceButton.tsx` | 14 | let + 분기 className |
| `FeedbackPanel.tsx` | 24 | Array.isArray 타입가드 |
| `ProgressBar.tsx` | 8 | total > 0 가드 |
| `ProgressBar.tsx` | 18 | inline style 동적 width |
| `QuestionNavigator.tsx` | 24 | Array.from 빌더 |
| `QuestionNavigator.tsx` | 53 | compact prop 분기 |
| `QuizCard.tsx` | 25 | useRef DOM 참조 |
| `QuizCard.tsx` | 35 | as HTMLElement 단언 |
| `QuizCard.tsx` | 41 | preventDefault + 직접 focus |
| `QuizSettings.tsx` | 11 | as const 효과 |
| `QuizSettings.tsx` | 23 | callback prop + Partial |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- classnames 도입 → 별도 PR
- compact 분리 → 별도 PR
- focus 관리 훅으로 추출 → 별도 PR

## 다음 PR
**PR #12 `docs/learn-result-components`** — `ResultChart`, `ReviewCard`. SVG circle stroke 애니메이션, 리뷰 카드 분기.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
