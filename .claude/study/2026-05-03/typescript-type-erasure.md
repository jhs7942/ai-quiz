# TypeScript 타입 소거(Type Erasure) — 타입은 런타임에 존재하지 않는다

## 학습 환경
- 날짜: 2026-05-03 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x

## 배경
`import type` 학습 중 자연스러운 의문이 떠올랐다 — "타입 모듈을 import했는데 컴파일 시 삭제되면, 그걸 사용한 코드에서 오류가 나야 하는 거 아닌가?" 이 의문을 추적하다 보니 TypeScript의 가장 근본 원리인 **타입 소거(Type Erasure)** 와 **타입의 세계 vs 값의 세계** 분리 모델에 도달했다.

이 원리를 모르면 `import type`이 "왜 안전한지", `interface`/`type` 선언이 "왜 JS에 영향이 없는지", 제네릭이 "왜 런타임에 모르는지"를 단편적으로만 외우게 된다. 본 노트는 이를 통합적으로 정리한다.

## 핵심 개념

### 1. 타입 소거(Type Erasure)란
> **TypeScript는 컴파일 시 모든 타입 정보를 완전히 지운다. JS에는 타입이라는 개념 자체가 없다.**

타입은 컴파일러가 **검사용으로만 쓰는 정보**이고, 실제 실행되는 JS에는 흔적조차 남지 않는다. 타입이 살아있는 시간은 컴파일 시점뿐.

### 2. "두 개의 세계" 모델
TypeScript에는 분리된 두 세계가 있다.

#### 🌍 값의 세계 (Runtime)
- 함수, 변수, 클래스 인스턴스, 객체, 숫자, 문자열...
- 실제로 메모리에 존재하고 코드로 실행됨
- JS와 동일한 세계

#### 👻 타입의 세계 (Compile-time only)
- interface, type, 제네릭, 타입 어노테이션...
- 컴파일러의 머릿속에만 존재
- 컴파일 끝나면 증발

```
[TypeScript 소스]
       │
       ├── 값의 세계 ──────→ [JS 출력에 그대로 남음]
       │
       └── 타입의 세계 ────→ [컴파일러가 검사 후 폐기]
```

`import type`은 **타입의 세계로만** 가져오는 것. 값의 세계(JS)에 처음부터 들어가지 않으므로 사라져도 사라질 게 없다.

### 3. 무엇이 지워지고, 무엇이 남는가

#### ❌ JS 출력에서 사라지는 것 (타입의 세계)
| 문법 | 사라지는 이유 |
|---|---|
| `interface`, `type` 선언 | 타입 정보 (런타임 값 아님) |
| `: Question`, `: number` 같은 어노테이션 | 타입 정보 |
| `import type` 구문 | 타입 정보만 가져옴 |
| 제네릭 `<T>` | 컴파일 시점에만 존재 |
| `as Type` 단언 | 타입 정보 |
| `satisfies` | 타입 검증용 |
| `declare` 선언 | 타입 정보 |

#### ✅ JS 출력에 남는 것 (값의 세계)
| 문법 | 남는 이유 |
|---|---|
| `function`, `const`, `class` 선언 | 실제 런타임 값 |
| `if`, `for`, 모든 로직 | 실제 실행 코드 |
| 일반 `import`/`export` | 런타임 모듈 시스템 |
| `enum` (const enum 제외) | 런타임 객체 생성 |

### 4. "사라진 것끼리 짝이 맞는다"는 통찰
타입 import가 사라져도 오류가 안 나는 이유는, **그것을 사용한 코드(타입 어노테이션 등)도 같이 사라지기 때문**.

```ts
// 입력
import type { Question } from './types';
function check(q: Question): boolean { return q.type === 'short_answer'; }
```
```js
// 출력 — Question, : Question, : boolean 모두 함께 사라짐
function check(q) { return q.type === 'short_answer'; }
```
짝이 맞으니 오류가 날 자리 자체가 없다.

## 실제 적용

### 시나리오 1: 인터페이스를 어노테이션으로만 사용
```ts
import type { Question } from './types';

function process(q: Question) {
  console.log(q.id);
  return q.type;
}
```
컴파일 후:
```js
function process(q) {
  console.log(q.id);
  return q.type;
}
```
속성 접근(`q.id`, `q.type`)은 JS에서도 그냥 객체 속성 접근이라 동작 정상.

### 시나리오 2: 변수 타입 선언
```ts
import type { QuizSettings } from './types';

const settings: QuizSettings = {
  questionCount: 10,
  difficulty: 'easy',
  shuffle: true,
};
```
컴파일 후:
```js
const settings = {
  questionCount: 10,
  difficulty: 'easy',
  shuffle: true,
};
```
객체 리터럴은 그대로, 타입 어노테이션만 사라짐.

### 시나리오 3: 제네릭에 타입 사용
```ts
import type { User } from './types';

const users: Array<User> = [];
const map = new Map<string, User>();
```
컴파일 후:
```js
const users = [];
const map = new Map();
```
런타임 객체(`Array`, `Map`)는 남고, 제네릭 타입 인자만 사라짐.

### 시나리오 4: interface 선언 자체도 사라진다
```ts
// 입력
interface User { id: number; name: string }
const u: User = { id: 1, name: 'kim' };
```
```js
// 출력
const u = { id: 1, name: 'kim' };
```
`interface User` 선언이 통째로 사라진다. JS에 인터페이스라는 개념 자체가 없으니까.

## 주의사항

### 1. 진짜 오류가 나는 케이스 — 타입을 값으로 쓰려 할 때
컴파일러가 사전 차단하지만, 어떤 패턴이 위험한지 알아둘 것.

#### ❌ 함수를 type으로 import 후 호출
```ts
import type { saveData } from './api';
saveData(payload);
// ❌ TS 에러: 'saveData' cannot be used as a value because it was imported using 'import type'.
```

#### ❌ 클래스를 type으로 import 후 instanceof
```ts
import type { ApiError } from './errors';
if (err instanceof ApiError) { ... }  // ❌
```
`instanceof`는 우항에 실제 생성자 객체가 필요한데 사라졌으므로 에러.

#### ❌ 클래스를 type으로 import 후 new
```ts
import type { User } from './user';
const u = new User();  // ❌
```

### 2. 안전한 사용 — 타입의 세계에서만
```ts
import type { User } from './user';

function getName(u: User): string {            // ✅ 어노테이션
  return u.name;
}

const list: User[] = [];                        // ✅ 어노테이션
const handler = (u: User) => u.id;              // ✅ 어노테이션
type AdminUser = User & { isAdmin: true };      // ✅ 타입 정의
```
모두 컴파일 후 사라지는 자리에서만 사용 → 안전.

### 3. enum은 예외 — 런타임 객체를 생성한다
```ts
enum Status { Active, Inactive }
// 컴파일 후 객체로 살아남음
```
이래서 enum은 `import type`으로만 가져오면 값으로 쓸 때 에러.

### 4. const enum은 인라인되어 사라짐
```ts
const enum Color { Red = 'red' }
const c = Color.Red;  // → const c = 'red';
```
값 자체가 인라인되므로 별도 import 없이 동작. 하지만 별도 함정(빌드 도구 호환성)이 있어 별도 학습 필요.

### 5. 컴파일러가 값/타입 혼동을 사전 차단
TypeScript 컴파일러는 `import type`으로 가져온 심볼을 값으로 쓰려고 하면 컴파일 에러를 낸다. 위험 케이스들은 **런타임 도달 전에 차단**된다.

이래서 `import type`은 사용자 실수를 컴파일 시점에 강제 차단하는 역할도 한다. 미래의 누군가가 실수로 값으로 쓰는 것도 막힌다.

### 6. JavaScript 자체에 "런타임 타입 검사"가 없다는 점도 알아둘 것
TypeScript의 타입 검사는 **오로지 컴파일 시점**. 런타임에 들어온 값이 진짜 그 타입인지는 보장하지 않는다.
```ts
function f(q: Question) { ... }
f({ wrong: 'shape' } as any);  // 컴파일 통과, 런타임 위험
```
런타임 검증이 필요하면 zod, valibot, io-ts 같은 별도 라이브러리 필요.

## 직관적 비유 — 연극 대본
- **타입** = 대본의 무대 지시문 ("배우는 슬픈 표정으로 등장")
- **값(코드)** = 배우의 실제 대사와 행동
- **컴파일** = 공연 시작
- **JS 실행** = 관객이 보는 공연

대본의 무대 지시문은 연출가(컴파일러)가 검토해 배우들에게 지도하지만, 실제 공연(JS) 중에 무대 지시문이 무대 위에서 낭독되지는 않는다. 무대 지시문(타입)을 어디서 빌려왔든(`import type`이든 직접 작성이든) 공연에 영향이 없다.

## 한 줄 요약 모음
- TypeScript의 타입은 **컴파일러의 머릿속에만 존재**한다 (Type Erasure)
- `import type`은 **타입의 세계로만** 심볼을 가져오므로 JS에는 처음부터 없다
- 타입을 "사용한 코드"(어노테이션, 제네릭, interface 선언)도 **함께 사라진다**
- 사라진 것끼리 짝이 맞아 **오류가 날 자리 자체가 없음**
- 값으로 쓰는 패턴(호출, instanceof, new)은 컴파일러가 사전 차단
- TypeScript는 컴파일 시점 검사이고, **런타임 타입 보장은 없다** (별도 라이브러리 필요)

## 참고 자료
- [TypeScript Handbook — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TypeScript Handbook — TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
- [TC39 — Type Annotations Proposal](https://github.com/tc39/proposal-type-annotations) (JS 자체에 타입 도입 논의 — 현재 stage 1)
- 런타임 타입 검증 라이브러리: [zod](https://github.com/colinhacks/zod), [valibot](https://github.com/fabian-hiller/valibot)
- 연관 학습 노트:
  - `.claude/study/2026-05-03/typescript-type-guard.md`
  - `.claude/study/2026-05-03/typescript-sentinel-literal-union.md`
  - `.claude/study/2026-05-03/typescript-utility-types.md`
  - `.claude/study/2026-05-03/typescript-import-type.md`
