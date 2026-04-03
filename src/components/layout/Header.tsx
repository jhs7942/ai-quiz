import { Link } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'

interface HeaderProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export default function Header({ onMenuToggle, showMenuButton }: HeaderProps) {
  const { isDark, toggle } = useDarkMode()

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-5 gap-4 sticky top-0 z-30">
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 lg:hidden"
          aria-label="메뉴 열기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
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
