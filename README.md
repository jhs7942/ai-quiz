# AI Quiz — 싸피 AI 시험 대비 학습 퀴즈 플랫폼

> **4시간 MVP** 제약 안에서 LLM 동적 생성 대신 **싸피 교재 기반 정적 JSON**을 택해, 1 캠퍼스 기획이 전국으로 유기적 확산. **총 92,329건 퀴즈 풀이 · 6,343 세션** 도달.

<p align="center">
  <a href="https://ai-quiz-xi-livid.vercel.app"><img src="https://img.shields.io/badge/Live-ai--quiz.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
</p>

**Live** · <https://ai-quiz-xi-livid.vercel.app>
**기간** · MVP 4시간 + 1·2차 시험 대비 개선
**역할** · 코드 개발 1인 / 콘텐츠 팀 2명

---

## 핵심 지표

| | 1차 시험 | 2차 시험 | 합계 |
|---|---:|---:|---:|
| 퀴즈 풀이 | 73,848 | 18,481 | **92,329** |
| 세션 | 4,795 | 1,548 | **6,343** |
| 콘텐츠 | 930문제 | +180문제 | **1,160문제 · 12 카테고리** |

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

## 핵심 의사결정

**왜 LLM 동적 생성이 아닌 정적 JSON인가** — 시험 범위가 싸피 내부 교재로 고정되어 있어 LLM은 범위 적합도를 구조적으로 보장할 수 없다. *"교재 기반 + AI 초안 + 인간 검수"* 하이브리드로 즉시 응답·0원·범위 100% 일치를 모두 확보.

**가용성 원칙 — "DB가 죽어도 퀴즈는 돈다"** — 분석·로깅용 Supabase 호출은 모두 silent fail. 정적 JSON이 단일 진실 소스라 핵심 플로우는 무중단.

**의도적으로 빼낸 것** — 정답률 표시(UX 오버헤드), 로그인(복잡도), PWA(peer dep 실패 후 반응형으로 대체).

---

## 결과 (가설 vs 실측)

| 가설 | 실측 | 판정 |
|---|---|:---:|
| 퀴즈 로드 < 1초 | 즉시 | 확증 |
| 사용자별 비용 0원 | 0원 | 확증 |
| DB 장애 시 가용성 | 운영 중 무중단 | 확증 |
| 시험 범위 적합도 | 체감 95% | 확증 |
| 주관식 정답률 | *가설 미수립* — 40.7% | **반증** |

---

## 회고

1. **제약이 기술 선택을 강제한다** — 4시간·토큰 한도가 *"덜 하는 것"* 을 승리 전략으로 만들었다.
2. **아키텍처가 가용성을 결정한다** — *"JSON=필수, DB=선택"* 이라는 구조 자체가 silent fail을 가능케 했다.
3. **협업 인프라 부재 = 사람을 잃는 비용** — 두 번의 팀원 이탈 경험 이후 Linear 도입. 협업 도구는 속도의 반대가 아니라 전제.

자세한 회고 → [`.claude/portfolio-v2.md`](.claude/portfolio-v2.md)

---

[@jhs7942](https://github.com/jhs7942) · SSAFY 마이스터고 트랙
