import { Link } from 'react-router-dom'

export default function Footer() {
  return (
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
