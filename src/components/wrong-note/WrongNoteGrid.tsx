import { useEffect, useState } from 'react'
import { useWrongNoteStore } from '../../store/wrongNoteStore'
import { fetchCategories, fetchQuiz } from '../../lib/quiz'
import { fetchMockExams, fetchMockExamQuestions } from '../../lib/mockExam'
import type { Question, QuizCategory, MockExam } from '../../types'

interface WrongNoteGroup {
  id: string
  title: string
  icon: string
  count: number
  isMockExam: boolean
}

interface WrongNoteGridProps {
  onStart: (questions: Question[]) => void
}

export default function WrongNoteGrid({ onStart }: WrongNoteGridProps) {
  const { wrongNotes, clearWrongNotes } = useWrongNoteStore()
  const [groups, setGroups] = useState<WrongNoteGroup[]>([])
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [mockExams, setMockExams] = useState<MockExam[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    Promise.all([fetchCategories(), fetchMockExams()])
      .then(([cats, exams]) => {
        setCategories(cats)
        setMockExams(exams)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    const newGroups: WrongNoteGroup[] = []

    for (const cat of categories) {
      const count = wrongNotes.filter((n) => n.quizId === cat.id).length
      if (count > 0) newGroups.push({ id: cat.id, title: cat.title, icon: cat.icon, count, isMockExam: false })
    }

    for (const exam of mockExams) {
      const count = wrongNotes.filter((n) => n.quizId === exam.id).length
      if (count > 0) newGroups.push({ id: exam.id, title: exam.title, icon: '📋', count, isMockExam: true })
    }

    setGroups(newGroups)
  }, [wrongNotes, categories, mockExams, loading])

  async function fetchWrongQuestions(groupIds: string[]): Promise<Question[]> {
    const result: Question[] = []

    for (const cat of categories) {
      if (!groupIds.includes(cat.id)) continue
      const wrongIdsForCat = new Set(wrongNotes.filter((n) => n.quizId === cat.id).map((n) => n.id))
      const questions = await fetchQuiz(cat.id, cat.file)
      result.push(...questions.filter((q) => wrongIdsForCat.has(q.id)))
    }

    for (const exam of mockExams) {
      if (!groupIds.includes(exam.id)) continue
      const wrongIdsForExam = new Set(wrongNotes.filter((n) => n.quizId === exam.id).map((n) => n.id))
      const questions = await fetchMockExamQuestions(exam)
      result.push(...questions.filter((q) => wrongIdsForExam.has(q.id)))
    }

    return result
  }

  async function handleGroupStart(groupId: string) {
    setStarting(true)
    try {
      const questions = await fetchWrongQuestions([groupId])
      onStart(questions)
    } finally {
      setStarting(false)
    }
  }

  async function handleAllStart() {
    setStarting(true)
    try {
      const allIds = groups.map((g) => g.id)
      const questions = await fetchWrongQuestions(allIds)
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
            총 {wrongNotes.length}문제 · {groups.length}개 카테고리
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

      {/* 카테고리/모의고사별 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map(({ id, title, icon, count }) => (
          <button
            key={id}
            onClick={() => handleGroupStart(id)}
            disabled={starting}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-orange-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer disabled:opacity-40"
          >
            {/* 상단 컬러 배너 */}
            <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-orange-300 group-hover:from-orange-500 group-hover:to-orange-400 transition-colors" />

            <div className="p-4 flex flex-col gap-2">
              {/* 아이콘 */}
              <span className="text-2xl">{icon}</span>

              {/* 카테고리명 */}
              <div>
                <p className="text-[11px] text-gray-400 font-medium">오답노트</p>
                <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {title}
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
