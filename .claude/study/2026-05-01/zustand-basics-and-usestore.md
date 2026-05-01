# Zustand 입문 — `useStore()` 가 무엇이고 왜 필요한가

## 학습 환경
- 날짜: 2026-05-01 / 관련 프로젝트: ai-quiz / 기술·버전: Zustand 5.x, React 19

---

## 배경

`docs/learn-quiz-flow` PR 에서 `quizStore.ts`, `QuizPage.tsx` 의 학습 주석을 읽다가 다음 의문이 떠올랐다.

- `useStore()` 가 정확히 무엇이고 어떻게 동작하는가?
- 왜 Zustand 같은 외부 상태 관리 라이브러리가 필요한가? `useState` 로는 안 되는가?
- `useStore()` 와 `useStore.getState()` 는 어떻게 다른가?
- `useQuizStore` 와 `useWrongNoteStore` 처럼 store 가 여러 개일 때 어떻게 협업하는가?

이 노트는 Zustand 의 **입문 개념**을 정리한다. 같은 디렉토리의 다른 노트들과의 위치:

| 시리즈 순서 | 노트 |
|---|---|
| ① 입문 (이 노트) | `zustand-basics-and-usestore.md` |
| ② TS 제네릭 일반 | `typescript-generics-and-contextual-typing.md` |
| ③ curry 패턴 / Zustand 적용 | `zustand-create-curry-typescript-generics.md` |

---

## 핵심 개념

### 1. 출발점 — `useState` 의 한계

리액트 컴포넌트 안에서 값을 보관하려면 `useState` 를 쓴다.

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

특징:
- `count` 는 이 컴포넌트 안에 산다
- `setCount` 호출 → 이 컴포넌트만 재렌더
- **다른 컴포넌트는 이 값을 모른다**

### 2. 여러 컴포넌트가 같은 값을 공유해야 할 때의 문제

전통적 해결책 두 가지:

**(A) Props drilling** — 부모에 state 두고 자식들에게 props 로 계속 내려보냄. 단계가 깊으면 중간 컴포넌트들이 자기는 안 쓰면서 그냥 **전달만** 하느라 코드가 지저분해짐.

**(B) Context API** — 리액트 내장 기능. 보일러플레이트가 많고, Context 값이 바뀌면 그걸 쓰는 모든 컴포넌트가 재렌더되는 부작용.

**(C) 외부 상태 관리 라이브러리 (Redux, Zustand, Jotai 등)** — 컴포넌트 트리 **밖에** 상태를 두고, 어떤 컴포넌트든 직접 꺼내 쓰게 함.

Zustand 는 (C) 의 가장 간결한 버전이다.

### 3. Zustand 의 핵심 비유

> **"프로젝트 어디서든 꺼내 쓸 수 있는 공동 보관함(store)"** 을 만드는 도구.

```
              [ 공동 보관함 (store) ]
              ┌──────────────────────┐
              │ count: 0             │   ← 상태
              │ increment: () => ... │   ← 액션
              └──────────────────────┘
                ▲      ▲      ▲
                │      │      │  (각 컴포넌트가 직접 꺼내 씀)
            Counter  Header  Badge
```

- 보관함은 컴포넌트 트리 **바깥**에 산다 (모듈 최상위에 한 번 만들어 둠)
- 어느 컴포넌트든 import 해서 직접 접근 가능
- 보관함 값이 바뀌면 **그 값을 보고 있는 컴포넌트들만** 자동 재렌더

### 4. 가장 간단한 store

```ts
// counterStore.ts
import { create } from 'zustand'

interface CounterStore {
  count: number
  increment: () => void
}

export const useCounterStore = create<CounterStore>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

해석:
- `create(...)` → "공동 보관함 하나 만들어줘"
- 안에 넣은 객체 = **보관함의 초기 모습** (상태 + 그 상태를 바꾸는 함수)
- 결과로 받은 `useCounterStore` = **그 보관함을 꺼내 쓰는 도구 (= hook)**

### 5. `useStore()` 호출 시 일어나는 일

```tsx
function Counter() {
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)

  return <button onClick={increment}>{count}</button>
}
```

`useCounterStore(...)` 호출 시 내부 동작:

1. **현재 보관함의 값을 꺼낸다** (`count = 0`)
2. **이 컴포넌트는 보관함을 구독(subscribe)한다** — 보관함 값이 바뀌면 알려달라고 등록
3. 누군가 `increment` 를 호출 → 보관함의 `count` 가 1로 바뀜
4. 보관함이 구독자에게 알림 → **이 컴포넌트만 자동 재렌더**

> 핵심: **컴포넌트가 보관함을 "보고 있다(구독)"는 등록**까지 hook 호출 한 줄이 알아서 해준다. 이게 `useState` 와 가장 다른 점.

### 6. 두 컴포넌트가 같은 store 를 쓰는 그림

```tsx
function Header() {
  const count = useCounterStore((s) => s.count)
  return <h1>현재: {count}</h1>
}

function CounterButton() {
  const increment = useCounterStore((s) => s.increment)
  return <button onClick={increment}>+1</button>
}

function App() {
  return (<><Header /><CounterButton /></>)
}
```

흐름:
1. `Header` 렌더 → "나도 count 구독" 등록 + 0 받아옴
2. `CounterButton` 렌더 → "나도 구독" + increment 받아옴
3. 사용자가 버튼 클릭 → `increment()` 실행 → 보관함의 count 1로 변경
4. 보관함이 구독자 둘에게 알림
5. **두 컴포넌트만** 자동 재렌더, App 은 그대로

App 은 props 를 내려준 적도 없는데 두 자식이 같은 값을 공유한다.

### 7. `useStore` 의 두 얼굴

`useCounterStore` 라는 한 객체에 두 가지 사용법이 공존한다.

| 호출 방식 | 형태 | 어디서 부를 수 있나 | 무엇을 함 |
|---|---|---|---|
| **hook** | `useCounterStore((s) => s.count)` | 컴포넌트 안에서만 | 구독 등록 + 현재 값 받기 + 자동 재렌더 |
| **정적 메서드** | `useCounterStore.getState().count` | 어디서든 | "지금 이 순간의 값" 만 한 번 읽기 (구독 X) |

자바스크립트 차원에서:
```ts
typeof useCounterStore       // "function"  ← hook 으로 호출 가능
useCounterStore.getState     // function    ← 정적 메서드로도 접근 가능
useCounterStore.setState     // function
useCounterStore.subscribe    // function
```

자바스크립트에서 함수도 객체라 속성을 붙일 수 있다는 사실을 활용한 패턴.

---

## 실제 적용

### ai-quiz 의 두 store

```ts
// src/store/quizStore.ts — 퀴즈 진행 보관함
export const useQuizStore = create<QuizStore>()(persist((set, get) => ({
  questions: [],
  selectedAnswers: {},
  // ... 액션들
}), { name: 'ai-quiz-store', storage: createJSONStorage(() => sessionStorage) }))

// src/store/wrongNoteStore.ts — 오답노트 보관함 (별개의 store)
export const useWrongNoteStore = create<WrongNoteStore>()(persist((set, get) => ({
  wrongNotes: [],
  addWrongNote: (id, quizId) => { ... },
}), { name: 'ai-quiz-wrong-notes', storage: createJSONStorage(() => localStorage) }))
```

두 store 는 **storage 도 다르다** (sessionStorage vs localStorage) — 각각 "탭 닫으면 초기화" / "영구 보관" 이라는 의도 차이.

### 컴포넌트에서는 hook 으로

```tsx
// src/pages/QuizPage.tsx
function QuizPage() {
  const { questions, currentIndex, ... } = useQuizStore()
  //                                        ↑ hook (구독 + 재렌더)
}
```

### React 외부에서는 정적 메서드로

```ts
// src/store/quizStore.ts 안의 checkAnswer 액션 (= React 외부 코드)
checkAnswer: (questionId) => {
  // ...
  if (!isCorrect) {
    useWrongNoteStore.getState().addWrongNote(questionId, ...)
    //               ↑ 정적 메서드 (구독 안 하고 한 번만 액션 부르기)
  }
}
```

같은 `useWrongNoteStore` 가 **어디서 부르냐에 따라 다른 얼굴로 동작**한다.

### `useState` vs Zustand `useStore()` 비교

| | `useState` | Zustand `useStore()` |
|---|---|---|
| 어디 보관 | 컴포넌트 안 | 컴포넌트 트리 **바깥** (모듈 차원) |
| 누가 접근 | **그 컴포넌트만** | import 한 **모든 컴포넌트** |
| 공유 방법 | props 로 내려야 함 | 그냥 import 해서 hook 호출 |
| 변경 시 재렌더 | 그 컴포넌트 | 그 값을 **구독한** 컴포넌트들만 |
| React 외부에서 접근 | 불가능 | 가능 (`.getState()`) |

---

## 주의사항

- **store 는 모듈 최상위에 한 번만 만든다**. `create(...)` 호출은 import 시점 1회뿐이고, 그 후엔 모든 컴포넌트가 같은 보관함을 공유.
- **컴포넌트 안에서 hook 호출** 외에 React 외부(다른 store action, 일반 함수, 이벤트 핸들러) 에선 hook 형태가 금지. → `.getState()` 통로 사용.
- **`.getState()` 는 구독을 안 만든다**. 그 값을 화면에 표시하고 싶다면 hook 으로 받아야 한다 (`.getState()` 로 받은 값은 변경 알림이 안 옴).
- **store 가 여러 개여도 OK**. 도메인별로 분리(`quizStore`, `wrongNoteStore`)하면 관심사가 깔끔해진다. 단, store 끼리 참조할 땐 `.getState()` 패턴.
- **selector 로 최적화 가능**. `useCounterStore((s) => s.count)` 처럼 selector 를 주면 그 부분이 안 바뀌면 재렌더가 안 일어남. 디스트럭처링(`const { ... } = useStore()`)은 단순하지만 최적화 효과는 약함.
- **store 안 액션은 일반 함수**다. `(set, get) => ({...})` 안에 정의된 increment, addWrongNote 같은 함수들은 React 와 무관한 평범한 자바스크립트 함수 — 그래서 `.getState()` 로 꺼내 어디서든 호출할 수 있다.
- **persist 미들웨어와 storage 선택**은 store 의 데이터 성격에 맞춰야 한다 — 진행 중 상태는 sessionStorage, 영구 보관은 localStorage.

---

## 참고 자료

- Zustand 공식 문서: https://zustand.docs.pmnd.rs/
- Zustand getting started: https://zustand.docs.pmnd.rs/getting-started/introduction
- 같은 디렉토리의 후속 노트:
  - `typescript-generics-and-contextual-typing.md` (TS 제네릭 일반)
  - `zustand-create-curry-typescript-generics.md` (curry 패턴/Zustand 적용)
- 본 프로젝트의 store 코드:
  - `src/store/quizStore.ts`
  - `src/store/wrongNoteStore.ts`
- 본 프로젝트 PR: https://github.com/jhs7942/ai-quiz/pull/1
