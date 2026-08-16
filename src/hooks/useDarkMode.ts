import { useEffect, useState } from 'react'

// [학습] "use" 로 시작하는 함수가 React 의 커스텀 훅. 컴포넌트 안에서만 호출되어야 하고,
//        내부에서 useState/useEffect 등 다른 훅을 자유롭게 호출할 수 있다.
//        커스텀 훅은 "여러 컴포넌트가 같은 stateful 로직을 공유" 할 때 만든다 — 단순 함수와 다른 점은 hook 사용 가능 여부.
export function useDarkMode() {
  // [학습] useState(() => ...) — lazy initializer. 함수를 넘기면 첫 렌더 시에만 실행된다.
  //        무거운 초기화(localStorage 읽기, JSON 파싱 등)를 매 렌더마다 하지 않으려는 최적화 패턴.
  //        그냥 useState(localStorage.getItem(...)) 도 동작은 하지만, 매 렌더에서 localStorage 호출이 일어난다.
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    // [학습] 사용자 명시 선택이 있으면 그걸 따른다 — 시스템 설정 변경에도 사용자 의도가 우선.
    if (stored) return stored === 'dark'
    // [학습] window.matchMedia(...) — OS 다크모드 환경설정을 읽는 표준 API. 첫 방문자의 기본값으로 사용.
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // [학습] useEffect — isDark 가 바뀔 때마다 DOM(document.documentElement = <html>) 의 class 를 동기화.
  //        Tailwind 의 dark:* 클래스가 <html class="dark"> 를 감지해 다크 스타일 적용.
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    // [학습] cleanup 함수가 없는 이유 — class add/remove 와 localStorage 쓰기는 누적되는 부수효과가 아니라 "최신 상태 동기화".
    //        이벤트 리스너처럼 누적되는 자원이 있을 때만 cleanup 필요.
  }, [isDark])

  // [학습] 훅의 반환값은 자유 — 객체로 묶으면 호출처에서 { isDark, toggle } 처럼 명시적으로 골라 쓸 수 있다.
  //        toggle 안의 setIsDark((prev) => !prev) 는 함수형 업데이트 — "이전 값" 을 기준으로 토글해서 race 안전.
  return { isDark, toggle: () => setIsDark((prev) => !prev) }
}
