import { useEffect, useState } from 'react'
import { useWrongNoteStore } from '../../store/wrongNoteStore'
import { fetchCategories, fetchQuiz } from '../../lib/quiz'
import type { Question, QuizCategory } from '../../types'

interface CategoryWrongNote {
  category: QuizCategory
  count: number
}

interface WrongNoteGridProps {
  onStart: (questions: Question[]) => void
}

export default function WrongNoteGrid({ onStart }: WrongNoteGridProps) {
  const { wrongNotes, clearWrongNotes } = useWrongNoteStore()
  const [categoryGroups, setCategoryGroups] = useState<CategoryWrongNote[]>([])
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    const groups: CategoryWrongNote[] = []
    for (const cat of categories) {
      const count = wrongNotes.filter((n) => n.quizId === cat.id).length
      if (count > 0) groups.push({ category: cat, count })
    }
    setCategoryGroups(groups)
  }, [wrongNotes, categories, loading])

  async function fetchWrongQuestions(quizIds: string[]): Promise<Question[]> {
    const wrongIds = new Set(wrongNotes.map((n) => n.id))
    const result: Question[] = []
    for (const cat of categories) {
      if (!quizIds.includes(cat.id)) continue
      const questions = await fetchQuiz(cat.id, cat.file)
      result.push(...questions.filter((q) => wrongIds.has(q.id)))
    }
    return result
  }

  async function handleCategoryStart(quizId: string) {
    setStarting(true)
    try {
      const questions = await fetchWrongQuestions([quizId])
      onStart(questions)
    } finally {
      setStarting(false)
    }
  }

  async function handleAllStart() {
    setStarting(true)
    try {
      const allQuizIds = categoryGroups.map((g) => g.category.id)
      const questions = await fetchWrongQuestions(allQuizIds)
      onStart(questions)
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        오답노트를 불러오는 중...
      </div>
    )
  }

  if (wrongNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
        <span className="text-5xl">📝</span>
        <p className="text-base font-medium">아직 틀린 문제가 없어요</p>
        <p className="text-sm">퀴즈를 풀고 오답을 확인해보세요</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">오답노트</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            총 {wrongNotes.length}문제 · {categoryGroups.length}개 카테고리
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAllStart}
            disabled={starting}
            className="px-4 py-2 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            전체 오답 풀기
          </button>
          <button
            onClick={clearWrongNotes}
            className="px-4 py-2 rounded-full text-sm border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            전체 삭제
          </button>
        </div>
      </div>

      {/* 카테고리별 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categoryGroups.map(({ category, count }) => (
          <button
            key={category.id}
            onClick={() => handleCategoryStart(category.id)}
            disabled={starting}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-orange-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer disabled:opacity-40"
          >
            {/* 상단 컬러 배너 */}
            <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-orange-300 group-hover:from-orange-500 group-hover:to-orange-400 transition-colors" />

            <div className="p-4 flex flex-col gap-2">
              {/* 카테고리 아이콘 */}
              <span className="text-2xl">{category.icon}</span>

              {/* 카테고리명 */}
              <div>
                <p className="text-[11px] text-gray-400 font-medium">오답노트</p>
                <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {category.title}
                </p>
              </div>

              {/* 오답 수 + 시작 힌트 */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-orange-500 font-medium">{count}문제</span>
                <span className="text-xs text-orange-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  풀기 →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
