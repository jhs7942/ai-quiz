# TypeScript 타입가드 — 판별 유니온, `is` 키워드, 제어 흐름 분석

## 학습 환경
- 날짜: 2026-05-03 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x

## 배경
ai-quiz 프로젝트의 `quizStore.checkAnswer` 로직에서 주관식 정답 판별 시 `question.answer.includes(...)` 호출이 있었다. `ShortAnswerQuestion.answer`의 타입이 `string | string[]`이라, 좁히기를 제대로 하지 않으면 `string`인지 `string[]`인지에 따라 `.includes()`의 의미가 완전히 달라지는 위험이 있다.

이 문제를 추적하면서 다음을 학습했다.
- 타입가드의 종류와 역할
- 판별 유니온이 자동 좁히기를 가능하게 하는 원리
- `is` 키워드(사용자 정의 타입가드)가 필요한 시점
- TypeScript 제어 흐름 분석의 한계

## 핵심 개념

### 1. 타입가드란
유니온 타입을 더 좁은 타입으로 좁혀주는 표현식. if/else 블록 안에서 컴파일러가 "여기서는 변수가 확실히 X 타입이다"라고 인식하게 만드는 장치.

### 2. 자동으로 좁혀지는 패턴 (제어 흐름 분석)
TypeScript는 다음 패턴을 만나면 자동으로 타입을 좁힌다.

| 패턴 | 용도 | 예시 |
|------|------|------|
| `typeof` | 원시 타입 판별 | `typeof x === 'string'` |
| `instanceof` | 클래스 인스턴스 판별 | `err instanceof Error` |
| `in` | 객체 프로퍼티 존재 판별 | `'bark' in animal` |
| 리터럴 비교 | 판별 유니온 좁히기 | `q.type === 'short_answer'` |
| `null`/`undefined` 체크 | nullable 좁히기 | `if (x !== null)` |
| `Array.isArray` | 배열 판별 | `Array.isArray(x)` |
| 동등 비교 | 리터럴 유니온 좁히기 | `if (x === 'a')` |

### 3. 판별 유니온(Discriminated Union)
**정의**: 서로 다른 타입의 유니온이고, 모든 구성원이 **같은 이름의 필드**를 가지며 그 필드가 **서로 다른 리터럴 값**을 가질 때, 그 필드를 조건문으로 비교하면 객체 전체의 타입이 자동으로 좁혀진다.

핵심은 "공통 필드" + "서로 다른 리터럴 값"의 조합.

```ts
// ✅ 판별 유니온
type A = { kind: 'a'; data: number }
type B = { kind: 'b'; data: string }
// kind 이름은 공통, 값 'a' vs 'b'는 다름

// ❌ 판별 유니온 아님
type X = { kind: string; data: number }
type Y = { kind: string; data: string }
// 둘 다 string 타입 → 값으로 구별 불가
```

**중요**: 타입을 좁힐 때 컴파일러는 `q.type`만 좁히는 게 아니라 **`q` 객체 전체**가 어느 인터페이스인지 확정한다. 모양이 확정되면 그 안의 모든 필드 타입(예: `q.answer`)이 따라온다.

### 4. 사용자 정의 타입가드 (`is` 키워드)
함수로 빼면 자동 좁히기가 끊긴다. `is`는 그 자동 좁히기를 함수 경계 너머로 확장하는 도구.

```ts
function isShortAnswer(q: Question): q is ShortAnswerQuestion {
//                                   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
//                          "이 함수가 true면 q는 ShortAnswerQuestion이다"
//                           라는 약속을 컴파일러에게 전달
  return q.type === 'short_answer';
}
```

문법 규칙:
- 반환 타입 자리에 `매개변수 is 좁혀질타입` 형태로 작성
- `매개변수` 이름은 함수 인자 이름과 일치해야 함
- 함수 본문은 일반 boolean 반환 (런타임 동작은 동일)

### 5. 자동 좁히기가 안 되는 케이스
| 상황 | 원인 |
|------|------|
| `is` 없는 boolean 함수 호출 | 컴파일러가 함수 본문을 들여다보지 않음 |
| 조건을 변수로 분리 (`const isStr = typeof x === 'string'`) | 변수와 원본 변수의 관계 추적 어려움 |
| 콜백/setTimeout 안쪽 | 비동기 시점에 값이 바뀌었을 수도 있음 |
| `any` 타입 | 좁혀도 any |

## 실제 적용

### 케이스 1: ai-quiz의 위험한 패턴
```ts
// 현재 코드의 위험점
if (q.type === 'short_answer') {
  // q.answer는 string | string[]로 좁혀짐
  q.answer.includes(userAnswer);
  // ⚠️ string과 string[] 모두 .includes()가 있어 컴파일 에러는 안 나지만
  //    의미가 완전히 다름:
  //    - string.includes(): 부분 문자열 검사
  //    - string[].includes(): 요소 포함 검사
}
```

### 케이스 2: 한 단계 더 좁힌 안전한 패턴
```ts
if (q.type === 'short_answer') {
  if (Array.isArray(q.answer)) {
    // q.answer: string[]
    q.answer.includes(userAnswer);
  } else {
    // q.answer: string
    q.answer === userAnswer;
  }
}
```

### 케이스 3: 사용자 정의 타입가드로 추출
```ts
function isMultipleAnswers(value: string | string[]): value is string[] {
  return Array.isArray(value);
}

if (q.type === 'short_answer') {
  if (isMultipleAnswers(q.answer)) {
    q.answer.includes(userAnswer);  // string[]
  } else {
    q.answer === userAnswer;        // string
  }
}
```

### 케이스 4: `try/catch`의 `Error` 좁히기
```ts
try {
  await someApiCall();
} catch (err) {
  if (err instanceof Error) {
    console.log(err.message);  // err: Error로 좁혀짐
  }
}
```

## 주의사항

### 1. 좁히기 vs 컴파일 통과는 다른 문제
유니온이 좁혀져도 **남은 유니온의 메서드가 양쪽에 모두 존재**하면 컴파일 에러가 안 나지만 의미가 다를 수 있다 (`string | string[]`의 `.includes()`가 대표적). **에러가 안 나면 안전**이라고 착각하지 말 것.

### 2. `is`는 컴파일러를 속일 수 있다
```ts
function isShortAnswer(q: Question): q is ShortAnswerQuestion {
  return true;  // ❌ 항상 true! 컴파일러는 안 막음
}
// 런타임 폭발
```
`is`는 약속일 뿐, 본문 검증은 작성자 책임.

### 3. 판별 유니온이 성립하려면 "리터럴 타입"이어야 함
- ✅ `kind: 'a'` (리터럴)
- ❌ `kind: string` (일반 string)

### 4. 사용자 정의 타입가드가 필요한 시점 판단
- 인라인 조건이 충분히 명백 → 그냥 인라인 작성
- 복잡한 검증 로직 / 재사용 / `unknown` 좁히기 → `is` 함수 추출

### 5. 자동 좁히기는 함수 호출 1단계만 본다
중첩된 함수 호출이나 변수 분리를 거치면 끊긴다. 가능하면 인라인으로 쓰거나 `is`로 명시.

## 참고 자료
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook — Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [TypeScript Handbook — Using type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- 프로젝트 관련 코드: ai-quiz의 `quizStore.checkAnswer` (주관식 정답 판별 로직)
