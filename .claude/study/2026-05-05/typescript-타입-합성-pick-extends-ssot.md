# TypeScript 타입 합성 — Pick·extends와 Single Source of Truth

## 학습 환경
- 날짜: 2026-05-05
- 관련 프로젝트: ai-quiz (React + Vite + TypeScript)
- 기술·버전: TypeScript (Pick 유틸리티 타입, interface extends)

---

## 배경
`src/lib/db.ts`의 `createDraftSession` 함수가 payload 타입을 **인라인 객체 타입**으로 받고 있었다.

```ts
export async function createDraftSession(payload: {
  userId: string
  categories: string[]
  selectedTypes: string[]
  totalQuestions: number
  startedAt: string
  settings: { difficulty: string; shuffle: boolean }
  pretest: boolean
}): Promise<string | null> { ... }
```

같은 파일에서 `saveQuizSession`은 `SaveQuizSessionPayload`를 import해서 쓰고, `saveFeedback`은 `SaveFeedbackPayload`를 쓰는데 `createDraftSession`만 인라인 정의를 사용하고 있어서 **일관성이 깨진 상태**였다. 이걸 별도 타입으로 분리하는 게 낫지 않냐는 질문에서 출발해, "타입을 어떻게 분리하느냐"가 단순한 스타일 문제가 아니라 **변경 전파와 안전망에 직결되는 설계 결정**이라는 점을 학습했다.

---

## 핵심 개념

### 두 payload의 의미적 관계
`createDraftSession`과 `saveQuizSession`은 **같은 도메인 개체(퀴즈 세션)의 서로 다른 시점**을 표현한다.

```
시간 ───────────────────────────────▶
│                                    │
draft 생성                       최종 저장
(점수·답안 미정)               (점수·답안 확정)
│                                    │
└─ CreateDraftSessionPayload         └─ SaveQuizSessionPayload
   userId, categories, ...              (위 7개) + correctCount
                                                 + scorePercent
                                                 + answers
```

7개 필드가 우연히 같은 게 아니라 **같은 도메인이라 같아야만 한다**. 이 "같아야만 한다"를 코드로 표현할지, 우연으로 둘지가 핵심 선택이다.

### 분리 방법 3가지

#### 옵션 A — 독립 정의 (단순 분리)
```ts
export interface CreateDraftSessionPayload {
  userId: string
  categories: string[]
  // ... (7개 필드 모두 작성)
  pretest: boolean
}

export interface SaveQuizSessionPayload {
  userId: string
  categories: string[]
  // ... (같은 7개 + correctCount, scorePercent, answers)
}
```
- 두 타입이 **서로를 모름**. 한쪽 수정해도 다른 쪽에 영향 없음.

#### 옵션 B — `Pick`으로 파생 (DRY)
```ts
export type CreateDraftSessionPayload = Pick<
  SaveQuizSessionPayload,
  'userId' | 'categories' | 'selectedTypes' | 'totalQuestions'
  | 'startedAt' | 'settings' | 'pretest'
>
```
- 부모(`SaveQuizSessionPayload`)에서 **명시한 필드만** 골라 자식 타입을 생성.
- 공유 필드 목록을 명시적으로 관리하는 방식.

#### 옵션 C — `extends`로 상속 (도메인 흐름 반영)
```ts
export interface CreateDraftSessionPayload {
  userId: string
  // ... (draft 단계 7개 필드)
}

export interface SaveQuizSessionPayload extends CreateDraftSessionPayload {
  correctCount: number
  scorePercent: number
  answers: SaveAnswerPayload[]
}
```
- "draft에 점수·답안을 더하면 final"이라는 **도메인 흐름이 타입 계층에 그대로 표현**됨.
- 부모 한 번 수정 → 자식 자동 동기화.

### 변경 시나리오별 거동

| 변경 종류 | 옵션 A (독립) | 옵션 B (Pick) | 옵션 C (extends) |
|---|---|---|---|
| 필드 **추가** | 양쪽 수동 추가 (drift 위험) | 부모 수정 + Pick 리스트 갱신 필요 | **부모 한 곳 수정 → 자동 전파** |
| 필드 **이름 변경** | 컴파일러 침묵, 호출부 추적 어려움 | 부모만 바뀌면 Pick 리스트 에러로 잡힘 | **호출부에서 즉시 컴파일 에러** |
| 필드 **타입 좁히기** | 한쪽만 좁아짐 (타입 안전성 절반) | 부모만 좁히면 자식도 자동 좁아짐 | **양쪽 자동 좁아짐** |
| 필드 **삭제** | 침묵의 사용 잔존 | 부모에서 사라지면 Pick 에러 | **참조하던 호출부 모두 컴파일 에러** |

### "자동으로 따라오게" vs "자동으로 깨져서 알게" — 같은 동전의 양면

- **따라오게** = 좋은 변경(필드 추가)이 한 곳 수정으로 양쪽에 전파
- **깨져서 알게** = 위험한 변경(이름 변경·삭제·타입 변경)이 누락되면 **컴파일러가 호출부에서 즉시 에러로 알려줌**

옵션 A는 둘 다 못 한다(두 타입이 서로 모름). 옵션 C는 둘 다 된다(부모-자식 관계로 묶임).

### Single Source of Truth (SSoT) 원칙
TypeScript 한정 얘기가 아니라 **모든 데이터 모델링의 원칙**.

| 패턴 | 정의 | 결과 |
|---|---|---|
| **Single Source of Truth** | 하나의 정의만 있고, 다른 곳은 참조 | 동기화 자동, 변경 추적 가능 |
| **Multiple Sources of Truth** | 여러 곳에 같은 정의 복사 | 시간 흐름에 따라 반드시 어긋남 |

옵션 C가 SSoT, 옵션 A가 multiple sources. 도메인이 자주 바뀌는 프로젝트일수록 SSoT의 가치가 커진다.

---

## 실제 적용

### 변경 시나리오 1 — `language: 'ko' | 'en'` 필드 추가

**옵션 A (drift 발생):**
```ts
export interface CreateDraftSessionPayload {
  // ...
  language: 'ko' | 'en'  // 추가
}

export interface SaveQuizSessionPayload {
  // ...
  // language를 까먹고 안 추가함 — TS는 침묵
}
```
컴파일·빌드·배포 모두 통과. `saveQuizSession` 호출 시점에 NULL이 들어가 **데이터 오염**으로 발견됨.

**옵션 C (자동 전파):**
```ts
export interface CreateDraftSessionPayload {
  // ...
  language: 'ko' | 'en'  // 한 곳만 추가
}

export interface SaveQuizSessionPayload extends CreateDraftSessionPayload {
  correctCount: number
  // language 자동 상속
}
```
호출부 양쪽 모두 `language` 필수 적용. 누락 시 컴파일 에러.

### 변경 시나리오 2 — `categories` → `categoryIds` 이름 변경

**옵션 A:** 두 타입 모두에서 수동 변경 필요. 한쪽만 바꾸면 grep으로 찾아내야 함.

**옵션 C:** 부모 한 곳 변경 → 옛 이름 쓰던 모든 호출부에서 컴파일 에러.
```
error TS2322: Type '{ categories: string[]; ... }' is not assignable
to parameter of type 'SaveQuizSessionPayload'.
  Did you mean to write 'categoryIds'?
```

### 변경 시나리오 3 — `settings.difficulty: string` → `'easy'|'medium'|'hard'`

**옵션 A:** 한쪽만 좁히면 다른 쪽 호출부는 여전히 임의 string 통과. 타입 안전성 절반만 적용.

**옵션 C:** 부모 한 곳 좁히면 양쪽 호출부 모두에서 오타·잘못된 값을 컴파일 시점에 차단.

---

## 주의사항

### 옵션 B(Pick)의 한계 — 자동 전파가 아니다
`Pick<Parent, '필드1' | '필드2' | ...>`는 **명시한 필드만** 가져온다. 부모에 새 필드가 추가돼도 Pick 리스트에 추가하지 않으면 자식에 안 들어간다. "공유 필드를 명시적으로 관리하고 싶을 때" 적합하지만, **"draft가 final의 진짜 부분집합"이라는 도메인 의미를 강제하지는 못한다**.

### 옵션 C 선택 시 기존 호환성 점검 필요
ai-quiz 프로젝트에서 `SaveQuizSessionPayload.pretest`는 현재 `optional`이고, `createDraftSession`의 인라인 타입에서는 `pretest`가 `required`다. 옵션 C로 묶을 때 부모(`CreateDraftSessionPayload`)에서 `pretest: boolean`(required)으로 정의하면 자식이 자동 상속받아 `SaveQuizSessionPayload.pretest`도 required가 된다. **기존 호출자가 pretest를 생략하던 곳이 있다면 깨질 수 있으므로** 호출부 스캔 후 결정해야 한다.

### "관계 없으면 묶지 마라"
타입을 묶는 건 **도메인 관계가 실제로 있을 때만** 의미 있다. 우연히 필드 이름이 겹치는 두 타입을 extends로 묶으면 한쪽 변경이 의도치 않게 다른 쪽을 깨뜨린다. 묶기 전에 "이 둘이 같은 개체의 다른 시점/측면인가?"를 자문해야 한다. ai-quiz의 draft↔final 관계는 명확히 그렇다.

### 컴파일러 에러는 비용이 아니라 자산
"옵션 C로 바꾸니 갑자기 에러가 잔뜩 떴다"는 단점이 아니다. **그 에러들이 원래 잠재돼 있던 drift**다. 옵션 A는 그 drift를 런타임·데이터 오염 시점까지 미뤄둔 것뿐. 일찍 깨질수록 싸다.

---

## 참고 자료
- TypeScript Handbook — Utility Types (`Pick`, `Omit`, `Partial` 등): https://www.typescriptlang.org/docs/handbook/utility-types.html
- TypeScript Handbook — Interface Extending: https://www.typescriptlang.org/docs/handbook/2/objects.html#extending-types
- 프로젝트 내 관련 코드:
  - `src/lib/db.ts` — `createDraftSession`(인라인 타입), `saveQuizSession`(외부 타입 import)
  - `src/types/index.ts` — `SaveQuizSessionPayload`, `SaveFeedbackPayload`
- 관련 학습 노트:
  - `.claude/study/2026-05-03/typescript-utility-types.md`
  - `.claude/study/2026-05-05/rpc-와-supabase-upsert-패턴.md`
