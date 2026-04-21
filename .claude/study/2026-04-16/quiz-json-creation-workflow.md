# 퀴즈 JSON 파일 생성 워크플로우 진화 과정

## 학습 환경
- 날짜: 2026-04-16 / 관련 프로젝트: ai-quiz / 기술·버전: Whisper, Alt, Google NotebookLM

---

## 배경
ai-quiz 앱의 퀴즈 데이터(`public/quizzes/*.json`)를 교수님 강의에서 자동으로 생성하는 파이프라인을 구축하면서, 초기 방식에서 최신 방식으로 워크플로우가 진화한 과정을 정리한다.

---

## 핵심 개념

### 전체 파이프라인 구조

```
강의 음성 → 텍스트 변환(STT) → NotebookLM 퀴즈 생성 → JSON 파일
```

핵심은 **음성 → 텍스트** 변환 단계의 효율화다. 퀴즈 생성 자체는 NotebookLM이 일관되게 담당한다.

### 초기 방식 (수동 + Whisper)

| 단계 | 작업 | 도구 |
|------|------|------|
| 1 | 교수님 강의 영상 로컬 다운로드 | 수동 |
| 2 | 쉬는시간 기준으로 영상 구간 분할 | 수동 |
| 3 | Claude에게 Whisper 모듈 설치 지시 | Claude + Whisper |
| 4 | 분할된 영상을 Whisper로 텍스트 변환 | Claude + Whisper |
| 5 | 텍스트를 NotebookLM 소스로 입력 | Google NotebookLM |
| 6 | 퀴즈 자동 생성 | Google NotebookLM |

### 최신 방식 (Alt 활용)

| 단계 | 작업 | 도구 |
|------|------|------|
| 1 | 교수님 강의를 유튜브로 재생 + Alt 앱 실행 | Alt (실시간 전사) |
| 2 | 강의 종료 후 Alt에서 텍스트 내보내기 | Alt |
| 3 | 텍스트를 NotebookLM 소스로 입력 | Google NotebookLM |
| 4 | 퀴즈 자동 생성 | Google NotebookLM |

### 방식 비교

| 항목 | 초기 (Whisper) | 최신 (Alt) |
|------|---------------|------------|
| 사전 준비 | 영상 다운로드 + 분할 필요 | 없음 (유튜브 그대로 재생) |
| STT 도구 | Whisper (설치 필요) | Alt (앱 실행만) |
| 변환 시점 | 사후 처리 (녹화 후) | 실시간 (강의 중) |
| 수동 작업량 | 多 (다운로드, 분할, 설치) | 少 (앱 켜기, 내보내기) |
| 퀴즈 생성 | NotebookLM | NotebookLM (동일) |

---

## 실제 적용

### 생성된 퀴즈 파일 구조

```
public/quizzes/
├── index.json              ← 카테고리 목록 (앱 진입점)
├── quiz/                   ← 단원별 퀴즈 원본
├── 모의고사/                ← 모의고사 원본
├── ai-basics.json          ← 빌드된 퀴즈 파일들
├── cnn-image.json
├── rnn-lstm.json
└── ...
```

- `index.json`이 앱에서 카테고리를 로딩하는 기준
- 각 `{category-id}.json`은 문제 배열(객관식/주관식)을 담고 있음

---

## 주의사항

- **Alt 실시간 전사 품질**: 강의 음질, 마이크 상태에 따라 전사 품질이 달라질 수 있음. 전문 용어가 많은 AI/ML 강의에서는 후보정이 필요할 수 있다.
- **NotebookLM 퀴즈 포맷**: NotebookLM이 생성한 퀴즈를 앱의 JSON 스키마(`MultipleChoiceQuestion` / `ShortAnswerQuestion`)에 맞게 변환하는 작업이 별도로 필요하다.
- **Whisper 방식 폐기 이유**: 다운로드 → 분할 → Whisper 설치 → 변환 과정이 번거로워 Alt 실시간 전사로 전환.

---

## 참고 자료
- Google NotebookLM: 텍스트 소스 기반 퀴즈 자동 생성 도구
- Alt: macOS 실시간 음성 전사 앱
- OpenAI Whisper: 오픈소스 음성 인식 모델
