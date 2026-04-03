interface QuestionNavigatorProps {
  total: number
  currentIndex: number
  answeredIds: number[]
  skippedIds: number[]
  questionIds: number[]
  onNavigate: (index: number) => void
  compact?: boolean
  correctIds?: number[]
  wrongIds?: number[]
}

export default function QuestionNavigator({
  total,
  currentIndex,
  answeredIds,
  skippedIds,
  questionIds,
  onNavigate,
  compact = false,
  correctIds,
  wrongIds,
}: QuestionNavigatorProps) {
  const buttons = Array.from({ length: total }, (_, i) => {
    const qid = questionIds[i]
    const isAnswered = answeredIds.includes(qid)
    const isSkipped = skippedIds.includes(qid)
    const isCurrent = i === currentIndex
    const isCorrect = correctIds?.includes(qid)
    const isWrong = wrongIds?.includes(qid)

    let style = 'text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600'
    if (isCurrent) style = 'bg-blue-600 text-white border-blue-600'
    else if (isCorrect) style = 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    else if (isWrong) style = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
    else if (isAnswered) style = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    else if (isSkipped) style = 'bg-orange-50 text-orange-500 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'

    const content = isCorrect ? '✓' : isWrong ? '✗' : isAnswered ? '●' : isSkipped ? '◈' : i + 1

    return (
      <button
        key={i}
        onClick={() => onNavigate(i)}
        title={isCorrect ? '정답' : isWrong ? '오답' : isAnswered ? '완료' : isSkipped ? '건너뜀' : '미풀이'}
        className={`w-8 h-8 shrink-0 rounded-lg text-xs font-medium transition-all ${style}`}
      >
        {content}
      </button>
    )
  })

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {buttons}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">문제 목록</p>
      <div className="grid grid-cols-5 gap-1.5">
        {buttons}
      </div>
      <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
        {correctIds !== undefined ? (
          <>
            <div className="flex items-center gap-2"><span className="text-green-600 dark:text-green-400">✓</span> 정답</div>
            <div className="flex items-center gap-2"><span className="text-red-600 dark:text-red-400">✗</span> 오답</div>
          </>
        ) : (
          <div className="flex items-center gap-2"><span className="text-blue-600">●</span> 완료</div>
        )}
        <div className="flex items-center gap-2"><span className="text-orange-400">◈</span> 건너뜀</div>
        <div className="flex items-center gap-2"><span>숫자</span> 미풀이</div>
      </div>
    </div>
  )
}
