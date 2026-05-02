// [학습] react-router-dom 은 SPA 라우팅 라이브러리. URL 이 바뀌어도 페이지 리로드 없이 컴포넌트만 교체한다.
//        - BrowserRouter: HTML5 history API(`pushState`)를 써서 깔끔한 URL(`/quiz`)을 만든다. (HashRouter 는 `/#/quiz`)
//        - Routes/Route: 현재 URL 과 매칭되는 첫 Route 의 element 만 렌더한다 (v6 에서는 자동으로 가장 정확한 매치 선택).
//        - Navigate: 컴포넌트 형태의 리다이렉트. element 자리에 두면 마운트 즉시 to 경로로 이동.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// [학습] 페이지 컴포넌트는 상위 디렉토리(./pages/*)로 분리해 라우팅 트리를 한눈에 보이게 한다.
//        라우트가 늘어나면 lazy import + Suspense 로 코드 스플리팅을 거는 게 다음 단계.
import MainPage from './pages/MainPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import ReportPage from './pages/ReportPage'

// [학습] 함수 컴포넌트 + default export 패턴. import 시 이름을 자유롭게 줄 수 있어 유연하지만, named export 를 선호하는 팀도 많다.
export default function App() {
  return (
    // [학습] BrowserRouter 는 트리 최상단에 한 번만 둔다. 그래야 하위의 useNavigate / useLocation / Link 가 모두 같은 라우팅 컨텍스트를 공유한다.
    <BrowserRouter>
      {/* [학습] Routes 는 자식 Route 들 중 "URL 에 가장 잘 맞는 단 하나"만 골라 렌더한다. 순서는 v6에서 무관(정확도로 자동 선택). */}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/report" element={<ReportPage />} />
        {/* [학습] path="*" 는 위 어떤 라우트와도 매치되지 않은 경우의 fallback (404 캐치).
            여기서는 404 페이지 대신 메인으로 보내는 정책을 택했다.
            Navigate 의 replace 옵션은 history 스택을 "치환"한다 — 사용자가 뒤로가기 누를 때 잘못된 URL 로 다시 돌아오지 않게 막는다. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
