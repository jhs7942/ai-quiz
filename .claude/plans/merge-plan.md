# 디렉터리 통합 계획 (merge-plan.md) — v2 (사용자 결정 반영)

> 목표: 부모 디렉터리 `/Users/jeonghyeonseung/개발/AI_quiz/`의 파일을 git repo인 서브디렉터리 `ai-quiz/`로 통합하여 커밋·푸시 가능한 상태로 만든다.

---

## 0. 사용자 결정 (v2 반영)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 퀴즈 원본 JSON | `quiz/`, `모의고사/`를 `ai-quiz/public/quizzes/` 하위에 **별도 폴더**로 이동 (index.json 수정 없음) |
| 2 | `script.md` | **삭제** |
| 3 | `SEO/` 원고 | `ai-quiz/SEO/` — 루트 레벨 그대로 이관 |
| 4 | 커밋 단위 | **단일 커밋** |
| 5 | 부모 디렉터리 내용 | **전부 포함** (단, 170MB 참고자료는 §5 경고 확인 필요) |
| 6 | 부모 디렉터리 정리 | 계획에 미결 — 커밋·푸시 완료 후 별도 확인 |

---

## 1. 최종 이관 매핑

### 1-1. 루트 레벨 이동

| 원본 | 대상 |
|---|---|
| `AI_quiz/CLAUDE.md` | `ai-quiz/CLAUDE.md` |
| `AI_quiz/docs/traffic-spike-solutions.md` | `ai-quiz/docs/traffic-spike-solutions.md` |
| `AI_quiz/SEO/**` | `ai-quiz/SEO/**` (폴더 전체 그대로) |
| `AI_quiz/example.json` | `ai-quiz/example.json` |
| `AI_quiz/test.json` | `ai-quiz/test.json` |
| `AI_quiz/객관식.json` | `ai-quiz/객관식.json` |
| `AI_quiz/.playwright-mcp/` | `ai-quiz/.playwright-mcp/` (또는 gitignore 대상 검토) |

### 1-2. 퀴즈 원본 JSON 이동

| 원본 | 대상 |
|---|---|
| `AI_quiz/quiz/퀴즈1.json`, `퀴즈2.json`, `퀴즈3.json` | `ai-quiz/public/quizzes/quiz/` |
| `AI_quiz/quiz/퀴즈 추가/**` | `ai-quiz/public/quizzes/quiz/퀴즈 추가/` |
| `AI_quiz/모의고사/pre_test*.json` (9개) | `ai-quiz/public/quizzes/모의고사/` |

> **주의**: `ai-quiz/public/quizzes/`에는 이미 앱이 사용 중인 가공본 JSON 14개 + `index.json` + `mock-exams/`가 존재. 이번에 추가되는 `quiz/`, `모의고사/` 폴더는 **원본 보관용**이며 `index.json` 수정·앱 로직 변경 없음.

### 1-3. `.claude/` 병합 (부모가 더 풍부 → 덮어쓰기 병합)

| 원본 | 대상 |
|---|---|
| `AI_quiz/.claude/plans/{plan,plan2,construction,fine_tuning}.md` | `ai-quiz/.claude/plans/` (신규 복사) |
| `AI_quiz/.claude/plans/review.md` | **양쪽 존재 → diff 확인 후 부모 우선 덮어쓰기** |
| `AI_quiz/.claude/plans/merge-plan.md` | `ai-quiz/.claude/plans/merge-plan.md` (이 파일 자체) |
| `AI_quiz/.claude/fix/2026-03-24/*` | **diff 확인 후 부모 우선 덮어쓰기** |
| `AI_quiz/.claude/fix/{2026-03-26, 03-27, 04-01, 04-04}/*` | 신규 복사 |
| `AI_quiz/.claude/study/2026-04-08/*` | 신규 복사 |
| `AI_quiz/.claude/context/{pwa,batch-save,quiz-per-question-save}/*` | 신규 복사 |
| `AI_quiz/.claude/blog-material.md` | 신규 복사 |
| `AI_quiz/.claude/memory/` | 복사하되 커밋 제외 (.gitignore) |
| `AI_quiz/.claude/settings.local.json` | **제외** (로컬 설정) |

### 1-4. 삭제 대상

| 원본 | 처리 |
|---|---|
| `AI_quiz/script.md` | **삭제** |
| `AI_quiz/CLAUDE.local.md` (symlink) | 이동·삭제하지 않음 (전역 템플릿 심링크, 깨지면 안 됨) |

### 1-5. ⚠ 대용량 자료 (사용자 재확인 필요)

| 원본 | 크기 | GitHub 제약 | 권장 |
|---|---|---|---|
| `AI_quiz/참고자료/` | 54MB | 개별 파일이 50MB 넘으면 경고, 100MB 넘으면 푸시 거부 | **Git LFS 또는 제외** |
| `AI_quiz/참고자료.zip` | **53MB** | 단일 파일 50MB 경고 (푸시는 가능하나 clone 비용 증가) | **Git LFS 권장** |
| `AI_quiz/참고/` | 64MB | 내부 파일 크기에 따라 거부 가능 | **Git LFS 또는 제외** |

> **재확인 필요**: "전부 포함"을 문자 그대로 적용하면 ~170MB가 커밋 이력에 영구 저장되어 향후 `git clone` 비용이 급증한다. 선택지:
> - **(권장) A**: 세 항목 모두 `.gitignore`로 제외. 로컬 보존만.
> - **B**: Git LFS 설정 후 커밋. `ai-quiz/.gitattributes` 생성, `git lfs install`, `git lfs track "참고자료*" "참고/**"` 필요.
> - **C**: 그대로 일반 커밋 (100MB 초과 파일이 없는지 사전 스캔 필수, clone 비용 감수).

---

## 2. `.gitignore` 업데이트

`ai-quiz/.gitignore`에 다음 추가:
```
# Claude Code 로컬 상태
.claude/settings.local.json
.claude/memory/
.claude/context/
```

대용량 자료 처리 방식에 따라 추가:
- **옵션 A 선택 시**: `참고자료/`, `참고자료.zip`, `참고/` 추가
- **옵션 B 선택 시**: `.gitattributes`에 LFS 패턴 추가
- **옵션 C 선택 시**: 추가 없음 (단, `find 참고자료 참고 -size +100M` 사전 스캔)

---

## 3. 실행 단계

### Phase 1: 사전 확인 (read-only)
1. `ai-quiz/public/quizzes/quiz/`, `ai-quiz/public/quizzes/모의고사/` 폴더가 이미 존재하지 않는지 확인
2. `.claude/plans/review.md` 양쪽 diff
3. `.claude/fix/2026-03-24/` 양쪽 diff
4. `find 참고자료 참고 -size +100M` — GitHub 거부 대상 파일 검출
5. 부모 `.gitignore` 없음 → 서브의 것만 사용

### Phase 2: 파일 이동 (`mv` 기반, 부모에서 ai-quiz로)
1. 루트 파일·폴더 이동 (§1-1)
2. `quiz/`, `모의고사/` → `ai-quiz/public/quizzes/` 아래로 이동 (§1-2)
3. `.claude/` 병합 (§1-3)
   - 신규 복사본은 `cp -r`
   - 충돌 파일(`plans/review.md`, `fix/2026-03-24/*`)은 diff 확인 후 덮어쓰기
4. `script.md` 삭제 (§1-4)
5. 대용량 자료 처리 (§1-5 결정에 따름)

### Phase 3: .gitignore·정리
1. `ai-quiz/.gitignore` 업데이트 (§2)
2. `git status` 확인 — 의도치 않은 스테이징 검출
3. `git ls-files --others --exclude-standard | xargs du -sh | sort -h | tail -20` — 상위 용량 파일 확인

### Phase 4: 단일 커밋·푸시
1. `git add -A` (gitignore 검증 후에만)
2. 커밋 메시지 (단일 커밋):
   ```
   chore: 부모 디렉터리 자원을 ai-quiz repo로 통합

   - 프로젝트 지침·운영 문서 이관 (CLAUDE.md, docs/, SEO/)
   - 퀴즈 원본 JSON 보관 (public/quizzes/quiz/, public/quizzes/모의고사/)
   - .claude/ 병합 (plans, fix, study, context, blog-material)
   - script.md 삭제
   - .gitignore에 로컬 상태 파일 추가
   ```
3. `git push origin main`

### Phase 5: 부모 디렉터리 정리 (커밋·푸시 성공 후 별도 질문)
- 이동 성공한 항목을 부모에서 삭제할지 확인
- `CLAUDE.local.md` 심링크·`.playwright-mcp/`는 건드리지 않음

---

## 4. 충돌 처리 절차

| 파일 | 절차 |
|---|---|
| `.claude/plans/review.md` | `diff` → 다르면 부모 우선. 두 파일 내용이 다른 작업을 다루면 `review-*.md`로 분리 저장 고려 |
| `.claude/fix/2026-03-24/*` | 파일별 `diff` → 동일 skip, 다르면 부모 우선 |

---

## 5. 리스크·재확인 요청

| 리스크 | 대응 |
|---|---|
| **참고자료 170MB 커밋** | §1-5 옵션 A/B/C 중 선택 필요 (사용자 재확인) |
| `CLAUDE.local.md` symlink 훼손 | 이동·삭제하지 않음 |
| `index.json` 수정 없이 `quiz/`, `모의고사/` 폴더 추가 → 앱이 로드 시도 안 함 (정상, 보관용) | 변경 없음 |
| 단일 커밋으로 대량 변경 — 리뷰·롤백 어려움 | 사용자 요청대로 진행, 푸시 전 `git diff --stat` 최종 확인 |
| `.claude/memory/`·`settings.local.json` 실수 커밋 | Phase 3에서 `git status` 검증 필수 |

---

## 6. 최종 사용자 확인 요청

**Phase 1 실행 전 반드시 결정**:

**Q. 대용량 참고자료 (~170MB) 처리 방식?**
- **A**: `.gitignore`로 제외 (권장 — 로컬 보존만)
- **B**: Git LFS로 트래킹 (`git lfs install` + `.gitattributes` 생성 필요)
- **C**: 일반 커밋 강행 (사전 `find -size +100M` 스캔으로 거부 대상 배제)

답 주면 Phase 1 사전 확인부터 진행.
