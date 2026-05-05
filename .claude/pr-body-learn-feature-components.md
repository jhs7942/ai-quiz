## 요약
기능별 그리드 컴포넌트 2개에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#14 / 14 (마지막)**.

## 시리즈 종료
이 PR 로 36개 실사용 파일 전체 학습 주석 시리즈가 완료됩니다.
- ✅ #1 머지 완료 (quizStore, QuizPage)
- 🔄 #2~#13 PR 열림
- 🔄 **#14 (이 PR)** — MockExamGrid, WrongNoteGrid

## 사전 지식
- 3가지 상태 분기 패턴 (loading / empty / data)
- `Promise.all` 병렬 fetch
- `Set` 의 O(1) 조회 vs `Array.includes` 의 O(n)
- Tailwind 의 `group` + `group-hover` 패턴

## 학습 포인트

### `MockExamGrid.tsx`
1. **3가지 상태 분기 (early return)** — loading, empty, data 각각 다른 UI. 한 ternary 묶음보다 가독성 ↑
2. **반응형 그리드** — `grid-cols-2 sm:grid-cols-3 xl:grid-cols-4` mobile-first 누적 적용
3. **`group` + `group-hover`** — 부모 hover 시 자식 스타일 변경. CSS `:has()` 의 Tailwind 버전

### `WrongNoteGrid.tsx`
1. **`Promise.all` + 구조 분해** — 두 fetch 병렬. PR #4 의 직렬 for-of 와 대조
2. **`Promise.all` vs `allSettled`** — all 은 하나라도 실패 시 reject, allSettled 는 전부 끝까지 기다림
3. **다중 deps useEffect** — 4개의 deps 모두 나열. 어느 하나만 바뀌어도 재계산
4. **derived state vs effect+state** — useMemo 로 대안 가능. 두 방식 모두 정당
5. **`new Set(...)` 의 O(1) 조회 최적화** — `.includes` 는 O(n), `.has` 는 O(1). N×M → N+M 으로 줄임

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `MockExamGrid.tsx` | 9 | 3가지 상태 early return |
| `MockExamGrid.tsx` | 35 | 반응형 그리드 mobile-first |
| `MockExamGrid.tsx` | 44 | group + group-hover |
| `WrongNoteGrid.tsx` | 27 | Promise.all 병렬 fetch |
| `WrongNoteGrid.tsx` | 37 | 다중 deps useEffect |
| `WrongNoteGrid.tsx` | 56 | new Set O(1) 조회 |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- WrongNoteGrid 의 effect 를 useMemo 로 리팩토링 → 별도 PR
- 카드 클릭 진입 애니메이션 → 별도 PR

## 시리즈 다음 단계 제안
1. **PR #2~#14 모두 머지** — main 에 학습 주석 일괄 반영
2. **시리즈 후속 학습** — 다음 학습 흐름은 다음 중 선택:
   - 라이브러리 심화: Zustand selector 최적화, recharts 다른 차트, react-router 의 loader/action
   - 실험 PR: 본 시리즈의 Anti-scope 항목 중 하나 (셔플 알고리즘 교체, group/CategoryCard 의 button 마이그레이션 등)
   - 새 기능 추가: 타이머 모드, 다크모드 토글 차트 반영, Toast queue 등

🤖 Generated with [Claude Code](https://claude.com/claude-code)
