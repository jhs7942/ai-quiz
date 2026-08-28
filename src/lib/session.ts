// [학습] 모듈 상단의 const KEY — "매직스트링"을 한 곳에 모아두면 오타 방지 + 나중에 키를 바꿀 때 한 줄만 수정하면 된다.
const SESSION_KEY = 'ai_quiz_session_id'

// [학습] 익명 사용자 식별을 위한 클라이언트 사이드 UUID. 로그인 없이 "이 브라우저" 단위로 이벤트를 묶기 위한 패턴.
//        Supabase 의 user_id 컬럼에 이 값이 들어간다 (lib/db.ts 참조).
//        localStorage 라서 같은 브라우저 + 같은 도메인 내에선 영구 보존. 시크릿 모드/다른 브라우저는 별도 ID.
export function getSessionId(): string {
  // [학습] "있으면 그대로, 없으면 만든다" — 흔히 idempotent(멱등) 초기화 패턴.
  //        let 으로 선언한 후 if 분기. const + 삼항 연산자로 한 줄에 쓸 수도 있지만 이쪽이 가독성↑.
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    // [학습] crypto.randomUUID() — 브라우저 내장 API (Node 19+ / 모던 브라우저). 외부 라이브러리(uuid) 불필요.
    //        보안 컨텍스트(HTTPS 또는 localhost)에서만 사용 가능. file:// 등은 동작 안 함.
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
