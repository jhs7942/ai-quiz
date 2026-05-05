## 요약
Supabase 통신 레이어 `src/lib/db.ts` (174줄) 에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#5 / 13**.

## 사전 지식
- Supabase JS 클라이언트의 메서드 체이닝 패턴 (`.from().select().eq().single()`)
- `try/catch + 빈 catch` 의 silent fail 패턴이 언제 적절한지
- DB 컬럼 snake_case ↔ TS camelCase 매핑

## 학습 포인트
1. **silent fail 정책 분기** — 분석/로깅 함수는 빈 catch (앱 흐름 차단 X), 사용자 명시 액션(saveFeedback)은 에러를 위로 던짐
2. **`.single()` vs `.maybeSingle()`** — single 은 0개 행이면 에러, maybeSingle 은 null 반환. select 후 분기에는 maybeSingle, insert 후엔 single
3. **upsert 패턴 (직접 구현)** — Supabase 의 `.upsert()` 메서드도 있지만, 여기선 visit_count 증가 로직이 필요해 select → 분기 방식 채택
4. **fallback 반환** — DB 실패 시 sessionId 자체를 user_id 로 사용. 후속 함수가 string 만 받으므로 동작 영향 없음
5. **메서드 체이닝 → SQL 매핑** — `.from('users').select(...).eq(...)` ≈ `SELECT ... FROM users WHERE ...`
6. **두 단계 insert (1:N)** — quiz_sessions(부모) → quiz_answers(자식). 부모 id 를 받은 뒤 자식의 외래키에 채움
7. **bulk insert** — `.insert(배열)` 한 번으로 N 행 삽입. for 문 X — 한 번의 round-trip
8. **`?? false` (nullish coalescing)** — `||` 와 다름. `??` 는 null/undefined 만 검사, 0/'' 같은 falsy 는 통과
9. **`?? null` 명시적 null 변환** — Supabase 에 undefined 대신 null 을 넘기는 게 안전
10. **payload 객체 패턴** — 인자가 5개 이상이면 객체로 묶어 호출처에서 키 명시 (순서 실수 방지)
11. **`Promise<void>`** — 결과값 없이 비동기 완료만 알리는 함수 시그니처

## 리뷰 시 봐야 할 라인
| 라인 | 학습 포인트 |
|---|---|
| 12, 22 | maybeSingle vs single 차이 |
| 19, 24 | upsert 직접 구현 (select → if/else) |
| 36 | DB 실패 시 sessionId fallback |
| 50 | snake_case ↔ camelCase 매핑 |
| 100 | `?? false` (nullish coalescing) |
| 105 | error || !session 두 가지 모두 가드 |
| 109 | bulk insert (배열로 한 번에) |
| 122 | saveFeedback 만 try/catch 없음 — 사용자 액션 |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- Supabase RLS(Row-Level Security) 도입 → 별도 PR
- payload 타입을 zod 로 검증 → 별도 PR
- silent fail 을 일관적으로 로거(Sentry 등)에 보내기 → 별도 PR

## 다음 PR
**PR #6 `docs/learn-store-wrong-note`** — `src/store/wrongNoteStore.ts`. localStorage persist, 중복 방지 패턴, quizStore 와 storage 분리 이유.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
