import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizStore } from '../store/quizStore'
import { useSession } from '../hooks/useSession'
import { saveQuizSession, updateSessionResult } from '../lib/db'
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
    quizSessionId,
    startQuiz,
    resetQuiz,
  } = useQuizStore()
  const [tab, setTab] = useState<Tab>('all')
  const [toast, setToast] = useState('')
  // [학습] saved 플래그 — DB 저장이 한 번만 일어나도록 가드. useRef 도 가능하지만 useState 면 리렌더가 일어나도 값이 보존되며,
  //        이 컴포넌트에서는 saved 가 UI 에 영향을 주지 않으니 어느 쪽이든 정당. 단순 일관성으로 useState 선택.
  const [saved, setSaved] = useState(false)

  // [학습] guard effect — questions 가 비었으면(직접 URL 로 들어왔거나 store 가 reset 됐으면) 메인으로 보낸다.
  //        이 effect 는 navigate 부수효과만 일으키고 결과를 반환하지 않는다.
  useEffect(() => {
    if (questions.length === 0) {
      navigate('/')
    }
  }, [questions.length, navigate])

  // [학습] early return — 위 effect 가 navigate 를 트리거해도, 그 사이의 렌더는 빈 화면이어야 한다.
  //        return null 은 "아무것도 그리지 않는다" 의미. 빈 div 보다 명확.
  if (questions.length === 0) {
    return null
  }

  // [학습] derived data — questions 와 scoredAnswers 를 결합해 화면용 구조로 변환. 매 렌더마다 새로 만들지만 가벼워서 OK.
  //        scored?.answer (옵셔널 체이닝) — scoredAnswers[q.id] 가 undefined 일 때 안전하게 undefined 반환.
  const results = questions.map((q) => {
    const scored = scoredAnswers[q.id]
    // [학습] isSkipped 정의 — "건너뜀 + 채점 안 됨". 사용자가 건너뛰고 다시 풀어 채점됐다면 isSkipped 가 false.
    const isSkipped = skippedIds.includes(q.id) && !scored
    return {
      question: q,
      userAnswer: scored?.answer,
      // [학습] scored?.isCorrect ?? false — 옵셔널 체이닝 결과(undefined)를 nullish 로 받아 false 로 강제.
      //        이 줄에서 ?? 와 ? 가 같이 쓰이는 이유: ? 는 access 안전, ?? 는 결과의 빈값 처리.
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

    if (quizSessionId) {
      // quiz_answers는 QuizPage에서 문제별로 이미 저장됨 — 점수만 업데이트
      updateSessionResult(quizSessionId, correctCount, scorePercent)
    } else {
      // fallback: quizSessionId가 없으면 기존 방식 (세션 + 답안 일괄 저장)
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
    }
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
    // [학습] template literal — 백틱(`)으로 감싸 ${} 안에 표현식 삽입. 여러 줄도 그대로 작성 가능 (\n).
    //        .join('\n') — 배열 → 문자열 변환. 줄바꿈 구분자.
    const text = `AI Quiz 결과: ${correctCount}/${results.length} (${scorePercent}%)\n${results
      .map((r, i) => {
        const status = r.isSkipped ? '↷' : r.isCorrect ? '✓' : '✗'
        return `${i + 1}. ${status} ${r.question.question.slice(0, 30)}...`
      })
      .join('\n')}`
    // [학습] navigator.clipboard.writeText — Clipboard API. Promise 반환. HTTPS/localhost 에서만 동작.
    //        구버전 대비로 document.execCommand('copy') fallback 도 있으나 모던 브라우저는 이걸로 충분.
    navigator.clipboard.writeText(text).then(() => setToast('결과가 클립보드에 복사되었습니다.'))
  }

  // [학습] Record<Tab, string> — Tab 의 모든 가능값('all'|'correct'|...)을 키로 갖는 객체 강제.
  //        Tab 에 새 값('partial')을 추가하면 TAB_LABELS 에 partial 키가 빠졌다고 컴파일러가 즉시 알린다 (exhaustiveness check).
  const TAB_LABELS: Record<Tab, string> = {
    all: `전체 (${results.length})`,
    correct: `맞은 (${correctCount})`,
    wrong: `틀린 (${wrongCount})`,
    skipped: `건너뛴 (${skippedCount})`,
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] dark:bg-gray-900">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 점수 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <ResultChart correct={correctCount} total={results.length} />
          <div className="w-full sm:w-auto text-center sm:text-left">
            {mockExamTitle && (
              <p className="text-sm font-semibold text-blue-600 mb-1">{mockExamTitle}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {correctCount} / {results.length} 정답
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
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
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
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
