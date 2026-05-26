-- =====================================================================
-- AI Quiz · 포트폴리오용 지표 SQL 묶음 (학습 효과 강조 톤)
-- 실행: Supabase 대시보드 → SQL Editor 에 통째로 붙여넣기
--       또는 supabase MCP 인증 복구 후 execute_sql 로 1개씩 실행
--
-- 결과 해석 가이드:
--   - ⭐ 표시: 포트폴리오 한 줄로 직결되는 핵심 지표
--   - 모든 정답률은 % 단위 (0~100)
--   - score_percent: quiz_sessions 의 세션 점수 (0~100)
--   - is_correct: quiz_answers 의 정오답 (bool)
--   - pretest=true: 첫 시도, pretest=false: 오답 재시험
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. 헤드라인 규모 지표 (포트폴리오 첫 줄용)
--    "누적 N명, M회 세션, Q문제 풀이 처리, 평균 K회 재방문"
-- ---------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM users)                                   AS total_users,
  (SELECT COUNT(*) FROM quiz_sessions)                           AS total_sessions,
  (SELECT COUNT(*) FROM quiz_answers)                            AS total_answers,
  (SELECT COUNT(*) FROM users WHERE visit_count > 1)             AS returning_users,
  (SELECT ROUND(AVG(visit_count)::numeric, 2) FROM users)        AS avg_visits_per_user,
  (SELECT COUNT(*) FROM feedbacks)                               AS total_feedbacks;


-- ---------------------------------------------------------------------
-- 2. ⭐ 재시험 효과 (pretest 플래그 기준)
--    "오답 재시험 시 평균 정답률 X% → Y% (+Δ%p)"
-- ---------------------------------------------------------------------
SELECT
  CASE WHEN pretest THEN '첫 시도(pretest)' ELSE '재시험(retry)' END AS phase,
  COUNT(*)                                                            AS answer_count,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2)    AS correct_rate_percent
FROM quiz_answers
GROUP BY pretest
ORDER BY pretest DESC;


-- ---------------------------------------------------------------------
-- 3. ⭐⭐ 같은 사용자 · 같은 문제 N번째 시도별 정답률
--    오답 재시험 기능의 가장 직접적 학습 효과 증명
--    "동일 문제 1차 정답률 X% → 2차 Y% → 3차 Z%"
-- ---------------------------------------------------------------------
WITH ranked_attempts AS (
  SELECT
    qs.user_id,
    qa.quiz_id,
    qa.question_id,
    qa.is_correct,
    qa.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY qs.user_id, qa.quiz_id, qa.question_id
      ORDER BY qa.created_at
    ) AS attempt_no
  FROM quiz_answers qa
  JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
)
SELECT
  attempt_no,
  COUNT(*)                                                          AS attempts,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2)  AS correct_rate_percent
FROM ranked_attempts
WHERE attempt_no <= 3
GROUP BY attempt_no
ORDER BY attempt_no;


-- ---------------------------------------------------------------------
-- 4. ⭐ 첫날 vs 마지막날 평균 합격률 (사용자가 명시적으로 원한 지표)
-- ---------------------------------------------------------------------
WITH daily AS (
  SELECT
    DATE(started_at)                              AS date,
    COUNT(*)                                      AS sessions,
    ROUND(AVG(score_percent)::numeric, 2)         AS avg_score_percent
  FROM quiz_sessions
  WHERE total_questions > 0
  GROUP BY DATE(started_at)
)
SELECT
  (SELECT date              FROM daily ORDER BY date ASC  LIMIT 1) AS first_day,
  (SELECT avg_score_percent FROM daily ORDER BY date ASC  LIMIT 1) AS first_day_score,
  (SELECT date              FROM daily ORDER BY date DESC LIMIT 1) AS last_day,
  (SELECT avg_score_percent FROM daily ORDER BY date DESC LIMIT 1) AS last_day_score,
  (
    (SELECT avg_score_percent FROM daily ORDER BY date DESC LIMIT 1) -
    (SELECT avg_score_percent FROM daily ORDER BY date ASC  LIMIT 1)
  ) AS delta_percent_points,
  (SELECT COUNT(*) FROM daily) AS active_days;


-- ---------------------------------------------------------------------
-- 5. 일별 평균 합격률 트렌드 (꺾은선 차트용 raw 데이터)
-- ---------------------------------------------------------------------
SELECT
  DATE(started_at)                       AS date,
  COUNT(*)                               AS sessions,
  COUNT(DISTINCT user_id)                AS unique_users,
  ROUND(AVG(score_percent)::numeric, 2)  AS avg_score_percent
FROM quiz_sessions
WHERE total_questions > 0
GROUP BY DATE(started_at)
ORDER BY date;


-- ---------------------------------------------------------------------
-- 6. ⭐ 사용자별 첫 세션 vs 마지막 세션 점수 (개인 학습 곡선의 평균)
--    "2회 이상 푼 사용자의 첫 세션 평균 점수 X% → 마지막 세션 Y%"
-- ---------------------------------------------------------------------
WITH ranked AS (
  SELECT
    user_id,
    score_percent,
    started_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at ASC)  AS rn_first,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at DESC) AS rn_last,
    COUNT(*)    OVER (PARTITION BY user_id)                            AS session_count
  FROM quiz_sessions
  WHERE total_questions > 0
)
SELECT
  ROUND(AVG(CASE WHEN rn_first = 1 THEN score_percent END)::numeric, 2) AS avg_first_session_score,
  ROUND(AVG(CASE WHEN rn_last  = 1 THEN score_percent END)::numeric, 2) AS avg_last_session_score,
  COUNT(DISTINCT user_id)                                                AS users_with_multiple_sessions
FROM ranked
WHERE session_count >= 2;


-- ---------------------------------------------------------------------
-- 7. 카테고리별 평균 정답률 + 인기도 (어떤 시험이 활용되나)
-- ---------------------------------------------------------------------
SELECT
  cat                                    AS category,
  COUNT(*)                               AS session_count,
  ROUND(AVG(score_percent)::numeric, 2)  AS avg_score_percent
FROM quiz_sessions, UNNEST(categories) AS cat
WHERE total_questions > 0
GROUP BY cat
ORDER BY session_count DESC
LIMIT 10;


-- ---------------------------------------------------------------------
-- 8. 모바일 vs 데스크탑 사용자 비율 (반응형 3단 분기의 근거)
-- ---------------------------------------------------------------------
SELECT
  CASE
    WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'mobile'
    WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%'                                    THEN 'tablet'
    ELSE 'desktop'
  END                                            AS device,
  COUNT(*)                                       AS users,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percent
FROM users
GROUP BY device
ORDER BY users DESC;


-- ---------------------------------------------------------------------
-- 9. 가장 어려운 문제 Top 10 (정답률 하위 — 문제 품질 개선 후보)
--    최소 5회 이상 시도된 문제만 대상
-- ---------------------------------------------------------------------
SELECT
  quiz_id,
  question_id,
  COUNT(*)                                                         AS attempts,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) AS correct_rate_percent
FROM quiz_answers
GROUP BY quiz_id, question_id
HAVING COUNT(*) >= 5
ORDER BY correct_rate_percent ASC, attempts DESC
LIMIT 10;
