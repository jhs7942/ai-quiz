import { useEffect, useRef, useState } from 'react'
import { getSessionId } from '../lib/session'
import { upsertUser, logAccess } from '../lib/db'

// [학습] 페이지 진입 시 익명 사용자를 식별·등록하고 접속 로그를 남기는 훅.
//        호출처: 각 페이지 컴포넌트 (MainPage, QuizPage 등) 의 최상단에서 useSession('/quiz') 형태.

export function useSession(pagePath: string) {
  // [학습] userId 는 비동기로 채워진다 — 초기엔 null, upsertUser 가 끝나면 실제 id.
  //        호출처에서 userId 가 null 인 동안엔 DB 호출을 미루도록 분기해야 한다.
  const [userId, setUserId] = useState<string | null>(null)
  // [학습] useRef(false) — "한 번만 실행" 가드. useState 와 달리 ref 변경은 리렌더를 유발하지 않으므로 플래그 용도에 적합.
  //        StrictMode 에서 useEffect 가 2번 실행되더라도 두 번째 호출은 ref 가 이미 true 라 스킵.
  const initialized = useRef(false)

  useEffect(() => {
    // [학습] 중복 실행 방지 — StrictMode + dev 환경에서 effect 가 2번 호출되어도 upsertUser/logAccess 가 1번만 실행되도록.
    if (initialized.current) return
    initialized.current = true

    const sessionId = getSessionId()
    // [학습] navigator.userAgent — 브라우저 정보. 분석용으로 DB 에 보낸다.
    //        대안 navigator.userAgentData 는 더 정밀하지만 호환성이 낮아 여기서는 기본 userAgent 사용.
    const userAgent = navigator.userAgent

    // [학습] async/await 대신 .then() 을 쓴 이유 — useEffect 콜백은 cleanup 함수를 반환해야 하는데, async 함수는 자동으로 Promise 를 반환해 충돌.
    //        해결책: 외부에서 .then() 으로 처리하거나, 내부에 IIFE async 를 만든다 (`async function run() {} run()`).
    upsertUser(sessionId, userAgent).then((id) => {
      setUserId(id)
      logAccess(id, pagePath, userAgent)
    })
    // [학습] deps [pagePath] — pagePath 가 바뀌어도 실제로는 재실행되지 않는다 (initialized.current 가드).
    //        ESLint react-hooks/exhaustive-deps 만족용. 실질적으로는 mount-once 효과.
  }, [pagePath])

  return { userId }
}
