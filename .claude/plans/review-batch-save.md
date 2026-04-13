# 코드 리뷰: 퀴즈 답안 배치 저장 구현

## 변경 범위
- 변경 파일: `src/lib/db.ts`, `src/types/index.ts`, `src/store/quizStore.ts`, `src/hooks/useBatchSave.ts` (신규), `src/pages/QuizPage.tsx`, `src/pages/ResultPage.tsx`
- 관련 기능: 퀴즈 풀이 중 5문제마다 답안을 DB에 배치 저장, 중도 이탈 시 데이터 유실 최소화

## 발견 사항

### [HIGH] clearAnswer로 채점 초기화 후 재채점 시 DB에 중복 답안 삽입

- 파일: `src/hooks/useBatchSave.ts:59`, `src/store/quizStore.ts:121-128`
- 문제: `clearAnswer(questionId)`는 `checkedIds`에서 해당 id를 제거하지만, `lastSavedCount`는 감소하지 않는다. 이후 같은 문제를 다시 채점하면 `checkedIds`에 다시 push되는데, 이미 배치 저장된 답안이 다시 slice 범위에 포함될 수 있다. `checkedIds.slice(lastSavedCount)` 경계 추적은 `checkedIds`가 단조 증가(append-only)할 때만 정확하다. `clearAnswer`로 중간 요소가 제거되면 배열 인덱스가 어긋나 동일 문제의 답안이 DB에 중복 삽입된다.

  구체적 시나리오:
  1. 문제 1~5 채점 -> `checkedIds = [1,2,3,4,5]`, 배치 저장 실행, `lastSavedCount = 5`
  2. 문제 3의 `clearAnswer` 호출 -> `checkedIds = [1,2,4,5]`, `lastSavedCount = 5`
  3. 문제 3 재채점 -> `checkedIds = [1,2,4,5,3]`, `lastSavedCount = 5`
  4. 문제 6~9 채점 -> `checkedIds = [1,2,4,5,3,6,7,8,9]`, `unsavedCount = 4`로 배치 미실행
  5. 문제 10 채점 -> `checkedIds = [1,2,4,5,3,6,7,8,9,10]`, `unsavedCount = 5`
  6. `slice(5, 10) = [3,6,7,8,9]` -> 문제 3이 DB에 재삽입 (이전 답과 다른 답일 수 있음)

  `implementation.md`에서도 이 문제를 인지하고 "분석 시 최신 행 기준으로 처리 필요"라고 명시했으나, `quiz_answers` 테이블에 unique 제약이 없어 중복 행이 누적된다.

- 수정: 다음 중 하나를 적용한다.
  - (권장) `quiz_answers` 테이블에 `(quiz_session_id, question_id)` unique 제약 추가 + `saveBatchAnswers`에서 `upsert` 사용
  - (대안) `clearAnswer` 시 `lastSavedCount`를 해당 문제의 원래 인덱스까지 감소시키거나, 별도의 "저장 완료 ID Set"을 관리하여 이미 저장된 문제는 스킵

### [HIGH] useBatchSave 배치 저장이 await 없이 setLastSavedCount를 즉시 갱신

- 파일: `src/hooks/useBatchSave.ts:76-78`
- 문제: `saveBatchAnswers`는 async 함수이지만 await 없이 호출(fire-and-forget)하고, 바로 다음 줄에서 `setLastSavedCount`로 카운트를 증가시킨다. `saveBatchAnswers`가 네트워크 오류 등으로 실패(silent fail)하면, `lastSavedCount`는 이미 증가한 상태이므로 해당 배치의 답안은 영구 유실된다. ResultPage의 flush에서도 `checkedIds.slice(lastSavedCount)`로 미저장분을 계산하므로, 실패한 배치는 재시도되지 않는다.

  silent fail 정책 자체는 프로젝트 컨벤션에 부합하지만, "저장 실패 시에도 저장 완료로 표시"하는 것은 의도와 다를 수 있다. 분석 데이터의 정확성이 중요하다면 문제가 된다.

- 수정: `saveBatchAnswers`의 반환값을 활용하여, 성공 시에만 `setLastSavedCount`를 갱신한다.
  ```ts
  // db.ts에서 성공/실패를 boolean으로 반환
  export async function saveBatchAnswers(...): Promise<boolean> {
    try {
      // ...insert
      return true
    } catch {
      return false
    }
  }

  // useBatchSave.ts
  saveBatchAnswers(quizSessionId, batchAnswers, !!mockExamId).then((ok) => {
    if (ok) setLastSavedCount(lastSavedCount + BATCH_SIZE)
  })
  ```
  단, silent fail이 의도적 정책이고 분석 정확도가 best-effort라면 현재 구현도 수용 가능하다. 이 경우 주석으로 의도를 명시하는 것을 권장한다.

### [MEDIUM] ResultPage에서 saveBatchAnswers와 updateSessionResult가 순서 보장 없이 병렬 실행

- 파일: `src/pages/ResultPage.tsx:89-93`
- 문제: `saveBatchAnswers` (미저장 답안 flush)와 `updateSessionResult` (점수 업데이트)가 둘 다 await 없이 fire-and-forget으로 호출된다. `updateSessionResult`가 먼저 완료되고, `saveBatchAnswers`가 나중에 완료되면 점수와 실제 저장된 답안 수가 일시적으로 불일치할 수 있다. Supabase의 단일 connection 내에서 순차 처리되더라도, 네트워크 재시도 등으로 순서가 뒤바뀔 가능성이 있다.

  분석 대시보드에서 세션 데이터를 조회할 때, 답안이 아직 삽입되지 않은 상태에서 점수만 업데이트된 레코드를 읽을 수 있다.

- 수정: flush 완료 후 점수를 업데이트하거나, 최소한 주석으로 순서 무관함을 명시한다.
  ```ts
  if (unsavedAnswers.length > 0) {
    saveBatchAnswers(quizSessionId, unsavedAnswers, !!mockExamId).then(() => {
      updateSessionResult(quizSessionId, correctCount, scorePercent)
    })
  } else {
    updateSessionResult(quizSessionId, correctCount, scorePercent)
  }
  ```

### [MEDIUM] creatingSession ref가 Promise 실패 시 false로 복구되지 않을 수 있음

- 파일: `src/hooks/useBatchSave.ts:38-49`
- 문제: `createDraftSession`이 예외를 throw하면 `.then()` 콜백이 실행되지 않아 `creatingSession.current`가 `true`로 남는다. 현재 `createDraftSession` 내부에서 try-catch로 예외를 잡아 `null`을 반환하므로 실제로 throw가 발생할 가능성은 낮지만, 방어적 코드가 누락되어 있다. 만약 Supabase 클라이언트 자체가 초기화되지 않은 경우(예: env 미설정) `createClient` 단계에서 에러가 발생하면 해당 세션 동안 배치 저장이 완전히 비활성화된다.

- 수정: `.catch` 또는 `.finally`를 추가한다.
  ```ts
  createDraftSession({ ... })
    .then((id) => {
      if (id) setQuizSessionId(id)
    })
    .finally(() => {
      creatingSession.current = false
    })
  ```

### [MEDIUM] useBatchSave useEffect 의존성 배열에서 store 값 누락

- 파일: `src/hooks/useBatchSave.ts:50-51`, `src/hooks/useBatchSave.ts:79-80`
- 문제: 두 useEffect 모두 `eslint-disable react-hooks/exhaustive-deps` 주석으로 lint를 무시하고 있다. `implementation.md`에서 "setter 함수는 안정적 참조"라고 설명했으나, 문제는 setter가 아니라 데이터 값이다.
  - Effect 1: `mockExamId`, `selectedCategories`, `difficulty`, `shuffle`이 의존성에 없다. 이 값들은 퀴즈 시작 후 변경되지 않으므로 실질적 문제는 없지만, 의존성 누락의 이유를 주석으로 명시하는 것이 좋다.
  - Effect 2: `lastSavedCount`, `scoredAnswers`, `questions`, `mockExamId`가 의존성에 없다. `checkedIds.length`로 트리거하고 내부에서 최신 값을 읽으므로 동작은 정확하지만, Zustand의 구독 방식상 렌더링 시점의 값이 사용되므로 stale closure 위험이 있다.

  현재 구현에서 실질적 버그로 이어지지는 않지만, 향후 유지보수 시 혼란을 줄 수 있다.

- 수정: `eslint-disable` 주석 옆에 의존성을 의도적으로 제외한 이유를 간략히 기술한다. 또는 Zustand의 `useStore.getState()`를 사용하여 effect 내부에서 최신 값을 직접 읽는 패턴으로 변경한다.

### [LOW] ResultPage DB 저장 useEffect의 의존성이 [userId]뿐

- 파일: `src/pages/ResultPage.tsx:118-119`
- 문제: `saved` state로 1회 실행을 보장하고 있으므로 기능적으로 문제 없다. 하지만 `correctCount`, `scorePercent`, `checkedIds`, `lastSavedCount` 등 effect 내부에서 사용하는 값이 의존성에 없어 lint 경고가 발생한다. `saved` 플래그로 재실행이 차단되므로 실질적 문제는 없으나, 코드 의도를 명확히 하기 위해 `eslint-disable` 주석에 이유를 추가하는 것이 좋다.

- 수정: 기존 `eslint-disable` 주석에 `// userId 변경 시 1회만 실행 (saved 플래그로 중복 방지)` 부연 추가.

## 긍정적 평가

1. **fallback 설계가 견고하다**: `quizSessionId`가 없으면 기존 `saveQuizSession` 전체 저장으로 fallback하여, draft 세션 생성 실패 시에도 결과 데이터가 유실되지 않는다.
2. **커스텀 훅 분리가 적절하다**: `useBatchSave`로 배치 저장 로직을 완전히 분리하여 QuizPage의 책임이 증가하지 않았다. 테스트 용이성도 확보되었다.
3. **Zustand persist에 배치 상태 포함**: `quizSessionId`와 `lastSavedCount`가 sessionStorage에 persist되어 페이지 새로고침 후에도 배치 추적이 유지된다.
4. **모의고사 모드 처리가 합리적이다**: `checkAllAnswers()` 후 ResultPage flush로 일괄 처리하는 방식이 기존 모의고사 플로우를 깨지 않으면서 자연스럽게 통합되었다.
5. **silent fail 정책 일관성**: 새로 추가된 DB 함수 3개 모두 기존 프로젝트 컨벤션(try-catch + silent fail)을 따르고 있다.
6. **타입 안전성**: `QuizStore` 인터페이스에 새 상태와 setter를 명시적으로 추가하여 타입 체크가 정확하다.

## 리뷰 요약

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 0 | pass |
| HIGH | 2 | warn |
| MEDIUM | 3 | info |
| LOW | 1 | note |

**Verdict: Warning**

CRITICAL 이슈 없음. HIGH 2건은 데이터 정확성에 영향을 미칠 수 있는 문제이다.
- **clearAnswer 후 중복 삽입**: 사용자가 이전 문제로 돌아가 답을 수정하는 시나리오에서 발생. 빈도는 낮으나 DB 데이터 정합성에 직접 영향. `quiz_answers` 테이블에 unique 제약 추가를 강력 권장.
- **배치 저장 실패 시 카운트 증가**: silent fail 정책이 의도적이라면 주석 명시만으로 충분. 분석 정확도가 중요하면 성공 확인 후 카운트 갱신으로 변경 필요.

두 HIGH 이슈 모두 퀴즈 풀이 UX에는 영향 없으며(DB 저장 실패/중복이 퀴즈 진행을 차단하지 않음), 주의하여 머지 가능하다.
