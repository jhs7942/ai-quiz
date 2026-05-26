# Silent Fail과 try/catch 위치 결정

## 학습 환경
- 날짜: 2026-05-05 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x, Supabase JS Client

## 배경
`db.ts`의 `saveFeedback` 함수 주석에 "try/catch가 없다 — silent fail X"라는 설명을 보고
"try → catch → 사용자 알림" 흐름이 더 자연스럽지 않은가?라는 의문이 생겼다.

알고 보니 사용자 직관은 옳았고, 다만 **try/catch를 어디에 두느냐**가 silent fail / not silent fail을
가르는 핵심이었다. 같은 `db.ts` 파일 안에 silent fail이 OK인 함수(`logAccess`, `saveQuizSession`)와
NG인 함수(`saveFeedback`)가 공존하는 이유와, 함수 작성 시 어디에 try/catch를 둘지를 정리할 필요가 있었다.

## 핵심 개념

### Silent Fail의 정의
> **에러가 발생했는데 호출자도 사용자도 모르게 조용히 삼켜지는 것**

함수가 `throw`해야 호출처가 catch할 수 있다. 함수 내부에서 try/catch로 잡고 아무것도 안 하면(또는
콘솔에만 로깅하면) 호출처는 성공한 줄 안다 → silent fail.

### 3가지 패턴

| 패턴 | 함수 내부 try/catch | 결과 | 사용 시점 |
|---|---|---|---|
| **A. 삼킴** | 있음 + 콘솔 로깅만 | silent fail ✅ | 백그라운드 로깅·분석. 사용자가 결과를 기대하지 않음 |
| **B. throw 흘리기** | 없음 | not silent fail ✅ | 사용자가 의도적으로 누른 액션. 호출처(UI)가 catch + 알림 |
| **C. 재시도·변환** | 있음 + 처리 후 rethrow | not silent fail ✅ | 함수 단위 재시도·폴백·도메인 에러 변환이 필요할 때 |

### 의사결정 기준

| 상황 | try/catch 위치 |
|---|---|
| 백그라운드 로깅·분석 (사용자가 결과 기대 X) | **함수 내부에 두고 삼킨다** (silent fail OK) |
| 사용자가 누른 액션 (결과 기대 O) | **호출처(UI)에 둔다**, 함수는 throw |
| 재시도·폴백·에러 변환이 함수 단위로 필요한 경우 | **함수 내부에 두고 처리 후 의미 있는 에러로 rethrow** |

핵심 질문: "**사용자가 이 호출 결과를 기다리고 있는가?**"
- 예 → 호출처가 catch 책임 (패턴 B)
- 아니오 → 함수 내부에서 삼켜도 됨 (패턴 A)

## 실제 적용

### ai-quiz `db.ts`의 두 부류

| 함수 | 사용자 의도 | 실패 시 처리 | try/catch 위치 |
|---|---|---|---|
| `logAccess` | 접근 로그 (백그라운드) | silent fail OK | 함수 내부에서 삼킴 |
| `saveQuizSession` | 결과 분석용 저장 | silent fail OK | 함수 내부에서 삼킴 |
| `upsertUser` | 익명 사용자 등록 | silent fail OK | 함수 내부에서 삼킴 |
| `saveFeedback` | 사용자가 누른 "신고" | silent fail NG | **호출처 (FeedbackModal)** |

### 패턴 A — silent fail OK (logAccess 같은 분석)
```ts
export async function logAccess(userId: string) {
  try {
    await supabase.from('access_logs').insert({ user_id: userId });
  } catch (e) {
    console.error(e);   // 콘솔에만 — 사용자에게는 안 알림
  }
}

// 호출처 — 결과 무시
logAccess(userId);   // await 안 해도 됨, 실패해도 퀴즈 기능 영향 X
```

### 패턴 B — silent fail NG (saveFeedback)
```ts
// db.ts — 함수 내부 try/catch 없음
export async function saveFeedback(payload: SaveFeedbackPayload): Promise<void> {
  const { error } = await supabase.from('feedbacks').insert({...});
  if (error) throw error;   // 호출처로 흘려보냄
}

// FeedbackModal.tsx — UI 레이어가 catch 책임
try {
  await saveFeedback(payload);
  toast.success("신고가 접수되었습니다");
} catch (e) {
  toast.error("신고 접수에 실패했습니다. 다시 시도해주세요");
}
```

### 안티패턴 — 사용자 액션인데 함수 내부에서 삼킴
```ts
// ❌ 신고가 실패해도 호출처는 알 수 없음
export async function saveFeedback(payload) {
  try {
    await supabase.from('feedbacks').insert({...});
  } catch (e) {
    console.error(e);   // 콘솔에만
  }
}

// 호출처
await saveFeedback(payload);
toast.success("신고 접수됨");   // 실패해도 성공 토스트 (버그)
```

## 주의사항

### 헷갈리기 쉬운 점
1. **"try/catch가 없다 = 에러를 무시한다"가 아니다**
   - 함수에 try/catch가 없으면 에러가 호출처로 **전파**된다 (throw 자동 흘림)
   - 호출처가 catch하면 사용자에게 알릴 수 있음 → not silent fail
   - 즉 try/catch가 없는 게 오히려 silent fail을 **방지**한다

2. **try/catch + console.error만 있는 코드는 의심한다**
   - rethrow 없이 콘솔 로깅만 하면 호출처는 성공한 줄 안다
   - "이 호출이 실패하면 사용자가 알아야 하나?"를 물어보고, 알아야 한다면 throw 추가 또는 try/catch 제거

3. **호출처가 await 하지 않으면 모든 게 무의미**
   ```ts
   saveFeedback(payload);   // ❌ await 없이 fire-and-forget — catch 못 함
   await saveFeedback(payload);   // ✅
   ```
   사용자 액션은 반드시 await + try/catch.

4. **CLAUDE.md의 "silent fail" 규칙은 분석/로깅 한정**
   > 모든 DB 호출은 실패해도 퀴즈 기능에 영향 없이 silent fail
   - 이는 `logAccess`, `saveQuizSession` 같은 백그라운드 호출 원칙
   - `saveFeedback` 같은 사용자 액션은 예외 — 주석에 "silent fail X"로 명시

5. **함수 단위 재시도가 필요하면 패턴 C**
   - 네트워크 장애로 retry가 의미 있을 때
   - 단순 silent fail이 아니라 "처리 후 의미 있는 에러로 변환"이라는 점이 다름
   - 예: `if (error.code === 'NETWORK') retry; else throw new DomainError(...)`

### 코드 작성 체크리스트
- [ ] 이 함수의 호출자는 사용자 액션 결과를 기다리는가?
- [ ] 그렇다면 함수 내부에 try/catch를 두지 말고 throw가 흐르게 한다
- [ ] 그렇지 않다면 함수 내부에서 try/catch + 콘솔 로깅으로 삼킨다
- [ ] try/catch에 console.error만 있다면 "정말 silent fail이 맞는가?" 한 번 더 의심
- [ ] 의도가 헷갈릴 만한 자리에는 주석으로 "silent fail OK/X" 명시

## 참고 자료
- ai-quiz 프로젝트 CLAUDE.md — "silent fail" 원칙 명시 (`db.ts` 분석 호출 한정)
- 관련 study 노트: `.claude/study/2026-05-05/introduce-parameter-object.md` (saveFeedback의 payload 타입과 직접 연결)
- Joel Spolsky, "Don't Let Architecture Astronauts Scare You" — 에러 처리는 호출 맥락에 따라 결정해야 한다는 원칙
