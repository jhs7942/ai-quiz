import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 px-5 text-center">
      <nav className="flex justify-center items-center gap-1 text-sm text-gray-500 flex-wrap">
        <Link to="/about" className="hover:text-gray-800 transition-colors px-2 py-1">About us</Link>
        <span className="text-gray-300">|</span>
        <Link to="/contact" className="hover:text-gray-800 transition-colors px-2 py-1">Contact</Link>
        <span className="text-gray-300">|</span>
        <Link to="/privacy" className="hover:text-gray-800 transition-colors px-2 py-1">Privacy</Link>
        <span className="text-gray-300">|</span>
        <Link to="/report" className="hover:text-gray-800 transition-colors px-2 py-1">Report</Link>
      </nav>
      <p className="mt-2 text-xs text-gray-400">© 2025 AI Quiz. All rights reserved.</p>
    </footer>
  )
}
