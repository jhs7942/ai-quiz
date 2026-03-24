import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import ProgressBar from '../components/quiz/ProgressBar'
import QuizCard from '../components/quiz/QuizCard'
import QuestionNavigator from '../components/quiz/QuestionNavigator'
import FeedbackModal from '../components/common/FeedbackModal'
import Toast from '../components/common/Toast'
import { useQuizStore } from '../store/quizStore'
import { useSession } from '../hooks/useSession'

export default function QuizPage() {
  const { userId } = useSession('/quiz')
  const navigate = useNavigate()
  const {
    questions,
    currentIndex,
    answers,
    answeredIds,
    skippedIds,
    submitAnswer,
    skipQuestion,
    goToQuestion,
  } = useQuizStore()

  const [feedbackTarget, setFeedbackTarget] = useState<{ questionIndex: number } | null>(null)
  const [toast, setToast] = useState('')

  if (questions.length === 0) {
    navigate('/')
    return null
  }

  const currentQuestion = questions[currentIndex]
  const isAnswered = answeredIds.includes(currentQuestion.id)
  const answeredCount = answeredIds.length

  // 퀴즈 ID는 문제의 출처 파일을 알 수 없어서 'unknown'으로 처리
  // 실제로는 quizStore에서 quizId를 관리해야 하지만 현재는 단순화
  const quizId = 'quiz'

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1)
    }
  }

  function handleSkip() {
    skipQuestion(currentQuestion.id)
  }

  function handleFinish() {
    navigate('/result')
  }

  const isLastQuestion = currentIndex === questions.length - 1
  const allAnswered = answeredIds.length + skippedIds.length >= questions.length
  const canFinish = answeredIds.length > 0

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 상단 진행 정보 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <ProgressBar current={answeredCount} total={questions.length} />
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 shrink-0"
          >
            나가기
          </button>
        </div>

        <div className="flex gap-6">
          {/* 메인 퀴즈 영역 */}
          <div className="flex-1">
            {/* 문제 번호 */}
            <p className="text-xs text-gray-500 mb-3">
              {currentIndex + 1} / {questions.length}
            </p>

            <QuizCard
              question={currentQuestion}
              submitted={isAnswered}
              userAnswer={answers[currentQuestion.id]}
              onSubmit={(answer) => submitAnswer(currentQuestion.id, answer)}
              onReport={() => setFeedbackTarget({ questionIndex: currentIndex })}
            />

            {/* 하단 네비게이션 */}
            <div className="flex justify-between mt-4 gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 rounded-full text-sm border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-gray-300 transition-colors"
              >
                ← 이전
              </button>

              <div className="flex gap-2">
                {!isAnswered && (
                  <button
                    onClick={handleSkip}
                    className="px-5 py-2.5 rounded-full text-sm border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    건너뛰기
                  </button>
                )}

                {isLastQuestion && canFinish ? (
                  <button
                    onClick={handleFinish}
                    className="px-5 py-2.5 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    결과 보기 →
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={currentIndex >= questions.length - 1}
                    className="px-5 py-2.5 rounded-full text-sm bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
                  >
                    다음 →
                  </button>
                )}
              </div>
            </div>

            {allAnswered && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleFinish}
                  className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
                >
                  결과 보기 →
                </button>
              </div>
            )}
          </div>

          {/* 문제 번호 네비게이터 (데스크톱) */}
          <div className="hidden lg:block w-44 shrink-0">
            <QuestionNavigator
              total={questions.length}
              currentIndex={currentIndex}
              answeredIds={answeredIds}
              skippedIds={skippedIds}
              questionIds={questions.map((q) => q.id)}
              onNavigate={goToQuestion}
            />
          </div>
        </div>
      </div>

      {/* 신고 모달 */}
      {feedbackTarget !== null && userId && (
        <FeedbackModal
          question={questions[feedbackTarget.questionIndex]}
          quizId={quizId}
          userId={userId}
          onClose={() => setFeedbackTarget(null)}
          onSuccess={() => {
            setFeedbackTarget(null)
            setToast('신고가 접수되었습니다.')
          }}
        />
      )}

      {/* 토스트 */}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
