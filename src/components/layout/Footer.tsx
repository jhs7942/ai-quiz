import { Link } from 'react-router-dom'

// [학습] 가장 단순한 함수 컴포넌트 — props 없음, 상태 없음, 로직 없음. 그냥 JSX 만.
//        이런 컴포넌트는 React.memo 로 감쌀 필요도 없다 (본래 props 비교가 무의미).
export default function Footer() {
  return (
    // [학습] <footer>, <nav> 는 시맨틱 태그. <div> 만 쓰는 것보다 검색엔진/스크린리더가 페이지 구조 파악에 도움.
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-4 px-5 text-center">
      <nav className="flex justify-center items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
        <Link to="/about" className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors px-2 py-1">About us</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link to="/contact" className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors px-2 py-1">Contact</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link to="/privacy" className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors px-2 py-1">Privacy</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link to="/report" className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors px-2 py-1">Report</Link>
      </nav>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">© 2025 AI Quiz. All rights reserved.</p>
    </footer>
  )
}
