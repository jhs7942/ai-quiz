# Zustand `create<T>()()` curry 패턴과 TypeScript 제네릭 추론

## 학습 환경
- 날짜: 2026-05-01 / 관련 프로젝트: ai-quiz / 기술·버전: Zustand 5.x, TypeScript 5.9, React 19

---

## 배경

`docs/learn-quiz-flow` 학습 PR에서 `src/store/quizStore.ts` 의 다음 코드에 학습용 주석을 달았다.

```ts
export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      selectedCategories: [],
      questionCount: 10,
      // ...
    }),
    { name: 'ai-quiz-store', storage: createJSONStorage(() => sessionStorage) }
  )
)
```

리뷰 중 다음 의문이 떠올랐다:
1. `create<QuizStore>()` 의 빈 `()` 는 왜 있는가? 오타 아닌가?
2. `(set, get) => ({...})` 시그니처는 무엇이며, 왜 그렇게 생겼나?
3. `<T>` 의 T와 `(creator: ...) => T` 의 T는 같은 것인가? (선언 vs 사용 혼동)
4. 미들웨어 `persist` 에는 왜 타입을 명시하지 않아도 되는가?

이 의문은 결국 **TypeScript의 제네릭 추론 한계** 와 **contextual typing** 두 가지 메커니즘으로 모두 환원된다.

---

## 핵심 개념

### 1. TypeScript 제네릭의 핵심 규칙

> 한 함수의 제네릭들은 **전부 명시하거나 전부 추론**시켜야 한다. 일부만 명시하고 일부를 추론에 맡기는 부분 추론은 지원되지 않는다.

```ts
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b]
}

pair(1, "hi")                    // ✅ 둘 다 추론 (A=number, B=string)
pair<number, string>(1, "hi")    // ✅ 둘 다 명시
pair<number>(1, "hi")            // ❌ A만 명시, B는 비움 — 컴파일 에러
```

### 2. 제네릭의 "선언" vs "사용"

```ts
function create<T>(creator: (set, get) => T): UseStore<T>
//             ↑              ↑                          ↑
//           선언            사용                        사용
```

| 위치 | 의미 |
|---|---|
| `<T>` 꺾쇠 안 | T 라는 타입 변수의 **선언** (도입부) |
| 그 뒤에 등장하는 T | 위에서 선언한 T의 **사용**(참조) |

JavaScript 비유:
```js
function foo(x) {  // x 선언
  return x + 1     // x 사용
}
```

다른 함수에서 등장하는 `<T>` 는 **각자의 지역 변수** — 같은 이름이라도 별개의 T다. 그래서 이해 보조용으로 `T1`, `T2` 또는 `T`, `U` 로 구분해 부른다.

### 3. 한 번에 호출하면 깨지는 이유 — 순환 의존

`create<QuizStore>(persist(...))` 처럼 한 번에 호출하면 두 함수의 제네릭이 등장한다.

```ts
function create<T>(creator: StateCreator<T>): UseStore<T>
function persist<U>(creator: StateCreator<U>, opts: ...): StateCreator<U>
```

```
create<T>( persist<U>( (set, get) => ({...}), opts ) )
       ↑          ↑
   T = QuizStore  U = ???  ← 비워뒀음
```

- 사용자가 T 명시 (`QuizStore`).
- TS는 U 를 추론해야 함.
- U 를 알려면 `persist` 의 콜백 `(set, get) => ({...})` 반환값을 봐야 함.
- 그런데 콜백 안의 set/get 타입이 다시 U 에 의존.
- → **닭이 먼저냐 달걀이 먼저냐**. TS는 이 순환을 풀지 못해 set/get을 안전한 fallback(`unknown`/`never`)으로 떨어뜨린다.

증상: IDE에서 set 호출 시 "Argument of type ... is not assignable to parameter of type 'never'" 같은 에러.

### 4. curry 패턴이 푸는 방법

`create` 가 두 단계로 나뉘어 있으면:

```ts
function create<T>(): (creator: StateCreator<T>) => UseStore<T>
//          ↑           ↑
//       1단계: T 받기  2단계: creator 받기 (T가 이미 정해져 있음)
```

```ts
create<QuizStore>()           // 1단계: T = QuizStore 확정. 반환값은 (creator: StateCreator<QuizStore>) => UseStore<QuizStore>
                  (persist(...)) // 2단계: T가 이미 알려진 상태에서 persist의 타입을 맞춤
```

빈 `()` 는 오타가 아니라 **"1단계 끝, 이제 2단계로"** 라는 신호다.

### 5. persist 에 타입을 명시하지 않아도 되는 이유 — contextual typing

curry 1단계로 T가 못 박힌 뒤, 2단계 호출에서 TS는 다음과 같이 추론한다:

> "이 자리에 올 타입은 `StateCreator<QuizStore>` 다. 그럼 안쪽 `persist(...)` 의 반환 타입이 그거여야 한다. persist 시그니처상 반환이 `StateCreator<U>` 이므로 `U = QuizStore` 로 정하자."

이걸 **contextual typing(맥락 추론)** 이라고 한다 — "받는 쪽이 기대하는 타입을 보고 주는 쪽의 타입을 역추론" 하는 TS의 능력.

흐름 도식:

```
1단계 명시 (T = QuizStore)
        │
        ▼
2단계의 기대 타입 결정 (StateCreator<QuizStore>)
        │
        ▼
persist의 U 자동 결정 (U = QuizStore)
        │
        ▼
콜백 (set, get) => ({...}) 의 set/get 타입 자동 결정
```

도미노처럼 한 번의 명시가 안쪽까지 채워준다.

---

## 실제 적용

### `src/store/quizStore.ts` 에 적용된 모양

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { QuizStore } from '../types'

export const useQuizStore = create<QuizStore>()(   // ← 1단계: T 명시 (빈 ())
  persist(                                         // ← 2단계: persist 미들웨어 + creator 전달
    (set, get) => ({                               // ← Zustand가 set/get 주입하며 호출할 콜백
      selectedCategories: [],
      questionCount: 10,
      // ... 상태와 액션
      checkAnswer: (questionId) => {
        const { questions, selectedAnswers } = get()  // ← stale closure 방지
        // ...
        set((state) => ({ scoredAnswers: ... }))
      },
    }),
    {
      name: 'ai-quiz-store',
      storage: createJSONStorage(() => sessionStorage),  // sessionStorage 선택
    }
  )
)
```

### 작성 방식 비교 표

| 작성 방식 | 동작 | 타입 안전성 | 평가 |
|---|---|---|---|
| `create<QuizStore>()(persist((set, get) => ...))` | ✅ | ✅ contextual typing 으로 안쪽 추론 | ⭕ 정석 |
| `create<QuizStore>()(persist<QuizStore>((set, get) => ...))` | ✅ | ✅ 동일 | △ 명시는 동작하지만 중복 |
| `create<QuizStore>(persist((set, get) => ...))` | ❌ | ❌ U 추론 실패 → set/get 타입 깨짐 | ✗ |
| `create()(persist((set, get) => ...))` | ✅ | ❌ T를 추론에 맡김 — 큰 store에선 헷갈려짐 | △ |

---

## 주의사항

- **빈 `()` 는 오타가 아니다**. 코드 리뷰에서 "괄호 하나 빼먹은 것 같다"고 잘못 지적하기 쉬우니 패턴을 외워둔다.
- **제네릭의 선언 위치는 단 한 곳** — 함수 이름 옆 `<T>` 안. 그 뒤 등장하는 T는 모두 사용(참조)이다.
- **다른 함수의 제네릭은 서로 자동 연결되지 않는다**. 그래서 `create<T>` 와 `persist<U>` 는 별개의 변수로 다뤄야 하며, 둘을 한 번에 풀려면 contextual typing 같은 별도 메커니즘이 필요하다.
- **persist 에 명시할 필요가 없는 것** ↔ **명시하면 동작 안 하는 것** 이 아니다. 명시해도 OK, 단지 중복일 뿐. Zustand 공식 예제는 생략한다.
- **`(set, get) => ({...})` 콜백은 우리가 작성하지만 호출 주체는 Zustand**다. Zustand 내부에서 `creator(set, get)` 형태로 부르면서 set/get을 주입한다.
- 액션 안에서 다른 상태값을 읽을 때는 외부 변수 캡처 대신 **`get()`** 을 써야 한다 — 그렇지 않으면 store 생성 시점의 빈 상태가 클로저에 캡처되는 stale closure 버그가 생긴다.
- 같은 패턴이 다른 미들웨어(`devtools`, `immer`, `subscribeWithSelector` 등)에도 똑같이 적용된다. curry 패턴은 Zustand의 보편 규칙이다.

---

## 참고 자료

- Zustand 공식 TypeScript 가이드: https://zustand.docs.pmnd.rs/guides/typescript
- TypeScript Handbook — Type Inference (contextual typing): https://www.typescriptlang.org/docs/handbook/type-inference.html
- 본 프로젝트 PR: https://github.com/jhs7942/ai-quiz/pull/1 (`docs: 퀴즈 흐름 학습용 주석 추가`)
- 적용된 코드: `src/store/quizStore.ts` (curry + persist + sessionStorage)
