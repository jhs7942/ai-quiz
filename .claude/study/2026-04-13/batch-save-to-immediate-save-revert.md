# 배치 저장에서 문제별 즉시 저장으로 회귀한 결정 — 494ea8e → 900d8c0

## 학습 환경
- 날짜: 2026-04-13 / 관련 프로젝트: AI_quiz (ai-quiz) / 기술·버전: React 19, Zustand 5, Supabase PostgREST, TypeScript 5.9

---

## 배경

초기 구현에서는 퀴즈 완료 시점에만 `saveQuizSession()`을 호출했다. 이 구조에는 두 가지 문제가 있었다.

1. **중도 이탈 시 100% 유실** — 사용자가 퀴즈 중간에 나가면 풀었던 답안이 전부 사라진다.
2. **Supabase 무료 플랜 트래픽 한도 우려** — `docs/traffic-spike-solutions.md` § 대안 4에서 배치 처리를 대안으로 제시했다.

두 문제를 한 번에 해결하려고 5문제 단위 배치 저장을 도입했다(커밋 `494ea8e`). 그러나 6개 커밋 뒤 `900d8c0`에서 **문제별 즉시 저장으로 회귀**했다. 이 회귀 결정의 근거를 학습 자료로 정리한다.

---

## 핵심 개념

### 두 방식 트레이드오프

| 항목 | 배치 저장 (494ea8e) | 즉시 저장 (900d8c0 이후) |
|---|---|---|
| Supabase 요청 수 | 1/5 | 문제 수만큼 |
| 중도 이탈 유실 | 최대 4문제 | 0문제 |
| 구현 복잡도 | 높음 (Set 추적 + flush + 재시도) | 낮음 |
| 재채점 동작 | `savedAnswerIds`로 스킵 | UPSERT 또는 UPDATE |
| DB 중복 리스크 | 시나리오 존재 (리뷰 HIGH) | 없음 |
| 테스트 커버리지 | 직접 검증 어려움 | 단순 |

### "모아서 보내기"의 숨은 비용

단순히 "요청을 묶어 보내는 것"으로 보이지만 실제로는 다음 요소를 추가로 관리해야 한다.

- **상태 추적**: 어떤 답안이 이미 저장되었는지 영속 관리 (`savedAnswerIds`)
- **flush 타이밍**: 퀴즈 종료·페이지 이탈·배치 경계 등 다중 트리거
- **실패 재시도**: 네트워크 실패 시 어느 시점에 재전송할지
- **중복 방지**: 재채점·clearAnswer로 인해 같은 답안이 두 번 들어가지 않도록
- **동시성**: React `useEffect` 의존성으로 경쟁 조건 회피

---

## 실제 적용

### 배치 저장 설계 (494ea8e)

커밋 메시지: `feat: 퀴즈 답안 배치 저장 구현 (중도 이탈 대응)`
변경 파일: `src/hooks/useBatchSave.ts` 신규 87줄 + `db.ts`, `quizStore.ts`, `ResultPage.tsx`, `QuizPage.tsx` (+232 / -23)

**핵심 컴포넌트**
- `createDraftSession()` — 퀴즈 시작 즉시 세션 row 생성 (완료=false)
- `saveBatchAnswers()` — 답안 배열을 `insert([...])`로 일괄 전송
- `updateSessionResult()` — 종료 시 최종 점수 반영
- `useBatchSave(userId)` — 5문제 경계에서 자동 flush
- `savedAnswerIds: Set<string>` — 중복 삽입 방지 트래킹

**useBatchSave.ts 핵심 로직 (494ea8e 시점)**

```ts
const BATCH_SIZE = 5

const savedSet = new Set(savedAnswerIds)
const unsavedIds = checkedIds.filter((id) => !savedSet.has(id))
if (unsavedIds.length < BATCH_SIZE) return

const batchIds = unsavedIds.slice(0, BATCH_SIZE)
const batchAnswers = batchIds
  .map((qId) => {
    const question = questions.find((q) => q.id === qId)
    const scored = scoredAnswers[qId]
    if (!question || !scored) return null
    return {
      questionId: question.id,
      quizId: question.quizId ?? 'quiz',
      questionType: question.type,
      userAnswer: scored.answer,
      isCorrect: scored.isCorrect,
    }
  })
  .filter((a): a is NonNullable<typeof a> => a !== null)

if (batchAnswers.length > 0) {
  saveBatchAnswers(quizSessionId, batchAnswers, !!mockExamId).then(() => {
    addSavedAnswerIds(batchIds) // 성공 시에만 상태 갱신
  })
}
```

**설계상의 안전 장치**

- Set 기반 추적 — 초기 구현에서 사용한 `checkedIds.slice(lastSavedCount)` 인덱스 방식은 `clearAnswer` 후 경계가 어긋나 중복 삽입 위험이 있었다. ID 기반 Set으로 회피.
- 실패 시 상태 미갱신 — `.then()` 성공 콜백에서만 `savedAnswerIds`를 업데이트해 네트워크 실패 시 다음 배치에서 자동 재시도 가능.
- 최대 유실 4문제 — 5번째 문제 직후 배치가 전송되므로 이론적 최댓값.

### 회귀 결정 (900d8c0, 52675a0)

**커밋 흐름**
```
494ea8e  feat: 퀴즈 답안 배치 저장 구현 (중도 이탈 대응)
   ↓ (6개 커밋 후)
900d8c0  feat: 퀴즈 답안 문제별 즉시 저장
52675a0  fix: 엔터키로 문제 넘길 때도 quiz_answers 즉시 저장
```

**회귀 근거**

1. **리뷰에서 HIGH 이슈 지적** — 전체 리뷰(`review-batch-save.md`)에서 `clearAnswer` → 재채점 → 중복 삽입 시나리오가 HIGH로 지적됨. `savedAnswerIds`로 막았다고 설명했으나 E2E 검증이 없었다.
2. **트래픽 절감의 실효성 부재** — 사용자 1명당 초당 1회도 안 되는 호출량. Supabase 무료 플랜 한도와 거리가 매우 멀었다.
3. **구현 복잡도 부담** — 훅 구조 + flush 타이밍 + React `useEffect` 의존성이 추가 버그의 온상이 될 가능성.
4. **데이터 일관성 우선** — 유실 0건이 주는 명확성이 트래픽 절감의 추상적 이득보다 가치 있었다.

결론: **데이터 일관성 > 트래픽 절감**. 트래픽 최적화는 실측 지표가 한도를 위협하기 시작하면 재도입할 수 있다.

---

## 주의사항

### YAGNI 실전 사례

트래픽 한도를 실측하지 않은 상태에서 배치 저장을 도입한 것은 추측 기반 최적화였다. 단순 즉시 저장이 더 잘 맞는 규모였고, 최적화의 이점은 없으면서 복잡도·버그 위험만 추가됐다. "필요할 때 넣는다"는 YAGNI 원칙을 실전에서 위반한 케이스다.

### 되돌릴 수 있는 최적화인지 먼저 검토

494ea8e → 900d8c0은 몇 파일 수정으로 회귀 가능했다. 되돌리기 쉬운 최적화였기 때문에 "실험 가치"가 있었다. 반대로 되돌리기 어려운 최적화(예: 스키마 변경, 외부 의존성 추가, API 계약 변경)는 도입 기준이 더 엄격해야 한다.

### 관찰 가능한 지표 우선

실제 Supabase 호출 수·실패율·중도이탈 발생률을 **먼저 측정했어야** 했다. 지표 없이는 "얼마나 개선됐는지"도, "되돌려야 하는지"도 평가 불가다. 지표가 없으면 최적화의 근거도 회귀의 근거도 전부 추측이 된다.

### 리뷰가 설계 회귀를 유발할 수 있음

정적 리뷰에서 "동작하지만 위험한 코드"를 발견했을 때 **설계를 원점 재검토하는 선택**도 가능하다. 버그를 패치하는 방향만 있는 것이 아니다. 이번에는 리뷰가 단순 대안의 존재를 상기시켰고, 결과적으로 전체를 더 단순한 구조로 교체하게 만들었다.

### 재발 방지 체크리스트

1. 최적화 전: 현재 지표 측정 (요청/초, 실패율, 한도 대비 여유율)
2. 한도의 30% 이내면 최적화 보류
3. 도입 시 롤백 경로를 설계에 포함
4. 배치/큐 기반 쓰기는 유실 허용 범위(SLO)를 먼저 정의
5. E2E 시나리오에 "중간 실패 + 재채점" 케이스를 반드시 포함

---

## 참고 자료

- 커밋: `494ea8e` (feat: 퀴즈 답안 배치 저장 구현), `900d8c0` (feat: 퀴즈 답안 문제별 즉시 저장), `52675a0` (fix: 엔터키로 문제 넘길 때도 quiz_answers 즉시 저장)
- 관련 문서: `docs/traffic-spike-solutions.md` § 대안 4 (Supabase 요청 배치 처리), `.claude/plans/review-batch-save.md`
- [YAGNI - martinfowler.com](https://martinfowler.com/bliki/Yagni.html)
- [Supabase Rate Limits](https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation-and-abuse-prevention)
