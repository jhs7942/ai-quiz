import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import ProgressBar from '../components/quiz/ProgressBar'
import QuizCard from '../components/quiz/QuizCard'
import QuestionNavigator from '../components/quiz/QuestionNavigator'
import FeedbackModal from '../components/common/FeedbackModal'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'
import { useQuizStore, gradeAnswer } from '../store/quizStore'
import { useSession } from '../hooks/useSession'
import { createDraftSession, saveQuizAnswer } from '../lib/db'
import type { Question } from '../types'

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
    mockExamId,
    mockExamTitle,
    quizSessionId,
    selectedCategories,
    difficulty,
    shuffle,
    startedAt,
    selectAnswer,
    checkAnswer,
    checkAllAnswers,
    skipQuestion,
    goToQuestion,
    setQuizSessionId,
  } = useQuizStore()

  const isMockExam = !!mockExamId

  const [feedbackTarget, setFeedbackTarget] = useState<{ questionIndex: number } | null>(null)
  const [toast, setToast] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showUnansweredPopup, setShowUnansweredPopup] = useState(false)

  // DB draft 세션 생성 (중복 방지)
  const creatingSession = useRef(false)
  // 이미 저장된 답안 ID 추적 (중복 INSERT 방지)
  const savedIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!userId || !startedAt || questions.length === 0) return
    if (quizSessionId || creatingSession.current) return
    creatingSession.current = true
    const selectedTypes = [...new Set(questions.map((q) => q.type))]
    createDraftSession({
      userId,
      categories: mockExamId ? [mockExamId] : selectedCategories,
      selectedTypes,
      totalQuestions: questions.length,
      startedAt,
      settings: { difficulty, shuffle },
      pretest: !!mockExamId,
    }).then((id) => {
      if (id) setQuizSessionId(id)
      creatingSession.current = false
    })
  }, [userId, startedAt, questions.length])

  // 단일 답안 즉시 저장 헬퍼
  function saveCurrentAnswer(questionId: number, question: Question, userAnswer: string, pretest: boolean) {
    if (!quizSessionId || savedIds.current.has(questionId)) return
    savedIds.current.add(questionId)
    const isCorrect = gradeAnswer(question, userAnswer)
    saveQuizAnswer(quizSessionId, {
      questionId: question.id,
      quizId: question.quizId ?? 'quiz',
      questionType: question.type,
      userAnswer,
      isCorrect,
    }, pretest)
  }

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/')
    }
  }, [questions.length, navigate])

  // early return 전에 미리 계산 (useEffect 의존성으로 사용)
  const currentQuestion = questions[currentIndex]
  const isChecked = currentQuestion ? checkedIds.includes(currentQuestion.id) : false
  const isLastQuestion = questions.length > 0 ? currentIndex === questions.length - 1 : false
  const currentId = currentQuestion?.id ?? 0
  const selectedAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined

  // 엔터키로 정답 확인 및 다음 문제 이동
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (showExitConfirm || showUnansweredPopup || feedbackTarget !== null) return

      const tag = (e.target as HTMLElement).tagName
      const isInputFocused = tag === 'INPUT' || tag === 'TEXTAREA'

      if (isMockExam) {
        if (!isInputFocused && !isLastQuestion) {
          if (selectedAnswer && currentQuestion) {
            saveCurrentAnswer(currentId, currentQuestion, selectedAnswer, true)
          }
          goToQuestion(currentIndex + 1)
        }
      } else {
        if (!isChecked && selectedAnswer) {
          checkAnswer(currentId)
          if (currentQuestion) {
            saveCurrentAnswer(currentId, currentQuestion, selectedAnswer, false)
          }
        } else if (!isInputFocused && isChecked && !isLastQuestion) {
          goToQuestion(currentIndex + 1)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMockExam, isLastQuestion, isChecked, currentIndex, goToQuestion, showExitConfirm, showUnansweredPopup, feedbackTarget, selectedAnswer, checkAnswer, currentId])

  if (questions.length === 0) {
    return null
  }

  const scored = scoredAnswers[currentId]
  const isCorrect = scored?.isCorrect

  const quizId = currentQuestion.quizId ?? 'quiz'
  const checkedCount = checkedIds.length

  // 미풀이 문제: 건너뛰었고 채점도 안 된 문제 (일반 모드)
  const unansweredSkipped = skippedIds.filter((id) => !checkedIds.includes(id))
  // 미답변 문제: 답을 선택하지 않은 문제 (모의고사 모드)
  const unansweredMock = questions.filter((q) => !selectedAnswers[q.id])

  const isSkipped = skippedIds.includes(currentId)

  // 모의고사 모드: 선택된 답변 수 기준으로 진행률 표시
  const progressCurrent = isMockExam ? Object.keys(selectedAnswers).length : checkedCount
  const mockAnsweredIds = Object.keys(selectedAnswers).map(Number)

  const correctIds = isMockExam ? undefined : Object.entries(scoredAnswers)
    .filter(([, v]) => v.isCorrect)
    .map(([k]) => Number(k))
  const wrongIds = isMockExam ? undefined : Object.entries(scoredAnswers)
    .filter(([, v]) => !v.isCorrect)
    .map(([k]) => Number(k))

  function handleNext() {
    // 모의고사: "다음" 클릭 시 현재 답변 즉시 저장
    if (isMockExam && selectedAnswer) {
      saveCurrentAnswer(currentId, currentQuestion, selectedAnswer, true)
    }
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
    // 일반 퀴즈: "정답 확인" 클릭 시 답변 즉시 저장
    const answer = selectedAnswers[currentId]
    if (answer) saveCurrentAnswer(currentId, currentQuestion, answer, false)
  }

  function handleFinishClick() {
    if (isMockExam) {
      // 모의고사 제출 시 현재 문제 답변 저장
      if (selectedAnswer) {
        saveCurrentAnswer(currentId, currentQuestion, selectedAnswer, true)
      }
      if (unansweredMock.length > 0) {
        setShowUnansweredPopup(true)
      } else {
        checkAllAnswers()
        navigate('/result')
      }
    } else {
      if (unansweredSkipped.length > 0) {
        setShowUnansweredPopup(true)
      } else {
        navigate('/result')
      }
    }
  }

  function handleGoToFirstUnanswered() {
    setShowUnansweredPopup(false)
    if (isMockExam) {
      const firstUnansweredIndex = questions.findIndex((q) => !selectedAnswers[q.id])
      if (firstUnansweredIndex !== -1) goToQuestion(firstUnansweredIndex)
    } else {
      const firstUnansweredIndex = questions.findIndex((q) => unansweredSkipped.includes(q.id))
      if (firstUnansweredIndex !== -1) goToQuestion(firstUnansweredIndex)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] dark:bg-gray-900">
      <Header />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 모의고사 타이틀 */}
        {mockExamTitle && (
          <p className="text-sm font-semibold text-blue-600 mb-2">{mockExamTitle}</p>
        )}

        {/* 상단 진행 정보 */}
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <ProgressBar current={progressCurrent} total={questions.length} />
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
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
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:border-gray-300 transition-colors"
              >
                ← 이전
              </button>

              <div className="flex gap-2 flex-1 sm:flex-none justify-end">
                {isMockExam ? (
                  // 모의고사 모드: 정답 확인 없이 다음으로 이동, 마지막 문제에서 제출
                  <>
                    {!isLastQuestion && (
                      <button
                        onClick={handleNext}
                        className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        다음 →
                      </button>
                    )}
                    {isLastQuestion && (
                      <button
                        onClick={handleFinishClick}
                        className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        제출 →
                      </button>
                    )}
                  </>
                ) : (
                  // 일반 모드: 건너뛰기 → 정답 확인 → 다음 / 결과 보기
                  <>
                    {/* 건너뛰기 — 채점 전, 마지막 문제 건너뜀 상태 제외 */}
                    {!isChecked && !(isLastQuestion && isSkipped) && (
                      <button
                        onClick={handleSkip}
                        className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 transition-colors whitespace-nowrap"
                      >
                        건너뛰기
                      </button>
                    )}

                    {/* 정답 확인 — 채점 전, 답변 선택 시 활성화, 마지막 문제 건너뜀 상태 제외 */}
                    {!isChecked && !(isLastQuestion && isSkipped) && (
                      <button
                        onClick={handleCheck}
                        disabled={!selectedAnswer}
                        className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full text-sm bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        정답 확인
                      </button>
                    )}

                    {/* 결과 보기 — 마지막 문제 채점 완료 또는 건너뜀 */}
                    {isLastQuestion && (isChecked || isSkipped) && (
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
                  </>
                )}
              </div>
            </div>

            {/* 문제 번호 네비게이터 (모바일·태블릿) */}
            <div className="mt-4 lg:hidden">
              <QuestionNavigator
                total={questions.length}
                currentIndex={currentIndex}
                answeredIds={isMockExam ? mockAnsweredIds : checkedIds}
                skippedIds={skippedIds}
                questionIds={questions.map((q) => q.id)}
                onNavigate={goToQuestion}
                correctIds={correctIds}
                wrongIds={wrongIds}
                compact
              />
            </div>
          </div>

          {/* 문제 번호 네비게이터 (데스크톱) */}
          <div className="hidden lg:block w-56 shrink-0">
            <QuestionNavigator
              total={questions.length}
              currentIndex={currentIndex}
              answeredIds={isMockExam ? mockAnsweredIds : checkedIds}
              skippedIds={skippedIds}
              questionIds={questions.map((q) => q.id)}
              onNavigate={goToQuestion}
              correctIds={correctIds}
              wrongIds={wrongIds}
            />
          </div>
        </div>
      </div>

      {/* 나가기 확인 팝업 */}
      {showExitConfirm && (
        <Modal onClose={() => setShowExitConfirm(false)}>
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">퀴즈를 나가시겠습니까?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">진행 상황이 사라집니다.</p>
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
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">아직 풀지 않은 문제가 있어요</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {isMockExam
              ? `답을 입력하지 않은 문제 ${unansweredMock.length}개가 있습니다.`
              : `건너뛴 문제 ${unansweredSkipped.length}개가 남아있습니다.`}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleGoToFirstUnanswered}
              className="px-4 py-2 rounded-full text-sm border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              문제 풀러 가기
            </button>
            <button
              onClick={() => {
                setShowUnansweredPopup(false)
                if (isMockExam) {
                  // 팝업에서 제출 시에도 현재 문제 답변 저장
                  if (selectedAnswer) {
                    saveCurrentAnswer(currentId, currentQuestion, selectedAnswer, true)
                  }
                  checkAllAnswers()
                }
                navigate('/result')
              }}
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
