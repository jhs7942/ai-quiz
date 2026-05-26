# Nullish Coalescing(`??`)과 undefined → null 정규화

## 학습 환경
- 날짜: 2026-05-05 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x, Supabase JS Client, PostgreSQL

## 배경
`db.ts`의 `saveFeedback`에서 `suggested_answer: payload.suggestedAnswer ?? null` 코드를 보고
두 가지 의문이 생겼다.

1. `??` 연산자의 의미와 `||`와의 차이
2. "DB 컬럼이 nullable이면 undefined가 자동으로 null로 변환되지 않나?"

직관과 달리 자동 변환은 일어나지 않는다. `JSON.stringify`가 undefined 필드를 통째로 제외하기 때문에
DB에 도달하기 전에 필드 자체가 사라지고, INSERT/UPDATE의 동작이 의도와 어긋날 수 있다.
호출 코드 단계에서 명시적으로 null로 정규화하는 패턴이 필요한 이유를 정리해둔다.

## 핵심 개념

### 1. `??` (Nullish Coalescing) — ES2020

> 왼쪽 값이 **null 또는 undefined**일 때만 오른쪽 값을 사용

```ts
const result = a ?? b;
// a가 null 또는 undefined → b
// 그 외 (0, "", false 포함) → a
```

### 2. `??` vs `||` 비교

| 연산자 | 오른쪽으로 넘어가는 조건 |
|---|---|
| `\|\|` (OR) | 왼쪽이 **falsy** (`false`, `0`, `""`, `null`, `undefined`, `NaN`) |
| `??` (Nullish Coalescing) | 왼쪽이 **null 또는 undefined**만 |

차이가 드러나는 예시:
```ts
const count = 0;
count || 10;   // 10  ← 0을 falsy로 취급해 의도치 않게 대체
count ?? 10;   // 0   ← 0은 유효한 값이므로 유지

const name = "";
name || "익명";   // "익명"  ← 빈 문자열을 "값 없음"으로 취급
name ?? "익명";   // ""      ← 빈 문자열도 유효한 값으로 인정
```

→ "값이 없을 때만 기본값"이라는 의도라면 `??`가 안전. `||`는 `0`·`""`·`false` 같은 유효 값까지 대체.

### 3. undefined의 JSON 직렬화 동작

`JSON.stringify`는 값이 `undefined`인 필드를 결과에서 **통째로 제외**한다:
```js
JSON.stringify({ a: 1, b: undefined, c: null })
// '{"a":1,"c":null}'
//   ↑ b 필드 자체가 사라짐, c는 null로 유지
```

→ HTTP로 나가는 시점에 이미 undefined 필드는 존재하지 않음.

### 4. DB까지의 전달 과정

| 단계 | undefined 처리 |
|---|---|
| JS 객체 | 그대로 `undefined` |
| `JSON.stringify` | 필드 제외 ❌ |
| HTTP 전송 | 해당 필드 없는 JSON |
| Supabase / PostgREST | 필드 없으니 SQL에 포함 안 시킴 |
| PostgreSQL | 컬럼이 SET/INSERT 목록에 없으니 DEFAULT 또는 기존 값 유지 |

→ **"nullable 컬럼이라 자동 null로 들어간다"는 단계는 어디에도 없다.**

### 5. INSERT vs UPDATE 동작 차이

**INSERT** — 운이 좋으면 동작:
```ts
insert({ user_id: 'u1', suggested_answer: undefined })
// 실제 SQL
INSERT INTO feedbacks (user_id) VALUES ('u1');
// → DEFAULT가 있으면 그 값, 없고 NULL 허용이면 NULL, NOT NULL이면 에러
```

**UPDATE** — 더 위험:
```ts
update({ description: '수정', suggested_answer: undefined }).eq('id', 1)
// 실제 SQL
UPDATE feedbacks SET description = '수정' WHERE id = 1;
// → suggested_answer가 SET 절에 없으니 기존 값 유지
// 사용자 의도("비우기")와 정반대 결과
```

### 6. 라이브러리별 동작 일관성 없음

| 환경 | undefined 필드 동작 |
|---|---|
| Supabase JS / fetch + JSON | 직렬화에서 제거 (필드 누락) |
| Prisma | "필드 명시 안 함"으로 해석. null과 명확히 구분 |
| Mongoose | 기본 누락. 옵션에 따라 다름 |
| Sequelize | 누락 |
| node-postgres (pg) | 경우에 따라 에러 |

→ "DB가 알아서 처리"는 어떤 환경에서도 보장 안 됨. 호출 코드 단계의 정규화가 유일한 안전장치.

## 실제 적용

### 정규화 패턴
```ts
suggested_answer: payload.suggestedAnswer ?? null,
//                       ↑ undefined 가능
//                                            ↑ 명시적 null로 정규화
```

이 한 줄이 보장하는 것:
1. JSON 직렬화에서 필드가 사라지지 않음
2. INSERT에서 DEFAULT 의존 없이 명시적 NULL 저장
3. UPDATE에서 "기존 값 유지"가 아니라 "NULL로 덮어쓰기"
4. 타입 시그니처 일관성 — 호출자가 `string | undefined`를 줘도 DB 레이어는 항상 `string | null` 처리

### Before / After

```ts
// ❌ Before — undefined가 그대로 흘러감
async function saveFeedback(payload: SaveFeedbackPayload) {
  await supabase.from('feedbacks').insert({
    suggested_answer: payload.suggestedAnswer,   // undefined일 수 있음
  });
}

// ✅ After — 명시적 null 정규화
async function saveFeedback(payload: SaveFeedbackPayload) {
  await supabase.from('feedbacks').insert({
    suggested_answer: payload.suggestedAnswer ?? null,
  });
}
```

### 타입 정의와의 관계
```ts
// types/index.ts
type SaveFeedbackPayload = {
  userId: string;
  suggestedAnswer?: string;   // optional → string | undefined
};

// DB row 타입 (생성된 타입)
type FeedbackRow = {
  user_id: string;
  suggested_answer: string | null;   // nullable 컬럼 → string | null
};
```

→ `undefined`(JS optional) ↔ `null`(DB nullable) 사이의 **타입 변환 책임은 DB 레이어가 진다**.
호출자는 optional하게 전달하고, DB 레이어가 `?? null`로 정규화.

## 주의사항

### 헷갈리기 쉬운 점
1. **"nullable 컬럼이니까 알아서 null"은 환상**
   - JSON 직렬화 단계에서 필드가 사라지므로 DB는 nullable 여부를 판단할 기회조차 없음
   - 호출 코드에서 명시적 변환이 필수

2. **`||`로 대체하면 0·""·false도 같이 대체**
   - 의도가 "nullish만 기본값"이라면 반드시 `??`
   - `||`는 의미상 "falsy면 기본값" — 다른 의도

3. **INSERT는 운 좋으면 동작, UPDATE는 거의 항상 버그**
   - INSERT에서 DEFAULT 정의에 의존하면 스키마 변경 시 깨짐
   - UPDATE는 "기존 값 유지"가 거의 대부분 의도와 다름

4. **`null`과 `undefined`를 혼용하지 않는다**
   - JS optional은 `undefined`가 자연스럽지만 DB 경계에서는 `null`로 통일
   - 일관성 없으면 `if (x === null)` / `if (x === undefined)` 체크가 산재함

5. **`??=` 할당 단축**
   ```ts
   payload.suggestedAnswer ??= '기본값';
   // payload.suggestedAnswer가 null/undefined일 때만 할당
   ```

### 코드 작성 체크리스트
- [ ] DB로 보내는 객체에 `undefined`가 들어갈 수 있는 필드는 모두 `?? null` 또는 명시적 변환
- [ ] optional 필드(`?:`)를 가진 payload 타입을 DB에 그대로 spread하지 않는다
- [ ] UPDATE 시에는 특히 주의 — "비우기"인지 "건드리지 않기"인지 명확히
- [ ] 기본값이 `0`·`""`·`false`가 될 수 있다면 `||` 대신 `??` 사용
- [ ] 타입 변환 지점을 DB 레이어 한 곳에 집중 (호출자마다 변환 책임 X)

## 참고 자료
- MDN: Nullish Coalescing Operator (`??`)
- MDN: `JSON.stringify` 동작 — undefined 필드 제외 명세
- 관련 study 노트: `.claude/study/2026-05-05/silent-fail-과-try-catch-위치.md` (같은 `saveFeedback` 함수의 다른 학습 포인트)
- 관련 study 노트: `.claude/study/2026-05-05/introduce-parameter-object.md` (payload 타입 설계)
