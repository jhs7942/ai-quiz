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
      {/* [학습] Array.isArray + 삼항 — string | string[] 유니온 타입을 화면용 문자열로 평탄화.
          .join(' / ') 로 복수 정답을 슬래시 구분 표시. 타입가드로 안전하게 분기 — TS 가 isArray 후 string[] 로 narrowing. */}
      {!isCorrect && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          <span className="font-semibold">정답: </span>{Array.isArray(correctAnswer) ? correctAnswer.join(' / ') : correctAnswer}
        </p>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{explanation}</p>
    </div>
  )
}
