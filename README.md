# AI Quiz — 싸피 AI 시험 대비 학습 퀴즈 플랫폼

> **4시간 MVP** 제약 안에서 LLM 동적 생성 대신 **싸피 교재 기반 정적 JSON**을 택해, 1 캠퍼스 기획이 전국으로 유기적 확산. **총 92,329건 퀴즈 풀이 · 6,343 세션 · 활성 학습자 826명** 도달.

<p align="center">
  <a href="https://ai-quiz-xi-livid.vercel.app"><img src="https://img.shields.io/badge/Live-ai--quiz.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Zustand-433E38?style=for-the-badge" alt="Zustand">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
</p>

**Live** · <https://ai-quiz-xi-livid.vercel.app>
**기간** · 2026.03 · MVP 4시간 + 1·2차 시험 대비 개선
**역할** · 개발 1인 / 퀴즈 제작 2인
**기술 스택** · React 19 · TypeScript · Zustand · Vite · Supabase(PostgreSQL) · Claude Code

---

## 프로젝트 배경

싸피 AI 시험 2일 전, 교육생들은 각자 LLM으로 기출 문제를 만들고 있었다. 그러나 **실제 배운 범위가 아닌 문제까지 생성**되고, **매번 제작에 약 10분**이 들었으며, 이동 중 같은 **자투리 시간에는 활용할 수 없었다.**

그래서 미리 검수한 문제 은행을 한 번 만들어 함께 쓰기로 했다. 시험까지 남은 시간은 2일 — **기획·배포를 포함한 개발 기간을 4시간으로 못박고** 시작했다.

---

## 핵심 지표

| | 1차 시험 | 2차 시험 | 합계 |
|---|---:|---:|---:|
| 퀴즈 풀이 | 73,848 | 18,481 | **92,329** |
| 세션 | 4,795 | 1,548 | **6,343** |
| 콘텐츠 | 930문제 | +180문제 | **1,160문제 · 12 카테고리** |

**운영 성과**

- **활성 학습자 826명** — 싸피 약 1,000명 중 약 83%가 실제 학습에 사용
- **재시도 정답률 67% → 75%** — 오답 재시험을 반복하며 개선
- **문제 신고 반영 120 / 134건 (약 90%)** — 사용자 신고 기반 상시 교정

> 1 캠퍼스(서울 15기) 기획 → 부산·광주 등 지역 캠퍼스로 유기적 확산.

---

## 화면

| 메인 — 카테고리 진입 | 카테고리·난이도·문제 수 설정 |
|:---:|:---:|
| ![메인](.claude/fix/2026-03-27/01-main.png) | ![설정](.claude/fix/2026-03-27/02-category-settings.png) |
| **퀴즈 풀이** | **정답·해설 즉시 피드백** |
| ![퀴즈](.claude/fix/2026-03-27/03-quiz-start.png) | ![피드백](.claude/fix/2026-03-27/04-feedback.png) |
| **결과 — 점수·정답률** | **문제 신고 모달** |
| ![결과](.claude/fix/2026-03-27/07-result.png) | ![신고](.claude/fix/2026-03-27/09-report-modal.png) |

### 모바일

| 메인 | 사이드 드로어 | 퀴즈 풀이 |
|:---:|:---:|:---:|
| ![모바일 메인](.claude/fix/2026-03-26/09-mobile-main.png) | ![모바일 드로어](.claude/fix/2026-03-26/10-mobile-drawer.png) | ![모바일 퀴즈](.claude/fix/2026-03-26/13-mobile-quiz.png) |

---

## 주요 문제와 해결

**문제 — 시간과 토큰, 두 개의 한도**

- **4시간 제약** — 기획·배포까지 4시간 안에 끝내려면 평소 쓰던 절차를 전부 밟을 수 없었다. *무엇을 버릴지부터* 정해야 했다.
- **토큰 한도** — Claude Code Pro의 토큰 한도 안에서 개발을 마쳐야 했다.

**해결**

- **문제 생성·검수 파이프라인** — 강의를 실시간 전사 앱으로 받아쓰고 → NotebookLM으로 초안을 뽑은 뒤 → 팀원 2명이 교재와 대조해 검수. LLM의 속도와 사람 검수의 정확도를 결합해 검증된 문제 은행을 채웠다.
- **의도적 생략** — 한정된 시간·토큰을 핵심 기능에 몰아주기 위해 아래를 덜어냈다.
  - *디자인 시안* — 토큰 절감
  - *코드 리뷰* — 기능 우선
  - *자동 테스트* — 로컬에서 직접 검증

---

[@jhs7942](https://github.com/jhs7942) · SSAFY 마이스터고 트랙
