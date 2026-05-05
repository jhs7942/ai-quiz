## 요약
도메인 타입 정의 파일 `src/types/index.ts` 에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#3 / 13**.

## 시리즈 진행 상황
- ✅ #1 `docs/learn-quiz-flow` (머지 완료) — quizStore, QuizPage
- 🔄 #2 `docs/learn-app-bootstrap` (PR #2) — main, App
- 🔄 **#3 (이 PR) `docs/learn-types`** — types/index.ts
- ⏳ #4~#14 — lib/, hooks/, pages/, components/

## 사전 지식
- TypeScript `interface` vs `type` 의 차이
- 리터럴 유니온 (예: `'easy' | 'medium' | 'hard'`) 이 enum 의 대안인 이유
- 매핑드 타입 (`Record`, `Partial`) 이 무엇인지

## 학습 포인트
1. **discriminated union (구분된 유니온)** — `Question = MultipleChoiceQuestion | ShortAnswerQuestion`. `type` 필드가 판별자 역할을 해서 `if (q.type === 'multiple_choice')` 한 줄로 narrowing 발생
2. **튜플 타입** — `[string, string, string, string]`. 배열 길이를 정확히 4로 강제 (`string[]` 보다 정밀)
3. **리터럴 유니온 vs enum** — `'easy' | 'medium' | 'hard'` 가 enum 의 대안. 직렬화·비교가 간단하고 번들 사이즈 추가 없음
4. **`?:` (optional) vs `| null`** — `?:` 는 "키 자체가 없을 수 있음", `| null` 은 "키는 있고 값이 null 일 수 있음". 의도가 다르다
5. **`string | string[]`** — 단일/복수 정답 동시 허용. 이 유니온이 채점 로직(`Array.isArray(ans)`)의 분기를 만든다 — 타입과 코드는 짝
6. **`Record<K, V>`** — `{ [key: K]: V }` 의 짧은 표기. 의도(id 로 답변 조회)를 명시하는 효과
7. **`Partial<T>`** — T 의 모든 필드를 optional 로 변환. "일부 필드만 갱신" 표현에 자주 쓰임 (`setSettings(settings: Partial<QuizSettings>)`)
8. **store 인터페이스 컨벤션** — Zustand 는 상태 + 액션을 한 인터페이스에 적는다 (`QuizStore`). store 사용처(QuizPage 등)가 한 곳만 보면 된다

## 리뷰 시 봐야 할 라인
| 라인 | 학습 포인트 |
|---|---|
| 9 | discriminator 필드(`type: 'multiple_choice'`) |
| 14 | 튜플 타입으로 길이 강제 |
| 17 | `?:` optional 의 의미 |
| 27 | discriminated union 자체 |
| 50 | sentinel `'all'` 의 타입 강제 |
| 67 | `Record<number, string>` |
| 76 | `string | null` vs `?:` 차이 |
| 90 | `Partial<QuizSettings>` 의 활용 |

## 검증
- ✅ `npm run build` (tsc + Vite) 통과
- 동작 변경 없음 (주석만)

## Anti-scope
- `string | string[]` 타입 정리(refactor) → 별도 PR (refactor/checkAnswer-type-safety 후보)
- 도메인별 파일 분리(types/quiz.ts 등) → 별도 PR
- enum 으로 마이그레이션 → 별도 ADR 후 결정

## 다음 PR
**PR #4 `docs/learn-data-pipeline`** — `src/lib/quiz.ts`, `mockExam.ts`, `session.ts`, `supabase.ts`. fetch + JSON, async/await, 균등 배분 알고리즘.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
