# 문제 번호 네비게이터 범례 셀렉터 불일치

## 발생 환경
- 날짜: 2026-04-04
- 관련 파일:
  - `ai-quiz/e2e/ai-quiz-flow.spec.ts:198`
  - `ai-quiz/e2e/full-e2e-scenarios.spec.ts:259`
- 라이브러리·버전: @playwright/test ^1.58.2

## 증상

E2E 테스트 2건 실패 (15개 중 13개 통과):

```
[chromium] › ai-quiz-flow.spec.ts:198 › Step 8: 우측 문제 번호 네비게이터 확인
[chromium] › full-e2e-scenarios.spec.ts:240 › 시나리오 6: 문제 번호 네비게이터
```

에러 메시지:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('div.bg-white.rounded-2xl').filter({ hasText: '문제 목록' }).getByText('완료')
Expected: visible
Timeout: 5000ms
```

## 원인

테스트 코드는 네비게이터 범례에서 `완료` 텍스트를 찾지만,
실제 UI의 범례 텍스트가 변경되어 불일치 발생.

| 테스트 기대값 | 실제 UI 표시값 |
|--------------|--------------|
| `완료` | `정답` |
| (없음) | `오답` (추가됨) |
| `건너뜀` | `건너뜀` (일치) |
| `미풀이` | `미풀이` (일치) |

에러 컨텍스트 스냅샷에서 실제 렌더링 확인:
```yaml
- generic [ref=e58]:
  - generic [ref=e59]: ✓
  - text: 정답
- generic [ref=e60]:
  - generic [ref=e61]: ✗
  - text: 오답
- generic [ref=e62]:
  - generic [ref=e63]: ◈
  - text: 건너뜀
- generic [ref=e64]:
  - generic [ref=e65]: 숫자
  - text: 미풀이
```

## 해결책

테스트 코드에서 `완료` → `정답`으로 수정하고, `오답` 범례 검증 추가.

`ai-quiz-flow.spec.ts` 및 `full-e2e-scenarios.spec.ts`에서 아래 변경 적용:

```ts
// 변경 전
await expect(navigator.getByText('완료')).toBeVisible()
await expect(navigator.getByText('건너뜀')).toBeVisible()
await expect(navigator.getByText('미풀이')).toBeVisible()

// 변경 후
await expect(navigator.getByText('정답')).toBeVisible()
await expect(navigator.getByText('오답')).toBeVisible()
await expect(navigator.getByText('건너뜀')).toBeVisible()
await expect(navigator.getByText('미풀이')).toBeVisible()
```

## 재발 방지

UI 텍스트 변경 시 관련 E2E 테스트 셀렉터도 함께 업데이트한다.
특히 범례, 버튼 라벨, 상태 텍스트처럼 기획 변경으로 자주 바뀌는 문자열은
상수로 관리하거나 `data-testid` 속성으로 셀렉팅하면 유지보수가 용이하다.
