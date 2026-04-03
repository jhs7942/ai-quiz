import type { Question } from '../../types'
import ChoiceButton from './ChoiceButton'
import FeedbackPanel from './FeedbackPanel'

interface QuizCardProps {
  question: Question
  selectedAnswer: string | undefined
  isChecked: boolean
  isCorrect: boolean | undefined
  onSelect: (answer: string) => void
  onReport: () => void
}

export default function QuizCard({
  question,
  selectedAnswer,
  isChecked,
  isCorrect,
  onSelect,
  onReport,
}: QuizCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 relative">
      {/* 신고 버튼 */}
      <button
        onClick={onReport}
        className="absolute top-4 right-4 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 transition-colors"
      >
        🚨 신고하기
      </button>

      {/* 문제 텍스트 */}
      <p className="text-base font-medium text-gray-800 dark:text-gray-100 leading-relaxed pr-28 mb-5">
        {question.question}
      </p>

      {/* 객관식 */}
      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.choices.map((choice, i) => {
            let state: 'idle' | 'selected' | 'correct' | 'wrong' | 'unselected-correct' = 'idle'
            if (isChecked) {
              if (choice === question.answer) state = 'unselected-correct'
              if (choice === selectedAnswer) {
                state = selectedAnswer === question.answer ? 'correct' : 'wrong'
              }
            } else if (choice === selectedAnswer) {
              state = 'selected'
            }
            return (
              <ChoiceButton
                key={i}
                choice={choice}
                index={i}
                state={state}
                onClick={() => onSelect(choice)}
                disabled={isChecked}
              />
            )
          })}
        </div>
      )}

      {/* 주관식 */}
      {question.type === 'short_answer' && (
        <div>
          <input
            type="text"
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
            placeholder="답을 입력하세요"
            value={selectedAnswer ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            disabled={isChecked}
          />
          {isChecked && (
            <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">정답</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{Array.isArray(question.answer) ? question.answer.join(' / ') : question.answer}</p>
            </div>
          )}
        </div>
      )}

      {/* 피드백 패널 */}
      {isChecked && isCorrect !== undefined && (
        <FeedbackPanel
          isCorrect={isCorrect}
          correctAnswer={question.answer}
          explanation={question.explanation}
        />
      )}
    </div>
  )
}
