# 트래픽 몰림 대처방안 공부 자료

> AI Quiz 프로젝트 기준으로 정리한 트래픽 대응 학습 자료 (2026-04-04)

---

## 현재 앱 구조

```
사용자 브라우저  →  서버  →  HTML/JS/퀴즈 JSON 파일  →  화면 표시
```

| 구성 | 특성 |
|------|------|
| 프론트엔드 | 정적 SPA (React + Vite) |
| 퀴즈 데이터 | `public/quizzes/` 정적 JSON 파일 |
| 백엔드 | Supabase (분석·피드백 로깅 전용, 비핵심) |

정적 SPA이므로 서버 과부하 위험이 낮고, 대응도 상대적으로 쉽습니다.

---

## 대안 1. CDN (Content Delivery Network)

### 개념

전 세계 곳곳에 앱 파일의 **복사본을 뿌려두는** 방식.
사용자는 가장 가까운 서버에서 파일을 받으므로 빠르고, 원본 서버 부담이 줄어든다.

```
[기존]
서울 사용자 ──┐
부산 사용자 ──┼──→ 서버 1대 (과부하)
뉴욕 사용자 ──┘

[CDN]
서울 사용자 → 서울 CDN ──┐
부산 사용자 → 부산 CDN   ├──→ 원본 서버 (여유)
뉴욕 사용자 → 뉴욕 CDN ──┘
```

### 주요 서비스 비교

| 서비스 | 무료 플랜 | 특징 |
|--------|-----------|------|
| **Cloudflare Pages** | 대역폭 무제한 | 정적 사이트에 가장 유리 |
| **Vercel** | 월 100GB | 배포 UX가 간단, Next.js 친화적 |
| **Netlify** | 월 100GB | 설정 유연, 폼 처리 기능 내장 |

### 참고 키워드
- `CDN이란`
- `Cloudflare Pages 배포 방법`
- `정적 사이트 호스팅`
- `Edge Network`

---

## 대안 2. 브라우저 캐싱 (Browser Caching)

### 개념

브라우저가 **한 번 받은 파일을 저장해두고** 다음 방문 시 재사용하는 것.

```
[첫 방문]
브라우저 → 서버 요청 → 파일 수신 → 브라우저 내부 저장

[재방문]
브라우저 → 저장된 파일 즉시 사용 (서버 요청 없음)
```

### 핵심 개념

- **Cache-Control 헤더**: 서버가 "이 파일은 N초 동안 저장해도 돼"라고 브라우저에 지시하는 방법
- **ETag**: 파일이 바뀌었는지 확인하는 지문(해시값). 바뀌지 않으면 새로 받지 않음
- **max-age**: 캐시 유효 기간 (예: `max-age=86400` = 1일)

### 참고 키워드
- `HTTP Cache-Control 헤더`
- `브라우저 캐싱 동작 원리`
- `ETag와 Last-Modified`
- `강력 캐시 vs 협상 캐시`

---

## 대안 3. Service Worker (오프라인 지원)

### 개념

앱을 처음 열 때 백그라운드에서 동작하는 "중간 관리자"를 설치한다.
이 관리자가 필요한 파일을 미리 저장해두고, 이후 요청을 가로채 저장된 파일로 응답한다.

```
[첫 방문]
앱 실행 → Service Worker 설치 → 퀴즈 JSON 전부 미리 저장

[재방문 / 오프라인]
앱 실행 → Service Worker가 저장 파일 제공 → 서버 요청 0건
```

### 트래픽 관점에서의 효과

재방문 사용자는 서버 요청을 전혀 보내지 않으므로,
동시 접속자가 많아도 **신규 방문자 요청만** 처리하면 된다.

### 관련 기술

- **PWA (Progressive Web App)**: Service Worker를 활용해 앱처럼 설치·동작하는 웹앱
- **Workbox**: Google이 만든 Service Worker 라이브러리 (구현 편의성 높음)
- **Cache Storage API**: Service Worker가 파일을 저장하는 브라우저 저장소

### 참고 키워드
- `Service Worker란`
- `PWA 만들기`
- `Workbox 사용법`
- `오프라인 웹앱`
- `Cache Storage API`

---

## 대안 4. Supabase 요청 배치 처리 (Batching)

### 개념

개별 요청을 즉시 보내지 않고 **모아서 한 번에** 전송한다.

```
[기존 - 즉시 전송]
사용자 10명 퀴즈 완료 → 10개 요청 동시에 Supabase 전송

[배치 처리]
사용자 10명 퀴즈 완료 → 잠깐 대기 → 1개 요청으로 묶어서 전송
```

### 구현 방법

- **디바운싱(Debouncing)**: 마지막 요청 후 N초 기다렸다가 전송
- **스로틀링(Throttling)**: N초에 최대 1번만 전송
- **큐(Queue)**: 요청을 줄 세워두고 일정 간격으로 처리

### 이 프로젝트에서의 상황

Supabase는 `logAccess`, `saveQuizSession`, `saveFeedback`에만 사용.
실패해도 퀴즈 기능에 영향 없음 (silent fail 처리됨).
→ 급하지 않지만, Supabase 무료 플랜 한도를 아끼는 데 유용.

### 참고 키워드
- `디바운싱 vs 스로틀링`
- `API 요청 배치 처리`
- `Supabase rate limit`
- `JavaScript debounce throttle`

---

## 대안 5. JSON 번들링

### 개념

자주 쓰는 퀴즈 파일을 **하나로 합쳐서** HTTP 요청 횟수를 줄인다.

```
[현재]
index.json     → 요청 1번
pretest2_1.json → 요청 2번
pretest2_2.json → 요청 3번
...

[번들링 후]
all-quizzes.json → 요청 1번 (모든 퀴즈 포함)
```

### 장단점

| 장점 | 단점 |
|------|------|
| 네트워크 요청 수 감소 | 첫 로딩 파일 크기 증가 |
| 빠른 퀴즈 전환 | 일부만 필요해도 전체 다운로드 |

### 참고 키워드
- `HTTP 요청 최적화`
- `JSON 번들링`
- `Code Splitting`
- `Lazy Loading`

---

## 전체 비교 요약

| 방법 | 난이도 | 트래픽 효과 | 사용자 체감 속도 | 우선순위 |
|------|--------|-------------|-----------------|---------|
| **CDN 배포** | 낮음 | 매우 높음 | 빠름 | ★★★★★ |
| **브라우저 캐싱** | 낮음 | 중간 | 재방문 시 매우 빠름 | ★★★★ |
| **Service Worker** | 중간 | 높음 | 오프라인도 가능 | ★★★ |
| **Supabase 배치** | 중간 | 낮음 | 변화 없음 | ★★ |
| **JSON 번들링** | 중간 | 낮음 | 퀴즈 전환 빠름 | ★★ |

---

## 추천 학습 순서

1. **CDN / 정적 호스팅** → Cloudflare Pages 직접 배포해보기
2. **HTTP 캐싱** → MDN 문서로 Cache-Control 헤더 이해
3. **Service Worker / PWA** → Google의 web.dev PWA 튜토리얼
4. **디바운싱 / 스로틀링** → JavaScript 구현 직접 해보기

---

## 참고 자료

- [Cloudflare Pages 공식 문서](https://developers.cloudflare.com/pages/)
- [MDN - HTTP 캐싱](https://developer.mozilla.org/ko/docs/Web/HTTP/Caching)
- [web.dev - PWA 학습](https://web.dev/learn/pwa/)
- [web.dev - Service Worker 소개](https://web.dev/service-workers-cache-storage/)
- [Supabase Rate Limits 문서](https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation-and-abuse-prevention)
