import type { Question } from '../../types'

interface ReviewCardProps {
  question: Question
  userAnswer: string | undefined
  isCorrect: boolean
  isSkipped?: boolean
}

export default function ReviewCard({ question, userAnswer, isCorrect, isSkipped }: ReviewCardProps) {
  // [학습] early return — isSkipped 케이스를 먼저 처리하고 본문에서는 정답/오답 두 케이스만. 분기를 단순화.
  //        대안: 한 return 안에서 ternary 깊은 nesting → 가독성 떨어짐. early return 이 깔끔.
  if (isSkipped) {
    return (
      <div className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-gray-50/50">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-sm font-bold shrink-0 text-gray-400">↷</span>
          <p className="text-sm text-gray-700 font-medium leading-relaxed">{question.question}</p>
        </div>
        <div className="pl-5 text-xs text-gray-400">건너뜀</div>
      </div>
    )
  }

  return (
    <div
      className={`p-3 sm:p-4 rounded-xl border ${
        isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className={`text-sm font-bold shrink-0 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? '✓' : '✗'}
        </span>
        <p className="text-sm text-gray-800 font-medium leading-relaxed">{question.question}</p>
      </div>
      <div className="pl-5 space-y-1 text-xs text-gray-600">
        {/* [학습] userAnswer ?? '(미답변)' — null/undefined 일 때만 기본 문자열 표시. 빈 문자열('') 은 통과해서 그대로 보인다. */}
        <p><span className="font-semibold">내 답: </span>{userAnswer ?? '(미답변)'}</p>
        <p><span className="font-semibold">정답: </span>{Array.isArray(question.answer) ? question.answer.join(' / ') : question.answer}</p>
        <p className="text-gray-500 leading-relaxed mt-1">{question.explanation}</p>
      </div>
    </div>
  )
}
