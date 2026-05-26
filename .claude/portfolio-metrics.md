# AI Quiz — 운영 데이터 기반 임팩트 지표

> 데이터 범위: 2026-03-20 ~ 2026-05-06 (47일)
> 조회 시점: 2026-05 / 출처: Supabase 운영 DB 직접 집계
> 톤: **학습 효과 강조** (제품 가치 증명)
>
> 각 섹션의 표·수치 바로 아래에 **출처 SQL**을 함께 보관. 데이터 갱신 시 동일 쿼리를 재실행하면 새 수치를 얻을 수 있고, 면접관·검토자가 집계 방식을 검증할 수 있게 했습니다.

---

## 0. 한 줄 캐치프레이즈 (노션 썸네일 캡션용)

> **2,347명이 92,353개 문제를 풀며 직접 검증한 학습 도구.
> 같은 문제 재시도 시 정답률 67% → 75% (+8.2%p) 향상.**

세 가지 후보 — 톤에 맞춰 골라 쓰면 됩니다:

- (학습 효과형) "9만+ 답안으로 입증한 오답 재시험의 학습 효과 — 1차 67% → 2차 75%"
- (규모형) "47일간 2,347명 / 6,351세션 / 92,353답안을 실서비스로 처리한 SPA"
- (참여도형) "활성 학습자 826명이 1인 평균 18.31세션 — 1회용 도구가 아닌 반복 학습 도구"

---

## 1. 핵심 임팩트 5문장

복사해 붙여넣으면 노션 페이지 본문이 됩니다. 각 문장의 근거 SQL은 § 2~5 참조.

> 1. **누적 2,347명**의 사용자가 **6,351회 퀴즈 세션**을 진행, **92,353개 답안**을 누적 처리했습니다. 동기간 페이지뷰 28,155건. *[근거 § 5]*
>
> 2. **재방문 사용자 612명 (26.1%)** — 서로 다른 날짜에 2회 이상 접속한 사용자 기준. 별도로 퀴즈 세션을 2회 이상 진행한 활성 학습자 **826명(35.2%)** · 1인 평균 **18.31세션** (최다 305회). 단발 호기심이 아닌 반복 학습 도구로 정착. *[근거 § 5]*
>
> 3. **오답 재시도 시 정답률이 1차 67.1% → 2차 75.3%로 +8.2%p 상승** (5차 시도 78.3%). 9만+ 답안 표본으로 학습 효과를 정량 증명. *[근거 § 2]*
>
> 4. **완주 세션 평균 합격률 69.7%** (총 5,435세션, 중도 이탈 14.4% 제외). 가장 활용된 카테고리는 `ai-ml-dl-basics`로 564명이 2,054회 학습. *[근거 § 3, § 5]*
>
> 5. **모바일 사용자 23.9%** — 데스크탑(76.1%)과 모바일을 동시에 지원하는 3단 반응형 레이아웃(< 640 / 640–1023 / ≥ 1024px) 설계의 정량 근거. *[근거 § 5]*

---

## 2. 가장 강력한 시각화 카드 — 학습 효과 곡선 ⭐

> **"같은 사용자가 같은 문제를 풀 때마다 정답률이 오른다"**
> 이게 핵심입니다. 노션 표로 그대로 사용 가능.

| N차 시도 | 답안 수 | 정답률 | 1차 대비 |
| :---: | ---: | ---: | ---: |
| 1차 | 75,115 | **67.12%** | — |
| 2차 | 11,662 | **75.32%** | **+8.20%p** |
| 3차 | 2,961 | 76.33% | +9.21%p |
| 4차 | 1,212 | 76.32% | +9.20%p |
| 5차 | 561 | **78.25%** | **+11.13%p** |

**해석 문장 (그대로 인용 가능):**
> 단일 사용자·단일 문항의 반복 풀이 패턴을 추적한 결과, 첫 시도와 두 번째 시도 사이에서 가장 큰 학습 효과(+8.2%p)가 관찰됐다. 표본 크기가 8.8만 답안 이상으로 통계적 의미가 충분하다.

**출처 SQL — 동일 (user_id, quiz_id, question_id) 그룹에서 시간순으로 시도 번호를 매겨 N차별 정답률 집계.**

```sql
WITH ranked_attempts AS (
  SELECT
    qs.user_id,
    qa.quiz_id,
    qa.question_id,
    qa.is_correct,
    qa.answered_at,
    ROW_NUMBER() OVER (
      PARTITION BY qs.user_id, qa.quiz_id, qa.question_id
      ORDER BY qa.answered_at
    ) AS attempt_no
  FROM quiz_answers qa
  JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
  WHERE qs.user_id IS NOT NULL
)
SELECT
  attempt_no,
  COUNT(*)                                                         AS attempts,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) AS correct_rate_percent
FROM ranked_attempts
WHERE attempt_no <= 5
GROUP BY attempt_no
ORDER BY attempt_no;
```

---

## 3. 보조 카드 — 카테고리 인기·난이도

### 3-1. 인기 카테고리 Top 5 (세션 수 기준)

| # | 카테고리 | 세션 | 고유 사용자 | 평균 점수 |
| :---: | :--- | ---: | ---: | ---: |
| 1 | ai-ml-dl-basics | 2,054 | 564 | 55.45% |
| 2 | activation-loss | 1,309 | 462 | 63.45% |
| 3 | rnn-lstm | 1,179 | 401 | 63.99% |
| 4 | cnn-image | 1,153 | 386 | 62.72% |
| 5 | generative-models | 1,149 | 380 | 59.80% |

### 3-2. 가장 어려운 카테고리 Top 5 (정답률 오름차순, 사전 진단 카테고리 제외)

| # | 카테고리 | 세션 | 고유 사용자 | 평균 점수 |
| :---: | :--- | ---: | ---: | ---: |
| 1 | ai-ml-dl-basics | 2,054 | 564 | **55.45%** |
| 2 | multimodal | 1,147 | 364 | 56.18% |
| 3 | numpy-pandas | 714 | 255 | 56.35% |
| 4 | generative-models | 1,149 | 380 | 59.80% |
| 5 | transfer-learning | 1,081 | 359 | 61.35% |

> 사전 진단용 `pretest_2_1`은 정답률 **24.99%** 로 더 낮으나, 학습 전 모르는 상태에서 푸는 진단 카테고리라 일반 학습 카테고리와 성격이 달라 별도 분리.

**해석 문장 (그대로 인용 가능):**
> 가장 많이 학습된 카테고리(`ai-ml-dl-basics`, 564명·2,054세션)와 가장 어려운 카테고리(`ai-ml-dl-basics`, 평균 55.45%)가 **일치**한다 — 학습자가 어려운 영역에 더 많은 시간을 자발적으로 쓰고 있다는 신호. 사전 진단(`pretest_2_1`) 평균 24.99%가 일반 학습 후 평균 60%대까지 상승한 점도 학습 효과의 보조 증거.

**출처 SQL — `quiz_sessions.categories`가 text 배열이라 `UNNEST`로 펼친 뒤 카테고리별 집계. 인기·난이도 두 정렬을 한 쿼리로 받기 위해 raw 데이터를 받고 클라이언트에서 재정렬.**

```sql
-- 전체 카테고리 raw (인기·난이도 어느 쪽으로든 정렬 가능)
SELECT
  cat                                    AS category,
  COUNT(*)                               AS session_count,
  COUNT(DISTINCT user_id)                AS unique_users,
  ROUND(AVG(score_percent)::numeric, 2)  AS avg_score_percent
FROM quiz_sessions, UNNEST(categories) AS cat
WHERE total_questions > 0
GROUP BY cat
ORDER BY session_count DESC
LIMIT 15;

-- 가장 어려운 Top 5 (사전 진단 카테고리 제외, 충분한 표본만)
SELECT
  cat                                    AS category,
  COUNT(*)                               AS session_count,
  COUNT(DISTINCT user_id)                AS unique_users,
  ROUND(AVG(score_percent)::numeric, 2)  AS avg_score_percent
FROM quiz_sessions, UNNEST(categories) AS cat
WHERE total_questions > 0
  AND cat NOT LIKE 'pretest%'
  AND cat NOT LIKE 'pre_test%'
GROUP BY cat
HAVING COUNT(*) >= 100
ORDER BY avg_score_percent ASC
LIMIT 5;
```

---

## 4. 운영 책임감 카드 (선택 인용)

| 항목 | 수치 |
| :--- | ---: |
| 사용자 신고 누적 | **135건** |
| 정답률 0%로 발견된 의심 문제 | 3개 (10회 이상 시도 기준) |
| 최악 문항 사례 | `activation-loss #160` — **232회 시도, 0% 정답률** |

**해석 문장:**
> 단순 학습 도구가 아닌 **데이터 기반 품질 관리 사이클**을 구축. 사용자 신고와 정답률 데이터를 교차 검증해 문제 오류를 식별·수정하는 운영 루프 운영.

**출처 SQL #1 — 신고 누적 수.**

```sql
SELECT COUNT(*) AS total_feedbacks FROM feedbacks;
```

**출처 SQL #2 — 정답률 하위 10문항 (10회 이상 시도된 것 중).** 결과 첫 행에 `activation-loss #160 / 232회 / 0%` 가 나옵니다.

```sql
SELECT
  quiz_id,
  question_id,
  COUNT(*)                                                         AS attempts,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) AS correct_rate_percent
FROM quiz_answers
GROUP BY quiz_id, question_id
HAVING COUNT(*) >= 10
ORDER BY correct_rate_percent ASC, attempts DESC
LIMIT 10;
```

---

## 5. 규모 카드 (선택 인용)

| 지표 | 값 |
| :--- | ---: |
| 누적 사용자 | **2,347명** |
| 누적 세션 | **6,351회** |
| 누적 답안 | **92,353개** |
| 누적 페이지뷰 | 28,155건 |
| **재방문률** (서로 다른 날짜에 2회 이상 접속) | **26.08%** (612/2,347) |
| 활성 학습자 (퀴즈 세션 ≥2회) | 35.19% (826/2,347) |
| 1인 평균 세션 수 (활성 학습자 기준) | 18.31회 |
| 최다 방문자 앱 마운트 횟수 | 305회 |
| 데스크탑 / 모바일 비율 | 76.14% / 23.86% |
| 완주 세션 평균 합격률 | 69.70% (이탈 14.42% 제외) |
| 전체 답안 정답률 | 68.69% |
| 단일일 트래픽 피크 | 4,510세션 / 810명 (2026-03-25) |
| 활성 일수 | 30일 |

**출처 SQL #1 — 헤드라인 규모 한 행.**

```sql
SELECT
  (SELECT COUNT(*) FROM users)                              AS total_users,
  (SELECT COUNT(*) FROM quiz_sessions)                      AS total_sessions,
  (SELECT COUNT(*) FROM quiz_answers)                       AS total_answers,
  (SELECT COUNT(*) FROM users WHERE visit_count > 1)        AS returning_users,
  (SELECT ROUND(AVG(visit_count)::numeric, 2) FROM users)   AS avg_visits_per_user,
  (SELECT MAX(visit_count) FROM users)                      AS max_visits,
  (SELECT COUNT(*) FROM feedbacks)                          AS total_feedbacks,
  (SELECT COUNT(*) FROM access_logs)                        AS total_pageviews;
```

**출처 SQL #2 — 디바이스 비율 (User-Agent 키워드 파싱).**

```sql
SELECT
  CASE
    WHEN user_agent ILIKE '%iphone%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%mobile%' THEN 'mobile'
    WHEN user_agent ILIKE '%ipad%' OR user_agent ILIKE '%tablet%' THEN 'tablet'
    WHEN user_agent IS NULL OR user_agent = '' THEN 'unknown'
    ELSE 'desktop'
  END                                                AS device,
  COUNT(*)                                           AS users,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percent
FROM users
GROUP BY device
ORDER BY users DESC;
```

**출처 SQL #3 — 완주 / 중도 이탈 비율 + 보정된 평균 합격률.** `score_percent=0 AND correct_count=0`을 이탈로 간주.

```sql
SELECT
  COUNT(*)                                                              AS total_sessions,
  COUNT(*) FILTER (WHERE score_percent = 0 AND correct_count = 0)       AS abandoned_sessions,
  COUNT(*) FILTER (WHERE score_percent > 0 OR correct_count > 0)        AS completed_sessions,
  ROUND(
    COUNT(*) FILTER (WHERE score_percent = 0 AND correct_count = 0) * 100.0 / COUNT(*),
    2
  )                                                                     AS abandon_rate_percent,
  ROUND(AVG(score_percent) FILTER (
    WHERE score_percent > 0 OR correct_count > 0
  )::numeric, 2)                                                        AS avg_score_completed_only,
  ROUND(AVG(score_percent)::numeric, 2)                                 AS avg_score_all
FROM quiz_sessions
WHERE total_questions > 0;
```

**출처 SQL #4 — 전체 답안 정답률.**

```sql
SELECT
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) AS overall_correct_rate
FROM quiz_answers;
```

**출처 SQL #5 — 재방문률 정의별 비교 (정의에 따라 비율이 9%~70%로 크게 달라지므로 검토자에게 정의를 명시할 필요가 있어 별도 집계).**

```sql
WITH
  pv_days AS (
    SELECT user_id, COUNT(DISTINCT DATE(accessed_at)) AS d
    FROM access_logs WHERE user_id IS NOT NULL
    GROUP BY user_id
  ),
  sess_days AS (
    SELECT user_id, COUNT(DISTINCT DATE(started_at)) AS d
    FROM quiz_sessions WHERE user_id IS NOT NULL AND started_at IS NOT NULL
    GROUP BY user_id
  ),
  sess_count AS (
    SELECT user_id, COUNT(*) AS c
    FROM quiz_sessions WHERE user_id IS NOT NULL
    GROUP BY user_id
  )
SELECT
  (SELECT COUNT(*) FROM users)                                          AS total_users,
  (SELECT COUNT(*) FROM users     WHERE visit_count >= 2)               AS visit_count_ge2,
  (SELECT COUNT(*) FROM sess_count WHERE c >= 2)                         AS users_with_2plus_sessions,
  (SELECT COUNT(*) FROM pv_days    WHERE d >= 2)                         AS users_with_pageview_on_2plus_days,
  (SELECT COUNT(*) FROM sess_days  WHERE d >= 2)                         AS users_with_session_on_2plus_days;
```

**출처 SQL #6 — 일별 트래픽·합격률 (트래픽 피크 4,510세션 일자 식별용).**

```sql
SELECT
  DATE(started_at)                       AS date,
  COUNT(*)                               AS sessions,
  COUNT(DISTINCT user_id)                AS unique_users,
  ROUND(AVG(score_percent)::numeric, 2)  AS avg_score_percent
FROM quiz_sessions
WHERE total_questions > 0 AND started_at IS NOT NULL
GROUP BY DATE(started_at)
ORDER BY date;
```

---

## 6. 노션 페이지 구성 제안

### 옵션 A: 컴팩트 (페이지 1개, 스크롤 짧음)

1. 캐치프레이즈 (callout 블록)
2. § 1 핵심 5문장
3. § 2 학습 효과 곡선 표 (SQL은 토글로 접음)
4. § 3 카테고리 Top 5 표

### 옵션 B: 상세 (케이스 스터디형)

1. 캐치프레이즈
2. 프로젝트 소개 (기존 portfolio.md 내용)
3. § 1 핵심 5문장
4. § 2 학습 효과 곡선 (메인 차트로 시각화 추천)
5. § 3·4·5 보조 카드 토글로 접기
6. § 7 검토자용 — 사용한 SQL 전체

### 노션에서 SQL 코드블록 처리 팁

- 각 SQL을 **토글 블록 안에 코드블록**으로 넣으면 화면이 깔끔. 펼치면 검증 가능.
- 언어는 `SQL` 선택. 노션이 syntax highlighting 처리.
- "이 수치, 어떻게 뽑았어요?" 질문에 토글 하나 열어 답변하면 신뢰도 ↑

### 노션 차트 만들기 (선택)

§ 2 표 데이터를 노션 데이터베이스로 만들어 막대그래프 뷰로 변환하면 한눈에 보이는 학습 곡선이 됩니다.

---

## 7. 의도적으로 제외한 지표 (정직성 메모)

채용 검토자가 "왜 이 지표는 없나요?"라고 물을 때 답할 수 있도록, 제외 이유와 함께 보관.

| 지표 | 제외 이유 |
| :--- | :--- |
| 첫날 vs 마지막날 평균 합격률 | 마지막날 1세션·0점 노이즈로 통계적 의미 없음. 대신 § 2의 N차 시도 향상폭 사용 |
| 첫 세션 vs 마지막 세션 평균 (사용자 단위) | +0.70%p로 학습 효과가 평균에 묻힘 (사용자가 매번 다른 카테고리·난이도를 선택). § 2가 훨씬 강력 |
| `pretest` 플래그 기준 비교 | 직관과 반대 결과(첫시도 74% > 재시험 68%) — 코드상 정확한 의미 확인 전까지 사용 보류 |

**검증용 SQL #1 — 첫날 vs 마지막날 (참고용, 본문 미사용).**

```sql
WITH daily AS (
  SELECT
    DATE(started_at)                      AS date,
    ROUND(AVG(score_percent)::numeric, 2) AS avg_score_percent,
    COUNT(*)                              AS sessions
  FROM quiz_sessions
  WHERE total_questions > 0 AND started_at IS NOT NULL
  GROUP BY DATE(started_at)
)
SELECT
  (SELECT date              FROM daily ORDER BY date ASC  LIMIT 1) AS first_day,
  (SELECT avg_score_percent FROM daily ORDER BY date ASC  LIMIT 1) AS first_day_score,
  (SELECT sessions          FROM daily ORDER BY date ASC  LIMIT 1) AS first_day_sessions,
  (SELECT date              FROM daily ORDER BY date DESC LIMIT 1) AS last_day,
  (SELECT avg_score_percent FROM daily ORDER BY date DESC LIMIT 1) AS last_day_score,
  (SELECT sessions          FROM daily ORDER BY date DESC LIMIT 1) AS last_day_sessions
FROM (SELECT 1) AS _;
```

**검증용 SQL #2 — 사용자별 첫/마지막 세션 평균 (참고용, 본문 미사용).**

```sql
WITH ranked AS (
  SELECT
    user_id,
    score_percent,
    started_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at ASC)  AS rn_first,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY started_at DESC) AS rn_last,
    COUNT(*)    OVER (PARTITION BY user_id)                            AS session_count
  FROM quiz_sessions
  WHERE total_questions > 0 AND started_at IS NOT NULL AND user_id IS NOT NULL
)
SELECT
  ROUND(AVG(CASE WHEN rn_first = 1 THEN score_percent END)::numeric, 2) AS avg_first_session_score,
  ROUND(AVG(CASE WHEN rn_last  = 1 THEN score_percent END)::numeric, 2) AS avg_last_session_score,
  COUNT(DISTINCT user_id)                                                AS users_with_multiple_sessions,
  ROUND(AVG(session_count)::numeric, 2)                                  AS avg_sessions_per_user
FROM ranked
WHERE session_count >= 2;
```

**검증용 SQL #3 — pretest 플래그 분류 (참고용, 본문 미사용).**

```sql
SELECT
  CASE WHEN pretest THEN '첫시도(pretest=true)' ELSE '재시험(pretest=false)' END AS phase,
  COUNT(*)                                                            AS answer_count,
  ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2)    AS correct_rate_percent
FROM quiz_answers
GROUP BY pretest
ORDER BY pretest DESC;
```

---

## 8. DB 스키마 참고 (검토자용)

쿼리를 이해하려면 알아야 할 5개 테이블 핵심 컬럼.

| 테이블 | 핵심 컬럼 | 비고 |
| :--- | :--- | :--- |
| `users` | `id` (uuid), `session_id`, `visit_count`, `first_visit_at`, `last_visit_at`, `user_agent` | 익명 식별 — `session_id` 기반 |
| `access_logs` | `user_id`, `page_path`, `accessed_at`, `user_agent` | 페이지 트래픽 |
| `quiz_sessions` | `id`, `user_id`, `categories` (text[]), `total_questions`, `correct_count`, `score_percent`, `started_at`, `pretest` | 세션 단위 결과 |
| `quiz_answers` | `quiz_session_id`, `quiz_id`, `question_id`, `is_correct`, `answered_at`, `question_type`, `pretest` | 답안 단위 |
| `feedbacks` | `user_id`, `quiz_id`, `question_id`, `report_type`, `description`, `status` | 문제 오류 신고 |

---

## 부록 — SQL 통합 파일

위 모든 쿼리는 `.claude/scripts/portfolio-metrics.sql` 에 묶음으로 보관 (Supabase 대시보드 SQL Editor에 통째로 붙여넣어 한 번에 실행 가능). 본 마크다운 파일은 노션 발행용 정제본, SQL 파일은 재실행용 원본 — 데이터 갱신 시 SQL 파일을 돌리고 이 마크다운의 수치만 교체하면 됩니다.
