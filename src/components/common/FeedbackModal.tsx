import { useState } from 'react'
import Modal from './Modal'
import { saveFeedback } from '../../lib/db'
import type { Question } from '../../types'

const REPORT_TYPES = [
  { value: 'wrong_answer', label: '정답이 틀림' },
  { value: 'ambiguous', label: '문제가 모호함' },
  { value: 'bad_explanation', label: '해설이 부정확함' },
  { value: 'option_error', label: '보기에 오류가 있음' },
  { value: 'other', label: '기타' },
]

interface FeedbackModalProps {
  question: Question
  quizId: string
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function FeedbackModal({
  question,
  quizId,
  userId,
  onClose,
  onSuccess,
}: FeedbackModalProps) {
  const [reportType, setReportType] = useState('')
  const [description, setDescription] = useState('')
  const [suggestedAnswer, setSuggestedAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!reportType) {
      setError('신고 유형을 선택해주세요.')
      return
    }
    setSubmitting(true)
    try {
      await saveFeedback({
        userId,
        quizId,
        questionId: question.id,
        reportType,
        description,
        suggestedAnswer: suggestedAnswer || undefined,
      })
      onSuccess()
    } catch {
      setError('신고 제출에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">🚨 문제 오류 신고</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        문제: "{question.question.slice(0, 60)}{question.question.length > 60 ? '...' : ''}"
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">신고 유형</p>
        {REPORT_TYPES.map((rt) => (
          <label key={rt.value} className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input
              type="radio"
              name="reportType"
              value={rt.value}
              checked={reportType === rt.value}
              onChange={() => setReportType(rt.value)}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-200">{rt.label}</span>
          </label>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">상세 내용</p>
        <textarea
          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-400"
          rows={3}
          maxLength={500}
          placeholder="구체적인 내용을 입력해주세요 (최대 500자)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">올바른 답 (선택)</p>
        <input
          type="text"
          className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          placeholder="생각하는 올바른 답을 입력해주세요"
          value={suggestedAnswer}
          onChange={(e) => setSuggestedAnswer(e.target.value)}
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-full text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-5 py-2 rounded-full text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? '제출 중...' : '제출하기'}
        </button>
      </div>
    </Modal>
  )
}
