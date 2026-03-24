import { useState } from 'react'
import type { Question } from '../../types'
import ChoiceButton from './ChoiceButton'
import FeedbackPanel from './FeedbackPanel'

interface QuizCardProps {
  question: Question
  submitted: boolean
  userAnswer: string | undefined
  onSubmit: (answer: string) => void
  onReport: () => void
}

export default function QuizCard({ question, submitted, userAnswer, onSubmit, onReport }: QuizCardProps) {
  const [inputValue, setInputValue] = useState('')
  const [selfCorrect, setSelfCorrect] = useState<boolean | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  const isCorrect =
    question.type === 'multiple_choice'
      ? userAnswer === question.answer
      : selfCorrect === true

  function handleShortAnswerSubmit() {
    if (!inputValue.trim()) return
    setShowAnswer(true)
  }

  function handleSelfGrade(correct: boolean) {
    setSelfCorrect(correct)
    onSubmit(correct ? '__correct__' : '__wrong__')
  }

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
            let state: 'idle' | 'correct' | 'wrong' | 'unselected-correct' = 'idle'
            if (submitted) {
              if (choice === question.answer) state = 'unselected-correct'
              if (choice === userAnswer) state = userAnswer === question.answer ? 'correct' : 'wrong'
            }
            return (
              <ChoiceButton
                key={i}
                choice={choice}
                index={i}
                state={state}
                onClick={() => !submitted && onSubmit(choice)}
                disabled={submitted}
              />
            )
          })}
        </div>
      )}

      {/* 주관식 */}
      {question.type === 'short_answer' && (
        <div>
          {!showAnswer ? (
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                placeholder="답을 입력하세요"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShortAnswerSubmit()}
              />
              <button
                onClick={handleShortAnswerSubmit}
                disabled={!inputValue.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
              >
                제출
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-gray-50 rounded-xl p-4 mb-3">
                <p className="text-xs text-gray-500 mb-1">정답</p>
                <p className="text-sm font-semibold text-gray-800">{question.answer}</p>
              </div>
              {!submitted && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">맞았나요?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelfGrade(true)}
                      className="flex-1 py-2 rounded-xl border border-green-400 text-green-700 bg-green-50 text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                      ✓ 맞음
                    </button>
                    <button
                      onClick={() => handleSelfGrade(false)}
                      className="flex-1 py-2 rounded-xl border border-red-400 text-red-700 bg-red-50 text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      ✗ 틀림
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 피드백 패널 */}
      {submitted && (
        <FeedbackPanel
          isCorrect={isCorrect}
          correctAnswer={question.answer}
          explanation={question.explanation}
        />
      )}
    </div>
  )
}
