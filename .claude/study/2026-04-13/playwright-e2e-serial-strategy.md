# Playwright E2E 직렬 실행 전략 — fullyParallel: false를 고른 이유

## 학습 환경
- 날짜: 2026-04-13 / 관련 프로젝트: AI_quiz (ai-quiz) / 기술·버전: Playwright 1.58, React 19, Vite 8, Zustand 5 (sessionStorage persist), Supabase

---

## 배경

세션 기반 상태(`sessionStorage`, Zustand persist)와 Supabase 로그 테이블(`access_logs`, `quiz_sessions`, `quiz_answers`)을 동시에 다루는 SPA에서 E2E 테스트를 어떻게 격리할 것인가를 고민했다.

Playwright의 기본 권장값(`fullyParallel: true`, 멀티 워커)을 그대로 쓰지 않고 단일 워커 직렬 실행을 선택했는데, 이 결정의 근거를 정리해둔다.

---

## 핵심 개념

### playwright.config.ts 주요 옵션

| 옵션 | 값 | 함의 |
|---|---|---|
| `fullyParallel` | `false` | 파일·테스트 직렬 실행 |
| `workers` | `1` | 단일 워커 프로세스 |
| `retries` | `0` | 플레이키 은폐 금지 |
| `reporter` | `html` + `list` | 로컬 분석용 HTML + 콘솔 리스트 |
| `trace` | `on-first-retry` | retries=0이므로 사실상 수집 안 됨 |
| `screenshot` | `only-on-failure` | artifact 비용 절감 |
| `viewport` | `1280×800` | 데스크톱 lg 브레이크포인트 이상만 |
| `projects` | `chromium` 단독 | 크로스브라우저 커버리지 없음 |

### 직렬 실행이 필요한 이유 (일반론)

1. **클라이언트 상태 오염** — 병렬 워커가 같은 도메인의 `sessionStorage`/`localStorage`를 공유하면 다른 테스트의 잔여 상태가 침입한다. Zustand `persist` 미들웨어는 sessionStorage를 그대로 사용하므로 영향이 직접적이다.
2. **백엔드 부수효과 오염** — `access_logs`, `quiz_sessions` 같은 append-only 로그 테이블에 테스트마다 행이 쌓이면 실패 원인 분석이 어려워진다. 테스트 간 시간 순서가 보장되지 않으면 로그 추적이 깨진다.
3. **개발 서버 제약** — `baseURL: http://localhost:5173` 단일 포트를 가정한다. `npm run dev` 선행 기동이 필수이고, 병렬 확장 시 포트 충돌·HMR 상호간섭 위험이 있다.

---

## 실제 적용

### 설정 파일 (playwright.config.ts:1-26)

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

### 스펙 파일 구성

| 파일 | 줄 수 | 역할 |
|---|---|---|
| `e2e/ai-quiz-flow.spec.ts` | 220 | 기본 퀴즈 풀이 플로우 |
| `e2e/full-e2e-scenarios.spec.ts` | 444 | 엣지 케이스·전체 시나리오 |

테스트 실행 전 개발 서버를 수동으로 띄워야 한다 (`npm run dev` 선행).

---

## 주의사항

### 설정 간 모순: trace on-first-retry + retries 0

`trace: 'on-first-retry'`는 재시도가 일어난 두 번째 실행부터 trace를 수집한다. 그런데 `retries: 0`이면 재시도 자체가 없으므로 **trace는 실질적으로 수집되지 않는다**. 실패 분석을 스크린샷에만 의존하게 된다는 뜻이다.

개선 방향:
- (A) `retries: 1` + `trace: 'retain-on-failure'` — 플레이키는 드러나되 분석 자료는 확보
- (B) `retries: 0` 유지 + `trace: 'retain-on-failure'` — 근본 원인 수정 강제 + 모든 실패에 trace

### retries: 0의 의도

재시도로 플레이키 테스트를 은폐하지 않겠다는 선언이다. 일시적 실패도 바로 빨간색으로 드러나므로 근본 원인 수정을 강제한다. CI에서 테스트 안정화를 미룰 수 없다는 장점이 있지만, 네트워크·타이밍 이슈로 인한 플레이키가 개발 속도를 잡을 수 있다.

### 단일 브라우저·단일 뷰포트의 한계

반응형 앱인데 Playwright는 데스크톱 1280×800만 커버한다. 이 프로젝트에서는 반응형 시각 검증을 `viewport-test` 에이전트로 분리해 책임을 나눴다. Playwright는 "기능 smoke 테스트"만, 반응형 검증은 별도 도구.

### workers: 1의 비용

CI 속도가 느려진다. 테스트 수가 늘어나면 전체 실행 시간이 선형 증가한다. 격리 문제를 해결할 수 있다면(`storageState` 프로파일 등) `workers: '50%'` 실험이 가능하다.

---

## 참고 자료

- [Playwright - Parallelism](https://playwright.dev/docs/test-parallel)
- [Playwright - Test retry](https://playwright.dev/docs/test-retries)
- [Playwright - Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Zustand - persist middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- 관련 프로젝트 파일: `playwright.config.ts`, `e2e/ai-quiz-flow.spec.ts`, `e2e/full-e2e-scenarios.spec.ts`
