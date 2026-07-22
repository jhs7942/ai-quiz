# 리니어 플로우 — 블로그 콘텐츠 정리

> 출처: `github.com/jhs7942/claude-workspace` (public, 최종 push 2026-04-16)
> 대조: `claude-config`의 현재 `linear-project-manager.md` · `linear-project-template.md`

---

## 0. 먼저 — 발행된 04를 정정해야 한다

포트폴리오 04에 이렇게 써서 발행했습니다.

> "1인 개발이라 **부트스트랩과 Phase 경계 상태 전환까지만 실제로 돌렸고**, 원격 변경 분류는 **설계 단계**입니다"

이 서술은 당시 근거(`telepathy-v2`의 `last_pull_hash: null`)로는 맞았지만, **지금은 부정확합니다.** claude-workspace에 실행 로그가 있습니다.

```
14:24:50 | sync_state | ok | get_issue | id=CDS-6 | 5 drifts detected: state, priority, labels
05:16:42 | pull       | ok | get_issue | id=CDS-6 | state=In Progress priority=1
05:16:42 | pull       | ok | list_comments | count=1 last_comment=팀원 코멘트: 우선순위를 Urgent로…
05:16:43 | pull       | ok | update_progress_md | cached_priority=1 cached_labels=[…] | 4 fields updated
```

`last_pull_hash: 8c5f3a2e…` 도 채워져 있습니다. **pull·drift 경로가 실제로 돌았습니다.**

**단, 여전히 "팀과 운영했다"는 아닙니다.** 팀은 `claude-dev-sandbox`(CDS)이고 "팀원 코멘트"는 외부 수정 시뮬레이션입니다. 정확한 표현은 **"샌드박스에서 전 구간 통합 검증"**입니다.

→ 04 문구를 `설계 단계` → `샌드박스에서 전 구간 검증` 으로 고치는 것을 권합니다. 지금은 실제보다 **낮춰** 쓰고 있습니다.

---

## 1. 새로 확보된 근거

### 실행된 전 구간 (CDS 팀, 2026-04-16)

| 단계 | 로그 |
|---|---|
| bootstrap | 7 states · **16 labels 검증(0 created)** · state_map · cache write |
| create_issue | CDS-5 생성, labels `[phase/ideate, type/feat, priority/high]` |
| update_phase ×2 | ideate→design→implement, 라벨 전환 |
| close_issue | 종료 코멘트 생성 + Done 전환 + `phase/*` 라벨 제거 |
| create_subissue | CDS-2 (parent=CDS-1) |
| sync_state | **5 drifts 감지** (state, priority, labels) |
| pull | 원격 읽기 → 코멘트 1건 → **progress.md 4필드 갱신** |

### 스모크 테스트로 확정한 플랫폼 동작 — 글의 핵심

문서를 읽어서가 아니라 **직접 호출해서 확인한 것들**이라 이 부분이 가장 값어치가 있습니다.

1. **`save_*` upsert** — Linear MCP는 GitHub의 `create_*`/`update_*` 분리와 달리 `save_issue` 하나로 겸용. `id` 유무로 create/update 분기.
2. **응답 `id`가 UUID가 아니라 identifier** — `bc1fe577-…`가 아니라 `CDS-1`을 반환. 모든 도구가 identifier를 받으므로 **UUID 별도 조회가 불필요**.
3. **`labels`는 완전 덮어쓰기, 관계는 append-only** ← **이 비대칭이 이 글의 하이라이트**
   ```
   이전: labels = [type/feat, priority/medium, phase/ideate]
   save_issue(id=CDS-1, labels=[type/feat, priority/medium, phase/design])
   결과: phase/ideate 사라짐 → replace 확정
   ```
   반면 `blocks`/`blockedBy`/`relatedTo`/`links`는 append-only. 혼동하면 라벨이 조용히 날아갑니다. Phase 전환 때 **전체 라벨 배열을 재구성**해야 하는 이유.
4. **Phase↔state 퍼지 매칭** — 팀마다 워크플로 이름이 다르므로 `이름 exact → state type → 라벨 fallback` 3단.
5. **GraphQL 에러 파싱** — `message` 접두 기반 매핑(`Entity not found: Issue` → `issue_not_found`)으로 **에러 코드 16종** 문서화.

### 자기 설계의 허점을 스스로 찾고 → 고친 기록

검증 직후 허점 4건을 문서화했고, 현재 저장소와 대조해보니 **4건 전부 반영**돼 있습니다.

| # | 발견한 허점 | 현재 상태 |
|---|---|---|
| 1 | mechanical drift가 `state`만 저장돼 **같은 drift가 매번 반복** | ✅ `cached_labels`·`cached_priority`·`cached_assignees` 저장으로 확장 |
| 2 | drift 기준값(`cached_*`)이 스키마에 없어 **textual·structural 감지 불가** | ✅ 템플릿에 `cached_*` 스키마 정의 (12개소) |
| 3 | 제목·priority 수동 변경 경로 없음 | ✅ `edit_issue` action 신설 — **8개 → 9개** |
| 4 | 취소(Canceled) 경로 없음, `close_issue`가 Done으로만 동작 | ✅ `close_issue`에 `reason: completed \| cancelled` 추가 |

**이게 글의 결론이 되어야 합니다.** "연동했다"가 아니라 **"검증했더니 내 설계에 구멍이 4개 있었고, 그중 2개는 조용히 반복되는 종류였다"**.

---

## 2. 권장 형태 — 포트폴리오 아닌 독립 포스트

포트폴리오 04는 짧게 가기로 이미 정하셨고, 위 내용은 04에 넣기엔 큽니다. 블로그에는 **학습 정리 포스트 1편**이 맞습니다. 기존 60+편과 같은 형식이고, 원본 학습 노트(`linear-mcp-dev-flow-automation.md`)가 이미 그 파이프라인 입력 형태입니다.

### frontmatter 초안

```yaml
---
title: "Linear MCP로 개발 플로우 자동화하기 — 라벨은 덮어쓰기, 관계는 추가"
slug: "linear-mcp-dev-flow-automation"
labels: ["AI 작성", "학습 정리", "Claude Code", "Linear", "MCP", "자동화"]
source: "사용자 학습 노트 (Linear MCP 연동 — 스모크 테스트·4버킷 drift·허점 4건)"
---
```

제목은 **가장 실용적인 발견(라벨 replace 비대칭)**을 부제로 올렸습니다. "Linear 연동했습니다"류 제목보다 검색·클릭에 유리하고, 실제로 남이 걸릴 함정입니다.

### 구조 제안

| # | 섹션 | 핵심 |
|---|---|---|
| 0 | SUMMARY | 연동 자체가 아니라 "스모크 테스트로 확정한 동작 + 내 설계의 허점 4건"이 요지임을 명시 |
| 1 | 왜 필요했나 | 세 가지 질문 — 플로우가 Linear를 자동 수정하는가 / 초대된 워크스페이스에서도 되는가 / 팀원 수정이 반영되는가 |
| 2 | 붙이기 전에 확인한 것 | `save_*` upsert · 응답 id가 identifier · **labels replace vs 관계 append-only** |
| 3 | Phase ↔ state 매핑 | 퍼지 매칭 3단 (이름 → type → 라벨) |
| 4 | 역방향이 어려웠다 | **4버킷 분류** + 일괄 승인 1회 + 에이전트는 사용자와 직접 대화 금지 |
| 5 | 검증했더니 구멍이 4개 | 허점 4건 → 수정 내역. **글의 클라이맥스** |
| 6 | 플랫폼 제약 | `delete_issue` 없음 · webhook 불가(이벤트 루프 부재) → `/loop 15m` 폴링 · OAuth 만료 시 Linear 훅만 스킵 |
| 7 | 남은 것 | 샌드박스 검증이지 팀 운영이 아님을 **명시** |

### 톤 주의

7번을 빼면 안 됩니다. 로그의 "팀원 코멘트"는 시뮬레이션이고, 실제 팀 협업 이력은 없습니다. 이걸 밝히는 게 오히려 2~5번의 신뢰를 받칩니다 — 기존 포스트들(보안 등급 착시 같은)과 톤도 맞습니다.

---

## 3. 쓰지 말 것

| 항목 | 이유 |
|---|---|
| UUID·팀 ID 전체 | `8ef5c287-…` 등 워크스페이스 식별자. 샌드박스라도 노출 불필요 |
| `label_map` 16종 UUID 덤프 | 정보량 0, 지면만 먹음. 라벨 **이름**만 |
| 파일 목록 표(생성 8개·수정 4개) | 학습 노트에는 유용하나 독자에겐 무의미 |
| "팀원과 공유" 표현 | 실제로는 1인 + 샌드박스 |

---

## 4. 확인 필요

- **04 문구 정정할지.** 지금 라이브는 실제보다 보수적으로 적혀 있습니다. 고치면 재발행 1회.
- **포스트를 지금 쓸지, 소재만 등록할지.** `/blog/save`로 `topics.md`에 넣어두고 나중에 쓰는 경로도 있습니다.
- **원본 학습 노트가 claude-workspace에만 있습니다.** 블로그 파이프라인은 로컬 `output/`을 입력으로 받으므로, 포스트를 쓰려면 그 노트를 블로그 저장소로 가져오거나 새로 작성해야 합니다.
