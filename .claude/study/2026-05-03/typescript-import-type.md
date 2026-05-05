# TypeScript `import type` — 타입 전용 import의 정체와 필요성

## 학습 환경
- 날짜: 2026-05-03 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x, Vite

## 배경
ai-quiz 코드를 읽다가 `import type { ... }` 구문이 보여 학습 시작. 처음엔 단순 표기 차이로 보였지만, 실제로는 **번들 사이즈·사이드 이펙트·순환 참조·빌드 도구 호환성**에 걸친 의미 있는 차이가 있다. Vite + isolatedModules 환경에서는 사실상 모범 패턴.

연관 파일: `src/types/index.ts` (순수 타입 정의 모듈), 이를 import하는 모든 컴포넌트·스토어 파일.

## 핵심 개념

### 1. 한 줄 정의
> **`import type`**: "이 import는 타입 정보로만 쓸 거고, 런타임 코드는 가져오지 않겠다"고 컴파일러에게 명시하는 문법. JS 출력에서 해당 import 구문이 통째로 사라진다.

### 2. 일반 import의 한계
일반 `import` 사용 시 컴파일러가 "이게 값인지 타입인지" 추측해야 한다. 단일 파일만 보고 컴파일하는 도구(Babel, esbuild, swc 등)에서는 다른 파일의 사용처를 알 수 없어 보수적으로 import를 살릴 수 있다 → **번들 부풀음, 사이드 이펙트 유입, 순환 참조 문제**.

### 3. `import type`이 해결하는 4가지
1. **번들 사이즈 0바이트 보장** — 트리쉐이킹 확정
2. **사이드 이펙트 차단** — import한 모듈의 top-level 코드가 실행되지 않음
3. **순환 참조 회피** — 컴파일 시점에 사라지므로 런타임 순환 참조 자체가 안 생김
4. **빌드 도구 호환성** — Vite/esbuild/Babel 등에서 안전하게 처리 가능

### 4. 컴파일 결과 비교
```ts
// 입력 (TS)
import type { Question } from './quiz';
import { calculateScore } from './quiz';

function f(q: Question) { return calculateScore(q); }
```
```js
// 출력 (JS)
import { calculateScore } from './quiz';  // type import는 통째 삭제 보장
function f(q) { return calculateScore(q); }
```

## 실제 적용

### 문법 종류

#### A. 전체 import를 타입 전용으로
```ts
import type { Question, Difficulty } from './types';
import type DefaultExport from './module';
```

#### B. 개별 specifier만 타입 전용 (TS 4.5+)
```ts
import { someValue, type Question } from './module';
//                  ━━━━ 이 specifier만 타입 전용
```

#### C. 타입 전용 export
```ts
export type { Question };
export type { Question } from './types';  // re-export
```

### 실제 시나리오

#### 시나리오 1: 사이드 이펙트 모듈
```ts
// heavyModule.ts
console.log('이 모듈 로드됨!');  // 사이드 이펙트
export interface Config { ... }
export class HeavyClass { ... }

// myFile.ts
import type { Config } from './heavyModule';  // ✅ heavyModule이 번들에 안 들어감
// import { Config } from './heavyModule';    // ❌ console.log + HeavyClass 같이 묻어옴
```

#### 시나리오 2: 순환 참조 회피
값 import는 순환 참조 시 런타임 `undefined` 문제. `import type`은 컴파일 시점에 사라지므로 순환 참조 자체가 발생하지 않는다.

#### 시나리오 3: isolatedModules 환경
Vite, Next.js, esbuild 등은 파일 단위로 빠르게 컴파일. 한 파일만 보고는 import의 안전 제거 여부를 확신 못 함 → 일반 import는 다 살리거나 빌드 에러. `import type`이 있으면 한 파일만 보고도 "지워도 안전" 확신.

### 이 프로젝트에서의 권장 패턴
```ts
// ✅ 권장 — types 모듈은 순수 타입 정의
import type { Question, QuizSettings, QuizStore } from './types';

// ✅ 라이브러리에서 값+타입 같이
import { create, type StateCreator } from 'zustand';

// ✅ 클래스가 instanceof로도 쓰이면 일반 import (둘로 못 나눔)
import { ApiError } from './errors';
function handle(err: unknown) {
  if (err instanceof ApiError) {  // 값
    err.statusCode;               // 타입
  }
}
```

### tsconfig 옵션

#### `isolatedModules: true`
파일 단위 컴파일 강제. Vite, Next.js, ts-node, esbuild 등이 자동 활성화. 일부 패턴에서 `import type` 강제.

#### `verbatimModuleSyntax: true` (TS 5.0+, 권장)
- 컴파일러가 import를 자동 정리하지 **않음**
- 값 import는 항상 살리고, type import는 항상 지움
- 타입은 반드시 `import type`으로 명시해야 함
```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

## 주의사항

### 1. 값으로 쓸 걸 type으로 import
```ts
import type { someFunction } from './utils';
someFunction();  // ❌ 런타임 에러: undefined
```
`import type`으로 가져온 건 JS에 존재하지 않음.

### 2. 클래스를 type으로만 import 후 instanceof 사용
```ts
import type { MyClass } from './myClass';
if (err instanceof MyClass) { ... }  // ❌ MyClass가 런타임에 없음
```
`instanceof`는 값(생성자) 필요. 클래스를 instanceof로도 쓰면 일반 import 필요.

### 3. enum을 type으로 import
```ts
import type { Status } from './enums';
const s = Status.Active;  // ❌ enum 값 접근은 값 import 필요
```
TypeScript enum은 런타임 객체를 만든다. 값으로 쓰면 일반 import. (const enum은 인라인되지만 별도 함정 있어 별도 학습 필요)

### 4. 인터페이스/타입은 항상 `import type` (모범)
작동은 일반 import도 되지만 빌드 도구·모드에 따라 결과가 갈리고 미래 안전성이 떨어진다. 타입은 항상 `import type`이 모범.

### 5. 인라인 vs 분리 선택 기준
- 같은 모듈에서 값과 타입을 둘 다 쓸 때 → 인라인 `{ value, type X }` 또는 두 줄 분리
- 한 모듈에서 타입만 → `import type { ... }` 한 줄
- 가독성 vs 줄 수: 팀 컨벤션 따라 결정

## 실전 가이드 — 4가지 규칙
1. 타입/인터페이스/타입 별칭만 import → `import type`
2. 함수·변수·클래스·enum 값 사용 → 일반 import
3. 둘 다 필요 → 두 줄 분리 또는 `import { value, type X }` 인라인
4. 클래스를 타입과 instanceof 둘 다 사용 → 일반 import (둘로 못 나눔)

## 참고 자료
- [TypeScript Handbook — Type-Only Imports and Export](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [TypeScript 5.0 — verbatimModuleSyntax](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#verbatimmodulesyntax)
- [Vite 공식 문서 — TypeScript](https://vitejs.dev/guide/features.html#typescript)
- 프로젝트 관련 코드: ai-quiz의 `src/types/index.ts`를 import하는 모든 모듈
- 연관 학습 노트:
  - `.claude/study/2026-05-03/typescript-type-guard.md`
  - `.claude/study/2026-05-03/typescript-sentinel-literal-union.md`
  - `.claude/study/2026-05-03/typescript-utility-types.md`
