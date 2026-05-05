# RPC와 Supabase upsert 패턴 — 데이터 옆에서 코드를 실행한다는 것

## 학습 환경
- 날짜: 2026-05-05
- 관련 프로젝트: ai-quiz (React + Vite + Supabase)
- 기술·버전: Supabase JS 클라이언트, PostgREST, PostgreSQL

## 배경
`src/lib/session.ts`와 `src/lib/db.ts` 코드를 학습 주석을 달며 읽다가 다음 의문이 연쇄적으로 떠올랐다.

1. `localStorage.getItem(SESSION_KEY)`이 "브라우저 세션이 살아있는지" 검사하는 코드인가?
2. `visit_count` 증가를 select → update 분기 대신 Supabase `.upsert()` 한 번으로 처리할 수 있나?
3. 왜 굳이 RPC라는 것을 써야 하나? 클라이언트 라이브러리에 내장된 메서드만으로는 안 되나?
4. RPC는 함수 소스코드를 네트워크로 받아와서 클라이언트에서 실행하는 것 아닌가?

3번까지는 "그런 게 있다더라" 수준으로 넘어갈 수 있었지만, 4번에서 RPC의 동작 방향을 정반대로 이해하고 있었다는 걸 발견했다. 이걸 한 번 정리해두지 않으면 같은 함정에 다시 빠질 게 분명해서 노트로 박아둔다.

## 핵심 개념

### 1. localStorage의 "session"은 브라우저 세션이 아니다
| 저장소 | 수명 | 용도 |
|---|---|---|
| `sessionStorage` | 탭 닫으면 사라짐 | 진짜 "탭 세션" |
| `localStorage` | 사용자가 지우기 전까지 영구 | 디바이스 단위 영구 식별자 |

`SESSION_KEY = 'ai_quiz_session_id'`는 `localStorage`에 저장되므로 **영구 익명 사용자 ID**다. 엄밀히는 `USER_ID_KEY` 또는 `ANON_ID_KEY`가 더 정확한 이름이지만, 도메인 용어로 "분석을 위한 사용자 활동 묶음"을 "세션"으로 부르는 관습이 흔하다.

### 2. `.upsert()`로 visit_count 증가가 깔끔하지 않은 이유
Supabase `.upsert()`는 결국 PostgreSQL의 `INSERT ... ON CONFLICT DO UPDATE`를 JS로 감싼 것이다. 호출 시 **완성된 row 하나**를 JSON body로 넘겨야 한다.

```ts
.upsert({ id, visit_count: ??? })  // 클라이언트는 현재값을 모름
```

`visit_count + 1`을 표현하려면 현재값을 select로 먼저 읽어야 하고, 그러면 호출 횟수가 결국 2번이 된다. 즉 **upsert 한 번으로 self-reference 증가는 불가능**하다.

### 3. REST API가 표현 못 하는 SQL의 표현력
PostgREST(=Supabase JS 클라이언트)는 JSON body로 "값을 보낸다"만 표현 가능하다. 다음 SQL 기능은 노출되지 않는다.

- `col = col + 1` 같은 self-reference
- `ON CONFLICT DO UPDATE`에서 `EXCLUDED.col` 참조
- 여러 테이블 동시 변경 트랜잭션
- 복잡한 조건부 갱신

이걸 우회하기 위한 정공법이 **DB에 SQL 함수를 만들고 RPC로 호출**하는 것이다.

### 4. RPC = Remote Procedure Call
**원격 서버에 있는 함수를 마치 로컬 함수처럼 호출하는 통신 방식.**

- **R**emote: 원격(서버)에 있는
- **P**rocedure: 함수
- **C**all: 호출(실행해달라고 부탁)

핵심 오해 교정: RPC는 "함수 소스를 다운로드해서 클라이언트에서 실행"이 아니라 **"함수는 서버에 그대로 두고, 호출만 위임"** 하는 방식이다.

```
클라이언트                                 서버 (DB)
─────────                                 ──────────
                                          touch_user 함수가
                                          여기 미리 등록됨

supabase.rpc('touch_user', { p_id: ... })
   │
   │   요청: 함수명 + 인자만 ──────────▶
   │
   │                                      서버가 함수 실행
   │                                      (UPDATE 등)
   │
   │   ◀──────────── 응답: 결과값만
   │
data 받음
```

전송되는 것: **함수 이름 + 인자 + 결과** (수십~수백 바이트 텍스트)
전송되지 **않는** 것: 함수 소스코드, DB 내부 데이터

### 5. "Move computation to data, not data to computation"
데이터가 무거우니 코드를 데이터 쪽으로 옮기는 게 효율적이라는 데이터베이스 업계 원칙.

| | 데이터 위치 | 코드 위치 | 결과 |
|---|---|---|---|
| 클라이언트 처리 | 원격 | 로컬 | 데이터 왕복(왕복 ↑) |
| RPC | 원격 | **원격** | 코드를 데이터 옆으로(왕복 ↓) |

## 실제 적용

### 현재 ai-quiz 코드 (select → update 분기)
```ts
const { data: existing } = await supabase
  .from('users')
  .select('id, visit_count')
  .eq('id', sessionId)
  .single()

if (existing) {
  await supabase
    .from('users')
    .update({
      last_visit_at: new Date().toISOString(),
      visit_count: existing.visit_count + 1,
    })
    .eq('id', existing.id)
  return existing.id
}
// else insert ...
```

- 호출 2회
- 원자적 ✗ (race condition 가능)
- 분석용이라 silent fail + 약간의 카운트 누락은 허용 가능

### RPC로 한 번에 처리하는 정공법
**DB 함수 등록 (Supabase SQL Editor에서 한 번)**
```sql
create or replace function touch_user(p_id uuid, p_ua text)
returns uuid language sql as $$
  insert into users (id, user_agent, visit_count, last_visit_at)
  values (p_id, p_ua, 1, now())
  on conflict (id) do update
    set visit_count = users.visit_count + 1,
        last_visit_at = now()
  returning id;
$$;
```

**클라이언트 호출**
```ts
const { data } = await supabase.rpc('touch_user', {
  p_id: sessionId,
  p_ua: userAgent,
})
```

- 호출 1회
- 원자적 ✓ (DB 트랜잭션 안에서 처리)
- 동시 호출 시에도 카운트 정확

### 비교 표
| 방식 | 호출 수 | 원자성 | 구현 비용 |
|---|---|---|---|
| select → update (현재) | 2 | × | 낮음 |
| select → upsert | 2 | × | 낮음 (이득 없음) |
| **RPC** | **1** | **✓** | DB 함수 1회 작성 |

## 주의사항

### RPC ≠ 로컬 함수
"마치 로컬처럼"이 디자인 목표지만 실제는 다르다.

| 로컬 함수 | RPC |
|---|---|
| 즉시 실행 (ns~μs) | 네트워크 왕복 (ms~s) |
| 실패 = 예외 1종류 | 실패 = 네트워크·인증·타임아웃 등 다수 |
| 결정적 | 재시도·중복 호출 가능성 |

루프 안에서 `supabase.rpc(...)`를 100번 도는 코드는 N+1 latency 안티패턴. 배치 처리 함수로 만들거나 단일 호출에 인자를 묶어 보내는 식으로 풀어야 한다.

### "함수 다운로드" 오해를 다시 떠올리지 말 것
헷갈릴 때마다 식당 비유로 복귀:
- 오해 모델: "식당 레시피를 받아와 집에서 요리"
- 실제 RPC: "식당에 주문하고 음식만 받아옴"

레시피(함수 소스)는 주방(서버) 안에만 있고, 손님(클라이언트)은 메뉴 이름과 결과 음식만 본다.

### 클라이언트 → 서버 신뢰 경계
클라이언트는 사용자가 자유롭게 조작 가능한 환경(개발자 도구로 코드 변경 가능). 다음은 반드시 서버에서 강제해야 한다.
- 결제 금액 계산
- 권한 검사
- 멱등성·동시성 보장

RPC + RLS(Row Level Security) 조합이 신뢰 경계를 만든다. 클라이언트는 "함수 호출"만 부탁하고, 어떻게 처리할지는 서버가 결정.

### 라이브러리는 한계가 아니라 단순한 래퍼
"npm 라이브러리를 더 좋은 걸로 바꾸면 해결되지 않을까?"는 잘못된 방향. 어떤 npm 라이브러리든 **PostgREST가 노출한 기능 이상은 못 한다**. 한계는 라이브러리가 아니라 **API 표면(REST/JSON)** 에 있다. 이 한계를 넘으려면 RPC로 SQL의 표현력을 빌려와야 한다.

## 참고 자료
- Supabase Docs — Database Functions: https://supabase.com/docs/guides/database/functions
- PostgREST RPC: https://postgrest.org/en/stable/references/api/stored_procedures.html
- PostgreSQL `INSERT ... ON CONFLICT` 공식 문서: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
- 프로젝트 내 관련 코드: `src/lib/session.ts`, `src/lib/db.ts`
