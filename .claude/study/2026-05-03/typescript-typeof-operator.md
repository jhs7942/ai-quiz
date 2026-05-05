# TypeScript의 `typeof` — 값에서 타입을 추출하는 연산자

## 학습 환경
- 날짜: 2026-05-03 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x

## 배경
앞서 학습한 `Awaited<ReturnType<typeof f>>` 패턴에서 `typeof f`의 의미를 추적하다 발견. 같은 키워드 `typeof`가 JavaScript에는 런타임 연산자로, TypeScript에는 타입 추출 연산자로 **완전히 다르게** 존재한다는 사실을 확인. 이를 이해하면 `ReturnType`, `Parameters`, `InstanceType` 같은 유틸리티가 왜 `typeof`와 짝을 이루어 쓰이는지가 자연스럽게 풀린다.

이전 type-erasure 노트에서 정리한 "두 개의 세계" 모델의 가장 직접적인 활용 사례.

## 핵심 개념

### 1. 두 개의 typeof — 이름은 같지만 다른 연산자

| 구분 | JavaScript의 typeof | TypeScript의 typeof |
|------|---------------------|---------------------|
| 동작 시점 | 런타임 | 컴파일 타임 |
| 반환 | 문자열 (`'string'`, `'number'` 등) | 타입 |
| 위치 | 값 자리 (if, 변수 할당) | 타입 자리 (`:` 뒤, `<>` 안, `type =` 뒤) |
| 용도 | 런타임 종류 확인 | 값으로부터 타입 추출 |

```ts
function f() { return 42; }

// JS typeof — 값 자리, 런타임
const kind = typeof f;        // 'function' (문자열 값)
if (typeof f === 'function') { ... }

// TS typeof — 타입 자리, 컴파일 타임
type T = typeof f;            // () => number (타입)
const g: typeof f = f;        // f와 같은 타입의 변수 선언
```

같은 키워드라도 **위치(값 자리 vs 타입 자리)** 에 따라 의미가 완전히 다르다.

### 2. typeof가 "두 세계의 다리" 인 이유
이전 type-erasure 노트의 "두 세계" 모델 적용:

```
[값의 세계]                [타입의 세계]
fetchUser  ───typeof───→   () => { id: number; name: string }
   (함수 객체)                   (함수 타입)
```

`ReturnType`, `Parameters` 같은 유틸리티는 **함수 타입**을 인자로 받는다. 그런데 우리가 가진 건 보통 **함수 값**이다. `typeof`는 그 값을 타입의 세계로 옮겨주는 다리.

```ts
type R = ReturnType<fetchUser>;          // ❌ fetchUser는 값
type R = ReturnType<typeof fetchUser>;   // ✅ typeof로 타입 추출
```

### 3. 위치별 동작 판별
| 위치 | 동작 | 결과 |
|------|------|------|
| `if (typeof x === 'string')` | JS typeof | 문자열 반환 |
| `const k = typeof x;` | JS typeof | 문자열 반환 |
| `type T = typeof x;` | TS typeof | x의 타입 |
| `const y: typeof x = ...;` | TS typeof | x의 타입 |
| `ReturnType<typeof f>` | TS typeof | f의 함수 타입 |
| `Parameters<typeof f>` | TS typeof | f의 인자 튜플 |

**판별법**: `=` 좌변 타입 자리, `:` 뒤, 제네릭 `<>` 안 → TS typeof. 그 외 → JS typeof.

## 실제 적용

### 단계별 풀이 — `Awaited<ReturnType<typeof f>>`
```ts
async function f() {
  const res = await fetch('/api');
  return res.json();  // 가정: { id: number; name: string }
}

type R = Awaited<ReturnType<typeof f>>;
```

안에서 바깥으로:

| Step | 표현 | 결과 |
|------|------|------|
| 1 | `typeof f` | `() => Promise<{ id: number; name: string }>` |
| 2 | `ReturnType<typeof f>` | `Promise<{ id: number; name: string }>` |
| 3 | `Awaited<ReturnType<typeof f>>` | `{ id: number; name: string }` |

f의 본문을 다시 적지 않고 결과 타입만 추출. 함수가 바뀌면 타입도 자동 추적.

### 자주 쓰는 패턴

#### 패턴 A: 객체 → 타입 (Single Source of Truth)
```ts
const config = {
  host: 'localhost',
  port: 3000,
  debug: true,
};

type Config = typeof config;
// { host: string; port: number; debug: boolean }
```

#### 패턴 B: as const + typeof (리터럴 보존)
```ts
const config = {
  host: 'localhost',
  port: 3000,
} as const;

type Config = typeof config;
// {
//   readonly host: 'localhost';
//   readonly port: 3000;
// }
```
`as const` 없으면 string/number로 넓혀지지만, 붙이면 리터럴 그대로 보존.

#### 패턴 C: 배열 → 유니온
```ts
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = typeof ROLES[number];
// 'admin' | 'user' | 'guest'
```
센티넬 리터럴 유니온 패턴의 기초.

#### 패턴 D: 함수 시그니처 재사용
```ts
function handleClick(event: MouseEvent, id: number) { ... }

function logAndCall(...args: Parameters<typeof handleClick>) {
  console.log(args);
  handleClick(...args);
}
```

#### 패턴 E: 클래스 — 생성자 vs 인스턴스
```ts
class User { constructor(public name: string) {} }

type Ctor = typeof User;                       // 생성자 타입
type Instance = User;                          // 인스턴스 타입 (클래스명 그대로)
type Instance2 = InstanceType<typeof User>;    // 동일
```
**중요**: `typeof Class`는 인스턴스가 아니라 **생성자**.

#### 패턴 F: 라이브러리 객체 (zustand, react-query)
```ts
const useStore = create<StoreState>(...);
type Store = ReturnType<typeof useStore.getState>;
```

### 이 프로젝트에 적용한다면

#### 적용 1: fetchMockExams의 반환 타입 자동 추출
```ts
import { fetchMockExams } from './quiz';
type MockExamsResult = Awaited<ReturnType<typeof fetchMockExams>>;
// MockExam[]
// 시그니처가 바뀌어도 자동 추적
```

#### 적용 2: 카테고리 메타데이터 객체
```ts
const QUIZ_CONFIG = {
  defaultCount: 10,
  difficulties: ['easy', 'medium', 'hard', 'all'],
  shuffleByDefault: true,
} as const;

type QuizConfig = typeof QUIZ_CONFIG;
type Difficulty = typeof QUIZ_CONFIG.difficulties[number];
// 'easy' | 'medium' | 'hard' | 'all'
```

#### 적용 3: zustand 스토어 상태 타입
```ts
const useQuizStore = create<QuizStore>(...);
type QuizState = ReturnType<typeof useQuizStore.getState>;
```

## 주의사항

### 1. 타입을 typeof로 감싸지 말 것
```ts
interface User { id: number }
type T = typeof User;  // ❌ User는 값이 아니라 타입
type T = User;         // ✅
```
`typeof`는 **값**에만 사용. 타입은 그대로.

### 2. 값 자리에 typeof 쓰면 JS typeof로 동작
```ts
const f = () => 42;
const x = typeof f;  // 'function' (JS의 런타임 typeof)
```
타입 추출이 목표라면 반드시 타입 자리에서.

### 3. 함수 호출 결과에는 typeof 못 씀
```ts
type R = typeof fetchMockExams();  // ❌ 표현식엔 못 씀
type R = ReturnType<typeof fetchMockExams>;  // ✅
```
`typeof`는 식별자(변수명)에만 직접 사용 가능. 호출 결과 타입을 원하면 `ReturnType`.

### 4. 클래스의 typeof는 생성자 타입
```ts
class User {}
type U = typeof User;  // 인스턴스가 아닌 생성자 타입!
```
- `typeof Class` = 생성자
- `Class` 또는 `InstanceType<typeof Class>` = 인스턴스

### 5. as const 없으면 리터럴 유실
```ts
const ROLES = ['a', 'b', 'c'];
type R = typeof ROLES[number];  // string (리터럴 유실)

const ROLES2 = ['a', 'b', 'c'] as const;
type R2 = typeof ROLES2[number];  // 'a' | 'b' | 'c' ✅
```

### 6. 객체 모양은 typeof 시점에 고정됨
```ts
const config = { host: 'localhost' };
type C = typeof config;  // { host: string }

config.port = 3000;  // ❌ 동적 추가는 타입 추적 안 됨
```
객체에 동적으로 속성 추가해도 typeof로 뽑은 타입엔 반영 안 됨.

### 7. 직접 타입을 작성한 함수는 typeof 불필요
```ts
type MyFunc = (x: number) => string;
type R = ReturnType<MyFunc>;  // 이미 타입이라 typeof 불필요
```

## 한 줄 요약
- **TypeScript의 `typeof`** = "이 **값**의 **타입**을 줘"라는 다리
- 값의 세계에 있는 변수·함수·객체·클래스를 타입의 세계로 옮겨오는 연산자
- **타입 자리에서만** TS typeof로 동작 (`:` 뒤, `<>` 안, `type =` 뒤)
- 그 외 위치(if, 변수 할당)에서는 JS의 런타임 typeof로 동작
- `ReturnType`, `Parameters`, `InstanceType` 같은 유틸리티의 단짝

## 풀어 읽은 한 줄 표현
```ts
type R = Awaited<ReturnType<typeof f>>;
```
= "**f라는 값**의 **함수 타입**을 가져와서, 거기서 **반환 타입**을 뽑고, 그게 Promise면 **풀어서** 안의 타입을 얻은 것."

값(`f`) → 함수 타입 → 반환 타입 → Promise 안 타입. 타입의 세계에서 4단계 가공.

## 참고 자료
- [TypeScript Handbook — Typeof Type Operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
- [TypeScript Handbook — Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html) (`typeof ROLES[number]` 패턴)
- 프로젝트 관련 코드: ai-quiz의 `fetchMockExams`, zustand 스토어 정의
- 연관 학습 노트:
  - `.claude/study/2026-05-03/typescript-type-erasure.md` (두 세계 모델 — typeof는 그 다리)
  - `.claude/study/2026-05-03/typescript-utility-types.md` (ReturnType, Parameters, InstanceType, Awaited 등 typeof와 짝지어 쓰는 유틸리티)
  - `.claude/study/2026-05-03/typescript-sentinel-literal-union.md` (as const + typeof 배열 패턴)
  - `.claude/study/2026-05-03/javascript-async-await-promise.md` (Awaited<ReturnType<typeof f>> 발생 맥락)
