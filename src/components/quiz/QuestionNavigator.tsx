interface QuestionNavigatorProps {
  total: number
  currentIndex: number
  answeredIds: number[]
  skippedIds: number[]
  questionIds: number[]
  onNavigate: (index: number) => void
}

export default function QuestionNavigator({
  total,
  currentIndex,
  answeredIds,
  skippedIds,
  questionIds,
  onNavigate,
}: QuestionNavigatorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-500 mb-3">문제 목록</p>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const qid = questionIds[i]
          const isAnswered = answeredIds.includes(qid)
          const isSkipped = skippedIds.includes(qid)
          const isCurrent = i === currentIndex

          let style = 'text-gray-400 border border-gray-200'
          if (isCurrent) style = 'bg-blue-600 text-white border-blue-600'
          else if (isAnswered) style = 'bg-blue-100 text-blue-700 border-blue-200'
          else if (isSkipped) style = 'bg-orange-50 text-orange-500 border-orange-200'

          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              title={isAnswered ? '완료' : isSkipped ? '건너뜀' : '미풀이'}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${style}`}
            >
              {isAnswered ? '●' : isSkipped ? '◈' : i + 1}
            </button>
          )
        })}
      </div>
      <div className="mt-3 space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-2"><span className="text-blue-600">●</span> 완료</div>
        <div className="flex items-center gap-2"><span className="text-orange-400">◈</span> 건너뜀</div>
        <div className="flex items-center gap-2"><span>숫자</span> 미풀이</div>
      </div>
    </div>
  )
}
