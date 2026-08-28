import { Link } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'

// [학습] props 인터페이스 — optional(?:) 만으로 구성. 호출처에서 prop 을 안 넘기면 undefined.
//        showMenuButton 처럼 boolean optional 은 기본값을 false 로 처리하는 컨벤션 (조건부 렌더링과 짝).
interface HeaderProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

// [학습] 함수 시그니처에서 props 를 직접 구조 분해 — { onMenuToggle, showMenuButton }: HeaderProps.
//        타입 어노테이션을 객체 뒤에 적는다. 인자가 많아지면 별도 변수로 받아 props.xxx 로 쓰는 게 가독성이 나을 수도.
export default function Header({ onMenuToggle, showMenuButton }: HeaderProps) {
  const { isDark, toggle } = useDarkMode()

  return (
    // [학습] sticky top-0 z-30 — 페이지 스크롤 시 헤더가 상단에 붙어있도록. z-30 은 다른 요소(드로어 등)와의 stacking 관계.
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-5 gap-4 sticky top-0 z-30">
      {/* [학습] showMenuButton && (...) — JSX 에서 falsy 값(false/null/undefined/0/'')은 렌더되지 않는다.
          하지만 0 은 렌더되니 주의 — `count && <Badge/>` 처럼 number 검사는 `count > 0` 로 명시. */}
      {showMenuButton && (
        <button
          // [학습] onMenuToggle 가 optional 이라도 showMenuButton 이 true 일 때만 보이는 구조라 안전.
          //        엄격히는 onMenuToggle?.() 형태로 옵셔널 호출이 더 안전.
          onClick={onMenuToggle}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 lg:hidden"
          // [학습] aria-label — 시각적 텍스트가 없는 버튼(아이콘만)에 스크린리더용 라벨 제공. 접근성 필수.
          aria-label="메뉴 열기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      {/* [학습] Link 컴포넌트 — react-router-dom 이 제공. 내부적으로 <a href="/"> 를 렌더하지만 클릭 시 페이지 리로드 없이
          history.pushState 로 라우팅. 일반 <a> 를 쓰면 SPA 가 깨지므로 항상 Link/NavLink 를 사용. */}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <span className="text-xl">🧠</span>
        <span className="text-base font-bold text-gray-800 dark:text-gray-100">AI Quiz</span>
      </Link>
      <nav className="ml-auto flex items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        <Link to="/about" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">About</Link>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <Link to="/contact" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Contact</Link>
        <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">·</span>
        <Link to="/privacy" className="hidden sm:inline hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Privacy</Link>
        <button
          onClick={toggle}
          className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="다크 모드 토글"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  )
}
