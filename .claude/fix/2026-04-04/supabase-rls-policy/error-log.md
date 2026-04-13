# Supabase RLS 정책으로 인한 quiz_sessions INSERT 실패

## 발생 환경
- 날짜: 2026-04-04 / 관련 파일: `src/lib/db.ts` / Supabase PostgREST

## 증상
- 퀴즈를 풀어도 `quiz_sessions`, `quiz_answers` 테이블에 데이터가 저장되지 않음
- 브라우저 콘솔에 `POST quiz_sessions?select=id => 401` 에러 발생
- `users`, `access_logs` 테이블은 정상 저장됨

## 원인
- `quiz_sessions` 테이블에 INSERT RLS 정책만 존재하고 SELECT/UPDATE 정책이 없었음
- `createDraftSession()`과 `saveQuizSession()` 모두 `.insert().select('id').single()` 패턴 사용
- PostgREST는 `prefer: return=representation` 요청 시 INSERT 후 SELECT로 결과를 반환하는데, SELECT 권한이 없어 401 반환
- INSERT 자체도 트랜잭션 롤백되어 행이 생성되지 않음

## 해결책
- 6개 public 테이블 전체의 RLS를 비활성화하고 기존 정책을 모두 삭제
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

## 재발 방지
- 이 프로젝트는 anon key로 모든 테이블에 접근하므로 RLS가 불필요
- RLS를 활성화할 경우 INSERT뿐 아니라 SELECT/UPDATE 정책도 반드시 함께 추가해야 `.select()` 반환이 동작함
- Supabase 대시보드에서 테이블 생성 시 RLS가 기본 활성화되므로 주의 필요
