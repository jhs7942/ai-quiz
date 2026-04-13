# AI Quiz 프로젝트 — 블로그 소재 종합 정리

> **프로젝트 배경**: 시험 이틀 전, 4시간 만에 Claude Code(Pro 요금제)로 만든 AI 학습 퀴즈 웹앱.
> 토큰 절약을 위해 UI 디자인/평가 에이전트 미사용, JSON 데이터를 화면에 뿌리는 단순 구조로 Vite 채택.
> CSS/UI도 Claude Code가 직접 생성 — 사람이 직접 코드를 작성한 부분은 없음.

---

## 📌 소재 1: 프로젝트 회고 (포트폴리오 + 블로그 메인)

### 제목 안
- "시험 이틀 전, 4시간 만에 AI로 퀴즈 앱 만들기"
- "Claude Code로 실사용 웹앱을 4시간 만에 배포한 경험"

### 핵심 스토리라인

**제약 조건**
- 시간: 4시간 (시험 2일 전)
- 비용: Claude Code Pro 요금제 → 토큰 절약 필수
- 목적: 본인의 AI 과목 시험 대비용 학습 도구
- 코드 작성: 전부 Claude Code가 생성 (사람은 요구사항 지시만)

**의사결정 과정**

| 결정 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Vite + React (Next.js 아님) | JSON만 뿌려주면 됨, SSR 불필요, 빌드 빠름 |
| 퀴즈 생성 | API 동적 생성 → JSON 사전 제작 | API 비용 0원 + 오프라인 가능 + 4시간 안에 완성 가능 |
| UI 구현 | 디자인/평가 에이전트 미사용 | 토큰 절약 — 디자인 에이전트가 토큰을 많이 소모하므로 Claude Code가 직접 CSS 생성 |
| 상태관리 | Zustand | Redux 대비 보일러플레이트 최소, 빠른 구현 |
| DB | Supabase (분석용만) | 퀴즈 자체는 JSON, 사용자 통계만 DB 저장 |

**토큰 절약 전략의 구체적 내용**
- Claude Code에는 UI 프로토타입을 만들고 → 멀티 페르소나로 평가하는 에이전트가 있음
- 이 에이전트들은 고품질 UI를 만들지만 **토큰 소모가 큼**
- Pro 요금제의 토큰 한도 내에서 4시간 만에 완성하려면 이 과정을 생략하고,
  Claude Code가 Tailwind CSS로 직접 UI를 한 번에 생성하는 방식 채택
- 결과적으로 "디자인 완성도 < 기능 완성도" 트레이드오프를 의식적으로 선택

**v1 → v2 진화 과정**
```
v1 (4시간): Next.js + LLM API 키 입력 → 실시간 퀴즈 생성
  ↓ (비용 문제 + 안정성)
v2 (현재): Vite + JSON 사전제작 퀴즈 → 정적 배포
```

plan.md를 보면 v1은 "사용자가 API 키를 입력하면 LLM이 퀴즈 생성"하는 구조였으나,
비용·속도·안정성 문제로 v2에서 JSON 기반으로 전환.

**성과 지표**
- quiz_answers: 73,848건 (실제 풀이 기록)
- quiz_sessions: 4,795건
- access_logs: 21,428건
- feedbacks: 134건 (사용자 오류 신고)
- 퀴즈 문제: 1,160개 (12카테고리 + 모의고사)

**교훈**
- "4시간이라는 제약이 오히려 좋은 기술 선택을 강제했다"
- 화려한 스택보다 제약 안에서 실사용 가능한 제품을 만드는 능력이 실무에 가깝다
- AI 도구 활용에서도 "어디에 토큰을 쓸 것인가"라는 자원 배분 판단이 중요
- 디자인 에이전트를 생략해도 Tailwind CSS로 충분히 사용 가능한 UI가 나옴

---

## 📌 소재 2: 기술 스택 선택과 트레이드오프

### 제목 안
- "경량 React 스택으로 학습 플랫폼 구축하기 — Vite + Zustand + Supabase"
- "Next.js를 버리고 Vite를 선택한 이유"

### 핵심 내용

**Vite를 선택한 이유**
- JSON 데이터를 화면에 뿌려주기만 하면 됨 → SSR 불필요
- Next.js 대비 빌드 속도 압도적으로 빠름
- 정적 배포(Vercel)에 최적화
- 토큰 절약 — 간단한 설정으로 빠르게 시작

**Zustand vs Redux**
```ts
// Zustand — 이게 전체 스토어 설정의 시작
export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      selectedCategories: [],
      questionCount: 10,
      // ...
    }),
    { name: 'quiz-store', storage: createJSONStorage(() => sessionStorage) }
  )
)
```
- 보일러플레이트 최소화 — action, reducer, middleware 설정 없이 바로 사용
- `persist` 미들웨어로 sessionStorage 연동 한 줄
- 퀴즈 중단 후 복구가 자연스럽게 가능

**Supabase — "분석 전용" 아키텍처**
- 퀴즈 데이터: `public/quizzes/*.json` (정적 파일, DB 불필요)
- Supabase는 오직 분석/로깅용: 사용자 통계, 풀이 기록, 피드백
- 모든 DB 호출은 silent fail — DB 장애 시에도 퀴즈는 정상 동작
- anon key 기반이라 로그인 불필요

---

## 📌 소재 3: Supabase RLS 정책 함정 (에러 사례)

### 제목 안
- "Supabase INSERT는 되는데 데이터가 없다? — RLS 정책의 숨겨진 함정"
- "PostgREST의 return=representation과 RLS의 관계"

### 에러 상황
```
POST quiz_sessions?select=id => 401 Unauthorized
```
- `users`, `access_logs`는 정상 저장되는데 `quiz_sessions`만 실패
- INSERT 정책은 있었지만 SELECT 정책이 없었음

### 원인 분석
```
Supabase JS SDK: .insert({...}).select('id').single()
  → PostgREST 내부: INSERT + SELECT (return=representation)
  → INSERT OK → SELECT 시 RLS 차단 → 401
  → 전체 트랜잭션 롤백 → 행 생성 안 됨
```

핵심: **INSERT RLS만 설정하면 `.select()` 체인이 실패**한다.
PostgREST는 `prefer: return=representation` 헤더로 INSERT 결과를 SELECT하는데,
SELECT 권한이 없으면 401이 반환되고 INSERT까지 롤백된다.

### 해결
```sql
-- anon key 기반 프로젝트에서는 RLS 자체가 불필요
ALTER TABLE quiz_sessions DISABLE ROW LEVEL SECURITY;
```

### 교훈
- Supabase 테이블 생성 시 **RLS가 기본 활성화**됨 → 신규 테이블 주의
- INSERT만 넣고 끝내면 안 됨 → `.select()` 체인 쓸 거면 SELECT 정책도 필수
- anon key만 쓰는 프로젝트에서는 RLS 비활성화가 더 안전할 수 있음

---

## 📌 소재 4: Vercel vs 로컬 환경 차이 (에러 사례)

### 제목 안
- "로컬에서 되는데 Vercel에서 안 된다 — peer dependency와 CI 환경의 차이"
- "vite-plugin-pwa + Vite 8 호환 문제와 .npmrc의 중요성"

### 에러 상황
```
# Vercel CI 로그
npm error ERESOLVE could not resolve
npm error peer vite@"^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"
npm error from vite-plugin-pwa@1.2.0
npm error Found: vite@8.0.2
```
- 로컬: `npm install --legacy-peer-deps` → 성공
- Vercel: `npm ci` (기본값) → 실패

### 원인
| 환경 | 설치 방식 | peer dep 처리 | 결과 |
|------|----------|--------------|------|
| 로컬 | `npm install --legacy-peer-deps` | 충돌 무시 | 성공 |
| Vercel CI | `npm ci` | 충돌 시 에러 | 실패 |

**로컬에서 쓴 플래그가 CI로 전파되지 않는 것**이 핵심 문제.

### 해결
```ini
# ai-quiz/.npmrc
legacy-peer-deps=true
```

### 더 큰 교훈: 여러 기능 동시 배포의 위험
이 에러는 PWA + 배치 저장 + RLS 수정을 한꺼번에 배포하면서 발생.
어떤 게 원인인지 분리가 안 되어 결국 `git reset --hard`로 4개 커밋 롤백 후 하나씩 재배포.

> "기능별 분리 커밋 + 배포"의 중요성을 체감한 사례

---

## 📌 소재 5: 한글 주관식 유연 채점 로직 (코드 패턴)

### 제목 안
- "한글 주관식 채점의 어려움 — '과적합'도 'Overfitting'도 정답으로 인정하기"
- "정규식으로 구현한 한영 혼합 답안 채점 시스템"

### 문제 정의
AI 퀴즈에서 정답이 `"과적합(Overfitting)"`일 때:
- `"과적합"` → 정답
- `"Overfitting"` → 정답
- `"overfitting"` → 정답 (대소문자 무시)
- `"과 적 합"` → 정답 (공백 무시)

### 구현 (실제 코드)
```ts
export function gradeAnswer(question: Question, userAnswer: string): boolean {
  if (question.type === 'multiple_choice') {
    return userAnswer === question.answer
  }

  // 공백 제거 + 소문자 변환
  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase()

  // "과적합(Overfitting)" → ["과적합(overfitting)", "과적합", "overfitting"]
  const expandAnswer = (s: string): string[] => {
    const variants = [normalize(s)]
    const match = s.match(/^(.+?)\((.+?)\)$/)  // 괄호 패턴 감지
    if (match) {
      variants.push(normalize(match[1]))  // 한글 부분
      variants.push(normalize(match[2]))  // 영문 부분
    }
    return variants
  }

  const normalized = normalize(userAnswer)
  const ans = question.answer
  const candidates = Array.isArray(ans)
    ? ans.flatMap(expandAnswer)   // 복수 정답 지원
    : expandAnswer(ans)
  return candidates.includes(normalized)
}
```

### 설계 포인트
1. **정규화**: 공백·대소문자 차이를 무시
2. **괄호 확장**: `"한글(English)"` 패턴에서 한글/영문 각각 독립 정답으로 인정
3. **복수 정답**: answer가 배열이면 모든 요소를 확장
4. **확장성**: 새로운 정답 패턴 추가 시 `expandAnswer`만 수정

### 한계 & 향후 개선 (파인튜닝 연계)
- 현재: 정확 일치만 지원 (유사어 불가)
- 오답 데이터 73,848건 중 유의미한 오답 ~8,000건 확보
- Llama 파인튜닝으로 "의미적 유사성" 기반 채점 계획

---

## 📌 소재 6: AI 코드 생성의 함정 — 배치 저장 이슈 (AI 리뷰)

### 제목 안
- "Claude가 생성한 코드의 숨겨진 버그 — 배치 저장 경계 추적 문제"
- "AI 코드 리뷰에서 발견한 3가지 동시성 이슈"

### 배경
이 프로젝트의 모든 코드는 Claude Code가 생성했다.
코드 리뷰 에이전트가 발견한 이슈들은 **AI가 만들고 AI가 잡은** 사례.

### 이슈 1: clearAnswer로 인한 중복 INSERT
```
1. 문제 1~5 채점 → checkedIds = [1,2,3,4,5], 배치 저장, lastSavedCount = 5
2. 문제 3 clearAnswer → checkedIds = [1,2,4,5], lastSavedCount = 5 (그대로)
3. 문제 3 재채점 → checkedIds = [1,2,4,5,3]
4. 문제 6~10 채점 → slice(5, 10) = [3,6,7,8,9] → 문제 3 중복 저장!
```
- **근본 원인**: `checkedIds`가 append-only일 때만 유효한 인덱스 기반 추적
- `clearAnswer`가 중간 요소를 제거하면 인덱스가 어긋남

### 이슈 2: fire-and-forget의 카운트 갱신
```ts
// 문제 코드: 저장 실패해도 카운트 증가
saveBatchAnswers(quizSessionId, batchAnswers)  // await 없음
setLastSavedCount(lastSavedCount + BATCH_SIZE) // 바로 실행
```
- 네트워크 오류로 saveBatchAnswers 실패 시 → 해당 배치 영구 유실

### 이슈 3: 점수 vs 답안 저장 순서 미보장
```ts
// ResultPage: 둘 다 fire-and-forget
saveBatchAnswers(quizSessionId, unsavedAnswers)     // 답안
updateSessionResult(quizSessionId, correct, percent) // 점수
// → 점수가 먼저 저장되면 답안 없는 상태에서 점수만 존재
```

### 해결: 배치 저장 → 문제별 즉시 저장으로 전환
```ts
// 변경 후: Set으로 중복 방지 + 문제별 즉시 INSERT
const savedIds = useRef<Set<number>>(new Set())

const saveCurrentAnswer = (questionId, question, userAnswer) => {
  if (savedIds.current.has(questionId)) return  // 중복 방지
  savedIds.current.add(questionId)
  saveQuizAnswer(quizSessionId, { questionId, ... })
}
```

### 교훈
- AI가 생성한 코드에서 **동시성·상태 경계 추적** 이슈는 자주 발생
- "동작하는 코드"와 "올바른 코드"의 차이를 리뷰로 잡아야 함
- **AI가 만들고 AI가 잡는** 워크플로우 — 구현 에이전트와 리뷰 에이전트 분리의 가치

---

## 📌 소재 7: SPA에서 Google AdSense 승인받기

### 제목 안
- "React SPA에서 AdSense 승인이 안 되는 이유와 해결법"
- "CSR + Prerender 하이브리드로 AdSense 반려 극복하기"

### 반려 사유
> "게시자 콘텐츠가 없는 화면에 Google 게재 광고"

SPA(CSR)는 크롤러가 방문하면 빈 `<div id="root"></div>`만 보임.
Google 크롤러가 JS를 실행하지 않으면 콘텐츠 없는 페이지로 판단.

### 해결 전략
```
정적 페이지 (/, /about, /contact, /privacy, /report)
  → 빌드 시 HTML 미리 생성 (prerender)
  → 크롤러가 콘텐츠 확인 가능
  → AdSense 광고 삽입

동적 페이지 (/quiz, /result)
  → React CSR 유지
  → 상태 의존 페이지이므로 prerender 불가
  → AdSense 광고 제외
```

### 추가 대응
- Footer에 About/Contact/Privacy 링크 추가 (사이트 신뢰도)
- Report 페이지에 서비스 성과 데이터 표시 (콘텐츠 보강)
- robots.txt, sitemap.xml 정적 서빙 설정

---

## 📌 소재 8: 반응형 Tailwind 그리드 계산 실수 (에러 사례)

### 제목 안
- "Tailwind CSS 고정 너비 그리드에서 버튼이 겹치는 이유"

### 에러 상황
데스크톱 문제 네비게이터에서 번호 버튼들이 서로 겹침.

### 원인 (수치 계산)
```
컨테이너: w-44 = 176px
패딩: p-4 × 2 = 32px
가용 너비: 176 - 32 = 144px

필요 너비:
  버튼 5개: w-8(32px) × 5 = 160px
  gap 4개: gap-1.5(6px) × 4 = 24px
  합계: 184px > 144px ← 넘침!
```

### 해결
```diff
- <div className="hidden lg:block w-44 shrink-0">
+ <div className="hidden lg:block w-56 shrink-0">
```

### 교훈
고정 크기 그리드 배치 시 사전 계산 공식:
```
최소 컨테이너 = (버튼크기 × 열수) + (gap × (열수-1)) + (패딩 × 2)
```

---

## 📌 소재 9: Llama 파인튜닝 로드맵 (향후 계획)

### 제목 안
- "학습 앱 데이터로 LLM 파인튜닝하기 — 7만 건의 풀이 기록 활용법"

### 보유 데이터
| 데이터 | 규모 | 활용 |
|--------|------|------|
| 퀴즈 문제 JSON | 1,160문제 | instruction 데이터셋 기반 |
| quiz_answers | 73,848건 | 난이도 캘리브레이션, 오답 패턴 |
| feedbacks | 134건 | 문제 품질 개선 시그널 |

### 파인튜닝 태스크
1. **문제 자동 생성**: 카테고리+난이도 → 새 문제 생성
2. **유연한 채점**: "오버피팅" ≈ "과적합" 의미 기반 판정
3. **해설 자동 생성**: 문제+정답 → 학습 도움 해설

---

## 📌 소재 10: 모바일 한글 버튼 줄바꿈 (에러 사례)

### 제목 안
- "모바일 375px에서 한글 버튼이 깨지는 이유"

### 에러
```
375px 모바일에서:
"건너뛰기" → "건너뛰\n기"
"정답 확인" → "정답 확\n인"
```

### 해결
```css
white-space: nowrap; /* Tailwind: whitespace-nowrap */
```

### 교훈
한글 버튼은 영문보다 글자당 폭이 넓어 모바일에서 줄바꿈 확률이 높음.
2글자 이상 한글 버튼에는 `whitespace-nowrap` 기본 적용 권장.

---

## 🏷️ 블로그 시리즈 추천 순서

| 순서 | 소재 | 유형 | 우선도 |
|------|------|------|--------|
| 1 | 소재 1: 프로젝트 회고 | 포트폴리오 메인 | ⭐⭐⭐ |
| 2 | 소재 6: AI 코드의 함정 | ai-review | ⭐⭐⭐ |
| 3 | 소재 3: Supabase RLS | error | ⭐⭐⭐ |
| 4 | 소재 5: 한글 채점 로직 | study | ⭐⭐ |
| 5 | 소재 4: Vercel 환경 차이 | error | ⭐⭐ |
| 6 | 소재 7: SPA AdSense | study | ⭐⭐ |
| 7 | 소재 2: 기술 스택 선택 | adr | ⭐ |
| 8 | 소재 9: 파인튜닝 로드맵 | study | ⭐ |
| 9 | 소재 8: 그리드 너비 계산 | error | ⭐ |
| 10 | 소재 10: 모바일 UX | error | ⭐ |
