# Supabase RLS × PostgREST return=representation 함정

## 학습 환경
- 날짜: 2026-04-13 / 관련 프로젝트: AI_quiz (ai-quiz) / 기술·버전: Supabase PostgREST, @supabase/supabase-js 2.x

---

## 배경

퀴즈를 풀어도 `quiz_sessions`, `quiz_answers` 테이블에 데이터가 저장되지 않는 증상이 발생했다. `users`, `access_logs`는 정상이었고, `quiz_sessions`만 `POST .../quiz_sessions?select=id → 401`로 실패했다.

원인은 단순한 권한 누락이 아니라 **PostgREST의 `Prefer: return=representation` 동작**과 Supabase JS client의 `.select()` 체이닝이 결합하면서 발생한 것이었다. RLS INSERT 정책만으로는 부족한 이유를 이해해야 한다.

출처: `.claude/fix/2026-04-04/supabase-rls-policy/error-log.md`

---

## 핵심 개념

### PostgREST Prefer 헤더 3종

| 값 | 반환 내용 | SELECT 권한 필요 |
|---|---|---|
| `return=minimal` | 없음 | ❌ |
| `return=headers-only` | Location 헤더만 | ❌ |
| `return=representation` | 삽입된 행 전체 | ✅ |

### Supabase JS client의 `.select()` 체이닝

```ts
await supabase.from('quiz_sessions').insert(row).select('id').single()
```

`.select()`를 체이닝하면 client가 자동으로 `Prefer: return=representation` 헤더를 붙인다. PostgREST는 INSERT 후 **내부적으로 SELECT를 실행하여 행을 반환**한다. 이 SELECT에 RLS 정책이 없으면 권한 실패가 발생한다.

### 에러의 연쇄

1. `.insert(...).select('id').single()` 호출
2. client가 `Prefer: return=representation` 헤더 첨부
3. PostgREST가 INSERT 실행 (INSERT 정책 통과)
4. 이어서 반환용 SELECT 실행 (SELECT 정책 부재 → 실패)
5. 트랜잭션 롤백 → 행 생성되지 않음
6. HTTP 401 응답

**INSERT 자체는 허용되었지만, 결과 반환을 위한 SELECT가 거부되어 트랜잭션 전체가 롤백**된다. 겉으로는 INSERT 권한 문제처럼 보이지만 실제로는 SELECT 권한 문제다.

---

## 실제 적용

### 해결: RLS 전면 비활성화

이 프로젝트는 anon key로 모든 public 테이블에 접근하는 구조라 RLS가 본래 의도대로 동작하기 어렵다. 6개 테이블의 RLS를 끄고 기존 정책을 삭제했다.

```sql
DROP POLICY IF EXISTS "anon insert access_logs" ON access_logs;
DROP POLICY IF EXISTS "anon insert quiz_answers" ON quiz_answers;
DROP POLICY IF EXISTS "anon insert quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon insert users" ON users;
DROP POLICY IF EXISTS "anon select users" ON users;
DROP POLICY IF EXISTS "anon upsert users" ON users;

ALTER TABLE access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### RLS를 유지하는 대안 3가지

RLS를 유지하고 싶다면 세 가지 선택지가 있다.

**(A) SELECT 정책 추가**
```sql
CREATE POLICY "anon select quiz_sessions" ON quiz_sessions
FOR SELECT TO anon USING (true);
```
간단하지만 anon이 모든 행을 읽을 수 있게 되어 보안 의도와 충돌한다.

**(B) `.select()` 제거 + 클라이언트 UUID 생성**
```ts
const id = crypto.randomUUID()
await supabase.from('quiz_sessions').insert({ id, ...row })
// 반환 없이 id를 클라이언트가 보유
```
INSERT 정책만으로 동작한다. 가장 깔끔한 패턴.

**(C) `Prefer: return=minimal` 명시**
```ts
await supabase
  .from('quiz_sessions')
  .insert(row, { returning: 'minimal' })
```
반환값이 필요 없을 때 유효하다.

---

## 주의사항

### Supabase 대시보드 기본값에 주의

대시보드에서 테이블을 생성하면 **RLS가 기본 활성화**된다. 정책을 추가하지 않은 상태에서 활성화되면 모든 요청이 차단된다. 생성 직후 증상이 "아무것도 안 된다"일 때는 RLS가 범인일 가능성이 높다.

### INSERT 정책만 있으면 `.select()` 체이닝과 비호환

가장 헷갈리는 지점이다. "INSERT 정책 추가했으니 insert는 되겠지"라고 생각하지만, `.select()`가 붙으면 SELECT 정책도 필요하다. 개발 환경에서는 policy explorer로 정책 목록을 확인하고, client 쪽은 `.select()` 호출 유무를 함께 검토해야 한다.

### anon key 구조에서 RLS의 의미 재검토

이 프로젝트처럼 모든 row가 익명 기여분이고 PII 민감도가 낮다면 RLS 비활성화가 실용적이다. 다만 다음 조건이 충족되는지 확인이 필요하다.

- 공개 앱이고 모든 데이터가 게시용
- 사용자 간 소유권 구분이 없음
- 실시간 조회는 서버 측 대시보드에서만 수행
- PII·개인 식별 정보가 포함되지 않음

이 중 하나라도 어긋나면 RLS를 유지하고 위 대안 (A)~(C) 중 하나를 선택해야 한다.

### RLS 해제 결정의 이론적 타당성

이 프로젝트처럼 "로그인 없이 모두가 INSERT하는 구조"에서 RLS를 해제한 결정을 이론적으로 검증한다. 결론부터 말하면 **실용적으로 맞지만, 용어와 전제 몇 가지를 정확히 이해하고 있어야** 한다.

#### 정정 1 — "RLS 권한"이라는 표현은 부정확

PostgreSQL에는 두 개의 접근 제어 레이어가 있고, 이 둘은 다른 개념이다.

| 레이어 | 역할 | 명령 |
|---|---|---|
| **GRANT/REVOKE** | 역할(role)에게 테이블·컬럼 접근 **가능 여부** | `GRANT INSERT ON quiz_sessions TO anon` |
| **RLS** | 이미 접근 가능한 테이블에서 **행 단위 조건** 검사 | `CREATE POLICY ... USING (...) WITH CHECK (...)` |

RLS는 "권한"이 아니라 **"행 단위 필터"**다. Supabase는 기본적으로 `anon` 역할에 public 스키마 테이블 GRANT를 자동으로 준다. 즉 GRANT는 이미 열려있고, RLS가 그 위에 얹히는 구조다.

#### 정정 2 — RLS 기본 동작

| RLS 상태 | 정책 없음 | 정책 있음 |
|---|---|---|
| **활성화 (ENABLE)** | **모두 차단** (기본 deny) | 정책 조건에 맞는 행만 허용 |
| **비활성화 (DISABLE)** | GRANT에 따라 허용 | 정책 무시 (없는 것과 같음) |

Supabase 대시보드에서 테이블 생성 후 "아무것도 안 되는" 상태는 RLS가 켜져있는데 정책이 없어서 발생한다. 권한 부족이 아니라 행 필터가 모두 거부하고 있는 것이다.

#### 두 가지 동등한 선택지

"로그인 없이 모두가 INSERT하는 구조"를 만족하는 방법은 이론적으로 두 개다.

```sql
-- 옵션 X: RLS 비활성화 (이 프로젝트 선택)
ALTER TABLE quiz_sessions DISABLE ROW LEVEL SECURITY;

-- 옵션 Y: RLS 활성화 + 전체 허용 정책
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon all" ON quiz_sessions
FOR ALL TO anon
USING (true) WITH CHECK (true);
```

둘 다 결과적으로 "anon이 모든 row에 접근 가능"이지만, 의미 차이는 있다.

| 구분 | 옵션 X (DISABLE) | 옵션 Y (ENABLE + USING true) |
|---|---|---|
| 의도 표현 | "RLS 안 쓸 거야" | "RLS 쓰긴 쓰는데 지금은 제약 없음" |
| 나중에 제약 추가 | 다시 ENABLE 해야 함 | 정책만 수정하면 됨 |
| 감사 로그 | "비활성화됨"만 남음 | 정책 이력이 남음 |
| 코드 리뷰 인상 | 위험 신호로 보일 수 있음 | 명시적 허용으로 읽힘 |

#### RLS 해제가 타당하려면 충족해야 할 3가지 전제

1. **사용자 구분 없음** — 모든 row가 익명 기여분이고 "내 데이터 vs 남의 데이터" 개념이 없을 때. 있으면 RLS를 유지해서 `auth.uid() = user_id` 같은 조건을 걸어야 한다.
2. **row 단위 제약 불필요** — "특정 조건을 만족하는 row만 INSERT 허용" (예: `score BETWEEN 0 AND 100`, `length(answer) < 1000`) 같은 제약이 필요 없을 때. 필요하면 `WITH CHECK` 정책으로 걸 수 있으므로 DISABLE보다 ENABLE이 낫다.
3. **SELECT 노출 허용** — RLS를 끄면 anon GRANT가 살아있어 SELECT도 가능해진다. `supabase.from('quiz_answers').select('*')` 한 번 호출로 테이블 전체 dump가 가능해진다. 이 프로젝트는 PII 민감도 낮고 공개 학습앱이라 허용 범위로 판단했다.

#### 숨은 리스크 — 읽기 노출

`docs/traffic-spike-solutions.md`의 논점은 "쓰기 부하"였지만, RLS 비활성화는 **읽기 쪽 노출도 동시에 발생**시킨다. 한 번 누가 `.select('*')`로 전체 dump를 가져가도 막을 수 없다. 의사결정 시 쓰기 부하뿐 아니라 읽기 노출까지 함께 따져야 완전한 평가가 된다.

나중에 다음 중 하나라도 필요해지면 RLS를 다시 켜야 한다.
- INSERT 속도 제한 (`created_at >= now() - interval '1 second'`)
- 데이터 크기 제한 (`length(user_answer) < 2000`)
- 특정 컬럼 값 강제 (`is_correct IN (true, false)`)
- 읽기는 service_role만 허용, anon은 쓰기만

#### 더 정확한 표현

"로그인이 없으니 RLS를 해제했다"를 이론적으로 더 정확히 말하면 이렇다.

> 사용자 구분이 없고 행 단위 제약이 필요 없으며 SELECT 노출을 허용할 수 있는 구조라서 RLS를 비활성화했다. 동등한 대안으로 `ENABLE + USING(true)` 정책도 가능했지만 복잡도만 늘고 실익이 없어 DISABLE을 선택했다.

### 재발 방지 체크리스트

1. 테이블 생성 직후 `SELECT rolname FROM pg_roles` 확인 + RLS 상태 확인
2. client 코드에서 `.select()` 체이닝 여부 감사
3. 401 에러 발생 시 요청 쿼리스트링에 `?select=...`가 있는지 확인 → 있으면 SELECT 권한 문제
4. `Prefer` 헤더를 명시적으로 제어할 수 있는 wrapper 함수를 고려

---

## 참고 자료

- [PostgREST - Prefer header](https://postgrest.org/en/stable/api.html#prefer-header)
- [Supabase - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JS - Insert with select](https://supabase.com/docs/reference/javascript/insert)
- [PostgreSQL - ALTER TABLE ... DISABLE ROW LEVEL SECURITY](https://www.postgresql.org/docs/current/sql-altertable.html)
- 관련 프로젝트 파일: `.claude/fix/2026-04-04/supabase-rls-policy/error-log.md`, `src/lib/db.ts`
