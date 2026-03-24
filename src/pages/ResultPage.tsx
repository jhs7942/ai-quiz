import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore'
import { useSession } from '../hooks/useSession'
import { saveQuizSession } from '../lib/db'
import Header from '../components/layout/Header'
import ResultChart from '../components/result/ResultChart'
import ReviewCard from '../components/result/ReviewCard'
import Toast from '../components/common/Toast'

type Tab = 'all' | 'correct' | 'wrong'

export default function ResultPage() {
  const { userId } = useSession('/result')
  const navigate = useNavigate()
  const { questions, answers, selectedCategories, difficulty, shuffle, startedAt, startQuiz, resetQuiz } = useQuizStore()
  const [tab, setTab] = useState<Tab>('all')
  const [toast, setToast] = useState('')
  const [saved, setSaved] = useState(false)

  if (questions.length === 0) {
    navigate('/')
    return null
  }

  const results = questions.map((q) => {
    const userAnswer = answers[q.id]
    const isCorrect =
      userAnswer === '__correct__' || (userAnswer !== undefined && userAnswer !== '__wrong__' && userAnswer === q.answer)
    return { question: q, userAnswer, isCorrect }
  })

  const correctCount = results.filter((r) => r.isCorrect).length
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  // DB 저장 (한 번만)
  useEffect(() => {
    if (saved || !userId || !startedAt) return
    setSaved(true)
    saveQuizSession({
      userId,
      categories: selectedCategories,
      totalQuestions: questions.length,
      correctCount,
      scorePercent,
      startedAt,
      settings: { difficulty, shuffle },
      answers: results
        .filter((r) => r.userAnswer !== undefined)
        .map((r) => ({
          questionId: r.question.id,
          quizId: 'quiz',
          userAnswer: r.userAnswer!,
          isCorrect: r.isCorrect,
        })),
    })
  }, [userId])

  const filtered = results.filter((r) => {
    if (tab === 'correct') return r.isCorrect
    if (tab === 'wrong') return !r.isCorrect
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
    const text = `AI Quiz 결과: ${correctCount}/${questions.length} (${scorePercent}%)\n${
      results.map((r, i) => `${i + 1}. ${r.isCorrect ? '✓' : '✗'} ${r.question.question.slice(0, 30)}...`).join('\n')
    }`
    navigator.clipboard.writeText(text).then(() => setToast('결과가 클립보드에 복사되었습니다.'))
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 점수 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
          <ResultChart correct={correctCount} total={questions.length} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {correctCount} / {questions.length} 정답
            </h1>
            <p className="text-gray-500 text-sm mt-1">정답률 {scorePercent}%</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={handleRetryWrong}
                disabled={correctCount === questions.length}
                className="px-4 py-2 rounded-full text-sm border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 transition-colors"
              >
                오답만 다시 풀기
              </button>
              <button
                onClick={handleRetryShuffle}
                className="px-4 py-2 rounded-full text-sm border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                같은 문제 다시 풀기
              </button>
              <button
                onClick={() => { resetQuiz(); navigate('/') }}
                className="px-4 py-2 rounded-full text-sm border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                새 퀴즈 생성
              </button>
              <button
                onClick={handleCopyResult}
                className="px-4 py-2 rounded-full text-sm border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                📋 결과 복사
              </button>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {(['all', 'correct', 'wrong'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                tab === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {t === 'all' ? `전체 (${results.length})` : t === 'correct' ? `맞은 문제 (${correctCount})` : `틀린 문제 (${questions.length - correctCount})`}
            </button>
          ))}
        </div>

        {/* 문제 리뷰 */}
        <div className="space-y-3">
          {filtered.map(({ question, userAnswer, isCorrect }) => (
            <ReviewCard
              key={question.id}
              question={question}
              userAnswer={userAnswer}
              isCorrect={isCorrect}
            />
          ))}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
