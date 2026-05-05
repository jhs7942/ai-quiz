# JavaScript/TypeScript 비동기 — Promise, async, await

## 학습 환경
- 날짜: 2026-05-03 / 관련 프로젝트: ai-quiz / 기술·버전: TypeScript 5.x, ES2022+

## 배경
ai-quiz의 `fetchMockExams` 함수를 보다가 반환 타입 `Promise<MockExam[]>`의 의미를 추적하기 시작. 처음엔 "API 결과 타입"으로 단편 이해했지만, Promise는 출처와 무관한 일반적인 "지연된 값" 컨테이너라는 본질을 학습. 이어서 async/await의 동작 원리, 마이크로태스크 양보, 흔한 함정(forEach + await, await 누락 등)까지 정리.

연관 파일: `src/lib/db.ts`, `src/lib/quiz.ts` 등 fetch와 Supabase 호출이 있는 모든 모듈.

## 핵심 개념

### 1. Promise<T>의 진짜 의미
> **"지금은 값이 없지만, 나중에 T 타입의 값이 도착할 거다"** 라는 약속(promise) 객체.

API 결과만이 아니다. 시간이 걸리는 모든 작업(파일 I/O, 타이머, 사용자 입력 대기, 다른 비동기 작업)의 결과를 표현하는 일반 컨테이너.

```ts
const p1: Promise<number> = new Promise(r => setTimeout(() => r(42), 1000));
const p2: Promise<string> = readFile('/path');
const p3: Promise<MockExam[]> = fetch('/...').then(r => r.json());
// 셋 다 똑같은 Promise<T> — 출처는 무관, "나중에 T가 올 거다"라는 의미
```

### 2. Promise의 3가지 상태
| 상태 | 의미 |
|------|------|
| **pending** (대기) | 아직 작업이 끝나지 않음 |
| **fulfilled** (이행) | 작업 성공, 값 도착 |
| **rejected** (거부) | 작업 실패, 에러 발생 |

`Promise<T>`의 `T`는 fulfilled됐을 때 받을 값의 타입.

### 3. Promise를 다루는 두 문법
- **.then() / .catch()** — 전통적, 콜백 기반
- **async / await** — 현대적, 동기 코드처럼 읽힘 (문법적 설탕)

둘 다 **동작은 동일**, 가독성 차이만 있음.

### 4. async 키워드
> **"이 함수는 항상 Promise를 반환한다"** 는 선언.

자동 변환 규칙:
1. 함수 안에서 무엇을 return하든 자동으로 Promise로 감싸줌
2. throw하면 rejected Promise로 변환됨
3. 함수 안에서 await 사용 가능

```ts
function f1() { return 42; }              // number
async function f2() { return 42; }        // Promise<number>
```

### 5. await 키워드
> Promise 앞에 붙여서 **"끝날 때까지 기다렸다가 값을 꺼낸다"**.

4가지 효과:
1. Promise가 fulfilled될 때까지 대기
2. fulfilled되면 값을 꺼내서 반환 (Promise를 풀어줌)
3. rejected되면 throw로 변환 (try/catch로 잡힘)
4. 기다리는 동안 이벤트 루프에 제어권 양보 (다른 작업 계속됨)

### 6. await의 실행 흐름 (핵심)
`await`는 함수를 진짜로 멈추는 게 아니라, **함수의 나머지를 "Promise가 끝나면 실행"으로 예약**하고 즉시 호출자에게 제어권을 돌려준다.

```ts
async function load() {
  console.log('1');
  const data = await fetch('/api');  // ← 여기서 함수 일시 정지
  console.log('2');
}

load();
console.log('3');

// 출력: 1 → 3 → 2  (await 동안 외부 코드 먼저 실행)
```

JavaScript는 단일 스레드이므로 진짜로 멈추면 다른 일을 못 한다. await는 "멈추는 척"하면서 작업 큐에 등록만 한다.

## 실제 적용

### 이 프로젝트의 fetchMockExams 분석
```ts
export async function fetchMockExams(): Promise<MockExam[]> {
  const res = await fetch('/quizzes/mock-exams/index.json')
  const data = await res.json()
  return data
}
```

해석:
1. `async function ... : Promise<MockExam[]>` → 비동기이며 결과는 MockExam[] 배열을 담은 Promise
2. `await fetch(...)` → 응답 헤더가 도착할 때까지 대기 (본문은 아직 안 읽음)
3. `await res.json()` → 본문을 읽어서 JSON 파싱 (이것도 비동기)
4. `return data` → async가 자동으로 Promise로 감싸줌

**fetch는 두 단계 await 필요**: 응답 헤더 받기 + 본문 파싱.

### 호출 패턴
```ts
// 방법 A: await
async function loadPage() {
  const exams = await fetchMockExams();  // exams: MockExam[]
}

// 방법 B: .then()
fetchMockExams().then(exams => { ... });
```

### 자주 쓰는 패턴

#### 패턴 A: try/catch로 에러 처리
```ts
async function load() {
  try {
    const data = await fetchMockExams();
    return data;
  } catch (err) {
    console.error('로드 실패:', err);
    return [];  // fallback
  }
}
```

#### 패턴 B: 병렬 실행 (Promise.all)
```ts
// ❌ 순차 (느림): 총 시간 = A + B
const a = await fetchA();
const b = await fetchB();

// ✅ 병렬 (빠름): 총 시간 = max(A, B)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

#### 패턴 C: 순차 vs 병렬 선택
- 결과가 서로 의존적 → 순차 (await 연속)
- 결과가 독립적 → 병렬 (Promise.all)

#### 패턴 D: 조건부 await
```ts
async function getData(useCache: boolean) {
  if (useCache) return cache.get();  // 동기 반환도 OK (자동 Promise 감쌈)
  return await fetch('/api').then(r => r.json());
}
```

### 타입 추론
```ts
async function f() { return 42; }
const result = await f();
// f(): Promise<number>
// await f(): number

type R = Awaited<ReturnType<typeof f>>;  // number
```

## 주의사항

### 1. await 잊으면 Promise 객체가 그대로 옴
```ts
async function bad() {
  const data = fetchMockExams();  // ❌ await 누락
  console.log(data);  // Promise 객체 출력 (값 아님)
  data.length;        // ❌ Promise에 length 없음
}
```
TypeScript가 잡아주지만 일반 JS에서는 조용히 넘어감.

### 2. async 함수 밖에서 await 못 씀 (top-level await 제외)
- ES2022+ 모듈에서는 top-level await 가능 (`module: "esnext"` 등)
- 일반 코드에서 쓰려면 async 함수 안에 호출

### 3. 즉시 풀리는 Promise라도 한 사이클 양보
```ts
async function f() {
  console.log('A');
  await Promise.resolve();  // 즉시 풀림
  console.log('B');         // 마이크로태스크로 밀림
}

f();
console.log('C');
// 출력: A → C → B
```
**await는 항상 한 번 양보**한다는 사실이 동기 코드와의 가장 큰 차이.

### 4. await 없이 반환하면 try/catch가 못 잡는다
```ts
// ❌ catch 작동 안 함
async function f() {
  try {
    return fetchMockExams();  // await 없이 반환
  } catch (err) {
    // 여기로 안 옴! rejection이 외부로 전파됨
  }
}

// ✅ await 후 반환
async function f2() {
  try {
    return await fetchMockExams();  // ✅ 잡힘
  } catch (err) {
    // ✅
  }
}
```
"return await"이 중복으로 보이지만 try/catch가 필요한 경우엔 필수.

### 5. forEach 안에서 await는 안 통한다
```ts
[1, 2, 3].forEach(async (n) => {
  await someAsync(n);  // forEach는 결과를 기다리지 않음
});
console.log('done');  // 위 await가 끝나기 전에 찍힘
```
**해결책**:
```ts
// 순차 실행
for (const n of [1, 2, 3]) {
  await someAsync(n);
}

// 병렬 실행
await Promise.all([1, 2, 3].map(n => someAsync(n)));
```

### 6. async 함수의 반환 타입은 Promise<T> 형태여야 함
```ts
async function f(): Promise<number> { return 42; }  // ✅
async function f(): number { return 42; }            // ❌ 에러
```

### 7. fetch는 두 단계 await 필요
- `await fetch(...)` → 응답 헤더만 도착
- `await res.json()` → 본문 파싱

### 8. fetch는 HTTP 에러를 throw하지 않음
4xx, 5xx 응답도 Promise는 fulfilled. 직접 `res.ok` 검사 필요.
```ts
const res = await fetch('/api');
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
```

## 실무 체크리스트

| 상황 | 사용 |
|------|------|
| 비동기 결과를 표현 | `Promise<T>` 타입 |
| 함수 안에서 비동기 호출 | `async` + `await` |
| 여러 독립 작업을 동시에 | `Promise.all([...])` |
| 첫 결과만 받고 싶음 | `Promise.race([...])` |
| 일부 실패 허용하면서 모두 시도 | `Promise.allSettled([...])` |
| 에러 처리 | `try/catch` + `await` |
| 배열을 비동기 순회 | `for...of` + await (순차) 또는 `Promise.all + map` (병렬) |

## 한 줄 요약
- **Promise<T>**: "나중에 T 타입 값이 도착할 거라는 약속" 컨테이너 (출처 무관)
- **async**: "이 함수는 항상 Promise를 반환한다"는 선언, 안에서 await 사용 가능
- **await**: Promise를 풀어서 값을 꺼냄 + 그동안 이벤트 루프에 양보
- async/await는 .then() 체인의 **문법적 설탕** — 동작은 동일, 가독성만 다름

## 참고 자료
- [MDN — Promise](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN — async function](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN — await](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/await)
- [JavaScript.info — Promises, async/await](https://ko.javascript.info/async)
- 프로젝트 관련 코드: ai-quiz의 `fetchMockExams`, `src/lib/db.ts` 모든 비동기 함수
- 연관 학습 노트:
  - `.claude/study/2026-05-03/typescript-utility-types.md` (Awaited 유틸리티)
