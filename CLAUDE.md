# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 구조

이 디렉토리가 앱 루트다. 모든 개발 명령은 이 디렉토리에서 실행한다.
퀴즈 원본 JSON은 `public/quizzes/quiz/`, `public/quizzes/모의고사/`에 보관한다 (빌드 로직은 `public/quizzes/index.json` 기준으로 동작하며 원본 폴더는 참고용).

## 개발 명령어

```bash
npm run dev       # Vite 개발 서버 실행 (http://localhost:5173)
npm run build     # TypeScript 컴파일 + Vite 프로덕션 빌드
npm run lint      # ESLint 검사
npm run preview   # 빌드된 앱 미리보기

npx playwright test          # E2E 테스트 전체 실행
npx playwright test --ui     # Playwright UI 모드
```

## 아키텍처 개요

**SPA** (React 19 + Vite + TypeScript). 서버 없이 정적 배포 가능하며, 분석/피드백 로깅에만 Supabase를 사용한다.

### 라우팅 (3개 페이지)
```
/         → MainPage   : 카테고리 선택 + 퀴즈 설정
/quiz     → QuizPage   : 문제 풀이 (1문제씩 표시)
/result   → ResultPage : 결과 확인 + 오답 재시험
```

### 퀴즈 데이터 흐름
1. **퀴즈 데이터**: `public/quizzes/index.json` (카테고리 목록) + `public/quizzes/{id}.json` (문제 배열)
2. **문제 타입**: `MultipleChoiceQuestion` (객관식) | `ShortAnswerQuestion` (주관식)
3. **빌드**: `src/lib/quiz.ts`의 `buildQuestions()` — 카테고리별 JSON fetch → 난이도 필터 → count 샘플링 → 셔플
4. **상태**: Zustand store (`src/store/quizStore.ts`) — sessionStorage에 persist

### 정답 확인 로직 (`quizStore.checkAnswer`)
- 객관식: `userAnswer === question.answer`
- 주관식: `question.answer.includes(userAnswer.toLowerCase())` ← 오류 발생 지점 (answer가 배열이 아닌 string일 때 `.toLowerCase()` 호출)

### Supabase 연동
- `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 필요
- `src/lib/db.ts`: `upsertUser`, `logAccess`, `saveQuizSession`, `saveFeedback`
- 모든 DB 호출은 실패해도 퀴즈 기능에 영향 없이 silent fail

### 반응형 레이아웃
- `< 640px`: Sidebar 드로어, 하단 문제 네비게이터
- `640–1023px`: Sidebar 드로어, 인라인 네비게이터
- `≥ 1024px`: 고정 좌측 Sidebar, 우측 문제 네비게이터 패널

## 새 퀴즈 카테고리 추가 방법

1. `public/quizzes/{category-id}.json` 생성 (Question 배열)
2. `public/quizzes/index.json`에 카테고리 메타데이터 항목 추가

## E2E 테스트

`e2e/*.spec.ts` — Playwright, baseURL `http://localhost:5173`, Chrome, viewport 1280×800.
테스트 실행 전 `npm run dev`로 개발 서버를 먼저 띄워야 한다.
