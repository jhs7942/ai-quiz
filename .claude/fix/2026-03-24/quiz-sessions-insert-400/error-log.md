# quiz_sessions INSERT HTTP 400 에러

## 발생 환경
- 날짜: 2026-03-24
- 관련 파일: `src/lib/db.ts` > `saveQuizSession()`, `src/pages/ResultPage.tsx`
- 라이브러리·버전: @supabase/supabase-js (프로젝트 의존성)

## 증상

결과 화면(`/result`) 진입 시 브라우저 콘솔에 아래 에러 발생:

```
Failed to load resource: the server responded with a status of 400 ()
@ https://kksaaqssfgotnoichdma.supabase.co/rest/v1/quiz_sessions?select=id
```

퀴즈 풀이 기록이 Supabase `quiz_sessions` 테이블에 저장되지 않음.
화면 동작 자체는 정상 (silent fail 처리).

## 원인

다음 두 가지 중 하나 또는 둘 다:

1. **RLS 정책 누락**: `quiz_sessions` 테이블에 RLS가 활성화되어 있으나, `anon` 역할에 대한 INSERT 정책이 없어 요청이 거부됨
2. **스키마 불일치**: 코드가 전송하는 컬럼(`user_id`, `categories`, `selected_types`, `total_questions`, `correct_count`, `score_percent`, `started_at`, `settings`)이 실제 테이블 스키마와 다를 가능성

## 해결책

Supabase 대시보드 또는 MCP로 아래 중 해당 사항 적용:

**① RLS 정책 추가 (원인 1)**
```sql
-- quiz_sessions: anon INSERT 허용
CREATE POLICY "anon can insert quiz_sessions"
ON public.quiz_sessions
FOR INSERT
TO anon
WITH CHECK (true);

-- quiz_answers: anon INSERT 허용
CREATE POLICY "anon can insert quiz_answers"
ON public.quiz_answers
FOR INSERT
TO anon
WITH CHECK (true);
```

**② 스키마 확인 (원인 2)**
- Supabase 대시보드 > Table Editor > `quiz_sessions` 에서 실제 컬럼명과 코드의 INSERT 필드 비교
- 누락된 컬럼 추가 또는 코드의 필드명 수정

## 재발 방지

- 새 테이블 생성 시 RLS 정책(INSERT/SELECT/UPDATE/DELETE)을 함께 작성
- DB 스키마 변경 시 `src/lib/db.ts`의 INSERT 필드와 동기화 확인
