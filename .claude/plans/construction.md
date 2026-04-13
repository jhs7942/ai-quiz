# 기술 설계: JSON 기반 퀴즈 웹사이트 (construction.md)

## 기술 스택 상세

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| 빌드 도구 | Vite | 6.x | - |
| 언어 | TypeScript | 5.x | - |
| UI | React + Tailwind CSS | 19.x / 4.x | - |
| 라우터 | React Router | 7.x | SPA 클라이언트 라우팅 |
| 상태 관리 | Zustand | 5.x | 퀴즈 진행 상태 전역 관리 |
| DB | Supabase (PostgreSQL) | - | 클라이언트 SDK 직접 사용 (anon key + RLS) |
| 차트 | Recharts | 2.x | 결과 화면 도넛 차트 |
| 폰트 | Pretendard | - | CDN |

---

## 프로젝트 파일 구조

```
ai-quiz/
├── public/
│   └── quizzes/
│       ├── index.json            # 카테고리 메타데이터 목록
│       ├── ai-basics.json
│       ├── numpy-pandas.json
│       ├── ml-dl.json
│       ├── cnn-attention.json
│       ├── image-models.json
│       ├── rnn-transformer.json
│       └── mock-exams/           # 실전 모의고사 전용 디렉토리
│           ├── index.json        # 모의고사 메타데이터 목록
│           ├── pre_test1.json
│           ├── pre_test2.json
│           └── pre_test{N}.json  # 파일 수 = 모의고사 수
├── src/
│   ├── main.tsx                  # 앱 진입점
│   ├── App.tsx                   # 라우터 설정
│   ├── pages/
│   │   ├── MainPage.tsx          # 메인: 카테고리 선택 + 퀴즈 설정
│   │   ├── QuizPage.tsx          # 퀴즈 풀기 화면
│   │   └── ResultPage.tsx        # 결과 화면
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx        # 상단 헤더 (로고)
│   │   │   └── Sidebar.tsx       # 좌측 사이드바 (실전 모의고사 항목 + 카테고리 목록)
│   │   ├── mock-exam/
│   │   │   └── MockExamGrid.tsx  # 모의고사 회차 카드 그리드 (메인 영역 표시)
│   │   ├── quiz/
│   │   │   ├── QuizSettings.tsx  # 퀴즈 설정 패널 (난이도/문항수/순서)
│   │   │   ├── QuizCard.tsx      # 문제 카드 (문제 텍스트 + 보기 포함)
│   │   │   ├── ChoiceButton.tsx  # 선택지 버튼 (정답/오답 상태 포함)
│   │   │   ├── FeedbackPanel.tsx # 정답/오답 해설 패널 (클릭 후 펼침)
│   │   │   ├── ProgressBar.tsx   # 상단 진행률 바
│   │   │   └── QuestionNavigator.tsx # 우측 문제 번호 네비게이터
│   │   ├── result/
│   │   │   ├── ResultChart.tsx   # 도넛 차트 + 점수 표시
│   │   │   └── ReviewCard.tsx    # 문제별 리뷰 카드
│   │   └── common/
│   │       ├── Modal.tsx         # 공통 모달 래퍼 (오버레이 포함)
│   │       ├── Toast.tsx         # 토스트 알림
│   │       ├── CategoryCard.tsx  # 사이드바 카테고리 카드
│   │       └── FeedbackModal.tsx # 문제 오류 신고 모달
│   ├── lib/
│   │   ├── supabase.ts           # Supabase 클라이언트 (anon key)
│   │   ├── db.ts                 # DB 호출 함수 (users, logs, sessions, feedbacks)
│   │   ├── quiz.ts               # 퀴즈 JSON fetch / 필터링 / 셔플 유틸
│   │   ├── mockExam.ts           # 모의고사 JSON fetch 유틸 (fetchMockExams, fetchMockExamQuestions)
│   │   └── session.ts            # 익명 UUID 세션 관리 유틸
│   ├── store/
│   │   └── quizStore.ts          # Zustand 퀴즈 전역 상태 스토어
│   ├── types/
│   │   └── index.ts              # 전역 타입 정의
│   └── hooks/
│       ├── useQuiz.ts            # 퀴즈 진행 로직 훅
│       └── useSession.ts         # 사용자 세션/접속 로그 훅
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 데이터 구조 및 타입

### 퀴즈 문제 (`public/quizzes/*.json`) — 통합 형식

두 가지 문제 타입이 **같은 배열**에 공존 가능:

```ts
// Question[] 배열 형태
type Question = MultipleChoiceQuestion | ShortAnswerQuestion

interface MultipleChoiceQuestion {
  id: number
  type: 'multiple_choice'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  choices: [string, string, string, string]  // 항상 4개
  answer: string                              // choices 중 하나와 정확히 일치
  explanation: string
}

interface ShortAnswerQuestion {
  id: number
  type: 'short_answer'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  answer: string                              // 정답 텍스트
  explanation: string
  // 채점 방식: 사용자 입력이 answer 문자열에 포함(includes)되면 정답 인정
  // 예: answer가 "탐색적 데이터 분석(EDA)"일 때 "EDA" 입력도 정답
}
```

### 카테고리 메타데이터 (`public/quizzes/index.json`)

```ts
interface QuizCategory {
  id: string           // 'ai-basics'
  title: string        // 'AI 기초 개념'
  description: string  // 간략 설명
  icon: string         // 이모지 아이콘
  file: string         // 'ai-basics.json'
  questionCount: number
}
```

### 모의고사 메타데이터 (`public/quizzes/mock-exams/index.json`)

```ts
interface MockExam {
  id: string           // 'pre_test1'
  title: string        // '실전 모의고사 1회'
  description: string  // '전 범위 종합 모의고사'
  file: string         // 'pre_test1.json'
  questionCount: number
}
```

**모의고사 문제 파일** (`public/quizzes/mock-exams/pre_test{N}.json`):
- `pre_test2.json`과 동일한 형식 — 객관식 4지선다 문제 배열
- `type: 'multiple_choice'`만 사용, `short_answer` 불필요

```ts
// MultipleChoiceQuestion[] 배열 형태
[
  {
    id: number
    type: 'multiple_choice'
    difficulty: 'easy' | 'medium' | 'hard'
    question: string
    choices: [string, string, string, string]
    answer: string
    explanation: string
  }
]
```

### Zustand 스토어 (`src/store/quizStore.ts`)

```ts
interface QuizStore {
  // 설정
  selectedCategories: string[]
  questionCount: number | 'all'
  difficulty: 'easy' | 'medium' | 'hard' | 'all'
  shuffle: boolean

  // 진행 상태
  questions: Question[]
  currentIndex: number
  selectedAnswers: Record<number, string>  // { questionId: 선택/입력한 답변 } — 채점 전 임시 상태
  scoredAnswers: Record<number, { answer: string; isCorrect: boolean }>  // 채점 완료된 답변
  checkedIds: Set<number>              // 정답 확인 완료된 문제 id (네비게이터에서 ● 표시)
  skippedIds: Set<number>              // 건너뛴 문제 id (네비게이터에서 ⬡ 표시)

  // 세션
  startedAt: string | null             // 퀴즈 시작 시각 (ISO 8601)

  // 모의고사 모드
  mockExamId: string | null        // 현재 모의고사 ID (null = 카테고리 퀴즈 모드)
  mockExamTitle: string | null     // 결과/퀴즈 페이지 타이틀 표시용

  // 액션
  setCategories: (ids: string[]) => void
  setSettings: (settings: Partial<QuizSettings>) => void
  startQuiz: (questions: Question[]) => void
  startMockExam: (exam: MockExam, questions: Question[]) => void  // 모의고사 시작 (설정 없이)
  selectAnswer: (questionId: number, answer: string) => void   // 답변 선택만 (채점 X)
  checkAnswer: (questionId: number) => void                    // 정답 확인 (채점 실행)
  checkAllAnswers: () => void                                  // 모의고사용: 모든 답변 일괄 채점
  clearAnswer: (questionId: number) => void                    // 이전 버튼으로 돌아와 수정 시 채점 초기화
  skipQuestion: (questionId: number) => void
  goToQuestion: (index: number) => void
  resetQuiz: () => void
}
```

---

## Supabase 클라이언트 직접 연동

API 서버 없이 브라우저에서 Supabase 클라이언트 SDK를 직접 사용한다.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 환경변수로 관리
- anon key는 공개키이며 RLS(Row Level Security)로 보안 처리
- DB 호출 함수는 `src/lib/db.ts`에 집약

```ts
// src/lib/db.ts 주요 함수
upsertUser(sessionId, userAgent): Promise<string>         // userId 반환
logAccess(userId, pagePath, userAgent): Promise<void>
saveQuizSession(payload): Promise<void>
saveFeedback(payload): Promise<void>
```

---

## 데이터 흐름

```
[접속 — MainPage.tsx]
  ├─ fetch('/quizzes/index.json') → 카테고리 목록 로드
  ├─ fetch('/quizzes/mock-exams/index.json') → 모의고사 목록 로드
  ├─ useSession(): localStorage에서 UUID 읽기 (없으면 생성)
  ├─ db.upsertUser(sessionId, userAgent) → userId 획득
  └─ db.logAccess(userId, '/', userAgent) → 접속 기록

[사이드바 — 실전 모의고사 클릭]
  ├─ Sidebar: "실전 모의고사" 항목 클릭 → MainPage 모드 전환 (mode: 'mock-exam')
  └─ MockExamGrid: 회차 카드 그리드 표시 (mockExams 배열 렌더링)

[모의고사 시작 — 카드 클릭]
  ├─ fetch('/quizzes/mock-exams/{file}') → 문제 배열 로드
  ├─ quizStore.startMockExam(exam, questions) → mockExamId/Title 저장, 전체 문제 순서 고정
  └─ navigate('/quiz')

[카테고리 선택 + 퀴즈 설정]
  ├─ Sidebar: 카테고리 체크박스 → quizStore.setCategories()
  └─ QuizSettings: 난이도/문항수/순서 선택 → quizStore.setSettings()

[퀴즈 시작]
  ├─ 선택된 카테고리별 fetch('/quizzes/{id}.json')
  ├─ 문제 병합 → difficulty 필터 → 수량 제한 → 조건부 셔플
  ├─ quizStore.startQuiz(questions)
  └─ navigate('/quiz')

[퀴즈 풀기 — QuizPage.tsx (카테고리 퀴즈 모드)]
  ├─ quizStore에서 questions[currentIndex] 읽어 QuizCard 렌더링
  ├─ [객관식] ChoiceButton 클릭 → quizStore.selectAnswer(id, answer)  // 선택만, 채점 X
  ├─ [주관식] 텍스트 입력 → quizStore.selectAnswer(id, input)         // 입력만, 채점 X
  ├─ [정답 확인] 클릭 (답변 선택 후 활성화)
  │   ├─ 객관식: selectedAnswers[id] === answer → is_correct 판정
  │   ├─ 주관식: answer.includes(selectedAnswers[id]) → is_correct 판정
  │   └─ quizStore.checkAnswer(id) → scoredAnswers에 저장, checkedIds에 추가
  ├─ FeedbackPanel 펼침 (정답/오답 + 해설) — checkAnswer 후에만 표시
  ├─ [다음] 클릭 (checkAnswer 완료 후 활성화) → currentIndex + 1
  ├─ [이전] 클릭 → currentIndex - 1
  │   └─ 이미 채점된 문제: quizStore.clearAnswer(id)로 채점 초기화 후 재선택 가능
  ├─ [건너뛰기] → quizStore.skipQuestion(id) → 다음 문제
  ├─ [신고하기] → FeedbackModal → db.saveFeedback()
  ├─ [나가기] 클릭 → 확인 팝업 → 확인 시 navigate('/'), DB 저장 X
  └─ 마지막 문제 → [결과 보기] 클릭
      ├─ 건너뛴 문제 있으면 팝업: [문제 풀러 가기] / [제출]
      └─ 없거나 제출 선택 시 → navigate('/result')

[퀴즈 풀기 — QuizPage.tsx (실전 모의고사 모드)]
  ├─ isMockExam = !!mockExamId — 모의고사 모드 판별
  ├─ quizStore에서 questions[currentIndex] 읽어 QuizCard 렌더링
  │   └─ QuizCard에 isMockExam=true 전달 → 정답/오답 하이라이트, 해설 숨김
  ├─ [객관식/주관식] 답변 선택 → quizStore.selectAnswer(id, answer)
  ├─ "정답 확인" 버튼 **미표시**
  ├─ [다음] 버튼 → 답변 선택 시 바로 활성화 → currentIndex + 1 (채점 없이 이동)
  ├─ [이전] 클릭 → currentIndex - 1 (자유롭게 이동, 답변 수정 가능)
  ├─ [건너뛰기] → quizStore.skipQuestion(id) → 다음 문제
  ├─ [나가기] 클릭 → 확인 팝업
  └─ 마지막 문제 → [결과 보기] 클릭
      ├─ 건너뛴 문제 있으면 팝업: [문제 풀러 가기] / [제출]
      └─ 제출 시 → quizStore.checkAllAnswers()로 일괄 채점 → navigate('/result')

[결과 — ResultPage.tsx]
  ├─ quizStore에서 answers, questions 읽어 점수 계산
  ├─ db.saveQuizSession(payload) → DB 저장 (실패해도 무시)
  │   ├─ mockExamId가 있으면 pretest: true, 없으면 pretest: false
  │   └─ pretest: true일 때 quiz_answers insert 스킵 (quiz_sessions만 저장)
  ├─ 모의고사 모드: 결과 페이지에서 정답/오답/해설 **최초 공개**
  ├─ [오답만 다시]: 오답 문제만 필터 → quizStore.startQuiz()
  ├─ [셔플 재시험]: 동일 문제 셔플 → quizStore.startQuiz()
  └─ [새 퀴즈]: quizStore.resetQuiz() → navigate('/')
```

---

## DB 스키마 (Supabase SQL)

```sql
-- 1. 문제 메타데이터 (JSON 파일 배포 시 앱 초기화 과정에서 upsert 동기화)
create table questions (
  id varchar(64) primary key,          -- '{quiz_id}-{question_id}' 형태
  quiz_id varchar(64) not null,        -- 'ai-basics'
  type varchar(32) not null,           -- 'multiple_choice' | 'short_answer'
  difficulty varchar(16) not null,     -- 'easy' | 'medium' | 'hard'
  created_at timestamptz default now()
);

-- 2. 사용자 (익명 세션)
create table users (
  id uuid primary key default gen_random_uuid(),
  session_id varchar(64) unique not null,
  first_visit_at timestamptz default now(),
  last_visit_at timestamptz default now(),
  visit_count integer default 1,
  user_agent text
);

-- 3. 접속 로그
create table access_logs (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete set null,
  accessed_at timestamptz default now(),
  page_path varchar(255),
  user_agent text,
  session_duration integer       -- 초 단위 (페이지 이탈 시 갱신)
  -- ip_address 수집 안 함 (개인정보 보호)
);

-- 4. 퀴즈 풀이 세션
create table quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  categories text[],
  selected_types text[],         -- ['multiple_choice', 'short_answer']
  total_questions integer,
  correct_count integer,
  score_percent decimal(5,2),
  started_at timestamptz,
  completed_at timestamptz default now(),
  settings jsonb,                -- { difficulty, shuffle }
  pretest boolean default false  -- true = 실전 모의고사, false = 카테고리 퀴즈
);

-- 5. 개별 문제 답변 기록
create table quiz_answers (
  id bigint generated always as identity primary key,
  quiz_session_id uuid references quiz_sessions(id) on delete cascade,
  question_id integer,
  quiz_id varchar(64),           -- 'ai-basics'
  question_type varchar(32),     -- 'multiple_choice' | 'short_answer'
  user_answer text,
  is_correct boolean,
  answered_at timestamptz default now(),
  pretest boolean default false  -- true = 실전 모의고사, false = 카테고리 퀴즈
);

-- 6. 문제 오류 신고
create table feedbacks (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete set null,
  quiz_id varchar(64) not null,
  question_id integer not null,
  report_type varchar(32) not null,
  -- wrong_answer | ambiguous | bad_explanation | option_error | other
  description text,
  suggested_answer text,
  status varchar(16) default 'pending',
  -- pending | reviewed | resolved | rejected
  created_at timestamptz default now()
);

-- 7. 일별 집계 통계
create table daily_stats (
  date date primary key,
  unique_visitors integer default 0,
  total_quiz_sessions integer default 0,
  total_questions_answered integer default 0,
  avg_score_percent decimal(5,2)
);

-- RLS 활성화 (anon key 보안)
alter table questions enable row level security;
alter table users enable row level security;
alter table access_logs enable row level security;
alter table quiz_sessions enable row level security;
alter table quiz_answers enable row level security;
alter table feedbacks enable row level security;

-- anon 사용자 INSERT/SELECT 허용 정책
create policy "anon upsert questions" on questions for insert to anon with check (true);
create policy "anon select questions" on questions for select to anon using (true);
create policy "anon insert users" on users for insert to anon with check (true);
create policy "anon upsert users" on users for update to anon using (true);
create policy "anon insert access_logs" on access_logs for insert to anon with check (true);
create policy "anon insert quiz_sessions" on quiz_sessions for insert to anon with check (true);
create policy "anon insert quiz_answers" on quiz_answers for insert to anon with check (true);
create policy "anon insert feedbacks" on feedbacks for insert to anon with check (true);
create policy "anon select users" on users for select to anon using (true);
```

---

## 반응형 설계

### 브레이크포인트 (Tailwind CSS 기준)

| 이름 | 범위 | Tailwind 접두사 | 주요 변화 |
|------|------|----------------|-----------|
| 모바일 | < 640px | (기본) | 단일 열, 드로어 사이드바, 버튼 풀너비 |
| 태블릿 | 640px ~ 1023px | `sm:` | 2열 가능, 드로어 사이드바 유지 |
| 데스크톱 | ≥ 1024px | `lg:` | 사이드바 고정, 네비게이터 우측 표시 |

### 페이지별 반응형 동작

#### MainPage (`/`)

| 요소 | 모바일 | 태블릿 | 데스크톱 |
|------|--------|--------|---------|
| 사이드바 | 드로어 (☰ 탭) | 드로어 (☰ 탭) | 고정 좌측 (`w-64`) |
| 카테고리 안내 | "☰ 메뉴에서 선택" | "☰ 메뉴에서 선택" | "좌측에서 선택" |
| 설정 패널 | 풀너비, 세로 스택 | `max-w-xl` 중앙 | `max-w-xl` 좌측 정렬 |
| 패딩 | `p-4` | `p-5` | `p-6` |

#### QuizPage (`/quiz`)

| 요소 | 모바일 | 태블릿 | 데스크톱 |
|------|--------|--------|---------|
| 문제 번호 네비게이터 | 카드 하단 가로 스크롤 바 | 카드 하단 인라인 | 우측 고정 (`w-44`) |
| 네비게이션 버튼 | 풀너비 (`w-full`) | 기본 | 기본 |
| 패딩 | `px-3 py-4` | `px-4 py-5` | `px-4 py-6` |
| 보기 버튼 | 터치 타겟 `min-h-[48px]` | 기본 | 기본 |

#### ResultPage (`/result`)

| 요소 | 모바일 | 태블릿 | 데스크톱 |
|------|--------|--------|---------|
| 점수 카드 내부 | 세로 스택 (`flex-col`) | 가로 (`flex-row`) | 가로 (`flex-row`) |
| 액션 버튼 | 풀너비 세로 나열 | `flex-wrap` | `flex-wrap` |
| 탭 버튼 | 풀너비 3등분 | 자동 너비 | 자동 너비 |
| 리뷰 카드 | 패딩 축소 | 기본 | 기본 |

### 컴포넌트별 반응형 구현 상세

```
Sidebar.tsx
  - lg:flex (데스크톱 고정) / lg:hidden (모바일·태블릿 드로어)
  - 드로어: fixed inset-0, 오버레이 배경 + 슬라이드 애니메이션

Header.tsx
  - showMenuButton prop: lg 미만에서 ☰ 버튼 노출
  - 로고 텍스트: sm 미만에서 축약 없이 유지

QuestionNavigator.tsx (QuizPage 내)
  - 데스크톱: hidden lg:block w-44 (우측 사이드 패널)
  - 태블릿·모바일: 카드 하단, flex-wrap 가로 나열 + overflow-x-auto

QuizSettings.tsx
  - 옵션 행: 모바일 세로 스택 → sm: 가로 flex

ReviewCard.tsx (ResultPage)
  - 정답/오답 배지: 모바일에서 텍스트 축약 없이 유지
  - 패딩: p-3 sm:p-4
```

### 터치 최적화 규칙

- 모든 탭 가능 요소: 최소 높이 `min-h-[44px]` (iOS HIG 기준)
- 선택지 버튼 (`ChoiceButton`): 모바일 `py-3`, 데스크톱 `py-2.5`
- 드로어 오버레이: 터치로 닫기 (`onClick={onClose}`)
- 스크롤: 사이드바 내부 `overflow-y-auto`, 네비게이터 `overflow-x-auto`

---

## 구현 순서

1. **프로젝트 초기화** — `npm create vite@latest` (React + TS) + 패키지 설치
2. **환경변수 설정** — `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
3. **타입 정의** — `src/types/index.ts`
4. **퀴즈 데이터 작성** — `public/quizzes/index.json` + 카테고리별 JSON
5. **Supabase 연동** — `src/lib/supabase.ts` + `src/lib/db.ts`
6. **세션 유틸** — `src/lib/session.ts` + `src/hooks/useSession.ts`
7. **Zustand 스토어** — `src/store/quizStore.ts` (sessionStorage persist)
8. **퀴즈 유틸** — `src/lib/quiz.ts` (fetch, 필터, 셔플)
8-1. **모의고사 유틸** — `src/lib/mockExam.ts` (fetchMockExams, fetchMockExamQuestions)
9. **공통 컴포넌트** — Modal, Toast, CategoryCard, FeedbackModal
10. **레이아웃** — Header, Sidebar (드로어 + 실전 모의고사 항목 포함)
11. **메인 페이지** — MainPage (사이드바 + QuizSettings + MockExamGrid + 빈 상태)
12. **퀴즈 페이지** — QuizPage (QuizCard + ChoiceButton + FeedbackPanel + ProgressBar + Navigator)
13. **결과 페이지** — ResultPage (ResultChart + ReviewCard + 액션 버튼)
14. **라우터** — App.tsx (React Router: /, /quiz, /result)
15. **반응형 보완** — 각 페이지 모바일·태블릿 브레이크포인트 적용 (아래 체크리스트 기준)
16. **Supabase 마이그레이션** — SQL 실행 + RLS 정책 적용

---

## 트레이드오프

| 선택 | 장점 | 단점 | 대안 |
|------|------|------|------|
| Vite SPA | 단순, 정적 배포 어디서든 가능 | 퀴즈 데이터 클라이언트에 노출 | Next.js (서버에서 JSON 읽기 가능, 복잡도 증가) |
| Supabase 클라이언트 직접 사용 | 서버 불필요, 코드 단순 | anon key 노출 (RLS로 완화) | API 서버 경유 (보안 강화, 복잡도 증가) |
| Zustand + sessionStorage persist | 경량, 새로고침 대응 | 탭 닫으면 상태 초기화 | localStorage (영구 저장, 완료 퀴즈 재진입 문제) |
| 익명 UUID 세션 | 로그인 불필요, 구현 단순 | 다른 기기 = 별도 사용자 집계 | 소셜 로그인 (정확하지만 복잡도 대폭 상승) |
| Recharts | React 친화적, TypeScript 지원 | 번들 크기 약 300KB | Chart.js (더 가볍지만 React 래퍼 별도 필요) |

---

## 리스크 & 완화 방안

- **리스크**: 주관식 문제 채점 — 포함(includes) 판정으로 너무 짧은 입력이 오정답 처리될 수 있음
  - 완화: JSON 데이터 제작 시 answer 필드를 충분히 구체적으로 작성 (단음절 정답 지양)

- **리스크**: 퀴즈 페이지 새로고침 시 Zustand 상태 초기화로 문제 목록 유실
  - 완화: `persist` 미들웨어로 quizStore를 sessionStorage에 저장

- **리스크**: Supabase 연결 장애
  - 완화: DB 호출 실패 시 에러를 throw하지 않고 조용히 무시 — 퀴즈 풀기 자체는 항상 가능하도록 설계

---

## 성공 기준

### 기능
- [ ] 카테고리 선택 → 퀴즈 설정 → 퀴즈 풀기 → 결과 전체 흐름 정상 동작
- [ ] 객관식: 보기 선택 후 [정답 확인] 클릭 시 피드백 + 해설 표시
- [ ] 주관식: 텍스트 입력 후 [정답 확인] 클릭 시 includes 판정 + 피드백 표시
- [ ] [정답 확인] 전 [다음] 버튼 비활성화, 확인 후 활성화
- [ ] 이전 버튼: 채점된 문제로 돌아가서 답변 수정 가능 (채점 초기화)
- [ ] 건너뛰기: 미완료 표시 후 네비게이터로 재방문 가능
- [ ] 마지막 문제 → 건너뛴 문제 있으면 미풀이 팝업 표시
- [ ] 나가기 버튼: 확인 팝업 → 메인 이동, DB 저장 안 함
- [ ] 결과 화면 탭: 전체 / 맞은 문제 / 틀린 문제 / 건너뛴 문제
- [ ] 문제 신고 제출 시 `feedbacks` 테이블 저장 확인
- [ ] 퀴즈 완료 시 `quiz_sessions` / `quiz_answers` 테이블 저장 확인
- [ ] 접속 시 `users` / `access_logs` 테이블 저장 확인
- [ ] DB 오류 발생 시에도 퀴즈 풀기 정상 동작
- [ ] 실전 모의고사: 사이드바 "실전 모의고사" 클릭 시 메인 영역에 회차 카드 그리드 표시
- [ ] 실전 모의고사: 카드 클릭 → 설정 없이 바로 QuizPage 이동
- [ ] 실전 모의고사: 전체 문제 순서 고정 출제 (셔플 없음)
- [ ] 실전 모의고사: QuizPage/ResultPage 상단에 "실전 모의고사 N회" 타이틀 표시
- [ ] 실전 모의고사: mock-exams/index.json에 항목 추가 시 카드 자동 반영
- [ ] 실전 모의고사: 결과 저장 시 `quiz_sessions.pretest = true` 확인
- [ ] 실전 모의고사: `quiz_answers` 테이블에 모의고사 데이터 미저장 확인
- [ ] 실전 모의고사: 풀이 중 정답/오답/해설 미표시 확인
- [ ] 실전 모의고사: "정답 확인" 버튼 대신 "다음" 버튼 표시 확인
- [ ] 실전 모의고사: 결과 페이지에서 정답/오답/해설 정상 표시 확인
- [ ] 카테고리 퀴즈: 결과 저장 시 `pretest = false` (기본값) 확인
- [ ] 카테고리 퀴즈: 기존 "정답 확인 → 다음" 흐름 정상 동작 확인

### 반응형 (기기별)
- [ ] **데스크톱 (≥ 1024px)**: 사이드바 고정 노출, 네비게이터 우측 표시
- [ ] **태블릿 (640px ~ 1023px)**: ☰ 버튼 → 드로어 열림, 퀴즈 설정 패널 정상 표시
- [ ] **모바일 (< 640px)**: ☰ 버튼 → 드로어 열림, 네비게이터 카드 하단 표시
- [ ] **모바일**: 선택지 버튼 터치 타겟 44px 이상
- [ ] **모바일**: 결과 페이지 액션 버튼 세로 나열 정상 표시
- [ ] **iOS Safari / Android Chrome**: 레이아웃 깨짐 없음
- [ ] **모바일**: 드로어 오버레이 터치로 닫기 동작

---

## Google AdSense 승인 대응 (2026-03-28)

### 목표
- 정적 페이지(/, /about, /contact, /privacy, /report)를 prerender로 크롤러에 콘텐츠 노출
- /quiz, /result 페이지에서 AdSense 스크립트 로드 제외

---

### 1. Prerender 적용

**패키지**: `vite-plugin-prerender`

**vite.config.ts 변경**
```ts
import prerender from 'vite-plugin-prerender'

plugins: [
  react(),
  prerender({
    staticDir: path.resolve(__dirname, 'dist'),
    routes: ['/', '/about', '/contact', '/privacy', '/report'],
  }),
]
```

- `/quiz`, `/result`는 prerender 제외 (sessionStorage 상태 의존)
- 빌드 결과: `dist/index.html`, `dist/about/index.html` 등 정적 HTML 생성
- React hydrate 후 동작 동일 → 사용자 경험 변화 없음

---

### 2. AdSense 조건부 로드

**위치**: `index.html` 또는 `src/main.tsx`

**방식**: 현재 경로가 `/quiz` 또는 `/result`이면 AdSense `<script>` 삽입 안 함

**index.html 방식** (인라인 스크립트로 조건 분기)
```html
<script>
  const noAdRoutes = ['/quiz', '/result'];
  if (!noAdRoutes.some(r => location.pathname.startsWith(r))) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9907319302562189';
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }
</script>
```

- prerender 빌드 후 각 페이지 HTML에도 포함되므로 `/quiz`, `/result` HTML에는 AdSense 미삽입

---

### 검증 체크리스트

#### Prerender
- [ ] `npm run build` 성공
- [ ] `dist/index.html` — 메인 페이지 콘텐츠 포함 확인 (빈 `<div id="root">` 아님)
- [ ] `dist/about/index.html` 생성 확인
- [ ] `dist/contact/index.html` 생성 확인
- [ ] `dist/privacy/index.html` 생성 확인
- [ ] `dist/report/index.html` 생성 확인
- [ ] `npm run preview` 후 각 페이지 정상 동작 확인

#### AdSense 조건부 로드
- [ ] `/` 페이지: 브라우저 Network 탭에서 `adsbygoogle.js` 요청 확인
- [ ] `/about`, `/contact`, `/privacy`, `/report`: `adsbygoogle.js` 요청 확인
- [ ] `/quiz` 페이지: `adsbygoogle.js` 요청 **없음** 확인
- [ ] `/result` 페이지: `adsbygoogle.js` 요청 **없음** 확인
- [ ] 퀴즈 풀기 → 결과 → 메인 복귀 시 광고 정상 로드 확인
