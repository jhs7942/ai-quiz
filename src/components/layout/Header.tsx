import { Link } from 'react-router-dom'

interface HeaderProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export default function Header({ onMenuToggle, showMenuButton }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 sticky top-0 z-30">
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="text-gray-500 hover:text-gray-800 lg:hidden"
          aria-label="메뉴 열기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <span className="text-xl">🧠</span>
        <span className="text-base font-bold text-gray-800">AI Quiz</span>
      </Link>
      <nav className="ml-auto flex items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500">
        <Link to="/about" className="hover:text-gray-800 transition-colors">About</Link>
        <span className="text-gray-300">·</span>
        <Link to="/contact" className="hover:text-gray-800 transition-colors">Contact</Link>
        <span className="text-gray-300 hidden sm:inline">·</span>
        <Link to="/privacy" className="hidden sm:inline hover:text-gray-800 transition-colors">Privacy</Link>
      </nav>
    </header>
  )
}
