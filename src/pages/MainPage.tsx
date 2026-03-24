import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import QuizSettingsPanel from '../components/quiz/QuizSettings'
import { fetchCategories, buildQuestions } from '../lib/quiz'
import { useQuizStore } from '../store/quizStore'
import { useSession } from '../hooks/useSession'
import type { QuizCategory } from '../types'

export default function MainPage() {
  useSession('/')
  const navigate = useNavigate()
  const { selectedCategories, questionCount, difficulty, shuffle, setCategories, setSettings, startQuiz } = useQuizStore()
  const [categories, setCategories_] = useState<QuizCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
      .then(setCategories_)
      .finally(() => setLoading(false))
  }, [])

  const selectedCats = categories.filter((c) => selectedCategories.includes(c.id))

  // 현재 필터 기준 예상 문제 수 계산
  const estimatedMax = selectedCats.reduce((sum, cat) => sum + cat.questionCount, 0)

  async function handleStart() {
    if (selectedCats.length === 0) return
    setStarting(true)
    try {
      const questions = await buildQuestions(selectedCats, difficulty, questionCount, shuffle)
      if (questions.length === 0) {
        alert('선택한 조건에 맞는 문제가 없습니다. 난이도를 변경해보세요.')
        return
      }
      startQuiz(questions)
      navigate('/quiz')
    } finally {
      setStarting(false)
    }
  }

  function handleToggle(id: string) {
    if (selectedCategories.includes(id)) {
      setCategories(selectedCategories.filter((c) => c !== id))
    } else {
      setCategories([...selectedCategories, id])
    }
  }

  function handleToggleAll() {
    if (selectedCategories.length === categories.length) {
      setCategories([])
    } else {
      setCategories(categories.map((c) => c.id))
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Header onMenuToggle={() => setDrawerOpen(true)} showMenuButton />
      <div className="flex">
        <Sidebar
          categories={categories}
          selected={selectedCategories}
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-5 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              카테고리를 불러오는 중...
            </div>
          ) : selectedCats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
              <span className="text-5xl">📚</span>
              <p className="text-base font-medium">
                <span className="lg:hidden">☰ 메뉴에서 퀴즈 카테고리를 선택하세요</span>
                <span className="hidden lg:inline">좌측에서 퀴즈 카테고리를 선택하세요</span>
              </p>
              <p className="text-sm">여러 카테고리를 동시에 선택할 수 있습니다</p>
            </div>
          ) : (
            <div className="w-full max-w-xl">
              <QuizSettingsPanel
                settings={{ questionCount, difficulty, shuffle }}
                maxQuestions={estimatedMax}
                onChange={setSettings}
                onStart={handleStart}
              />
              {starting && (
                <p className="text-sm text-blue-600 mt-3 text-center">문제를 불러오는 중...</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
