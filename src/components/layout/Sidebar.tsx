import type { QuizCategory } from '../../types'
import CategoryCard from '../common/CategoryCard'
import { useWrongNoteStore } from '../../store/wrongNoteStore'

interface SidebarProps {
  categories: QuizCategory[]
  selected: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
  isOpen?: boolean
  onClose?: () => void
  mode?: 'category' | 'mock-exam' | 'wrong-note'
  onMockExamClick?: () => void
  onWrongNoteClick?: () => void
}

export default function Sidebar({
  categories,
  selected,
  onToggle,
  onToggleAll,
  isOpen,
  onClose,
  mode = 'category',
  onMockExamClick,
  onWrongNoteClick,
}: SidebarProps) {
  const allSelected = selected.length === categories.length && categories.length > 0
  const wrongNoteCount = useWrongNoteStore((s) => s.wrongNotes.length)

  const content = (
    <div className="flex flex-col h-full">
      {/* 실전 모의고사 항목 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { onMockExamClick?.(); onClose?.() }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'mock-exam'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span>📋</span>
          <span>실전 모의고사</span>
        </button>
      </div>

      {/* 카테고리 영역 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">퀴즈 카테고리</h2>
          <button
            onClick={onToggleAll}
            className="text-xs text-blue-600 hover:underline"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        {selected.length > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-1.5">
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

      {/* 오답노트 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => { onWrongNoteClick?.(); onClose?.() }}
          disabled={wrongNoteCount === 0}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
            mode === 'wrong-note'
              ? 'bg-orange-500 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span>오답노트</span>
          </div>
          {wrongNoteCount > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              mode === 'wrong-note'
                ? 'bg-white/20 text-white'
                : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
            }`}>
              {wrongNoteCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* 데스크톱: 고정 사이드바 */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#F0EDE8] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-56px)] sticky top-14 flex-col">
        {content}
      </aside>

      {/* 모바일: 드로어 */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative w-72 bg-[#F0EDE8] dark:bg-gray-800 h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">퀴즈 카테고리</span>
              <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
