import type { QuizCategory } from '../../types'

interface CategoryCardProps {
  category: QuizCategory
  selected: boolean
  onToggle: (id: string) => void
}

export default function CategoryCard({ category, selected, onToggle }: CategoryCardProps) {
  return (
    <div
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
        selected
          ? 'bg-blue-600 shadow-sm'
          : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
      }`}
      onClick={() => onToggle(category.id)}
    >
      {/* 아이콘 */}
      <span
        className={`text-xl shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
          selected ? 'bg-white/20' : 'bg-gray-50'
        }`}
      >
        {category.icon}
      </span>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate leading-tight ${selected ? 'text-white' : 'text-gray-800'}`}>
          {category.title}
        </p>
        <p className={`text-xs mt-0.5 ${selected ? 'text-blue-100' : 'text-gray-400'}`}>
          {category.questionCount}문제
        </p>
      </div>

      {/* 체크 표시 */}
      {selected && (
        <span className="shrink-0 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] font-bold">
          ✓
        </span>
      )}
    </div>
  )
}
