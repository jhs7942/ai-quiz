interface FeedbackPanelProps {
  isCorrect: boolean
  correctAnswer: string | string[]
  explanation: string
}

export default function FeedbackPanel({ isCorrect, correctAnswer, explanation }: FeedbackPanelProps) {
  return (
    <div
      className={`mt-4 p-4 rounded-xl border transition-all duration-300 ${
        isCorrect
          ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
          : 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-lg ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {isCorrect ? '✓' : '✗'}
        </span>
        <span className={`text-sm font-bold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {isCorrect ? '정답입니다!' : '오답입니다'}
        </span>
      </div>
      {!isCorrect && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          <span className="font-semibold">정답: </span>{Array.isArray(correctAnswer) ? correctAnswer.join(' / ') : correctAnswer}
        </p>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{explanation}</p>
    </div>
  )
}
