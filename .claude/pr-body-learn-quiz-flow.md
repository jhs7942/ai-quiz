## 요약

리액트를 학습 중인 입장에서 본 프로젝트의 핵심 흐름(`quizStore.ts` ↔ `QuizPage.tsx`)을 따라갈 수 있도록 두 파일에 **`[학습]` 주석만** 추가했다. 코드 로직은 단 한 줄도 변경하지 않았다.

## 사전 지식 (이 PR을 읽기 전에)

| 개념 | 한 줄 요약 |
|---|---|
| Zustand store | `create()` 로 만든 훅. 컴포넌트에서 호출하면 상태/액션을 꺼내 쓸 수 있다 |
| persist 미들웨어 | store 상태를 storage에 자동 직렬화 — 새로고침해도 살아남는다 |
| Rules of Hooks | 모든 hook은 항상 같은 순서로 호출돼야 한다 (조건문/early return 위에서) |
| useEffect | 렌더 결과가 아닌 "외부 시스템과의 상호작용"을 담당. 의존성 배열이 핵심 |
| useRef | 값이 바뀌어도 재렌더를 트리거하지 않는 슬롯 |

## 학습 포인트 — 리뷰 시 이 라인을 차례대로 읽으세요

### `src/store/quizStore.ts`
1. `gradeAnswer` 를 store 외부에 export 한 이유 — 채점 로직 단일 출처
2. 주관식 정규화 규칙(공백·대소문자·괄호 변형) — `expandAnswer`
3. `create<T>()(persist(...))` 의 빈 `()()` curry 패턴 — TS 제네릭과 미들웨어 추론을 모두 살리기 위함
4. `(set, get) =>` 액션 시그니처 — `get()` 이 필요한 시점(checkAnswer가 questions를 참조)
5. 함수형 업데이트 `set((state) => ...)` 의 race 회피
6. `{ [questionId]: _s, ...restScored }` — 객체에서 키 1개만 제거하는 destructuring 패턴
7. `useWrongNoteStore.getState()` — 훅이 아닌 일반 함수라 어디서든 호출 가능. 다른 store action 안에서의 정석 패턴
8. `persist` + `sessionStorage` 선택 근거 — 탭 닫으면 초기화되는 의도

### `src/pages/QuizPage.tsx`
1. `useQuizStore()` 디스트럭처링과 재렌더 동작 (selector 최적화는 별도)
2. `useRef` vs `useState` — 재렌더 트리거 여부에 따른 선택
3. `useEffect` 의존성 배열의 의미와 빈 배열/생략의 차이
4. `navigate('/')` 같은 사이드 이펙트는 렌더 도중이 아닌 `useEffect` 안에서
5. Rules of Hooks — `if (questions.length === 0) return null` **위에** 모든 hook을 두는 이유
6. `window.addEventListener` 의 cleanup 함수 (좀비 핸들러·메모리 누수 방지)
7. JSX 안의 조건부 렌더링 — 삼항(양자택일)과 `&&`(있을 때만)의 구분

## 검증

- ✅ `npm run build` (tsc + Vite) 통과
- ⚠️ `npm run lint` 는 기존 7건의 경고/에러가 그대로 — **본 PR 변경과 무관**하며 main 브랜치에서도 동일하게 발생함을 확인 완료. 별도 PR로 정리 권장.

## Anti-scope (이번 PR에서 안 한 것)

- 코드 리팩토링·버그 수정
- 다른 파일(`MainPage`, `ResultPage`, `lib/quiz.ts` 등) 학습 주석 → 다음 학습 PR 후보
- 기존 lint 경고 정리 → 별도 PR

## 다음 학습 PR 후보

- `docs/learn-data-pipeline` — `lib/quiz.ts` 의 `buildQuestions()` 데이터 흐름
- `chore/eslint-unused-vars-pattern` — `_` prefix 변수 ESLint 예외 설정 추가 (`argsIgnorePattern: '^_'`)
- `refactor/checkAnswer-type-safety` — 주관식 `answer` 의 string/string[] 타입 정리
