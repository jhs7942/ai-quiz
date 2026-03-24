import type { Question } from '../../types'
import ChoiceButton from './ChoiceButton'
import FeedbackPanel from './FeedbackPanel'

interface QuizCardProps {
  question: Question
  selectedAnswer: string | undefined  // 현재 선택/입력한 답변 (채점 전)
  isChecked: boolean                  // 정답 확인 완료 여부
  isCorrect: boolean | undefined      // isChecked일 때만 유효
  onSelect: (answer: string) => void  // 답변 선택 또는 입력
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
      {/* 신고 버튼 */}
      <button
        onClick={onReport}
        className="absolute top-4 right-4 text-xs text-orange-500 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full border border-orange-200 transition-colors"
      >
        🚨 신고하기
      </button>

      {/* 문제 텍스트 */}
      <p className="text-base font-medium text-gray-800 leading-relaxed pr-28 mb-5">
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
                disabled={false}  // 채점 후에도 클릭 가능 (답변 수정용)
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
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="답을 입력하세요"
            value={selectedAnswer ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            disabled={isChecked}
          />
          {isChecked && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">정답</p>
              <p className="text-sm font-semibold text-gray-800">{Array.isArray(question.answer) ? question.answer.join(' / ') : question.answer}</p>
            </div>
          )}
        </div>
      )}

      {/* 피드백 패널 — 정답 확인 후에만 표시 */}
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
