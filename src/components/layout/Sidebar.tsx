import type { QuizCategory } from '../../types'
import CategoryCard from '../common/CategoryCard'

interface SidebarProps {
  categories: QuizCategory[]
  selected: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({
  categories,
  selected,
  onToggle,
  onToggleAll,
  isOpen,
  onClose,
}: SidebarProps) {
  const allSelected = selected.length === categories.length && categories.length > 0

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">퀴즈 카테고리</h2>
          <button
            onClick={onToggleAll}
            className="text-xs text-blue-600 hover:underline"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        {selected.length > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">
            {selected.length}개 선택됨 (총{' '}
            {categories
              .filter((c) => selected.includes(c.id))
              .reduce((s, c) => s + c.questionCount, 0)}
            문제)
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            selected={selected.includes(cat.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* 데스크톱: 고정 사이드바 */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#F0EDE8] border-r border-gray-200 h-[calc(100vh-56px)] sticky top-14 flex-col">
        {content}
      </aside>

      {/* 모바일: 드로어 */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative w-72 bg-[#F0EDE8] h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="font-bold text-gray-700 text-sm">퀴즈 카테고리</span>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
