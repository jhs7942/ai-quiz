import { useEffect } from 'react'

// [학습] 페이지별 SEO 메타태그를 React 라이프사이클에 맞춰 동적으로 갱신하는 훅.
//        SPA 는 정적 HTML 의 <title> 이 모든 페이지에 똑같이 적용되므로, 라우트별로 갱신해야 검색엔진이 페이지를 구분한다.
//        라이브러리(react-helmet 등) 도 있지만, 단순 갱신은 직접 훅으로 충분.

const DEFAULT_TITLE = 'AI Quiz - 시험 직전 10분, 핵심 개념 완벽 마스터'
const DEFAULT_DESC =
  'AI 핵심 이론부터 실전 문제까지! 시험 대비 최적화 AI 퀴즈 플랫폼입니다. 짧은 시간 안에 고효율 학습을 경험하세요.'

// [학습] 단일 책임 — title 과 description 을 같이 받아 한 번에 갱신. 두 개를 분리하면 호출처가 두 훅을 호출해야 함.
export function useMeta(title: string, description: string) {
  useEffect(() => {
    // [학습] document.title 직접 할당 — DOM 표준 API. React 가 아닌 일반 JS 처럼 동작.
    document.title = title
    // [학습] querySelector(...)?.setAttribute(...)  — 옵셔널 체이닝(?.)으로 meta 태그가 없을 때 안전.
    //        index.html 에 <meta name="description"> 이 항상 있다고 가정하지만, 안전망.
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    // [학습] cleanup 함수 — 언마운트 또는 deps 가 바뀌어 effect 재실행 직전에 호출된다.
    //        여기선 페이지를 떠날 때(컴포넌트 언마운트) 기본값으로 복원 → 다음 페이지가 useMeta 를 안 쓰면 기본값 노출.
    return () => {
      document.title = DEFAULT_TITLE
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', DEFAULT_DESC)
    }
    // [학습] deps 배열 [title, description] — 둘 중 하나라도 바뀌면 cleanup → 다시 실행. 같은 페이지 안에서도 다이나믹 갱신 가능.
  }, [title, description])
}
