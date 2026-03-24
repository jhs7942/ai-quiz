import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import ProgressBar from '../components/quiz/ProgressBar'
import QuizCard from '../components/quiz/QuizCard'
import QuestionNavigator from '../components/quiz/QuestionNavigator'
import FeedbackModal from '../components/common/FeedbackModal'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'
import { useQuizStore } from '../store/quizStore'
import { useSession } from '../hooks/useSession'

export default function QuizPage() {
  const { userId } = useSession('/quiz')
  const navigate = useNavigate()
  const {
    questions,
    currentIndex,
    selectedAnswers,
    scoredAnswers,
    checkedIds,
    skippedIds,
    selectAnswer,
    checkAnswer,
    skipQuestion,
    goToQuestion,
  } = useQuizStore()

  const [feedbackTarget, setFeedbackTarget] = useState<{ questionIndex: number } | null>(null)
  const [toast, setToast] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showUnansweredPopup, setShowUnansweredPopup] = useState(false)

  if (questions.length === 0) {
    navigate('/')
    return null
  }

  const currentQuestion = questions[currentIndex]
  const currentId = currentQuestion.id
  const isChecked = checkedIds.includes(currentId)
  const selectedAnswer = selectedAnswers[currentId]
  const scored = scoredAnswers[currentId]
  const isCorrect = scored?.isCorrect

  const quizId = currentQuestion.quizId ?? 'quiz'
  const checkedCount = checkedIds.length

  // 미풀이 문제: 건너뛰었고 채점도 안 된 문제
  const unansweredSkipped = skippedIds.filter((id) => !checkedIds.includes(id))

  const isLastQuestion = currentIndex === questions.length - 1

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
    skipQuestion(currentId)
  }

  function handleCheck() {
    checkAnswer(currentId)
  }

  function handleFinishClick() {
    if (unansweredSkipped.length > 0) {
      setShowUnansweredPopup(true)
    } else {
      navigate('/result')
    }
  }

  function handleGoToFirstUnanswered() {
    setShowUnansweredPopup(false)
    const firstUnansweredIndex = questions.findIndex((q) => unansweredSkipped.includes(q.id))
    if (firstUnansweredIndex !== -1) goToQuestion(firstUnansweredIndex)
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Header />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 상단 진행 정보 */}
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <ProgressBar current={checkedCount} total={questions.length} />
          </div>
          <button
            onClick={() => setShowExitConfirm(true)}
            className="text-sm text-gray-500 hover:text-gray-700 shrink-0 min-h-[44px] px-2"
          >
            나가기
          </button>
        </div>

        <div className="flex gap-6">
          {/* 메인 퀴즈 영역 */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-3">
              {currentIndex + 1} / {questions.length}
            </p>

            <QuizCard
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              isChecked={isChecked}
              isCorrect={isCorrect}
              onSelect={(answer) => selectAnswer(currentId, answer)}
              onReport={() => setFeedbackTarget({ questionIndex: currentIndex })}
            />

            {/* 하단 네비게이션 */}
            <div className="flex justify-between mt-4 gap-2 sm:gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-gray-300 transition-colors"
              >
                ← 이전
              </button>

              <div className="flex gap-2 flex-1 sm:flex-none justify-end">
                {/* 건너뛰기 — 채점 전에만 */}
                {!isChecked && (
                  <button
                    onClick={handleSkip}
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    건너뛰기
                  </button>
                )}

                {/* 정답 확인 — 채점 전, 답변 선택 시 활성화 */}
                {!isChecked && (
                  <button
                    onClick={handleCheck}
                    disabled={!selectedAnswer}
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
                  >
                    정답 확인
                  </button>
                )}

                {/* 결과 보기 — 마지막 문제 채점 완료 시 */}
                {isChecked && isLastQuestion && (
                  <button
                    onClick={handleFinishClick}
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    결과 보기 →
                  </button>
                )}

                {/* 다음 — 채점 완료 후, 마지막 문제 제외 */}
                {isChecked && !isLastQuestion && (
                  <button
                    onClick={handleNext}
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    다음 →
                  </button>
                )}
              </div>
            </div>

            {/* 문제 번호 네비게이터 (모바일·태블릿) */}
            <div className="mt-4 lg:hidden">
              <QuestionNavigator
                total={questions.length}
                currentIndex={currentIndex}
                answeredIds={checkedIds}
                skippedIds={skippedIds}
                questionIds={questions.map((q) => q.id)}
                onNavigate={goToQuestion}
                compact
              />
            </div>
          </div>

          {/* 문제 번호 네비게이터 (데스크톱) */}
          <div className="hidden lg:block w-44 shrink-0">
            <QuestionNavigator
              total={questions.length}
              currentIndex={currentIndex}
              answeredIds={checkedIds}
              skippedIds={skippedIds}
              questionIds={questions.map((q) => q.id)}
              onNavigate={goToQuestion}
            />
          </div>
        </div>
      </div>

      {/* 나가기 확인 팝업 */}
      {showExitConfirm && (
        <Modal onClose={() => setShowExitConfirm(false)}>
          <h2 className="text-base font-bold text-gray-800 mb-2">퀴즈를 나가시겠습니까?</h2>
          <p className="text-sm text-gray-500 mb-5">진행 상황이 사라집니다.</p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowExitConfirm(false)}
              className="px-4 py-2 rounded-full text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              계속 풀기
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              나가기
            </button>
          </div>
        </Modal>
      )}

      {/* 미풀이 문제 팝업 */}
      {showUnansweredPopup && (
        <Modal onClose={() => setShowUnansweredPopup(false)}>
          <h2 className="text-base font-bold text-gray-800 mb-2">아직 풀지 않은 문제가 있어요</h2>
          <p className="text-sm text-gray-500 mb-5">
            건너뛴 문제 {unansweredSkipped.length}개가 남아있습니다.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleGoToFirstUnanswered}
              className="px-4 py-2 rounded-full text-sm border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              문제 풀러 가기
            </button>
            <button
              onClick={() => { setShowUnansweredPopup(false); navigate('/result') }}
              className="px-4 py-2 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              제출
            </button>
          </div>
        </Modal>
      )}

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

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
