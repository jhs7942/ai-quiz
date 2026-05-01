# TypeScript 제네릭과 Contextual Typing 문법 정리

## 학습 환경
- 날짜: 2026-05-01 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.9

---

## 배경

ai-quiz 프로젝트의 `src/store/quizStore.ts` 코드를 학습하던 중, Zustand의 `create<QuizStore>()(persist(...))` 표현이 이해되지 않았다. 분석해보니 이 코드 한 줄을 이해하려면 다음 TypeScript 문법 개념들이 모두 필요했다.

1. 제네릭 `<T>` 의 역할
2. 제네릭의 **선언** vs **사용** 구분
3. 제네릭의 **명시** vs **추론**
4. 부분 추론 불가 규칙
5. 다른 함수의 제네릭은 별개 스코프
6. 두 제네릭 함수가 중첩될 때 발생하는 순환 의존
7. **Contextual typing(맥락 추론)** 으로 그 순환을 피하는 메커니즘

이 노트는 위 7가지를 Zustand 맥락이 아닌 **TypeScript 문법 자체**로 정리한다 (Zustand 적용 노트는 같은 디렉토리의 `zustand-create-curry-typescript-generics.md` 참조).

---

## 핵심 개념

### 1. 제네릭이란

함수·클래스·타입을 정의할 때 "어떤 타입이든 받을 수 있고, 그 타입을 기억해서 다른 곳에 다시 쓰는" 메커니즘.

```ts
function identity<T>(x: T): T {
  return x
}
```

| 위치 | 의미 |
|---|---|
| `<T>` 꺾쇠 안 | T 라는 타입 변수의 **선언** (= "이 함수는 T라는 타입 매개변수를 받는다") |
| `x: T`, `: T` | 그 T를 **사용** (이미 선언된 T를 참조) |

> JavaScript 비유: `function foo(x) { return x + 1 }` 에서 `(x)` 가 선언, `x + 1` 의 x가 사용. 타입 세계도 똑같다.

### 2. 명시 vs 추론

제네릭 함수를 호출하는 방법은 두 가지.

```ts
identity(123)            // 추론: 인자 123을 보고 T = number 라고 TS가 알아냄
identity<string>("hi")   // 명시: T = string 이라고 직접 적음
```

둘 다 OK. 어느 쪽을 쓸지는 가독성·정확성 트레이드오프.

### 3. 핵심 규칙: 전부 명시 또는 전부 추론

제네릭이 여러 개일 때 **일부만 명시하고 나머지를 추론에 맡기는 부분 추론은 지원되지 않는다.**

```ts
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b]
}

pair(1, "hi")                    // ✅ 둘 다 추론 (A=number, B=string)
pair<number, string>(1, "hi")    // ✅ 둘 다 명시
pair<number>(1, "hi")            // ❌ A만 명시, B 비움 — 컴파일 에러
```

> 외울 한 줄: **"제네릭은 다 적든지, 하나도 안 적든지 둘 중 하나."**

### 4. 함수 시그니처에서 T 가 여러 번 등장할 때

```ts
function create<T>(creator: (set, get) => T): UseStore<T>
//             ↑              ↑                          ↑
//           선언            사용                        사용
```

T 가 세 번 등장하지만 **선언은 단 한 곳** — 함수 이름 옆 `<T>` 안. 나머지는 모두 그 선언된 T를 참조하는 자리.

세 자리 모두 같은 T 를 가리킨다. 즉:
- 호출자가 `create<QuizStore>(...)` 로 T 를 정하면
- `creator: (set, get) => QuizStore` 로 자동 치환되고
- 반환 타입은 `UseStore<QuizStore>` 가 된다

한 번 결정된 T 가 함수 안 모든 T 자리에 자동 전파.

### 5. 다른 함수의 제네릭은 별개 스코프

같은 파일·같은 표현식 안에 등장해도, **각 함수의 `<T>` 는 그 함수만의 지역 변수**다.

```ts
function create<T>(creator: () => T): UseStore<T>
function persist<U>(creator: () => U, opts: ...): WrappedThing<U>
```

여기서 `T` 와 `U` 는 같은 이름을 써도 **별개의 변수**다. 헷갈림 방지를 위해 다른 이름(`T1`/`T2` 또는 `T`/`U`) 으로 부른다.

> JavaScript로 비유하면 `function foo(x) {...}` 와 `function bar(x) {...}` 에서 두 x 가 같은 변수가 아니라 각자의 매개변수인 것과 같다.

### 6. 두 제네릭 함수가 중첩될 때 — 순환 의존

```ts
create<T>( persist<U>( (set, get) => ({...}), opts ) )
       ↑          ↑
   T = QuizStore  U = ???  ← 비워뒀음
```

이 구조에서 TS의 추론 흐름:
- 사용자가 T 를 명시 → 결정됨
- U 는 추론해야 함 → `persist` 의 콜백 `(set, get) => ({...})` 반환값을 보고 결정
- 그런데 콜백 안의 set/get 타입은 다시 U 에 의존
- → **닭이 먼저냐 달걀이 먼저냐** 순환

TS는 이 순환을 풀지 못해 set/get 을 안전한 fallback(`unknown`/`never`)으로 떨어뜨린다.

증상: IDE에서 set 호출에 빨간 줄 + "Argument of type ... is not assignable to parameter of type 'never'" 같은 에러.

### 7. Contextual Typing (맥락 추론)

TS에는 "**받는 쪽이 기대하는 타입을 보고 주는 쪽의 타입을 역으로 추론**" 하는 능력이 있다. 이를 contextual typing 이라고 한다.

가장 흔한 예 — 콜백의 매개변수 타입:

```ts
const arr: number[] = [1, 2, 3]
arr.map((x) => x * 2)
//      ^ x 의 타입은? → number (Array<number>.map의 시그니처에서 역추론)
```

`x` 자리에 타입을 적지 않았지만, `arr` 가 `number[]` 이고 `.map` 시그니처가 `(callback: (item: T) => U) => U[]` 이므로 TS는 "`x` 자리에 와야 할 타입은 `T = number` 다" 라고 결정한다.

같은 메커니즘이 함수 호출의 인자 자리에서도 동작:

```ts
declare function create<T>(): (creator: StateCreator<T>) => UseStore<T>

const fn = create<QuizStore>()
//    ^ 타입: (creator: StateCreator<QuizStore>) => UseStore<QuizStore>

fn(persist(...))
// ↑ 이 자리에 와야 할 타입은 StateCreator<QuizStore>
//   → persist의 반환이 StateCreator<U> 이므로 U = QuizStore 로 역추론
```

핵심: **"받는 쪽 타입이 명확하면, TS는 안쪽으로 그 정보를 흘려보낸다."**

### 8. Curry 함수로 순환을 분리

`create` 가 두 단계로 나뉘면 6번의 순환이 풀린다.

```ts
function create<T>(): (creator: StateCreator<T>) => UseStore<T>
//          ↑           ↑
//       1단계: T 받기  2단계: creator 받기 (T 가 이미 결정된 상태)
```

```ts
create<QuizStore>()             // 1단계: T 명시. 반환은 (creator: StateCreator<QuizStore>) => UseStore<QuizStore>
                  (persist(...)) // 2단계: 기대 타입이 명확 → contextual typing 으로 안쪽 U 자동 결정
```

빈 `()` 는 오타가 아니라 "**1단계 끝, 이제 2단계**" 라는 신호.

### 9. 흐름 도식 — 한 번의 명시가 안쪽까지 채우는 도미노

```
사용자가 1단계에서 T 명시 (T = QuizStore)
        │
        ▼
1단계 호출 결과의 시그니처 결정
((creator: StateCreator<QuizStore>) => UseStore<QuizStore>)
        │
        ▼
2단계 호출의 "기대 타입" 결정 (StateCreator<QuizStore>)
        │
        ▼
contextual typing 으로 안쪽 persist 의 U 결정 (U = QuizStore)
        │
        ▼
콜백 (set, get) => ({...}) 의 set/get 타입 결정
```

**T 한 번 명시 → 안쪽까지 다 자동.**

---

## 실제 적용

### 비교 표 — 같은 코드를 4가지 방식으로 작성

| 작성 방식 | 컴파일 | 타입 안전성 | 평가 |
|---|---|---|---|
| `create<QuizStore>()(persist((set, get) => ...))` | ✅ | ✅ contextual typing 으로 안쪽 추론 | ⭕ 정석 |
| `create<QuizStore>()(persist<QuizStore>((set, get) => ...))` | ✅ | ✅ 동일 | △ 동작은 OK, 단지 중복 |
| `create<QuizStore>(persist((set, get) => ...))` | ❌ | ❌ U 추론 실패 → set/get 깨짐 | ✗ 순환 의존 |
| `create()(persist((set, get) => ...))` | ✅ | ❌ T 를 추론에 맡김 | △ 큰 store 에선 헷갈림 |

### 손으로 확인하는 방법

VS Code/IDE 에서 다음을 임시로 작성하고 set·get 위에 마우스 hover:

```ts
// ✅ 정상 — set/get 이 정확한 타입으로 잡힘
const a = create<QuizStore>()(persist((set, get) => ({...} as QuizStore), { name: 'a' }))

// ❌ set, get 이 unknown/never 비슷하게 잡힘
const b = create<QuizStore>(persist((set, get) => ({...} as QuizStore), { name: 'b' }))
```

타입 차이를 직접 눈으로 보는 것이 글로 읽는 것보다 훨씬 잘 박힌다.

---

## 주의사항

- **선언 vs 사용 혼동**: `<T>` 의 T 와 그 뒤에 등장하는 T 는 같은 변수다. 하지만 **선언은 꺾쇠 안 한 곳에서만** 일어난다. 그 외 위치는 모두 사용(참조).
- **부분 추론은 안 된다**: `pair<number>(1, "hi")` 처럼 일부만 명시하고 나머지는 추론에 맡기는 코드는 컴파일 에러. 두 가지 해결책 — 둘 다 명시하거나 둘 다 비우거나.
- **함수마다 제네릭 스코프가 분리**: `create<T>` 와 `persist<U>` 는 같은 식 안에 있어도 별개 변수. 이름을 같게 써도 자동 연결되지 않는다.
- **순환 의존은 IDE 메시지로 드러난다**: set 호출 시 "type 'never' 에 할당할 수 없다" 같은 에러는 보통 안쪽 제네릭이 추론되지 못한 신호다.
- **Contextual typing 은 "받는 쪽이 명확할 때"만 동작**: 받는 쪽도 추론에 의존하는 상황에선 도와주지 않는다. 그래서 curry 패턴이 1단계 명시를 강제하는 셈.
- **빈 `()` 를 오타로 오해 금지**: 코드 리뷰 시 "괄호 빠뜨린 것 같다"고 잘못 지적하기 쉽다. curry 호출 패턴은 라이브러리 API 에서 보편적이니 외워둔다.
- **`<T>` 명시는 코드의 "의도 문서화"**: 큰 store/큰 타입은 추론에 맡기지 말고 명시하는 편이 가독성·디버깅에 유리하다. 추론 실패 시 어디가 문제인지 메시지가 헷갈려진다.

---

## 참고 자료

- TypeScript Handbook — Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html
- TypeScript Handbook — Type Inference (Contextual Typing): https://www.typescriptlang.org/docs/handbook/type-inference.html
- 같은 디렉토리의 Zustand 적용 노트: `zustand-create-curry-typescript-generics.md`
- 적용된 코드: `src/store/quizStore.ts`
