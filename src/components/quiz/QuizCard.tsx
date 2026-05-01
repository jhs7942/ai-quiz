import { useRef, useEffect } from 'react'
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
  // [학습] useRef<HTMLDivElement>(null) — DOM 요소 참조. .current 로 접근. <div ref={choicesRef}> 처럼 JSX 에 연결.
  //        useState 와 다른 점 — 값이 바뀌어도 리렌더 안 한다. DOM 직접 조작(focus, scroll 등) 에 적합.
  const choicesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 문제 전환 시 객관식은 첫 번째 선택지, 주관식은 input에 포커스
  // [학습] deps [question.id] — 문제 id 가 바뀔 때마다 effect 실행 (= 다음 문제로 넘어갈 때 자동 포커스).
  //        키보드만으로도 끊김 없이 풀 수 있게 하는 접근성 개선.
  useEffect(() => {
    if (isChecked) return
    if (question.type === 'short_answer') {
      // [학습] inputRef.current?.focus() — 옵셔널 체이닝. ref 가 null 이면(언마운트 등) 안전하게 무시.
      inputRef.current?.focus()
    } else {
      // [학습] querySelector + as HTMLElement — DOM 노드를 더 좁은 타입으로 단언.
      //        Element 는 focus() 가 없지만 HTMLElement 에는 있다. 단언 없이 호출하면 TS 에러.
      const firstBtn = choicesRef.current?.querySelector('button:not([disabled])') as HTMLElement
      firstBtn?.focus()
    }
  }, [question.id])

  // 객관식: Tab 키로 선택지 1~4만 순환
  // [학습] e.preventDefault() + 직접 focus 이동 — 기본 Tab 동작(브라우저의 다음 포커서블 요소)을 막고,
  //        선택지 4개 안에서만 순환하도록 강제. 키보드 사용자가 퀴즈 영역을 벗어나지 않게 하는 UX.
  // [학습] e.shiftKey — Shift 동시 입력 여부. Shift+Tab 은 역방향. 한 핸들러에서 양방향 처리.
  function handleChoicesKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return
    if (!choicesRef.current) return
    const buttons = Array.from(choicesRef.current.querySelectorAll('button:not([disabled])')) as HTMLElement[]
    if (buttons.length === 0) return

    e.preventDefault()
    const idx = buttons.indexOf(document.activeElement as HTMLElement)
    if (e.shiftKey) {
      // [학습] idx <= 0 이면 마지막으로 — 0 미만(=-1: 현재 포커스가 버튼이 아님)도 같이 처리.
      buttons[idx <= 0 ? buttons.length - 1 : idx - 1].focus()
    } else {
      buttons[idx >= buttons.length - 1 ? 0 : idx + 1].focus()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 relative">
      {/* 신고 버튼 */}
      <button
        onClick={onReport}
        tabIndex={-1}
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
        <div ref={choicesRef} onKeyDown={handleChoicesKeyDown} className="space-y-2">
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
        <div onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); inputRef.current?.focus() } }}>
          <input
            ref={inputRef}
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
