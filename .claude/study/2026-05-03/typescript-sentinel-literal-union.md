# TypeScript 센티넬 값과 리터럴 유니온 — `number | 'all'` 패턴

## 학습 환경
- 날짜: 2026-05-03 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x

## 배경
ai-quiz의 `QuizSettings.questionCount` 타입이 `number | 'all'`로 정의돼 있는 이유를 추적하면서 학습. 단순히 "전체 문제 풀기" 옵션을 표현하기 위한 트릭이 아니라, **하나의 개념을 하나의 변수가 온전히 책임지게 만드는** 타입 설계 원칙의 사례임을 확인했다.

관련 파일: `src/types/index.ts`의 `QuizSettings`, `QuizStore`.

## 핵심 개념

### 1. 센티넬(Sentinel) 값
> "정상 데이터 범위 밖에 있으면서, 특별한 의미를 나타내는 값"

원래 컴퓨터 과학 용어(배열 끝 표시 `null`, C 문자열 끝 `\0` 등). UI/도메인 코드에서는 "전체", "없음", "무한대" 같은 **숫자 범위 밖의 의미**를 표현할 때 사용.

### 2. 리터럴 타입(Literal Type)
TypeScript에서 특정 값 자체가 타입이 되는 것.

```ts
let a: string = 'all';     // 어떤 문자열이든 가능
let b: 'all' = 'all';      // 정확히 'all'만 가능
b = 'al';   // ❌ 에러
b = 'All';  // ❌ 대소문자 다름
```

### 3. 매직 스트링/매직 넘버 문제
코드에 직접 박혀있고 의미가 코드만 봐서는 안 보이는 값. 오타나면 조용히 false가 되고, 의미 파악이 어렵다.

```ts
if (mode === 'all') { ... }   // 'all'이 매직 스트링
if (status === 3) { ... }     // 3이 매직 넘버
```

### 4. `number | 'all'` 패턴이 푸는 문제
**한 줄 정의**: 숫자 도메인에 "특별한 비숫자 상태" 하나를 추가하면서, 그 상태의 이름을 코드에 직접 박아 의미를 드러내고 오타를 컴파일 시점에 잡는 패턴.

### 5. 본질 — "하나의 의미는 하나의 변수가 책임진다"
이 패턴의 진짜 가치는 옵션을 추가하는 것이 아니라 **상태를 흩어놓지 않는 것**.

```ts
// ❌ 흩어진 버전 — 두 변수가 한 개념을 분담 → 모순 가능
{ questionCount: number; useAll: boolean }
// useAll: true인데 questionCount: 5인 모순 상태가 가능

// ✅ 통합된 버전 — 한 변수가 모든 가능성 표현
{ questionCount: number | 'all' }
// 모순 상태 자체가 표현 불가능
```

함수형 프로그래밍의 격언:
> **"불가능한 상태를 표현 불가능하게 만든다"** (Make impossible states impossible)

## 실제 적용

### 이 프로젝트의 사용 사례
```ts
// src/types/index.ts
export interface QuizSettings {
  questionCount: number | 'all'
  difficulty: 'easy' | 'medium' | 'hard' | 'all'
  shuffle: boolean
}
```

### 사용 시점에서의 타입 좁히기
```ts
const count: number | 'all' = settings.questionCount;

if (count === 'all') {
  // count는 'all' 리터럴로 좁혀짐
  questions = allQuestions;
} else {
  // count는 number로 자동 좁혀짐 (제어 흐름 분석)
  questions = allQuestions.slice(0, count);
}
```

### 다른 대안과의 비교

| 대안 | 문제점 |
|------|--------|
| `number` + 매직 넘버(-1) | 의미 불투명, 오타·다른 음수와 충돌 |
| `string`만 사용 | 매번 `parseInt` 필요, 오타 검증 불가 |
| 별도 boolean 플래그 | 두 필드 모순 가능 (`useAll: true` + `count: 5`) |
| `number \| null` | `null`이 다른 의미("값 없음")와 혼동 |
| **`number \| 'all'`** | **모든 단점 해결** |

### 자주 쓰이는 패턴들

```ts
// 단일 센티넬
type Pagination = number | 'all';
type Timeout = number | 'never';
type Limit = number | 'unlimited';

// 다중 센티넬 (이 프로젝트의 difficulty)
difficulty: 'easy' | 'medium' | 'hard' | 'all'

// 판별 유니온과 결합 (상태별 데이터)
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; message: string }

// const assertion으로 단일 출처
const QUIZ_COUNT_OPTIONS = [5, 10, 20, 'all'] as const;
type QuizCount = typeof QUIZ_COUNT_OPTIONS[number];
// QuizCount = 5 | 10 | 20 | 'all'
```

## 주의사항

### 1. 일반 string으로 도망가지 말 것
```ts
function setCount(count: number | string) {  // ❌ 너무 넓음
  if (count === 'all') { ... }
}
setCount('al');  // 컴파일러가 못 막음
```
유니온의 일부를 `string`으로 두면 리터럴 타입의 가치가 사라진다. **반드시 정확한 리터럴**로 작성해야 오타 검증이 작동.

### 2. 센티넬이 너무 많아지면 다른 패턴으로 전환
```ts
type Count = number | 'all' | 'half' | 'random' | 'last' | 'first';  // ❌ 과도
```
3개 이상 누적 시:
- 단순 enum 같은 고정 목록 → `as const` 배열 패턴
- 상태마다 따라오는 데이터가 다름 → 판별 유니온 객체로 전환

### 3. 정상 값으로 표현 가능하면 만들지 말 것
```ts
type Volume = number | 'mute';  // 'mute'가 0과 다른가?
```
`0`이 mute 의미면 그냥 `number`로 충분. 센티넬은 **정상 값으로 표현 불가능한 의미**일 때만 추가.

### 4. 대소문자·공백 등 정확히 일치해야 함
```ts
let x: 'all' = 'All';  // ❌ 에러
let y: 'all' = 'all '; // ❌ 끝 공백
```
리터럴 타입은 문자열 비교가 엄격하다.

### 5. 사용처에서 좁히기를 끝까지 해야 안전
```ts
if (count === 'all') { ... }
else {
  count + 10;  // ✅ count: number로 좁혀짐
}
```
좁히기를 안 하고 그대로 쓰면 `number | 'all'` 그대로라 숫자 연산 시 컴파일 에러.

## 참고 자료
- [TypeScript Handbook — Literal Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [Make Illegal States Unrepresentable (Yaron Minsky)](https://blog.janestreet.com/effective-ml-revisited/)
- 프로젝트 관련 코드: ai-quiz의 `src/types/index.ts` (`QuizSettings.questionCount`, `difficulty`)
- 연관 학습 노트: `.claude/study/2026-05-03/typescript-type-guard.md` (제어 흐름 분석으로 `number | 'all'` 좁히기)
