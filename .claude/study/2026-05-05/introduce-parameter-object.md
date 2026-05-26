# Introduce Parameter Object

## 학습 환경
- 날짜: 2026-05-05 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x

## 배경
DB 저장 함수의 시그니처를 학습하면서 코드 주석에 "payload 패턴"이라는 표현을 만났다.
"payload 패턴"이 정식 용어인지, Gemini가 답한 "Parameter Object Pattern" 또는
구글에서 자주 보이는 "Introduce Parameter Object"와 어떤 관계인지 정리할 필요가 있었다.
인자 묶음 리팩토링 기법의 정식 명칭과 적용 절차·효과·주의점을 한 번에 정리해두면
다음 리팩토링·코드 리뷰 때 동일한 판단을 빠르게 내릴 수 있다.

## 핵심 개념

### 명칭 정리
| 표현 | 품사 | 가리키는 것 |
|---|---|---|
| **Introduce Parameter Object** | 동사구 (행위) | Martin Fowler 『Refactoring』의 공식 리팩토링 기법명 — "여러 인자를 객체로 묶어 도입하는 작업" |
| **Parameter Object (Pattern)** | 명사 (결과물) | 그 작업으로 만들어진 객체·패턴 자체 |
| **Options Object** | 명사 (별칭) | JS/TS 커뮤니티 관용어. 선택적 설정 인자가 많을 때 |
| **payload** | 명사 (별칭) | DB·API·메시징·Redux 맥락에서 운반되는 데이터 본체를 가리키는 도메인 용어 |

→ 모두 동일 패턴이다. Fowler 명명 규칙은 동사로 시작 (Extract, Inline, Rename, Introduce…).

### 적용 신호 (Code Smell)
1. **Long Parameter List** — 인자 4~5개 이상
2. **Data Clump** — 같은 인자 묶음이 여러 함수에 반복 등장
3. **같은 타입 인자 연속** — `string, string, string` 순서 실수 위험
4. **선택적 인자 다수** — `undefined` 자리 채우기로 호출이 지저분

### 적용 절차 (Fowler 메커니즘)
1. 새 클래스/타입 생성 — 묶을 인자들을 필드로
2. 함수 시그니처 변경 — 객체 인자 하나로 교체
3. 호출처 수정 — 모든 호출자가 객체를 만들어 전달
4. 단계별 컴파일·테스트 통과 확인
5. 같은 데이터 묶음을 쓰는 다른 함수도 같은 타입 사용하도록 통일

### 효과
| 효과 | 설명 |
|---|---|
| 호출처 가독성 | `8, 10, 120` → `score: 8, total: 10, duration: 120` |
| 순서 실수 제거 | 키 매칭이라 위치 무관 |
| 확장 용이성 | 필드 추가·선택화 시 호출처 영향 최소 |
| 타입 재사용 (SSoT) | DB 레이어·호출처·테스트가 동일 타입 import → drift 즉시 감지 |
| Data Clump 제거 | 도메인 개념이 코드에 명시됨 |
| 행동 부착 가능 | 단순 묶음에서 검증·계산 메서드를 가진 객체로 진화 가능 |

## 실제 적용

ai-quiz 프로젝트의 퀴즈 세션 저장 함수에 동일 기법이 적용돼 있다.

**Before — Long Parameter List**
```ts
async function saveQuizSession(
  userId: string,
  category: string,
  score: number,
  total: number,
  duration: number,
  difficulty: string,
): Promise<void> { ... }

saveQuizSession("u1", "react", 8, 10, 120, "easy");
```

**Step 1: Parameter Object 도입**
```ts
// types/index.ts 에 정의 (SSoT — DB 레이어와 호출처가 공유)
type SaveQuizSessionPayload = {
  userId: string;
  category: string;
  score: number;
  total: number;
  duration: number;
  difficulty: string;
};
```

**Step 2: 시그니처 교체**
```ts
async function saveQuizSession(payload: SaveQuizSessionPayload): Promise<void> { ... }
```

**Step 3: 호출처 수정**
```ts
saveQuizSession({
  userId: "u1",
  category: "react",
  score: 8,
  total: 10,
  duration: 120,
  difficulty: "easy",
});
```

→ "리팩토링 기법"은 Introduce Parameter Object,
   "결과 객체의 도메인 별칭"은 payload,
   "공유 타입 위치"는 `types/index.ts` (SSoT).

## 주의사항

### 오용 패턴
1. **2~3개 인자에 무리하게 적용 금지** — 호출이 오히려 verbose. Fowler도 "Long" Parameter List 한정 처방으로 명시
2. **God Object 만들지 말 것** — 관련 없는 필드를 한 객체에 욱여넣으면 응집도 하락. 응집된 묶음만 모은다
3. **받은 객체를 함수 내부에서 mutate 금지** — 호출자 상태가 바뀌어 추적 불가능한 버그 유발. 읽기 전용 또는 새 객체 반환
4. **타입을 호출처마다 재정의 금지** — SSoT가 깨져 drift 발생. 단일 위치에 두고 import

### 헷갈리기 쉬운 점
- "Parameter Object Pattern"·"Options Object"·"payload"는 **다른 패턴이 아니다**. 명명 맥락 차이
- 구글 검색에서 `Introduce Parameter Object`가 우세한 이유는 Fowler 책의 항목 제목이 그것이기 때문
- TypeScript의 `interface`로 정의하든 `type`으로 정의하든 패턴 본질은 동일
- 필드 일부가 선택적이면 `?:` 또는 `Partial<T>` 활용 — 다만 너무 많은 옵션은 인자 객체가 아닌 빌더 패턴 후보

## 참고 자료
- Martin Fowler, 『Refactoring: Improving the Design of Existing Code』 — "Introduce Parameter Object" 항목
- Refactoring Guru: https://refactoring.guru/introduce-parameter-object
- 관련 study 노트: `.claude/study/2026-05-05/typescript-타입-합성-pick-extends-ssot.md` (SSoT 개념과 직접 연결)
