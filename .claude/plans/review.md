# 코드 리뷰: AI Quiz 프로젝트 전체 리뷰

**리뷰 일시**: 2026-04-01
**리뷰 대상**: ai-quiz/ 전체 소스 (37개 TypeScript/TSX 파일)
**기술 스택**: React 19 + TypeScript 5.9 + Vite 8 + Zustand 5 + Supabase + Tailwind CSS 4

---

## 변경 범위

- **변경 파일**: 전체 프로젝트 (37개 .ts/.tsx 파일)
- **관련 기능**: 퀴즈 풀기, 모의고사, 오답노트, 결과 확인, 문제 오류 신고, DB 로깅
- **주요 모듈**: pages (3), store (2), lib (5), hooks (3), components (16)

---

## 발견 사항

### [CRITICAL] Supabase 자격 증명이 .env 파일에 평문으로 존재하며 클라이언트에 번들됨

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/.env:1-2`
- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/lib/supabase.ts:3-4`
- **문제**: `.env` 파일에 Supabase URL과 anon key가 평문으로 저장되어 있다. `VITE_` 접두사 변수는 Vite 빌드 시 클라이언트 번들에 그대로 포함된다. anon key 자체는 Supabase 아키텍처상 공개 가능하도록 설계되었지만, 이는 **반드시 RLS(Row Level Security) 정책이 올바르게 설정되어 있어야** 안전하다.
- **위험도**: RLS가 미설정된 경우 누구나 anon key로 `users`, `access_logs`, `quiz_sessions`, `quiz_answers`, `feedbacks` 테이블에 대해 임의의 읽기/쓰기가 가능하다. 특히 `db.ts`에서 `user_agent`, `session_id` 등 사용자 정보를 저장하고 있어 PII 노출 위험이 있다.
- **수정**:
  1. Supabase 대시보드에서 모든 관련 테이블에 RLS 정책이 활성화되어 있는지 반드시 확인할 것
  2. 최소한 INSERT만 허용하고 SELECT는 service_role key로만 가능하게 제한 권장
  3. `.env` 파일이 `.gitignore`에 포함되어 있는 것은 확인됨 (양호)

---

### [CRITICAL] `saveFeedback` 함수에서 에러를 silence하지 않고 throw함

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/lib/db.ts:88-98`
- **문제**: 다른 DB 함수들(`upsertUser`, `logAccess`, `saveQuizSession`)은 모두 try-catch로 에러를 조용히 처리하는데, `saveFeedback`만 유일하게 `if (error) throw error`로 에러를 전파한다. 이 자체는 의도적일 수 있지만(사용자에게 실패를 알려야 하므로), 호출부인 `FeedbackModal.tsx:42`에서는 catch 처리를 하고 있어 직접적인 앱 크래시 위험은 없다. 다만 **일관성 문제**와 함께, `saveFeedback`이 다른 곳에서 호출될 때 미처리될 위험이 있다.
- **수정**: 현재는 호출부에서 catch 처리하고 있어 동작상 문제 없음. 다만 프로젝트 전반의 DB 에러 처리 패턴을 통일하는 것을 권장한다.

---

### [HIGH] 채점 로직 중복 — `checkAnswer`와 `checkAllAnswers`

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/store/quizStore.ts:70-98` (checkAnswer)
- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/store/quizStore.ts:127-166` (checkAllAnswers)
- **문제**: `normalize`, `expandAnswer` 함수와 채점 로직이 두 메서드에 완전히 복제되어 있다. 한쪽만 수정하고 다른 쪽을 누락하면 채점 결과가 달라지는 버그가 발생한다.
- **수정**: 공통 채점 함수를 추출하여 양쪽에서 호출하도록 리팩토링할 것.
```ts
function gradeQuestion(question: Question, userAnswer: string): boolean { ... }
```

---

### [HIGH] `checkAllAnswers`에서 오답노트 등록 누락

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/store/quizStore.ts:127-166`
- **문제**: `checkAnswer`(70행)는 오답 시 `useWrongNoteStore.getState().addWrongNote()`를 호출하지만, `checkAllAnswers`(모의고사 일괄 채점)에서는 오답노트 등록 로직이 **완전히 누락**되어 있다. 즉, 모의고사 모드에서는 틀린 문제가 오답노트에 저장되지 않는다.
- **수정**: `checkAllAnswers` 내부에서도 `isCorrect === false`인 문제에 대해 `addWrongNote`를 호출해야 한다.

---

### [HIGH] `WrongNoteGrid`에서 `fetchCategories()`를 매번 재호출

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/wrong-note/WrongNoteGrid.tsx:22-33`
- **문제**: `useEffect`의 의존성이 `[wrongNotes]`이므로, 오답노트 목록이 변경될 때마다 `fetchCategories()`를 호출한다. 또한 `MainPage.tsx`에서도 같은 API를 호출하므로 네트워크 요청이 중복된다. 특히 `wrongNotes`가 오답노트 풀기 후 변경되면 불필요한 재요청이 발생한다.
- **수정**: 
  1. 카테고리 데이터를 별도 전역 상태(Zustand store 또는 React context)로 관리하여 중복 fetch 방지
  2. 또는 `wrongNotes`를 의존성에서 제외하고 초기 로드 시에만 fetch (wrongNotes 변경은 이미 로드된 카테고리 데이터와 비교하면 됨)

---

### [HIGH] `WrongNoteGrid`에서 오답 문제 ID 충돌 가능성

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/wrong-note/WrongNoteGrid.tsx:37-44`
- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/store/wrongNoteStore.ts:17-18`
- **문제**: `WrongNote`의 `id`는 `question.id`인데, 각 카테고리별 JSON 파일의 문제 ID가 독립적이라면 **서로 다른 카테고리에서 같은 ID를 가진 문제가 존재**할 수 있다. `wrongNoteStore.addWrongNote`는 `id`만으로 중복을 체크하므로(`some((n) => n.id === id)`), 카테고리 A의 id=1 문제를 틀리고 나서 카테고리 B의 id=1 문제를 틀리면 두 번째가 무시된다. 또한 `fetchWrongQuestions`에서 `wrongIds.has(q.id)`로 필터하므로 다른 카테고리의 같은 ID 문제도 포함될 수 있다.
- **수정**: 오답노트의 고유 키를 `quizId + questionId` 복합키로 변경하거나, 중복 체크 시 `quizId`도 함께 비교해야 한다.

---

### [HIGH] `ResultPage.tsx`의 `useEffect` 의존성 배열 불완전 (ESLint react-hooks/exhaustive-deps 위반 가능)

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/pages/ResultPage.tsx:63-87`
- **문제**: DB 저장 `useEffect`의 의존성이 `[userId]`만 지정되어 있는데, 내부에서 `saved`, `startedAt`, `questions`, `mockExamId`, `selectedCategories`, `difficulty`, `shuffle`, `correctCount`, `scorePercent`, `results`를 참조한다. `saved` 플래그로 1회 실행을 보장하고 있어 실제로는 문제가 크지 않지만, React의 동시성 모드에서 예상치 못한 동작이 발생할 수 있다.
- **수정**: 
  1. 현재 `saved` 플래그로 1회 실행을 보장하고 있으므로 치명적이진 않음
  2. ESLint 경고 방지를 위해 `// eslint-disable-next-line react-hooks/exhaustive-deps` 주석 추가 또는 useRef 패턴으로 전환 권장

---

### [HIGH] `QuizCard`에서 채점 후에도 선택지 클릭 가능

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/quiz/QuizCard.tsx:51-58`
- **문제**: `ChoiceButton`에 `disabled={false}`가 하드코딩되어 있다. 채점 완료(`isChecked === true`) 후에도 선택지를 클릭할 수 있으며, 이로 인해 `selectAnswer`가 호출되어 채점 결과가 초기화된다(`selectAnswer` 내부에서 `scoredAnswers`를 삭제함). 의도적으로 답변 수정을 허용하는 것이라면 UX적으로 혼란스럽고, 아니라면 버그이다.
- **수정**: `disabled={isChecked}`로 변경하거나, 채점 후 재선택 시 사용자에게 경고를 표시해야 한다.

---

### [MEDIUM] `supabase.ts`에서 환경변수 누락 시 런타임 크래시

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/lib/supabase.ts:3-6`
- **문제**: `VITE_SUPABASE_URL`이나 `VITE_SUPABASE_ANON_KEY`가 설정되지 않으면 `undefined`가 `createClient`에 전달되어 런타임 에러가 발생한다. 현재 `as string` 타입 단언으로 TypeScript 경고도 우회되고 있다.
- **수정**: 환경변수 누락 시 fallback 처리 또는 명시적 에러 메시지 출력:
```ts
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경변수가 설정되지 않았습니다.')
}
```

---

### [MEDIUM] `Math.random()` 기반 셔플은 균일 분포를 보장하지 않음

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/lib/quiz.ts:35,50,59`
- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/pages/ResultPage.tsx:104`
- **문제**: `arr.sort(() => Math.random() - 0.5)` 패턴은 비교 함수의 일관성을 보장하지 않아 일부 JS 엔진에서 불균일한 셔플 결과를 만든다.
- **수정**: Fisher-Yates 셔플 알고리즘으로 교체:
```ts
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

---

### [MEDIUM] `buildQuestions`에서 순차적 fetch (직렬 요청)

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/lib/quiz.ts:26-29`
- **문제**: `for...of` 루프로 각 카테고리를 순차적으로 fetch한다. 카테고리가 많을 경우 대기 시간이 합산된다.
- **수정**: `Promise.all`로 병렬 요청:
```ts
const allQuestions = (await Promise.all(
  categories.map(cat => fetchQuiz(cat.id, cat.file))
)).flat()
```

---

### [MEDIUM] `WrongNoteGrid.fetchWrongQuestions`도 직렬 fetch

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/wrong-note/WrongNoteGrid.tsx:36-44`
- **문제**: `buildQuestions`와 동일한 직렬 fetch 문제. 오답노트에 여러 카테고리가 포함될 경우 느려진다.
- **수정**: `Promise.all`로 병렬화.

---

### [MEDIUM] `ResultChart`에서 dark mode 미지원

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/result/ResultChart.tsx:37-38`
- **문제**: 차트 중앙의 퍼센트 텍스트가 `text-gray-800`, `text-gray-500`로 고정되어 있어 다크 모드에서 가독성이 떨어진다.
- **수정**: `dark:text-gray-100`, `dark:text-gray-400` 클래스 추가.

---

### [MEDIUM] `Footer.tsx`에서 dark mode 미지원

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/layout/Footer.tsx:4`
- **문제**: Footer 배경(`bg-white`), 텍스트, border 색상에 dark 모드 클래스가 없다.
- **수정**: `dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400` 등 추가.

---

### [MEDIUM] `QuizSettings.tsx`에서 dark mode 미지원

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/quiz/QuizSettings.tsx:21`
- **문제**: 설정 패널 전체가 light 테마 색상만 사용한다.
- **수정**: `dark:` 접미 클래스 추가.

---

### [MEDIUM] `MockExamGrid.tsx`에서 dark mode 미지원

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/mock-exam/MockExamGrid.tsx:43`
- **문제**: 카드 배경, 텍스트, 테두리에 dark 모드 클래스가 없다.
- **수정**: `QuizSettings`와 동일하게 dark mode 클래스 추가.

---

### [MEDIUM] `useDarkMode` 훅이 각 컴포넌트에서 독립 인스턴스 생성

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/hooks/useDarkMode.ts`
- **문제**: `useState`로 로컬 상태를 관리하므로, 여러 컴포넌트에서 사용할 경우 상태 불일치가 발생할 수 있다. 현재는 `Header`에서만 사용되어 문제가 없지만, 확장 시 위험하다.
- **수정**: Zustand store로 전환하거나, context provider 패턴 사용 권장.

---

### [MEDIUM] `useSession` 훅에서 `initialized` ref 패턴의 StrictMode 호환성

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/hooks/useSession.ts:9-11`
- **문제**: React 18+ StrictMode에서는 개발 모드에서 useEffect가 두 번 실행된다. `useRef(false)` + `if (initialized.current) return` 패턴은 StrictMode에서 첫 마운트 → 언마운트 → 재마운트 사이클에서 ref가 리셋되지 않아 두 번째 마운트에서 초기화가 실행되지 않을 수 있다. 다만 React 19에서 이 동작이 변경되었을 수 있으므로 실제 테스트가 필요하다.
- **수정**: StrictMode에서의 중복 실행이 문제라면 AbortController 패턴 또는 cleanup 함수에서 ref를 리셋하는 방식 사용.

---

### [MEDIUM] `GoogleAdSense` 컴포넌트에서 `console.error` 잔류

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/common/GoogleAdSense.tsx:19`
- **문제**: `console.error('AdSense 오류:', e)`가 프로덕션 빌드에도 포함된다.
- **수정**: 개발 모드에서만 출력하거나 제거:
```ts
if (import.meta.env.DEV) console.error('AdSense 오류:', e)
```

---

### [LOW] `setSettings`에서 `shuffle: false` 설정 불가

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/store/quizStore.ts:25-30`
- **문제**: `settings.shuffle ?? state.shuffle` — `??` 연산자는 `null`/`undefined`만 체크한다. `shuffle: false`를 명시적으로 전달해도 `false ?? state.shuffle`은 `false`를 반환하므로 이 경우는 정상 동작한다. (false-positive 확인 완료)
- **비고**: 정상 동작 확인됨. 다만 `||` 연산자와 혼동하기 쉬우므로 주석으로 의도 명시 권장.

---

### [LOW] SEO 통계 수치 하드코딩

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/pages/MainPage.tsx:179-201`
- **문제**: "1,556명 이상의 사용자", "73,000건 이상의 문제" 등 통계 수치가 JSX에 하드코딩되어 있다. Supabase에서 실시간으로 가져오거나 빌드 시 주입하지 않으면 점점 실제와 괴리가 생긴다.
- **수정**: 정적 콘텐츠로 유지한다면 주기적 업데이트 프로세스 필요. 또는 API에서 가져오는 방식 고려.

---

### [LOW] `ResultPage`에서 `wrongCount` 계산에 건너뛴 문제 포함

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/pages/ResultPage.tsx:58`
- **문제**: `wrongCount = results.length - correctCount`로 계산하므로 건너뛴 문제도 "틀린" 것으로 포함된다. "틀린" 탭 필터(`tab === 'wrong'`)에서도 `!r.isCorrect`로 필터하므로 건너뛴 문제가 표시된다. 의도적일 수 있으나 사용자 관점에서 "틀림"과 "건너뜀"은 다른 개념이다.
- **수정**: `wrongCount = results.filter(r => !r.isCorrect && !r.isSkipped).length`로 분리하거나, "틀린" 탭에서 건너뛴 문제를 제외.

---

### [LOW] Recharts 전체 import로 번들 크기 증가

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/result/ResultChart.tsx:1`
- **문제**: `import { PieChart, Pie, Cell, Tooltip } from 'recharts'` — Recharts v3은 트리쉐이킹을 지원하지만, 도넛 차트만 사용하는데 전체 라이브러리를 의존하고 있다.
- **수정**: 번들 분석 후 필요하면 경량 차트 라이브러리(예: lightweight-charts)로 교체하거나 SVG 직접 구현 고려.

---

### [LOW] `QuestionNavigator`에서 `Array.from` + `includes` 반복 호출

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/quiz/QuestionNavigator.tsx:24-51`
- **문제**: 매 렌더마다 `Array.from({ length: total })`을 생성하고, 각 아이템에서 `answeredIds.includes(qid)` 등을 호출한다. `includes`는 O(n)이므로 문제 수가 많으면 O(n^2) 성능이 된다.
- **수정**: `answeredIds`, `skippedIds`, `correctIds`, `wrongIds`를 `Set`으로 변환하여 O(1) lookup 사용.

---

### [LOW] `CategoryCard`에 키보드 접근성 부족

- **파일**: `/Users/jeonghyeonseung/workspaces/AI_quiz/ai-quiz/src/components/common/CategoryCard.tsx:12-17`
- **문제**: `<div onClick>` 요소에 `role="button"`, `tabIndex`, `onKeyDown` 속성이 없어 키보드 사용자가 접근할 수 없다.
- **수정**: `<button>` 요소로 변경하거나 ARIA 속성 추가.

---

## 리뷰 요약

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 2 | review |
| HIGH | 5 | review |
| MEDIUM | 8 | info |
| LOW | 5 | note |

---

## 우선 수정 권장 순서

1. **Supabase RLS 정책 확인** (CRITICAL) — 외부에서 데이터 직접 조작 방지
2. **`checkAllAnswers` 오답노트 등록 누락** (HIGH) — 모의고사 모드에서 오답노트 미작동 버그
3. **채점 로직 중복 제거** (HIGH) — 향후 채점 규칙 변경 시 불일치 방지
4. **오답노트 ID 충돌 문제** (HIGH) — 복수 카테고리 사용 시 데이터 무결성 위험
5. **`QuizCard` 채점 후 선택지 disabled 처리** (HIGH) — UX 혼란 방지
6. **다크 모드 미지원 컴포넌트 일괄 수정** (MEDIUM) — Footer, QuizSettings, MockExamGrid, ResultChart

---

**Verdict: Warning**

CRITICAL 이슈 2건은 Supabase RLS 설정에 의존하며 코드 변경보다는 인프라 확인이 필요하다. HIGH 이슈 5건 중 "모의고사 오답노트 누락"과 "ID 충돌"은 실제 버그이므로 머지/배포 전 수정을 강력히 권장한다.
