import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore'
import { useSession } from '../hooks/useSession'
import { saveQuizSession } from '../lib/db'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import GoogleAdSense from '../components/common/GoogleAdSense'
import ResultChart from '../components/result/ResultChart'
import ReviewCard from '../components/result/ReviewCard'
import Toast from '../components/common/Toast'

type Tab = 'all' | 'correct' | 'wrong' | 'skipped'

export default function ResultPage() {
  const { userId } = useSession('/result')
  const navigate = useNavigate()
  const {
    questions,
    scoredAnswers,
    skippedIds,
    selectedCategories,
    difficulty,
    shuffle,
    startedAt,
    mockExamId,
    mockExamTitle,
    startQuiz,
    resetQuiz,
  } = useQuizStore()
  const [tab, setTab] = useState<Tab>('all')
  const [toast, setToast] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/')
    }
  }, [questions.length, navigate])

  if (questions.length === 0) {
    return null
  }

  const results = questions.map((q) => {
    const scored = scoredAnswers[q.id]
    const isSkipped = skippedIds.includes(q.id) && !scored
    return {
      question: q,
      userAnswer: scored?.answer,
      isCorrect: scored?.isCorrect ?? false,
      isSkipped,
    }
  })

  const correctCount = results.filter((r) => r.isCorrect).length
  const skippedCount = results.filter((r) => r.isSkipped).length
  const wrongCount = results.length - correctCount  // 건너뛴 문제 포함
  const scorePercent =
    results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0

  // DB 저장 (한 번만)
  useEffect(() => {
    if (saved || !userId || !startedAt) return
    setSaved(true)
    const selectedTypes = [...new Set(questions.map((q) => q.type))]
    saveQuizSession({
      userId,
      categories: mockExamId ? [mockExamId] : selectedCategories,
      selectedTypes,
      totalQuestions: questions.length,
      correctCount,
      scorePercent,
      startedAt,
      settings: { difficulty, shuffle },
      pretest: !!mockExamId,
      answers: results
        .filter((r) => r.userAnswer !== undefined)
        .map((r) => ({
          questionId: r.question.id,
          quizId: r.question.quizId ?? 'quiz',
          questionType: r.question.type,
          userAnswer: r.userAnswer!,
          isCorrect: r.isCorrect,
        })),
    })
  }, [userId])

  const filtered = results.filter((r) => {
    if (tab === 'correct') return r.isCorrect
    if (tab === 'wrong') return !r.isCorrect
    if (tab === 'skipped') return r.isSkipped
    return true
  })

  function handleRetryWrong() {
    const wrongQuestions = results.filter((r) => !r.isCorrect).map((r) => r.question)
    if (wrongQuestions.length === 0) return
    startQuiz(wrongQuestions)
    navigate('/quiz')
  }

  function handleRetryShuffle() {
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    startQuiz(shuffled)
    navigate('/quiz')
  }

  function handleCopyResult() {
    const text = `AI Quiz 결과: ${correctCount}/${results.length} (${scorePercent}%)\n${results
      .map((r, i) => {
        const status = r.isSkipped ? '↷' : r.isCorrect ? '✓' : '✗'
        return `${i + 1}. ${status} ${r.question.question.slice(0, 30)}...`
      })
      .join('\n')}`
    navigator.clipboard.writeText(text).then(() => setToast('결과가 클립보드에 복사되었습니다.'))
  }

  const TAB_LABELS: Record<Tab, string> = {
    all: `전체 (${results.length})`,
    correct: `맞은 (${correctCount})`,
    wrong: `틀린 (${wrongCount})`,
    skipped: `건너뛴 (${skippedCount})`,
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 점수 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <ResultChart correct={correctCount} total={results.length} />
          <div className="w-full sm:w-auto text-center sm:text-left">
            {mockExamTitle && (
              <p className="text-sm font-semibold text-blue-600 mb-1">{mockExamTitle}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              {correctCount} / {results.length} 정답
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              정답률 {scorePercent}%
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:flex-wrap">
              <button
                onClick={handleRetryWrong}
                disabled={wrongCount === 0}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] rounded-full text-sm border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 transition-colors"
              >
                오답만 다시 풀기
              </button>
              <button
                onClick={handleRetryShuffle}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] rounded-full text-sm border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                같은 문제 다시 풀기
              </button>
              <button
                onClick={() => { resetQuiz(); navigate('/') }}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] rounded-full text-sm border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                새 퀴즈 생성
              </button>
              <button
                onClick={handleCopyResult}
                className="w-full sm:w-auto px-4 py-2 min-h-[44px] rounded-full text-sm border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                📋 결과 복사
              </button>
            </div>
          </div>
        </div>

        {/* 광고 */}
        <div className="mb-4">
          <GoogleAdSense adSlot="1276120546" adFormat="fluid" adLayoutKey="-fb+5w+4e-db+86" />
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'correct', 'wrong', 'skipped'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 min-h-[44px] rounded-full text-xs sm:text-sm border transition-all ${
                tab === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* 문제 리뷰 */}
        <div className="space-y-3">
          {filtered.map(({ question, userAnswer, isCorrect, isSkipped }) => (
            <ReviewCard
              key={question.id}
              question={question}
              userAnswer={userAnswer}
              isCorrect={isCorrect}
              isSkipped={isSkipped}
            />
          ))}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <Footer />
    </div>
  )
}
