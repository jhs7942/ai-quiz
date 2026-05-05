## 요약
공통 UI 컴포넌트 5개에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#13 / 13**.

## 사전 지식
- `children: React.ReactNode` 으로 wrapper 컴포넌트 만들기
- `e.stopPropagation()` 의 이벤트 버블링 차단
- `setTimeout` cleanup 의 중요성
- `declare global` 로 Window 인터페이스 확장

## 학습 포인트

### `CategoryCard.tsx`
1. **`<div onClick>` 의 a11y 한계** — button 이 의미적으로 정확. 키보드/스크린리더 접근성 차이
2. (대안 안내) `<button>` reset CSS 또는 `role="button"` + `tabIndex={0}` + `onKeyDown`

### `Modal.tsx`
1. **wrapper 컴포넌트 (children)** — Modal 은 외곽만, 콘텐츠는 children
2. **document keydown ESC** — 전역 리스너 + cleanup 필수 (메모리/이벤트 누수 방지)
3. **portal 없는 fixed inset-0** — 트리 깊이가 얕으면 portal 없이도 충분
4. **e.stopPropagation()** — 자식 클릭이 부모(배경) 의 onClose 에 안 닿게. 배경 클릭 시 닫기 + 본체 클릭 유지

### `Toast.tsx`
1. **디폴트 prop 값 (`duration = 3000`)** — 함수 시그니처에서 직접
2. **setTimeout + cleanup** — 언마운트 시 타이머 취소. 이미 사라진 컴포넌트의 onClose 호출 방지
3. **`left-1/2 + -translate-x-1/2`** — 가로 중앙 정렬 Tailwind 패턴

### `GoogleAdSense.tsx`
1. **`declare global`** — 외부 스크립트가 주입한 window 속성을 TS 가 인지하도록 전역 인터페이스 확장
2. **AdSense init 표준 호출** — 외부 스크립트 큐에 push. 애드블록으로 throw 가능 → try/catch
3. **조건부 spread `{...(cond ? {key: v} : {})}`** — JSX 에 attribute 를 조건부로 깔끔하게 추가

### `FeedbackModal.tsx`
1. **비동기 제출 흐름의 표준** — try/catch/finally + submitting 플래그
2. **`|| undefined` (vs `?? null`)** — 빈 문자열을 undefined 로. PR #5 의 db.ts `?? null` 와 짝
3. **Modal wrapper 사용** — 단일 책임 분리 (외곽 vs 콘텐츠)

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `CategoryCard.tsx` | 10 | div onClick 의 a11y 한계 |
| `Modal.tsx` | 5 | children: ReactNode (wrapper) |
| `Modal.tsx` | 12 | document keydown + cleanup |
| `Modal.tsx` | 27 | e.stopPropagation 버블링 차단 |
| `Toast.tsx` | 9 | 디폴트 prop 값 |
| `Toast.tsx` | 11 | setTimeout + cleanup |
| `GoogleAdSense.tsx` | 3 | declare global Window 확장 |
| `GoogleAdSense.tsx` | 18 | AdSense init 표준 호출 |
| `GoogleAdSense.tsx` | 32 | 조건부 spread |
| `FeedbackModal.tsx` | 36 | 비동기 제출 try/catch/finally |
| `FeedbackModal.tsx` | 49 | `|| undefined` vs `?? null` |
| `FeedbackModal.tsx` | 60 | Modal wrapper 사용 |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- CategoryCard 를 `<button>` 으로 마이그레이션 → 별도 PR
- portal 도입 → 별도 PR
- Toast queue (여러 개 동시 표시) → 별도 PR

## 다음 PR
**PR #14 `docs/learn-feature-components`** — `MockExamGrid`, `WrongNoteGrid`. 그리드 빈 상태, 카드 클릭 → 라우팅·스토어 액션.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
