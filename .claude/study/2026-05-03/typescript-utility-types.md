# TypeScript 유틸리티 타입 총정리 — Partial, Record, Pick, Omit 외

## 학습 환경
- 날짜: 2026-05-03 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x

## 배경
ai-quiz의 `QuizStore.setSettings`가 `Partial<QuizSettings>`를 받는 코드를 보면서 시작. `Partial`과 `Record`의 역할을 정반대로 이해하고 있던 것을 발견하고, 이를 계기로 TypeScript 표준 유틸리티 타입 전반을 정리. 모두 매핑드 타입(Mapped Type) 위에 구현된 메타 도구들이다.

연관 파일: `src/types/index.ts` (`QuizStore.selectedAnswers: Record<number, string>`, `QuizStore.scoredAnswers: Record<number, ScoredAnswer>`).

## 핵심 개념

### 1. 매핑드 타입(Mapped Type)이란
"기존 키들을 한 바퀴 돌며 새 타입을 만들어내는" TypeScript의 메타 문법. 모든 객체 변환 유틸리티의 기반.

```ts
{ [K in Keys]: SomeType }
```

읽는 법:
- `[P in K]` → K의 각 키를 P라는 이름으로 하나씩 꺼낸다
- `: T` 또는 `: T[P]` → 그 키에 대응할 값 타입을 정한다
- `?`/`-?`/`readonly` → 수식어 추가/제거

### 2. 객체 변환 유틸리티 (매핑드 타입 기반)

| 유틸리티 | 정의 | 효과 |
|---|---|---|
| `Partial<T>` | `{ [P in keyof T]?: T[P] }` | 모든 필드 optional |
| `Required<T>` | `{ [P in keyof T]-?: T[P] }` | 모든 optional 제거(필수화) |
| `Readonly<T>` | `{ readonly [P in keyof T]: T[P] }` | 모든 필드 읽기 전용 |
| `Record<K, V>` | `{ [P in K]: V }` | 모든 값을 V로 통일 |
| `Pick<T, K>` | `{ [P in K]: T[P] }` | T에서 K 키들만 골라냄 |
| `Omit<T, K>` | T에서 K를 제외한 나머지 | T에서 K 키들을 제외 |

### 3. 유니온 조작 유틸리티

| 유틸리티 | 효과 |
|---|---|
| `Exclude<T, U>` | T에서 U와 호환되는 멤버 제거 |
| `Extract<T, U>` | T에서 U와 호환되는 멤버만 추출 |
| `NonNullable<T>` | null과 undefined 제거 |

### 4. 함수 관련 유틸리티

| 유틸리티 | 효과 |
|---|---|
| `Parameters<T>` | 함수의 인자 타입을 튜플로 추출 |
| `ReturnType<T>` | 함수의 반환 타입 추출 |
| `ConstructorParameters<T>` | 클래스 생성자 인자 타입 |
| `InstanceType<T>` | 클래스의 인스턴스 타입 |

### 5. Promise 관련

| 유틸리티 | 효과 |
|---|---|
| `Awaited<T>` | Promise 안의 타입 추출 (중첩 Promise도 풀어줌) |

### 6. 문자열 리터럴 변환

| 유틸리티 | 효과 |
|---|---|
| `Uppercase<T>` | 모두 대문자 |
| `Lowercase<T>` | 모두 소문자 |
| `Capitalize<T>` | 첫 글자만 대문자 |
| `Uncapitalize<T>` | 첫 글자만 소문자 |

## 실제 적용

### Partial — 부분 갱신
```ts
// QuizStore.setSettings의 시그니처
setSettings: (settings: Partial<QuizSettings>) => void

setSettings({ shuffle: true });               // ✅
setSettings({ questionCount: 10 });           // ✅
setSettings({});                              // ✅ 빈 객체도 OK
```

### Record — dict/map 표현
```ts
// 이 프로젝트의 실제 사용
selectedAnswers: Record<number, string>
// 모든 questionId(number)에 대한 답변(string)을 동일 형태로 저장

scoredAnswers: Record<number, ScoredAnswer>
// 모든 questionId(number)에 대한 채점 결과를 동일 형태로 저장

// 다른 예
type Roles = Record<'admin' | 'user' | 'guest', boolean>;
// { admin: boolean; user: boolean; guest: boolean }
```

### Pick — 일부 필드만 골라내기
```ts
type QuizDisplayInfo = Pick<Question, 'id' | 'question' | 'difficulty'>;
// 정답·해설 빼고 표시용만 추출
```

### Omit — 일부 필드 제외하기 (Pick의 반대)
```ts
type QuestionForDisplay = Omit<Question, 'answer' | 'explanation'>;
// 정답 정보를 제외한 표시용 Question
```

### Exclude — 유니온에서 빼기
```ts
type ConcreteDifficulty = Exclude<QuizSettings['difficulty'], 'all'>;
// 'easy' | 'medium' | 'hard'
// 센티넬 'all'을 제외한 진짜 난이도만
```

### Extract — 판별 유니온의 특정 멤버
```ts
type Action =
  | { type: 'login'; user: User }
  | { type: 'logout' }
  | { type: 'update'; data: Partial<User> };

type LoginAction = Extract<Action, { type: 'login' }>;
// { type: 'login'; user: User }
```

### Parameters / ReturnType — 함수 시그니처 재사용
```ts
type CheckAnswerArgs = Parameters<QuizStore['checkAnswer']>;
// [questionId: number]

const useQuizStore = create<QuizStore>(...);
type StoreState = ReturnType<typeof useQuizStore.getState>;
```

### Awaited — 비동기 결과 타입
```ts
async function fetchUser() {
  return { id: 1, name: 'kim' };
}

type User = Awaited<ReturnType<typeof fetchUser>>;
// { id: number; name: string }
```

### Uppercase 등 — 템플릿 리터럴과 결합
```ts
type EventName = 'click' | 'hover' | 'focus';
type HandlerName = `on${Capitalize<EventName>}`;
// 'onClick' | 'onHover' | 'onFocus'
```

### 유틸리티 조합 — 진짜 강력함은 여기서
```ts
// API 입력: User 일부 필드만 optional로
type UserUpdateInput = Partial<Pick<User, 'name' | 'email'>>;
// { name?: string; email?: string }

// 비동기 함수 결과에서 일부 필드만
type FetchedData = Pick<Awaited<ReturnType<typeof fetchUser>>, 'id' | 'name'>;

// 채점 결과 일부만 갱신
type AnswerPatch = Partial<ScoredAnswer>;
```

## 주의사항

### 1. Record와 Partial의 역할 혼동 주의
- **Record**: 키는 다양해도 **값 타입은 모두 동일**
- **Partial**: 기존 타입의 **각 필드 값 타입은 그대로 보존**, optional만 추가

비유:
- Record = "빈 표 + 모든 칸이 같은 모양"
- Partial = "기존 표 + 칸을 비워도 됨"

### 2. Pick vs Omit 선택 기준
- **남길 필드가 더 적다 → Pick**
- **제외할 필드가 더 적다 → Omit**

대부분 제외할 게 더 적기 때문에 Omit이 더 자주 쓰인다.

### 3. Exclude/Extract는 "할당 가능성" 기준
단순 일치가 아니라 호환성 검사로 동작한다.
```ts
type T = string | number | 'a';
type R = Exclude<T, string>;  // number — 'a'도 string에 호환되므로 제거됨
```

### 4. ReturnType과 typeof 같이 쓰는 패턴
일반 타입이 아니라 **함수 값**에서 추출할 때는 `typeof` 필요.
```ts
type R = ReturnType<getUser>;          // ❌ 타입이 아니라 값을 참조
type R = ReturnType<typeof getUser>;   // ✅
```

### 5. Partial의 함정 — 깊은 중첩에는 안 통함
```ts
interface Nested { user: { name: string; age: number } }
type P = Partial<Nested>;
// { user?: { name: string; age: number } }
// user 자체는 optional이지만, user.name은 여전히 필수
```
재귀적으로 모든 깊이를 optional로 만들려면 직접 `DeepPartial<T>` 같은 커스텀 타입을 만들거나 라이브러리(예: type-fest) 사용.

### 6. Awaited는 중첩 Promise도 풀어줌
```ts
type R = Awaited<Promise<Promise<number>>>;  // number
```
구버전(TS 4.5 이전)에서는 한 단계만 풀렸지만 지금은 중첩까지 처리.

### 7. 일반 string으로 도망가면 매핑드 타입 가치 사라짐
```ts
type Bad = Record<string, string>;  // 모든 문자열 키 허용 — 너무 넓음
type Good = Record<'a' | 'b', string>;  // 정확히 두 키만
```
가능하면 **리터럴 유니온**을 키로 쓰자.

## 사용 빈도 체감 순위
실무에서 자주 쓰는 순서:
1. **Partial** — 부분 갱신, 옵션 객체
2. **Pick / Omit** — 인터페이스 가공
3. **ReturnType / Parameters** — 라이브러리 타입 추출
4. **Record** — dict/map 표현
5. **Awaited** — 비동기 결과 타입
6. **Exclude / Extract** — 유니온 조작
7. **NonNullable** — null 정제
8. **Required / Readonly** — 가끔이지만 알면 깔끔
9. **Uppercase 등** — 템플릿 리터럴 결합 시

## 참고 자료
- [TypeScript Handbook — Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook — Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [type-fest 라이브러리](https://github.com/sindresorhus/type-fest) — DeepPartial, DeepReadonly 등 확장 유틸리티
- 프로젝트 관련 코드: ai-quiz의 `src/types/index.ts` (`Partial<QuizSettings>`, `Record<number, string>`)
- 연관 학습 노트:
  - `.claude/study/2026-05-03/typescript-type-guard.md`
  - `.claude/study/2026-05-03/typescript-sentinel-literal-union.md`
