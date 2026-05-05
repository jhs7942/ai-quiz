## 요약
커스텀 훅 3개에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#7 / 13**.

## 사전 지식
- 커스텀 훅이 단순 함수와 다른 점 — 내부에서 `useState/useEffect` 호출 가능
- `useState` lazy initializer (`useState(() => ...)`)
- `useRef` vs `useState` — ref 변경은 리렌더 안 함
- `useEffect` cleanup 함수의 호출 시점

## 학습 포인트

### `useDarkMode.ts`
1. **커스텀 훅의 정의** — "use" 로 시작, 내부에서 hook 호출 가능
2. **lazy initializer `useState(() => ...)`** — 첫 렌더 시에만 실행. localStorage 읽기 같은 무거운 초기화에 적합
3. **사용자 명시 > 시스템 기본** — stored 가 있으면 그걸, 없으면 `prefers-color-scheme`
4. **DOM 직접 조작** — `document.documentElement.classList.add('dark')`. Tailwind dark:* 가 이걸 감지
5. **cleanup 불필요한 effect** — 누적 자원이 없는 단순 동기화는 cleanup 안 써도 됨
6. **함수형 setIsDark** — `(prev) => !prev` 로 race-safe 토글

### `useMeta.ts`
1. **SPA SEO 문제** — 정적 HTML 의 `<title>` 은 모든 라우트에 동일. 라우트별 갱신 필요
2. **옵셔널 체이닝(`?.`)** — meta 태그가 없을 때 안전
3. **cleanup 함수 활용** — 페이지 떠날 때 기본 메타로 복원
4. **deps 배열** — title/description 둘 중 하나라도 바뀌면 cleanup → 다시 실행

### `useSession.ts`
1. **useRef 로 "한 번만 실행" 가드** — ref 변경은 리렌더 안 유발. flag 용도에 적합
2. **StrictMode + 이중 실행 대응** — dev 모드 effect 2번 호출 보호
3. **async useEffect 안 되는 이유** — useEffect 콜백은 cleanup 함수를 반환해야 하는데 async 는 Promise 자동 반환
4. **`.then()` vs IIFE async** — 둘 다 가능. 단순 한 번이면 .then 이 짧음
5. **userId null state** — 비동기 채움. 호출처에서 null 분기 필요

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `useDarkMode.ts` | 8 | lazy initializer |
| `useDarkMode.ts` | 14 | window.matchMedia OS 다크모드 감지 |
| `useDarkMode.ts` | 36 | 함수형 setIsDark race-safe |
| `useMeta.ts` | 22 | cleanup 으로 기본 메타 복원 |
| `useSession.ts` | 13 | useRef 로 mount-once 플래그 |
| `useSession.ts` | 27 | async/.then 우회 (cleanup 반환과 충돌 회피) |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- react-helmet 도입 → 별도 PR
- 다크모드 전환 애니메이션 → 별도 PR
- userId 가 null 일 동안 로딩 UI → 별도 PR

## 다음 PR
**PR #8 `docs/learn-pages-main-result`** — `MainPage`, `ResultPage`. 카테고리 선택 UX, 도넛 차트(SVG), 탭 필터.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
