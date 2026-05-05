## 요약
원본 JSON → 풀 문제 배열까지의 **데이터 파이프라인** 4개 파일에 학습용 주석을 추가합니다. 코드 변경 없음.

학습 시리즈 **#4 / 13**.

## 시리즈 진행 상황
- ✅ #1 머지 완료
- 🔄 #2 PR — main, App
- 🔄 #3 PR — types/index.ts
- 🔄 **#4 (이 PR)** — lib/quiz.ts, mockExam.ts, session.ts, supabase.ts
- ⏳ #5~#14

## 사전 지식
- `fetch` API — 4xx/5xx 도 reject 되지 않는다 (`res.ok` 검사 필수)
- `async/await` 와 `Promise<T>` 반환 타입
- spread (`...`) 로 새 배열·객체 만들기 (불변성)
- `import.meta.env` (Vite 환경변수)

## 학습 포인트

### `src/lib/supabase.ts` (6줄)
1. **`import.meta.env` (Vite)** — Webpack 의 `process.env` 대체. `VITE_` prefix 만 클라이언트에 노출 (보안)
2. **빌드 타임 상수** — 환경변수는 빌드 시 치환되므로 런타임에 동적으로 바꿀 수 없다
3. **싱글톤 모듈** — 클라이언트는 모듈 최상단에서 1회만 생성. 모든 import 한 곳이 같은 인스턴스 공유
4. **`as string` 단언** — 없으면 런타임에 폭발. db.ts 의 try/catch silent-fail 과 짝

### `src/lib/session.ts` (11줄)
1. **익명 사용자 식별** — 로그인 없이 "이 브라우저" 단위로 이벤트를 묶기 위한 패턴
2. **idempotent 초기화** — "있으면 그대로, 없으면 만든다". let + if 분기
3. **`crypto.randomUUID()`** — 외부 라이브러리(uuid) 불필요. 보안 컨텍스트(HTTPS/localhost) 한정

### `src/lib/mockExam.ts` (16줄)
1. **`import type`** — 타입만 import. 런타임 코드 0바이트
2. **`Promise<T>` 반환** — async 함수는 항상 Promise 로 감싸진다
3. **`/quizzes/...` 절대 경로** — `public/` 디렉토리 기준. Vite 가 빌드 시 dist/로 복사
4. **`fetch.ok` 검사** — 4xx/5xx 도 정상 응답으로 본다 (네트워크 실패만 reject)
5. **map + spread 로 quizId 태깅** — 원본 불변, 런타임 필드 추가 (types.ts 의 `quizId?:` 와 짝)

### `src/lib/quiz.ts` (60줄, 핵심)
1. **데이터 파이프라인 단계** — fetch → 태깅 → 병합 → 필터 → 샘플링 → 셔플
2. **for-of + await (직렬)** — Promise.all 로 병렬화 가능하지만, 카테고리 5~6개 + 캐시로 충분
3. **`push(...questions)`** — concat 대신 push + spread, 새 배열 미생성 메모리 효율
4. **sentinel `'all'`** — 매직 문자열을 타입에 박아 컴파일러가 오타 검출
5. **`sort(() => Math.random() - 0.5)`** — 비공식 셔플. 균등 분포는 아니지만 학습용 앱엔 충분 (Fisher-Yates 가 정석)
6. **반올림 누적 오차 방지** — `mcCount` 만 반올림 + `saCount = count - mcCount` 로 합이 항상 count
7. **discriminated union** — `q.type === 'multiple_choice'` 한 줄로 narrowing
8. **제네릭 화살표 함수 `<T>`** — `pickFrom<T>` 가 호출 측 타입을 그대로 보존 (any 회피)
9. **`Math.min(n, source.length)`** — 배열 초과 슬라이스 안전 클램프

## 리뷰 시 봐야 할 라인
| 파일 | 라인 | 학습 포인트 |
|---|---|---|
| `lib/quiz.ts` | 30 | for-of + await 직렬 처리, 병렬화 가능성 |
| `lib/quiz.ts` | 41 | sort + Math.random 셔플의 비균등성 |
| `lib/quiz.ts` | 56 | 반올림 누적 오차 방지 패턴 |
| `lib/quiz.ts` | 62 | 제네릭 헬퍼 함수 `<T>` |
| `lib/mockExam.ts` | 5, 18 | `import type`, map+spread 태깅 |
| `lib/session.ts` | 9 | idempotent 초기화 |
| `lib/supabase.ts` | 6 | 싱글톤 모듈 패턴 |

## 검증
- ✅ `npm run build` 통과
- 동작 변경 없음

## Anti-scope
- 셔플 알고리즘을 Fisher-Yates 로 교체 → 별도 PR
- 병렬 fetch (Promise.all) 로 변경 → 별도 PR (성능 측정 필요)
- 환경변수 누락 시 더 친절한 에러 → 별도 PR

## 다음 PR
**PR #5 `docs/learn-db-layer`** — `src/lib/db.ts` (174줄). Supabase upsert/select, silent-fail 패턴.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
