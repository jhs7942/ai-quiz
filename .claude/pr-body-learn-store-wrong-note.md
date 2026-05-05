## 요약
오답노트 스토어 `src/store/wrongNoteStore.ts` 에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#6 / 13**.

## 사전 지식 (이 PR에서 핵심)
- Zustand `create<T>()(persist(...))` curry 패턴 (PR #1 의 quizStore 와 동일)
- 함수형 업데이트 `set((state) => ...)` 의 race-safety
- `localStorage` vs `sessionStorage` — 데이터 수명 정책

## 학습 포인트
1. **다중 스토어 분리** — 한 앱에 여러 스토어 OK. 도메인이 다르면 분리(quiz vs wrongNote)
2. **인터페이스 비공개** — 외부에서 store 타입을 안 쓰면 파일 내부 `interface` 로 충분 (export 불필요)
3. **중복 방지 패턴** — set 전에 `get().wrongNotes.some(...)` 로 동일 항목 존재 검사 → 있으면 early return
4. **불변성 유지** — `[...state.wrongNotes, newItem]`, `filter(...)` — 원본 mutation X. Zustand 가 변경 감지하는 핵심
5. **함수형 vs 객체형 set** — `set((state) => ...)` 는 이전 상태 참조, `set({...})` 는 통째로 교체. 둘 다 정당함
6. **storage key 충돌** — 'ai-quiz-store' (quiz) ≠ 'ai-quiz-wrong-notes' (wrongNote). 같으면 덮어써짐
7. **localStorage 선택 이유** — 오답노트는 "장기 학습 데이터"라 탭 닫혀도 유지되어야 함. quizStore 는 sessionStorage (현재 풀이 세션 한정)

## 리뷰 시 봐야 할 라인
| 라인 | 학습 포인트 |
|---|---|
| 12 | curry 패턴 `create<T>()(persist(...))` |
| 22 | `get().wrongNotes.some(...)` 중복 방지 |
| 25 | early return 으로 불필요 set 회피 |
| 28 | 함수형 set + 스프레드로 불변 배열 |
| 35 | filter 로 불변 제거 |
| 38 | 단순 객체 set (통째로 교체) |
| 42 | storage key 가 quizStore 와 다름 |
| 45 | localStorage (vs quizStore 의 sessionStorage) |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- 오답노트 동기화(서버 저장) → 별도 PR
- localStorage 용량 초과 시 fallback → 별도 PR

## 다음 PR
**PR #7 `docs/learn-hooks`** — `useDarkMode`, `useMeta`, `useSession`. 커스텀 훅과 useEffect 패턴.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
