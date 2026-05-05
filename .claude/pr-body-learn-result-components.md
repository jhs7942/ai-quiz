## 요약
결과 UI 컴포넌트 2개에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#12 / 13**.

## 사전 지식
- recharts 같은 React 차트 라이브러리의 선언형 사용
- `position: absolute; inset: 0` 으로 정확히 겹치게 배치
- early return 의 분기 단순화 효과
- `??` (nullish coalescing) vs `||` (falsy)

## 학습 포인트

### `ResultChart.tsx`
1. **recharts 라이브러리** — D3 기반 React 친화 차트. 선언형으로 SVG 직접 작성 회피
2. **useState lazy + 1회 측정** — 마운트 시점 다크모드를 읽어 색상 결정. 토글 동안 차트 색은 안 바뀜 (정책 선택)
3. **세터 없는 useState (`[isDark]`)** — 읽기 전용 상태로 사용. useState 의 일반적이지 않은 활용
4. **`absolute inset-0` + 도넛 가운데 텍스트** — 차트 위에 텍스트 오버레이. 라이브러리에 텍스트 옵션 없을 때 흔한 우회

### `ReviewCard.tsx`
1. **early return 으로 분기 단순화** — isSkipped 별도 마크업, 본문은 정답/오답 두 케이스만. ternary nesting 회피
2. **`userAnswer ?? '(미답변)'`** — null/undefined 만 기본값으로. 빈 문자열은 통과 → "사용자가 입력한 빈 답" 도 그대로 표시

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `ResultChart.tsx` | 3 | recharts 라이브러리 선택 |
| `ResultChart.tsx` | 12 | useState lazy + 1회 측정 |
| `ResultChart.tsx` | 14 | 세터 없는 useState |
| `ResultChart.tsx` | 41 | absolute inset-0 오버레이 |
| `ReviewCard.tsx` | 12 | early return 분기 단순화 |
| `ReviewCard.tsx` | 38 | `??` 의 정확한 의미 |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- 다크모드 토글 시 차트 색상 즉시 반영 → 별도 PR (useDarkMode 훅 사용)
- recharts 대체 (자작 SVG) → 별도 PR

## 다음 PR
**PR #13 `docs/learn-common-components`** — `CategoryCard`, `FeedbackModal`, `GoogleAdSense`, `Modal`, `Toast`. Modal 패턴, AdSense ref init, Toast 자동 dismiss.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
