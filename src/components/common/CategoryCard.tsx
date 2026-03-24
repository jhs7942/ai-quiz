import type { QuizCategory } from '../../types'

interface CategoryCardProps {
  category: QuizCategory
  selected: boolean
  onToggle: (id: string) => void
}

export default function CategoryCard({ category, selected, onToggle }: CategoryCardProps) {
  return (
    <div
      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
      }`}
      onClick={() => onToggle(category.id)}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(category.id)}
          className="mt-0.5 accent-blue-600 w-4 h-4 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{category.icon}</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{category.title}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{category.description}</p>
          <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
            {category.questionCount}문제
          </span>
        </div>
      </div>
    </div>
  )
}
